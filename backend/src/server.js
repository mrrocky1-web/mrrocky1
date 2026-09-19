import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { initSchema } from './db/init.js';
import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurants.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import couponRoutes from './routes/coupons.js';
import reviewRoutes from './routes/reviews.js';
import superadminRoutes from './routes/superadmin.js';

initSchema();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Public + role-gated routes. Every restaurant-scoped route is nested
// under /restaurants/:restaurantId so requireOwnRestaurant can enforce
// tenant isolation from the URL rather than trusting the request body.
app.use('/api/auth', authRoutes);
app.use('/api/restaurants/:restaurantId/menu', menuRoutes);
app.use('/api/restaurants/:restaurantId/coupons', couponRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/superadmin', superadminRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
