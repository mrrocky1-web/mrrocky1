import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/index.js';
import { requireAuth, requireRole, requireOwnRestaurant } from '../middleware/auth.js';

const router = Router();

// Public: read reviews for a restaurant
router.get('/restaurant/:restaurantId', (req, res) => {
  res.json(db.prepare(
    'SELECT * FROM reviews WHERE restaurant_id = ? ORDER BY created_at DESC'
  ).all(req.params.restaurantId));
});

// Customer: leave a review (must have an order there)
router.post('/', requireAuth, requireRole('customer'), (req, res) => {
  const { restaurant_id, order_id, rating, comment } = req.body;
  if (!restaurant_id || !rating) return res.status(400).json({ error: 'restaurant_id and rating are required' });

  if (order_id) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND customer_id = ? AND restaurant_id = ?')
      .get(order_id, req.user.id, restaurant_id);
    if (!order) return res.status(400).json({ error: 'Order not found for this customer/restaurant' });
  }

  const id = uuid();
  db.prepare('INSERT INTO reviews (id, restaurant_id, customer_id, order_id, rating, comment) VALUES (?,?,?,?,?,?)')
    .run(id, restaurant_id, req.user.id, order_id || null, rating, comment || null);
  res.status(201).json({ id, message: 'Review posted' });
});

// Restaurant admin: reply to a review
router.patch(
  '/:reviewId/reply',
  requireAuth, requireRole('restaurant_admin', 'super_admin'),
  (req, res) => {
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(req.params.reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (req.user.role !== 'super_admin' && req.user.restaurant_id !== review.restaurant_id) {
      return res.status(403).json({ error: 'Not authorized for this review' });
    }
    db.prepare("UPDATE reviews SET reply = ?, replied_at = datetime('now') WHERE id = ?")
      .run(req.body.reply, review.id);
    res.json({ message: 'Reply posted' });
  }
);

export default router;
