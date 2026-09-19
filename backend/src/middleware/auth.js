import { verifyToken } from '../utils/jwt.js';

/**
 * Verifies the JWT and attaches `req.user = { id, role, restaurant_id? }`.
 * This is the ONLY place restaurant_id enters a request for admin routes —
 * never read restaurant_id from req.body/req.query for scoping decisions.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Restrict a route to one or more roles. */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden for this role' });
    }
    next();
  };
}

/**
 * For restaurant_admin/staff routes: whatever :restaurantId is in the URL
 * MUST match the token's restaurant_id, unless the caller is super_admin
 * (who is allowed cross-tenant access for support purposes).
 */
export function requireOwnRestaurant(req, res, next) {
  const paramId = req.params.restaurantId;
  if (req.user.role === 'super_admin') return next();
  if (req.user.role === 'restaurant_admin' || req.user.role === 'staff') {
    if (req.user.restaurant_id === paramId) return next();
    return res.status(403).json({ error: 'Not authorized for this restaurant' });
  }
  return res.status(403).json({ error: 'Forbidden' });
}
