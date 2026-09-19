import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import db from '../db/index.js';
import { signToken } from '../utils/jwt.js';

const router = Router();

// ---------- Customer ----------
// Demo simplification: email+password. Swap for OTP-over-SMS in production
// (send code via notifications service, verify, then issue token).

router.post('/customer/signup', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const existing = db.prepare('SELECT id FROM customers WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const id = uuid();
  const password_hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO customers (id, name, email, phone, password_hash) VALUES (?,?,?,?,?)'
  ).run(id, name || null, email, phone || null, password_hash);

  const token = signToken({ id, role: 'customer' });
  res.status(201).json({ token, user: { id, name, email, role: 'customer' } });
});

router.post('/customer/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM customers WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash || '')) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (user.is_blocked) return res.status(403).json({ error: 'Account blocked' });

  const token = signToken({ id: user.id, role: 'customer' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: 'customer' } });
});

// ---------- Restaurant signup (creates a pending restaurant + owner admin) ----------

router.post('/restaurant/signup', (req, res) => {
  const { restaurantName, city, ownerName, email, phone, password } = req.body;
  if (!restaurantName || !email || !password) {
    return res.status(400).json({ error: 'restaurantName, email, password required' });
  }

  const slug = restaurantName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
  const restaurantId = uuid();
  const ownerId = uuid();
  const password_hash = bcrypt.hashSync(password, 10);

  const insertRestaurant = db.prepare(`
    INSERT INTO restaurants (id, owner_id, name, slug, city, status)
    VALUES (?,?,?,?,?, 'pending')
  `);
  const insertOwner = db.prepare(`
    INSERT INTO restaurant_admins (id, restaurant_id, name, email, phone, password_hash, role)
    VALUES (?,?,?,?,?,?, 'owner')
  `);

  const tx = db.transaction(() => {
    insertRestaurant.run(restaurantId, ownerId, restaurantName, slug, city || null);
    insertOwner.run(ownerId, restaurantId, ownerName || restaurantName, email, phone || null, password_hash);
  });
  tx();

  res.status(201).json({
    message: 'Signup received. Your restaurant is pending Super Admin approval before it goes live.',
    restaurantId,
    status: 'pending',
  });
});

// ---------- Restaurant admin / staff login ----------

router.post('/restaurant/login', (req, res) => {
  const { email, password } = req.body;
  const admin = db.prepare('SELECT * FROM restaurant_admins WHERE email = ?').get(email);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  if (!admin.is_active) return res.status(403).json({ error: 'Account disabled' });

  const restaurant = db.prepare('SELECT status FROM restaurants WHERE id = ?').get(admin.restaurant_id);
  if (restaurant?.status === 'suspended') {
    return res.status(403).json({ error: 'Restaurant account is suspended' });
  }

  const role = admin.role === 'owner' || admin.role === 'manager' ? 'restaurant_admin' : 'staff';
  const token = signToken({ id: admin.id, role, restaurant_id: admin.restaurant_id, sub_role: admin.role });
  res.json({
    token,
    user: { id: admin.id, name: admin.name, email: admin.email, role, restaurant_id: admin.restaurant_id },
    restaurantStatus: restaurant?.status,
  });
});

// ---------- Super admin login ----------
// Seeded via db/seed.js — there's no public super-admin signup endpoint by design.

router.post('/superadmin/login', (req, res) => {
  const { email, password } = req.body;
  const admin = db.prepare('SELECT * FROM super_admins WHERE email = ?').get(email);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signToken({ id: admin.id, role: 'super_admin' });
  res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: 'super_admin' } });
});

export default router;
