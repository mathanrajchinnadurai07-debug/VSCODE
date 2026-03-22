const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

// Analytics
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const revenueAgg = await Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).select('orderNumber total status createdAt');
    res.json({ totalProducts, totalOrders, totalCustomers, totalRevenue, recentOrders });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// CRUD Products
router.post('/products', adminAuth, async (req, res) => {
  try { const product = await Product.create(req.body); res.status(201).json(product); } catch (err) { res.status(500).json({ message: err.message }); }
});
router.put('/products/:id', adminAuth, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(product);
});
router.delete('/products/:id', adminAuth, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
});

// Manage Orders
router.get('/orders', adminAuth, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).populate('user', 'name email');
  res.json(orders);
});
router.put('/orders/:id/status', adminAuth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  order.status = req.body.status;
  order.statusHistory.push({ status: req.body.status, note: req.body.note });
  await order.save();
  res.json(order);
});

// Customers
router.get('/customers', adminAuth, async (req, res) => {
  const customers = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
  res.json(customers);
});

module.exports = router;
