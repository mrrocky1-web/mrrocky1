import db from './index.js';

// SQLite mirror of database/schema.sql — same shape, simplified types
// (TEXT for UUID/JSONB/TIMESTAMPTZ, REAL for NUMERIC) so the demo API
// runs with zero external services. Swap this module for a `pg` pool
// against schema.sql when deploying for real.

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS super_admins (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'super_admin',
      permissions TEXT DEFAULT '[]', created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS restaurants (
      id TEXT PRIMARY KEY, owner_id TEXT, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
      city TEXT, address TEXT, latitude REAL, longitude REAL, delivery_radius_km REAL DEFAULT 5,
      logo_url TEXT, banner_url TEXT, cuisine_tags TEXT DEFAULT '[]', gst_number TEXT,
      opening_hours TEXT DEFAULT '{}', status TEXT NOT NULL DEFAULT 'pending',
      subscription_plan TEXT DEFAULT 'basic', commission_pct REAL DEFAULT 15,
      monthly_fee REAL DEFAULT 0, created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS restaurant_admins (
      id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner', permissions TEXT DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(restaurant_id, email)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      name TEXT NOT NULL, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);

    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL, name TEXT NOT NULL,
      description TEXT, price REAL NOT NULL, image_url TEXT, veg_flag TEXT DEFAULT 'veg',
      is_available INTEGER NOT NULL DEFAULT 1, variants TEXT DEFAULT '[]', addons TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY, name TEXT, phone TEXT UNIQUE, email TEXT UNIQUE,
      password_hash TEXT, loyalty_points INTEGER DEFAULT 0, is_blocked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customer_addresses (
      id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      label TEXT, line1 TEXT NOT NULL, line2 TEXT, city TEXT, pincode TEXT,
      latitude REAL, longitude REAL, is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
      customer_id TEXT NOT NULL REFERENCES customers(id), order_number TEXT UNIQUE NOT NULL,
      delivery_type TEXT NOT NULL DEFAULT 'delivery', address_id TEXT REFERENCES customer_addresses(id),
      status TEXT NOT NULL DEFAULT 'placed', payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT, subtotal REAL NOT NULL DEFAULT 0, discount REAL NOT NULL DEFAULT 0,
      delivery_fee REAL NOT NULL DEFAULT 0, tax REAL NOT NULL DEFAULT 0, tip REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0, coupon_id TEXT, notes TEXT,
      placed_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id TEXT NOT NULL REFERENCES menu_items(id), name_snapshot TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1, unit_price REAL NOT NULL, selected_variant TEXT,
      selected_addons TEXT DEFAULT '[]', line_total REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status TEXT NOT NULL, changed_by TEXT, changed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY, restaurant_id TEXT REFERENCES restaurants(id) ON DELETE CASCADE,
      code TEXT NOT NULL, description TEXT, discount_type TEXT NOT NULL DEFAULT 'percent',
      discount_value REAL NOT NULL, min_order_value REAL DEFAULT 0, max_discount REAL,
      usage_limit INTEGER, used_count INTEGER DEFAULT 0, valid_from TEXT, valid_until TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      customer_id TEXT NOT NULL REFERENCES customers(id), order_id TEXT REFERENCES orders(id),
      rating INTEGER NOT NULL, comment TEXT, reply TEXT, replied_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      gateway TEXT NOT NULL, gateway_ref TEXT, status TEXT NOT NULL DEFAULT 'pending',
      amount REAL NOT NULL, created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, recipient_type TEXT NOT NULL, recipient_id TEXT NOT NULL,
      channel TEXT NOT NULL, title TEXT, body TEXT, is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY, restaurant_id TEXT REFERENCES restaurants(id),
      customer_id TEXT REFERENCES customers(id), order_id TEXT REFERENCES orders(id),
      subject TEXT NOT NULL, status TEXT DEFAULT 'open', created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY, actor_type TEXT NOT NULL, actor_id TEXT NOT NULL,
      action TEXT NOT NULL, target_type TEXT, target_id TEXT, metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
