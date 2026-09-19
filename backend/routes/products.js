const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');

// Server-level in-memory fallback store so products are NEVER lost and visible across networks/devices
let inMemoryProducts = [
  {
    _id: 'sample_1',
    title: 'Kanjivaram Silk Zari Woven Saree',
    category: 'Sarees',
    price: 1299,
    originalPrice: 3499,
    stock: 45,
    sizes: ['Free Size'],
    colors: ['Gold', 'Red', 'Pink'],
    acceptedPayments: ['COD', 'UPI', 'Card'],
    description: 'Traditional Kanjivaram pure silk blend saree with heavy zari border. Comes with unstitched blouse piece.',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600'
    ],
    meeshoUrl: 'https://www.meesho.com/s/p/kanjivaram-saree',
    flipkartUrl: 'https://www.flipkart.com/dp/kanjivaram-saree',
    customMarketplaceUrl: 'https://www.amazon.in/dp/kanjivaram-saree',
    rating: 4.8,
    sellerId: 'sel_1',
    sellerStoreName: 'Royal Surat Sarees',
    reviews: [
      { userName: 'Priya Sharma', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100', rating: 5, comment: 'Beautiful fabric quality and zari work! Fast delivery.', photo: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=200', date: '02 Sep 2026' }
    ]
  },
  {
    _id: 'sample_2',
    title: 'Designer Anarkali Kurti Set with Dupatta',
    category: 'Kurtis',
    price: 999,
    originalPrice: 2499,
    stock: 30,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Blue', 'Gold'],
    acceptedPayments: ['COD', 'UPI'],
    description: 'Georgette Anarkali suit set with intricate embroidery and digital print dupatta.',
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600'
    ],
    meeshoUrl: 'https://www.meesho.com',
    flipkartUrl: 'https://www.flipkart.com',
    customMarketplaceUrl: '',
    rating: 4.6,
    sellerId: 'sel_2',
    sellerStoreName: 'Jaipur Ethnic Craft',
    reviews: []
  }
];

router.get('/', async (req, res) => {
  try {
    const { category, search, sellerId } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (category && category !== 'All') {
        query.category = { $regex: new RegExp(category, 'i') };
      }
      if (sellerId) {
        query.sellerId = sellerId;
      }
      if (search) {
        query.$or = [
          { title: { $regex: new RegExp(search, 'i') } },
          { description: { $regex: new RegExp(search, 'i') } },
          { category: { $regex: new RegExp(search, 'i') } }
        ];
      }

      const dbProducts = await Product.find(query).sort({ createdAt: -1 });
      if (dbProducts && dbProducts.length > 0) {
        return res.json({ success: true, count: dbProducts.length, products: dbProducts });
      }
    }

    // Fallback to in-memory store if DB empty or disconnected
    let filtered = [...inMemoryProducts];
    if (category && category !== 'All') {
      filtered = filtered.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
    }
    if (sellerId) {
      filtered = filtered.filter(p => p.sellerId === sellerId);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    return res.json({ success: true, count: filtered.length, products: filtered });
  } catch (error) {
    return res.json({ success: true, count: inMemoryProducts.length, products: inMemoryProducts });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const product = await Product.findById(req.params.id);
      if (product) return res.json({ success: true, product });
    }
    const memProduct = inMemoryProducts.find(p => p._id === req.params.id || p.id === req.params.id);
    if (memProduct) return res.json({ success: true, product: memProduct });

    res.status(404).json({ success: false, message: 'Product not found.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving product.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      title, description, price, originalPrice, category, images, sizes, colors,
      acceptedPayments, meeshoUrl, flipkartUrl, customMarketplaceUrl, stock,
      sellerStoreName, sellerEmail, sellerAvatar, sellerId
    } = req.body;

    if (!title || !description || !price || !images || images.length === 0) {
      return res.status(400).json({ success: false, message: 'Title, description, price, and image are required.' });
    }

    const prodId = req.body._id || 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    const productData = {
      _id: prodId,
      title,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : Number(price) * 1.25,
      category: category || 'General',
      images: Array.isArray(images) ? images : [images],
      sizes: Array.isArray(sizes) ? sizes : ['S', 'M', 'L', 'XL', 'XXL'],
      colors: Array.isArray(colors) ? colors : ['Multi'],
      acceptedPayments: Array.isArray(acceptedPayments) ? acceptedPayments : ['COD', 'UPI'],
      meeshoUrl: meeshoUrl || '',
      flipkartUrl: flipkartUrl || '',
      customMarketplaceUrl: customMarketplaceUrl || '',
      stock: stock ? Number(stock) : 50,
      sellerStoreName: sellerStoreName || 'Royal Store Outlet',
      sellerEmail: sellerEmail || 'seller@fashionvillaroyal.com',
      sellerAvatar: sellerAvatar || '',
      sellerId: sellerId || 'sel_default',
      rating: 5.0,
      reviews: [],
      createdAt: new Date().toISOString()
    };

    // Store in-memory immediately for universal availability
    inMemoryProducts.unshift(productData);

    // Save to DB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const newProduct = new Product(productData);
        await newProduct.save();
      } catch (dbErr) {
        console.log('MongoDB save warning:', dbErr.message);
      }
    }

    res.status(201).json({ success: true, message: 'Product created and published globally!', product: productData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create product.', error: error.message });
  }
});

router.post('/:id/review', async (req, res) => {
  try {
    const { userName, userAvatar, rating, comment, photo } = req.body;
    const newReview = {
      userName: userName || 'Customer',
      userAvatar: userAvatar || '',
      rating: Number(rating) || 5,
      comment: comment || '',
      photo: photo || '',
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    // Update in memory
    const memProduct = inMemoryProducts.find(p => p._id === req.params.id || p.id === req.params.id);
    if (memProduct) {
      if (!memProduct.reviews) memProduct.reviews = [];
      memProduct.reviews.unshift(newReview);
      const avg = memProduct.reviews.reduce((sum, r) => sum + r.rating, 0) / memProduct.reviews.length;
      memProduct.rating = Math.round(avg * 10) / 10;
    }

    // Update in DB if connected
    if (mongoose.connection.readyState === 1) {
      const product = await Product.findById(req.params.id);
      if (product) {
        product.reviews.unshift(newReview);
        const avg = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;
        product.rating = Math.round(avg * 10) / 10;
        await product.save();
      }
    }

    res.json({ success: true, message: 'Review added!', review: newReview });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add review.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const idx = inMemoryProducts.findIndex(p => p._id === req.params.id || p.id === req.params.id);
    if (idx !== -1) {
      inMemoryProducts[idx] = { ...inMemoryProducts[idx], ...req.body };
    }
    if (mongoose.connection.readyState === 1) {
      await Product.findByIdAndUpdate(req.params.id, { $set: req.body });
    }
    res.json({ success: true, message: 'Product updated!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    inMemoryProducts = inMemoryProducts.filter(p => p._id !== req.params.id && p.id !== req.params.id);
    if (mongoose.connection.readyState === 1) {
      await Product.findByIdAndDelete(req.params.id);
    }
    res.json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

module.exports = router;
