# Multi-Tenant Restaurant Ordering Platform

A working reference implementation of the spec: one shared database, one backend API,
and three independent frontends (Customer, Restaurant Admin, Super Admin), with
role-based access control enforced at the API layer.

```
restaurant-platform/
├── database/schema.sql       ← PostgreSQL schema (production target)
├── backend/                  ← Express API (JWT auth + RBAC)
├── frontend-customer/        ← Customer website (React)
├── frontend-admin/           ← Restaurant admin panel (React)
└── frontend-superadmin/      ← Super admin panel (React)
```

## Quick start (local demo)

The backend ships with SQLite so you can run everything with zero external
services. The schema in `database/schema.sql` is the intended production
(PostgreSQL) shape — `backend/src/db/init.js` mirrors it in SQLite for the demo.

```bash
# 1. Backend
cd backend
cp .env.example .env
npm install
npm run seed      # creates demo super admin, restaurant, menu, customer
npm run dev        # http://localhost:4000

# 2. Customer site (new terminal)
cd frontend-customer
npm install
npm run dev        # http://localhost:5173

# 3. Restaurant admin panel (new terminal)
cd frontend-admin
npm install
npm run dev        # http://localhost:5174 (or next free port)

# 4. Super admin panel (new terminal)
cd frontend-superadmin
npm install
npm run dev        # http://localhost:5175 (or next free port)
```

### Demo accounts (created by `npm run seed`)

| Role              | Email                     | Password        |
|-------------------|---------------------------|-----------------|
| Super admin       | super@platform.com        | SuperAdmin123!  |
| Restaurant owner  | owner@kingburger.com      | Owner123!       |
| Customer          | customer@example.com      | Customer123!    |

The seeded restaurant ("King Burger Express") is already `active`, so it shows
up on the customer site immediately. Sign up a *new* restaurant from the admin
panel's "Register here" link to see the full pending → approval flow via the
super admin panel.

## What's implemented

**Database** — full schema from the spec: restaurants, admins/staff, menu
(categories + items with variants/add-ons), customers + addresses, orders +
order items + status history, coupons, reviews, payments, notifications,
support tickets, audit logs. Every tenant-scoped table carries `restaurant_id`.

**Backend API** (`backend/src/`)
- JWT auth with four roles: `super_admin`, `restaurant_admin`, `staff`, `customer`.
- `middleware/auth.js` enforces tenant isolation: a restaurant admin's token is
  scoped to their `restaurant_id`, and any route touching `:restaurantId` in the
  URL checks it against the token — never against anything in the request body.
  Verified in testing: cross-tenant requests return 403.
- Server-side order pricing — the client sends item IDs and quantities only;
  price, tax, discount, and total are computed from the database.
- Order status state machine (`placed → accepted → preparing → ready → ...`)
  with invalid transitions rejected.
- Coupon application, reviews + replies, restaurant approval/suspend/billing,
  platform analytics, global settings, customer blocking, support tickets,
  audit logging.

**Customer website** — home, browse/search restaurants, menu with categories
and veg/non-veg tags, cart, checkout (delivery/pickup/dine-in, coupon, payment
method), live order tracking with a status timeline, login/signup, order
history.

**Restaurant admin panel** — dashboard with today's stats and a pending-orders
alert, order queue with status-transition actions, category + item CRUD with
availability toggling, coupon management, review replies, restaurant profile
editing, and new-restaurant registration (goes into `pending` until approved).

**Super admin panel** — platform analytics (revenue, top restaurants, city
breakdown), restaurant approval/reject/suspend/reactivate/delete, per-restaurant
billing (plan, commission %, monthly fee), customer block/unblock, support
ticket status management, global settings (delivery fee rules, tax rules,
homepage banners, featured restaurants) as editable JSON, and an audit log of
every super admin action.

## Going to production

This is a functioning scaffold, not a production deployment. Before shipping:

- **Swap SQLite for PostgreSQL.** Point `backend/src/db/index.js` at a `pg` pool
  using `database/schema.sql` instead of `db/init.js`'s SQLite mirror. The
  route/query logic doesn't need to change much — mostly parameter placeholders
  (`$1` vs `?`) and using real `UUID`/`JSONB`/`TIMESTAMPTZ` types.
- **Real payments.** `Checkout.jsx` has a clearly marked stub for
  Razorpay/Stripe — wire up the actual gateway SDK and webhook verification.
- **Real OTP/SMS/email/WhatsApp** for customer login and order notifications
  (currently email+password for customers, and notifications aren't sent).
- **File storage.** Logo/banner/menu images are plain URL fields — add S3 or
  Cloudinary upload handling.
- **Deploy separately per subdomain** (`www.`, `admin.`, `superadmin.`) as the
  spec describes; each frontend already reads its API base URL from
  `VITE_API_BASE` in its `.env`.
- **Rate limiting, input validation (e.g. zod), and HTTPS/CORS lockdown**
  before this touches real traffic.
