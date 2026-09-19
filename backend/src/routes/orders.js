import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/index.js';
import { requireAuth, requireRole, requireOwnRestaurant } from '../middleware/auth.js';

const router = Router();

const VALID_TRANSITIONS = {
  placed: ['accepted', 'rejected'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
  rejected: [],
};

function genOrderNumber() {
  return 'ORD' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 100);
}

// ---------- Customer: place an order ----------
router.post('/', requireAuth, requireRole('customer'), (req, res) => {
  const { restaurant_id, items, delivery_type, address_id, coupon_code, tip, payment_method, notes } = req.body;
  if (!restaurant_id || !items?.length) return res.status(400).json({ error: 'restaurant_id and items are required' });

  const restaurant = db.prepare("SELECT * FROM restaurants WHERE id = ? AND status = 'active'").get(restaurant_id);
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found or inactive' });

  // Price server-side from menu_items — never trust client-sent prices.
  let subtotal = 0;
  const lineItems = items.map((it) => {
    const menuItem = db.prepare('SELECT * FROM menu_items WHERE id = ? AND restaurant_id = ?').get(it.menu_item_id, restaurant_id);
    if (!menuItem || !menuItem.is_available) throw new Error(`Item unavailable: ${it.menu_item_id}`);
    let unitPrice = menuItem.price;
    if (it.selected_variant?.price_delta) unitPrice += it.selected_variant.price_delta;
    const addonsTotal = (it.selected_addons || []).reduce((s, a) => s + (a.price || 0), 0);
    const lineTotal = (unitPrice + addonsTotal) * it.qty;
    subtotal += lineTotal;
    return { menuItem, unitPrice, lineTotal, qty: it.qty, selected_variant: it.selected_variant, selected_addons: it.selected_addons };
  });

  let discount = 0;
  let couponId = null;
  if (coupon_code) {
    const coupon = db.prepare(
      `SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (restaurant_id = ? OR restaurant_id IS NULL)`
    ).get(coupon_code, restaurant_id);
    if (coupon && subtotal >= (coupon.min_order_value || 0)) {
      discount = coupon.discount_type === 'percent' ? subtotal * (coupon.discount_value / 100) : coupon.discount_value;
      if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
      couponId = coupon.id;
    }
  }

  const deliveryFee = delivery_type === 'delivery' ? 40 : 0;
  const tax = +(subtotal * 0.05).toFixed(2); // simplified 5% GST
  const total = +(subtotal - discount + deliveryFee + tax + (tip || 0)).toFixed(2);

  const orderId = uuid();
  const orderNumber = genOrderNumber();

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO orders (id, restaurant_id, customer_id, order_number, delivery_type, address_id,
        status, payment_status, payment_method, subtotal, discount, delivery_fee, tax, tip, total, coupon_id, notes)
      VALUES (?,?,?,?,?,?, 'placed', ?, ?, ?,?,?,?,?,?,?,?)
    `).run(
      orderId, restaurant_id, req.user.id, orderNumber, delivery_type || 'delivery', address_id || null,
      payment_method === 'cod' ? 'cod' : 'pending', payment_method || null,
      subtotal, discount, deliveryFee, tax, tip || 0, total, couponId, notes || null
    );

    for (const li of lineItems) {
      db.prepare(`
        INSERT INTO order_items (id, order_id, menu_item_id, name_snapshot, qty, unit_price, selected_variant, selected_addons, line_total)
        VALUES (?,?,?,?,?,?,?,?,?)
      `).run(
        uuid(), orderId, li.menuItem.id, li.menuItem.name, li.qty, li.unitPrice,
        JSON.stringify(li.selected_variant || null), JSON.stringify(li.selected_addons || []), li.lineTotal
      );
    }

    db.prepare('INSERT INTO order_status_history (id, order_id, status, changed_by) VALUES (?,?,?,?)')
      .run(uuid(), orderId, 'placed', 'customer');

    if (couponId) db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(couponId);
  });

  try {
    tx();
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  res.status(201).json({ id: orderId, order_number: orderNumber, total, status: 'placed' });
});

// ---------- Customer: order history / tracking ----------
router.get('/my', requireAuth, requireRole('customer'), (req, res) => {
  const orders = db.prepare(
    'SELECT * FROM orders WHERE customer_id = ? ORDER BY placed_at DESC'
  ).all(req.user.id);
  res.json(orders);
});

router.get('/:orderId', requireAuth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const isOwnerCustomer = req.user.role === 'customer' && req.user.id === order.customer_id;
  const isOwnerRestaurant = ['restaurant_admin', 'staff'].includes(req.user.role) && req.user.restaurant_id === order.restaurant_id;
  if (!isOwnerCustomer && !isOwnerRestaurant && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Not authorized to view this order' });
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY changed_at').all(order.id);
  res.json({ ...order, items, history });
});

// ---------- Restaurant admin: order queue + status updates ----------
router.get(
  '/restaurant/:restaurantId',
  requireAuth, requireRole('restaurant_admin', 'staff', 'super_admin'), requireOwnRestaurant,
  (req, res) => {
    const { status } = req.query;
    let sql = 'SELECT * FROM orders WHERE restaurant_id = ?';
    const params = [req.params.restaurantId];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY placed_at DESC';
    res.json(db.prepare(sql).all(...params));
  }
);

router.patch(
  '/:orderId/status',
  requireAuth, requireRole('restaurant_admin', 'staff', 'super_admin'),
  (req, res) => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (req.user.role !== 'super_admin' && req.user.restaurant_id !== order.restaurant_id) {
      return res.status(403).json({ error: 'Not authorized for this order' });
    }

    const { status } = req.body;
    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Cannot move order from ${order.status} to ${status}` });
    }

    db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, order.id);
    db.prepare('INSERT INTO order_status_history (id, order_id, status, changed_by) VALUES (?,?,?,?)')
      .run(uuid(), order.id, status, req.user.role);

    res.json({ message: 'Status updated', status });
  }
);

export default router;
