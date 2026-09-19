-- ============================================================
-- Multi-Tenant Restaurant Ordering Platform — Database Schema
-- Target: PostgreSQL 14+
-- Every tenant-scoped table carries restaurant_id for isolation.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- Platform-level ----------

CREATE TABLE super_admins (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(30) NOT NULL DEFAULT 'super_admin', -- super_admin | sub_admin
  permissions   JSONB DEFAULT '[]',                          -- for sub-admins
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE platform_settings (
  key         VARCHAR(80) PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- keys: delivery_charge_rules, tax_rules, payment_gateway_keys, homepage_banners, featured_restaurants

-- ---------- Tenants ----------

CREATE TABLE restaurants (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id          UUID,                       -- FK to restaurant_admins, set after owner created
  name              VARCHAR(160) NOT NULL,
  slug              VARCHAR(180) UNIQUE NOT NULL,
  city              VARCHAR(80),
  address           TEXT,
  latitude          DOUBLE PRECISION,
  longitude         DOUBLE PRECISION,
  delivery_radius_km NUMERIC(5,2) DEFAULT 5,
  logo_url          TEXT,
  banner_url        TEXT,
  cuisine_tags      TEXT[] DEFAULT '{}',
  gst_number        VARCHAR(40),
  opening_hours     JSONB DEFAULT '{}',          -- {mon: [["10:00","22:00"]], ...}
  status            VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | active | suspended | rejected
  subscription_plan VARCHAR(40) DEFAULT 'basic',
  commission_pct    NUMERIC(5,2) DEFAULT 15.00,
  monthly_fee       NUMERIC(10,2) DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE restaurant_admins (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(30) NOT NULL DEFAULT 'owner', -- owner | manager | staff | delivery
  permissions   JSONB DEFAULT '[]',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, email)
);

ALTER TABLE restaurants
  ADD CONSTRAINT fk_restaurants_owner
  FOREIGN KEY (owner_id) REFERENCES restaurant_admins(id) ON DELETE SET NULL;

-- ---------- Menu ----------

CREATE TABLE categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_categories_restaurant ON categories(restaurant_id);

CREATE TABLE menu_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  name          VARCHAR(160) NOT NULL,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL,
  image_url     TEXT,
  veg_flag      VARCHAR(10) DEFAULT 'veg',   -- veg | non_veg | egg
  is_available  BOOLEAN NOT NULL DEFAULT true,
  variants      JSONB DEFAULT '[]',           -- [{name:"Large", price_delta:50}]
  addons        JSONB DEFAULT '[]',           -- [{name:"Extra cheese", price:30}]
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);

-- ---------- Customers ----------

CREATE TABLE customers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(120),
  phone         VARCHAR(20) UNIQUE,
  email         VARCHAR(160) UNIQUE,
  password_hash VARCHAR(255),
  loyalty_points INT DEFAULT 0,
  is_blocked    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE customer_addresses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label         VARCHAR(40),         -- home | work | other
  line1         TEXT NOT NULL,
  line2         TEXT,
  city          VARCHAR(80),
  pincode       VARCHAR(12),
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  is_default    BOOLEAN DEFAULT false
);
CREATE INDEX idx_addresses_customer ON customer_addresses(customer_id);

-- ---------- Orders ----------

CREATE TABLE orders (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id),
  customer_id    UUID NOT NULL REFERENCES customers(id),
  order_number   VARCHAR(20) UNIQUE NOT NULL,
  delivery_type  VARCHAR(20) NOT NULL DEFAULT 'delivery', -- delivery | pickup | dine_in
  address_id     UUID REFERENCES customer_addresses(id),
  status         VARCHAR(30) NOT NULL DEFAULT 'placed',
  -- placed | accepted | preparing | ready | out_for_delivery | delivered | cancelled | rejected
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | paid | failed | cod
  payment_method VARCHAR(20),                             -- upi | card | wallet | cod
  subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee   NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax            NUMERIC(10,2) NOT NULL DEFAULT 0,
  tip             NUMERIC(10,2) NOT NULL DEFAULT 0,
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  coupon_id      UUID,
  notes          TEXT,
  placed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(restaurant_id, status);

CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES menu_items(id),
  name_snapshot VARCHAR(160) NOT NULL,   -- preserve name/price at order time
  qty           INT NOT NULL DEFAULT 1,
  unit_price    NUMERIC(10,2) NOT NULL,
  selected_variant JSONB,
  selected_addons  JSONB DEFAULT '[]',
  line_total    NUMERIC(10,2) NOT NULL
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TABLE order_status_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status      VARCHAR(30) NOT NULL,
  changed_by  VARCHAR(80),           -- role or user id
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Coupons ----------

CREATE TABLE coupons (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE, -- NULL = platform-wide
  code          VARCHAR(40) NOT NULL,
  description   TEXT,
  discount_type VARCHAR(10) NOT NULL DEFAULT 'percent',  -- percent | flat
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_discount  NUMERIC(10,2),
  usage_limit   INT,
  used_count    INT DEFAULT 0,
  valid_from    TIMESTAMPTZ,
  valid_until   TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT true,
  UNIQUE(restaurant_id, code)
);

ALTER TABLE orders ADD CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id);

-- ---------- Reviews ----------

CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES customers(id),
  order_id      UUID REFERENCES orders(id),
  rating        INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  reply         TEXT,                  -- restaurant's response
  replied_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_restaurant ON reviews(restaurant_id);

-- ---------- Payments ----------

CREATE TABLE payments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  gateway     VARCHAR(30) NOT NULL,     -- razorpay | stripe | cod
  gateway_ref VARCHAR(120),
  status      VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | success | failed | refunded
  amount      NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Notifications & support ----------

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_type VARCHAR(20) NOT NULL, -- customer | restaurant_admin | super_admin
  recipient_id   UUID NOT NULL,
  channel        VARCHAR(20) NOT NULL, -- sms | email | whatsapp | push
  title          VARCHAR(160),
  body           TEXT,
  is_read        BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE support_tickets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id),
  customer_id   UUID REFERENCES customers(id),
  order_id      UUID REFERENCES orders(id),
  subject       VARCHAR(160) NOT NULL,
  status        VARCHAR(20) DEFAULT 'open',  -- open | in_progress | resolved | closed
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_type  VARCHAR(20) NOT NULL,  -- super_admin | restaurant_admin
  actor_id    UUID NOT NULL,
  action      VARCHAR(120) NOT NULL,
  target_type VARCHAR(60),
  target_id   UUID,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
