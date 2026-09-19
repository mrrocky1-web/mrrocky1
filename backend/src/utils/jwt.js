import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// role: 'super_admin' | 'restaurant_admin' | 'staff' | 'customer'
// restaurant_id is embedded for restaurant_admin/staff tokens so every
// downstream query can be scoped without trusting anything from the client body.
export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
