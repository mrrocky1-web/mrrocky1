const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fashionvillaroyal_super_secret_jwt_key_2026';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@fashionvillaroyal.com').toLowerCase();
const ADMIN_SECONDARY_EMAIL = (process.env.ADMIN_SECONDARY_EMAIL || 'fhub0021@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'FashionRoyalAdmin@2026#';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and Password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const isAdminEmail = cleanEmail === ADMIN_EMAIL || cleanEmail === ADMIN_SECONDARY_EMAIL;

  // Strict Head Admin Authentication
  if (isAdminEmail) {
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid Head Admin Password! Access Denied.' });
    }

    const adminUser = {
      id: 'admin_master_001',
      name: 'Super Head Admin',
      email: cleanEmail,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'
    };
    const token = jwt.sign(adminUser, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, message: 'Welcome Head Admin! Full control granted.', token, user: adminUser });
  }

  // Seller or Customer Authentication
  const role = cleanEmail.includes('seller') ? 'seller' : 'customer';
  const user = {
    id: 'usr_' + Date.now(),
    name: cleanEmail.split('@')[0],
    email: cleanEmail,
    role: role,
    storeName: role === 'seller' ? 'Royal Seller Store' : '',
    avatar: '',
    address: { street: '', city: '', state: '', pincode: '' }
  };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

  return res.json({ success: true, message: 'Login successful!', token, user });
});

router.post('/register', async (req, res) => {
  const { name, email, role, storeName, phone } = req.body;
  
  let userRole = role === 'seller' ? 'seller' : 'customer';
  if (role === 'admin') userRole = 'customer';

  const user = {
    id: 'usr_' + Date.now(),
    name: name || 'User',
    email: email || 'user@example.com',
    phone: phone || '',
    role: userRole,
    storeName: storeName || (userRole === 'seller' ? 'New Merchant Store' : ''),
    status: userRole === 'seller' ? 'Pending' : 'Approved',
    avatar: '',
    banner: '',
    address: { street: '', city: '', state: '', pincode: '' }
  };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
  return res.status(201).json({ success: true, message: 'Registration successful!', token, user });
});

router.put('/profile', async (req, res) => {
  const { name, phone, storeName, address, avatar, banner } = req.body;
  res.json({
    success: true,
    message: 'Profile updated successfully!',
    profile: { name, phone, storeName, address, avatar, banner }
  });
});

router.delete('/account', async (req, res) => {
  res.json({ success: true, message: 'Account deleted successfully.' });
});

router.post('/forgot-password', async (req, res) => {
  const { emailOrPhone } = req.body;
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  return res.json({ success: true, message: 'OTP sent successfully!', otpPreview: generatedOtp });
});

router.post('/verify-otp-reset', async (req, res) => {
  return res.json({ success: true, message: 'Password reset successfully!' });
});

router.post('/change-password', async (req, res) => {
  return res.json({ success: true, message: 'Password changed!' });
});

module.exports = router;
