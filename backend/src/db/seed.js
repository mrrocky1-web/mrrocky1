import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import db from './index.js';
import { initSchema } from './init.js';

initSchema();

const hash = (pw) => bcrypt.hashSync(pw, 10);

// ---- Super admin ----
const superAdminId = uuid();
db.prepare(`INSERT OR IGNORE INTO super_admins (id, name, email, password_hash) VALUES (?,?,?,?)`)
  .run(superAdminId, 'Platform Owner', 'super@platform.com', hash('SuperAdmin123!'));

// ---- Demo restaurant ----
const restaurantId = uuid();
const ownerId = uuid();

db.prepare(`
  INSERT OR IGNORE INTO restaurants (id, owner_id, name, slug, city, address, status, cuisine_tags, logo_url, banner_url)
  VALUES (?,?,?,?,?,?, 'active', ?, ?, ?)
`).run(
  restaurantId, ownerId, 'King Burger Express', 'king-burger-express', 'Gurugram',
  'Sector 29, Gurugram, Haryana', JSON.stringify(['burger', 'fast_food']),
  'https://placehold.co/200x200?text=KBE', 'https://placehold.co/1200x400?text=King+Burger+Express'
);

db.prepare(`
  INSERT OR IGNORE INTO restaurant_admins (id, restaurant_id, name, email, phone, password_hash, role)
  VALUES (?,?,?,?,?,?, 'owner')
`).run(ownerId, restaurantId, 'Rohit Sharma', 'owner@kingburger.com', '9999999999', hash('Owner123!'));

// ---- Categories + items ----
const catBurgers = uuid();
const catSides = uuid();
db.prepare('INSERT OR IGNORE INTO categories (id, restaurant_id, name, sort_order) VALUES (?,?,?,?)').run(catBurgers, restaurantId, 'Burgers', 1);
db.prepare('INSERT OR IGNORE INTO categories (id, restaurant_id, name, sort_order) VALUES (?,?,?,?)').run(catSides, restaurantId, 'Sides & Drinks', 2);

const items = [
  { cat: catBurgers, name: 'Classic Chicken Burger', price: 149, veg: 'non_veg', desc: 'Crispy chicken patty, lettuce, mayo.' },
  { cat: catBurgers, name: 'Veggie Supreme Burger', price: 129, veg: 'veg', desc: 'Loaded veg patty with cheese and salsa.' },
  { cat: catBurgers, name: 'Double Cheese Burger', price: 199, veg: 'non_veg', desc: 'Double patty, double cheese.' },
  { cat: catSides, name: 'French Fries', price: 89, veg: 'veg', desc: 'Crispy golden fries, salted.' },
  { cat: catSides, name: 'Cold Coffee', price: 99, veg: 'veg', desc: 'Chilled coffee shake.' },
];
for (const it of items) {
  db.prepare(`
    INSERT OR IGNORE INTO menu_items (id, restaurant_id, category_id, name, description, price, veg_flag, image_url)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(uuid(), restaurantId, it.cat, it.name, it.desc, it.price, it.veg, 'https://placehold.co/300x200?text=' + encodeURIComponent(it.name));
}

// ---- Coupon ----
db.prepare(`
  INSERT OR IGNORE INTO coupons (id, restaurant_id, code, description, discount_type, discount_value, min_order_value)
  VALUES (?,?,?,?,?,?,?)
`).run(uuid(), restaurantId, 'WELCOME50', 'Flat ₹50 off on your first order', 'flat', 50, 199);

// ---- Demo customer ----
const customerId = uuid();
db.prepare(`INSERT OR IGNORE INTO customers (id, name, email, phone, password_hash) VALUES (?,?,?,?,?)`)
  .run(customerId, 'Test Customer', 'customer@example.com', '8888888888', hash('Customer123!'));

console.log('Seed complete.');
console.log('Super admin:      super@platform.com / SuperAdmin123!');
console.log('Restaurant owner: owner@kingburger.com / Owner123!  (restaurant: King Burger Express)');
console.log('Customer:         customer@example.com / Customer123!');
