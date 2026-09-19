const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  emailOrPhone: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 600 }
}, { timestamps: true });

module.exports = mongoose.model('Otp', otpSchema);
