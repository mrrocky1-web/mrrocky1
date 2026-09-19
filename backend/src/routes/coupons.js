import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/index.js';
import { requireAuth, requireRole, requireOwnRestaurant } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

// Mounted at /api/restaurants/:restaurantId/coupons
router.use(requireAuth, requireRole('restaurant_admin', 'super_admin'), requireOwnRestaurant);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM coupons WHERE restaurant_id = ?').all(req.params.restaurantId));
});

router.post('/', (req, res) => {
  const { code, description, discount_type, discount_value, min_order_value, max_discount, usage_limit, valid_from, valid_until } = req.body;
  if (!code || !discount_value) return res.status(400).json({ error: 'code and discount_value are required' });

  const id = uuid();
  db.prepare(`
    INSERT INTO coupons (id, restaurant_id, code, description, discount_type, discount_value, min_order_value, max_discount, usage_limit, valid_from, valid_until)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, req.params.restaurantId, code.toUpperCase(), description || null, discount_type || 'percent',
    discount_value, min_order_value || 0, max_discount || null, usage_limit || null, valid_from || null, valid_until || null
  );
  res.status(201).json({ id, message: 'Coupon created' });
});

router.patch('/:couponId', (req, res) => {
  const { is_active } = req.body;
  if (is_active === undefined) return res.status(400).json({ error: 'Only is_active toggle supported here' });
  db.prepare('UPDATE coupons SET is_active = ? WHERE id = ? AND restaurant_id = ?')
    .run(is_active ? 1 : 0, req.params.couponId, req.params.restaurantId);
  res.json({ message: 'Coupon updated' });
});

export default router;
