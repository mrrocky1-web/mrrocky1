const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['customer', 'seller', 'admin'], default: 'customer' },
  storeName: { type: String, default: '' },
  avatar: { type: String, default: '' },
  banner: { type: String, default: '' },
  status: { type: String, enum: ['Approved', 'Pending', 'Suspended'], default: 'Pending' },
  followersCount: { type: Number, default: 0 },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' }
  },
  isVerified: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
