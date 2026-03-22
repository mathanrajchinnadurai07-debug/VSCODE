const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get cart
router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('cart.product');
  res.json(user.cart);
});

// Add to cart
router.post('/add', auth, async (req, res) => {
  const { productId, quantity = 1, weight = '500g' } = req.body;
  const user = await User.findById(req.user._id);
  const existing = user.cart.find(i => i.product.toString() === productId && i.weight === weight);
  if (existing) { existing.quantity += quantity; } else { user.cart.push({ product: productId, quantity, weight }); }
  await user.save();
  res.json(user.cart);
});

// Update quantity
router.put('/update', auth, async (req, res) => {
  const { productId, quantity, weight } = req.body;
  const user = await User.findById(req.user._id);
  const item = user.cart.find(i => i.product.toString() === productId && i.weight === weight);
  if (item) { item.quantity = Math.max(1, quantity); await user.save(); }
  res.json(user.cart);
});

// Remove
router.delete('/remove/:productId/:weight', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  user.cart = user.cart.filter(i => !(i.product.toString() === req.params.productId && i.weight === req.params.weight));
  await user.save();
  res.json(user.cart);
});

// Clear
router.delete('/clear', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  user.cart = [];
  await user.save();
  res.json({ message: 'Cart cleared' });
});

module.exports = router;
