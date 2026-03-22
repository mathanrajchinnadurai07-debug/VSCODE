const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, user: req.user._id, statusHistory: [{ status: 'placed' }] });
    res.status(201).json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get user orders
router.get('/', auth, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

// Cancel order
router.put('/:id/cancel', auth, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (['shipped','delivered'].includes(order.status)) return res.status(400).json({ message: 'Cannot cancel' });
  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Cancelled by user' });
  await order.save();
  res.json(order);
});

module.exports = router;
