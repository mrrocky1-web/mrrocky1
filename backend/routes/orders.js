const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.post('/', async (req, res) => {
  try {
    const { items, totalAmount, shippingDetails, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    if (!shippingDetails) {
      return res.status(400).json({ success: false, message: 'Shipping contact details are required.' });
    }

    const { fullName, email, phone, address, city, pincode } = shippingDetails;
    if (!fullName || !phone || !email || !address || !city || !pincode) {
      return res.status(400).json({ success: false, message: 'Please fill all shipping details.' });
    }

    const newOrder = new Order({
      items,
      totalAmount,
      shippingDetails,
      paymentMethod: paymentMethod || 'COD',
      orderStatus: 'Placed'
    });

    await newOrder.save();
    res.status(201).json({ success: true, message: 'Order placed successfully!', orderId: newOrder._id, order: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to place order.', error: error.message });
  }
});

router.get('/my-orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus }, { new: true });
    res.json({ success: true, message: `Order status updated to ${orderStatus}`, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

module.exports = router;
