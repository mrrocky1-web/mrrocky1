import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth, requireRole, requireOwnRestaurant } from '../middleware/auth.js';

const router = Router();

const parseRestaurant = (r) => ({
  ...r,
  cuisine_tags: JSON.parse(r.cuisine_tags || '[]'),
  opening_hours: JSON.parse(r.opening_hours || '{}'),
});

// ---------- Public: customer website ----------

// GET /api/restaurants?city=Gurugram&cuisine=burger&search=king
router.get('/', (req, res) => {
  const { city, cuisine, search } = req.query;
  let sql = `SELECT id, name, slug, city, address, logo_url, banner_url, cuisine_tags
             FROM restaurants WHERE status = 'active'`;
  const params = [];

  if (city) { sql += ' AND city = ?'; params.push(city); }
  if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }

  const rows = db.prepare(sql).all(...params).map(parseRestaurant);
  const filtered = cuisine ? rows.filter((r) => r.cuisine_tags.includes(cuisine)) : rows;

  // attach rating summary
  const withRatings = filtered.map((r) => {
    const agg = db.prepare(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE restaurant_id = ?'
    ).get(r.id);
    return { ...r, avg_rating: agg.avg_rating ? Number(agg.avg_rating.toFixed(1)) : null, review_count: agg.review_count };
  });

  res.json(withRatings);
});

// GET /api/restaurants/:slug — full menu for the restaurant page
router.get('/:slug', (req, res) => {
  const restaurant = db.prepare("SELECT * FROM restaurants WHERE slug = ? AND status = 'active'").get(req.params.slug);
  if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

  const categories = db.prepare(
    'SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order ASC'
  ).all(restaurant.id);

  const items = db.prepare(
    'SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category_id'
  ).all(restaurant.id).map((i) => ({
    ...i,
    variants: JSON.parse(i.variants || '[]'),
    addons: JSON.parse(i.addons || '[]'),
    is_available: !!i.is_available,
  }));

  const menu = categories.map((c) => ({ ...c, items: items.filter((i) => i.category_id === c.id) }));

  res.json({ restaurant: parseRestaurant(restaurant), menu });
});

// ---------- Restaurant admin: profile ----------

router.patch(
  '/:restaurantId/profile',
  requireAuth,
  requireRole('restaurant_admin', 'super_admin'),
  requireOwnRestaurant,
  (req, res) => {
    const fields = ['name', 'city', 'address', 'delivery_radius_km', 'logo_url', 'banner_url', 'gst_number'];
    const updates = [];
    const params = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
    }
    if (req.body.cuisine_tags) { updates.push('cuisine_tags = ?'); params.push(JSON.stringify(req.body.cuisine_tags)); }
    if (req.body.opening_hours) { updates.push('opening_hours = ?'); params.push(JSON.stringify(req.body.opening_hours)); }
    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

    updates.push("updated_at = datetime('now')");
    params.push(req.params.restaurantId);
    db.prepare(`UPDATE restaurants SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    res.json({ message: 'Profile updated' });
  }
);

export default router;
