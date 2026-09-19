import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('super_admin'));

function logAction(actorId, action, targetType, targetId, metadata = {}) {
  db.prepare('INSERT INTO audit_logs (id, actor_type, actor_id, action, target_type, target_id, metadata) VALUES (?,?,?,?,?,?,?)')
    .run(uuid(), 'super_admin', actorId, action, targetType, targetId, JSON.stringify(metadata));
}

// ---- Restaurant lifecycle ----

router.get('/restaurants', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM restaurants';
  const params = [];
  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.patch('/restaurants/:id/status', (req, res) => {
  const { status } = req.body; // active | suspended | rejected
  if (!['active', 'suspended', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.prepare("UPDATE restaurants SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
  logAction(req.user.id, `restaurant_status_${status}`, 'restaurant', req.params.id);
  res.json({ message: `Restaurant ${status}` });
});

router.patch('/restaurants/:id/billing', (req, res) => {
  const { subscription_plan, commission_pct, monthly_fee } = req.body;
  const updates = [];
  const params = [];
  if (subscription_plan !== undefined) { updates.push('subscription_plan = ?'); params.push(subscription_plan); }
  if (commission_pct !== undefined) { updates.push('commission_pct = ?'); params.push(commission_pct); }
  if (monthly_fee !== undefined) { updates.push('monthly_fee = ?'); params.push(monthly_fee); }
  if (!updates.length) return res.status(400).json({ error: 'No billing fields provided' });

  params.push(req.params.id);
  db.prepare(`UPDATE restaurants SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  logAction(req.user.id, 'billing_updated', 'restaurant', req.params.id, req.body);
  res.json({ message: 'Billing updated' });
});

router.delete('/restaurants/:id', (req, res) => {
  db.prepare('DELETE FROM restaurants WHERE id = ?').run(req.params.id);
  logAction(req.user.id, 'restaurant_deleted', 'restaurant', req.params.id);
  res.json({ message: 'Restaurant deleted' });
});

// ---- Platform analytics ----

router.get('/analytics/overview', (req, res) => {
  const totals = db.prepare(`
    SELECT COUNT(*) as total_orders, COALESCE(SUM(total),0) as total_revenue
    FROM orders WHERE status = 'delivered'
  `).get();

  const restaurantCounts = db.prepare(`
    SELECT status, COUNT(*) as count FROM restaurants GROUP BY status
  `).all();

  const topRestaurants = db.prepare(`
    SELECT r.name, r.city, COUNT(o.id) as order_count, COALESCE(SUM(o.total),0) as revenue
    FROM restaurants r JOIN orders o ON o.restaurant_id = r.id AND o.status = 'delivered'
    GROUP BY r.id ORDER BY revenue DESC LIMIT 10
  `).all();

  const cityPerformance = db.prepare(`
    SELECT r.city, COUNT(o.id) as order_count, COALESCE(SUM(o.total),0) as revenue
    FROM restaurants r JOIN orders o ON o.restaurant_id = r.id AND o.status = 'delivered'
    GROUP BY r.city ORDER BY revenue DESC
  `).all();

  res.json({ totals, restaurantCounts, topRestaurants, cityPerformance });
});

// ---- Global settings ----

router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT * FROM platform_settings').all();
  res.json(Object.fromEntries(rows.map((r) => [r.key, JSON.parse(r.value)])));
});

router.put('/settings/:key', (req, res) => {
  db.prepare(`
    INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(req.params.key, JSON.stringify(req.body.value));
  logAction(req.user.id, 'setting_updated', 'platform_settings', req.params.key, req.body);
  res.json({ message: 'Setting saved' });
});

// ---- User management ----

router.get('/customers', (req, res) => {
  res.json(db.prepare('SELECT id, name, email, phone, loyalty_points, is_blocked, created_at FROM customers').all());
});

router.patch('/customers/:id/block', (req, res) => {
  db.prepare('UPDATE customers SET is_blocked = ? WHERE id = ?').run(req.body.is_blocked ? 1 : 0, req.params.id);
  logAction(req.user.id, req.body.is_blocked ? 'customer_blocked' : 'customer_unblocked', 'customer', req.params.id);
  res.json({ message: 'Customer updated' });
});

router.get('/restaurant-admins', (req, res) => {
  res.json(db.prepare(`
    SELECT ra.id, ra.name, ra.email, ra.role, ra.is_active, r.name as restaurant_name, r.id as restaurant_id
    FROM restaurant_admins ra JOIN restaurants r ON r.id = ra.restaurant_id
  `).all());
});

// ---- Support tickets ----

router.get('/tickets', (req, res) => {
  res.json(db.prepare('SELECT * FROM support_tickets ORDER BY created_at DESC').all());
});

router.patch('/tickets/:id', (req, res) => {
  db.prepare('UPDATE support_tickets SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  res.json({ message: 'Ticket updated' });
});

// ---- Audit log ----

router.get('/audit-logs', (req, res) => {
  res.json(db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200').all());
});

export default router;
