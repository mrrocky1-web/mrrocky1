import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/index.js';
import { requireAuth, requireRole, requireOwnRestaurant } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

// All routes here are mounted at /api/restaurants/:restaurantId/menu
router.use(requireAuth, requireRole('restaurant_admin', 'staff', 'super_admin'), requireOwnRestaurant);

// ---- Categories ----

router.get('/categories', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order'
  ).all(req.params.restaurantId);
  res.json(rows);
});

router.post('/categories', (req, res) => {
  const { name, sort_order = 0 } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const id = uuid();
  db.prepare('INSERT INTO categories (id, restaurant_id, name, sort_order) VALUES (?,?,?,?)')
    .run(id, req.params.restaurantId, name, sort_order);
  res.status(201).json({ id, name, sort_order });
});

router.delete('/categories/:categoryId', (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ? AND restaurant_id = ?')
    .run(req.params.categoryId, req.params.restaurantId);
  res.json({ message: 'Category deleted' });
});

// ---- Items ----

router.get('/items', (req, res) => {
  const rows = db.prepare('SELECT * FROM menu_items WHERE restaurant_id = ?').all(req.params.restaurantId)
    .map((i) => ({ ...i, variants: JSON.parse(i.variants || '[]'), addons: JSON.parse(i.addons || '[]'), is_available: !!i.is_available }));
  res.json(rows);
});

router.post('/items', (req, res) => {
  const { category_id, name, description, price, image_url, veg_flag, variants, addons } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'name and price are required' });

  const id = uuid();
  db.prepare(`
    INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, image_url, veg_flag, variants, addons)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, req.params.restaurantId, category_id || null, name, description || null, price,
    image_url || null, veg_flag || 'veg', JSON.stringify(variants || []), JSON.stringify(addons || [])
  );
  res.status(201).json({ id, message: 'Item added' });
});

router.patch('/items/:itemId', (req, res) => {
  const fields = ['category_id', 'name', 'description', 'price', 'image_url', 'veg_flag', 'is_available'];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  }
  if (req.body.variants) { updates.push('variants = ?'); params.push(JSON.stringify(req.body.variants)); }
  if (req.body.addons) { updates.push('addons = ?'); params.push(JSON.stringify(req.body.addons)); }
  if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

  params.push(req.params.itemId, req.params.restaurantId);
  db.prepare(`UPDATE menu_items SET ${updates.join(', ')} WHERE id = ? AND restaurant_id = ?`).run(...params);
  res.json({ message: 'Item updated' });
});

router.delete('/items/:itemId', (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?')
    .run(req.params.itemId, req.params.restaurantId);
  res.json({ message: 'Item deleted' });
});

export default router;
