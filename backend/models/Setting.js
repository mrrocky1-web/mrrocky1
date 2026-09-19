const mongoose = require('mongoose');

const carouselSlideSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  badgeText: { type: String, default: '' },
  linkUrl: { type: String, default: '#' },
  buttonText: { type: String, default: 'Shop Now' }
});

const settingSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Fashionvillaroyal' },
  announcementText: { type: String, default: 'We are available in Meesho, Flipkart, Amazon etc.' },
  supportEmail: { type: String, default: 'fhub0021@gmail.com' },
  carouselSlides: [carouselSlideSchema]
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
