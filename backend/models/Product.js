const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, default: 0 },
  category: { type: String, required: true, default: 'General' },
  images: [{ type: String, required: true }],
  sizes: [{ type: String }],
  colors: [{ type: String }],
  acceptedPayments: [{ type: String }],
  meeshoUrl: { type: String, default: '' },
  flipkartUrl: { type: String, default: '' },
  amazonUrl: { type: String, default: '' },
  customMarketplaceUrl: { type: String, default: '' },
  stock: { type: Number, default: 50, min: 0 },
  rating: { type: Number, default: 4.8 },
  sellerStoreName: { type: String, default: 'Royal Store Outlet' },
  sellerEmail: { type: String, default: 'seller@fashionvillaroyal.com' },
  sellerAvatar: { type: String, default: '' },
  sellerId: { type: String, default: 'sel_default' },
  reviews: [
    {
      userName: String,
      userAvatar: String,
      rating: Number,
      comment: String,
      photo: String,
      date: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
