const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const genToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET || 'curfee_secret', { expiresIn: '30d' });

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, phone });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: genToken(user._id, user.role) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, token: genToken(user._id, user.role) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Send OTP (demo)
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  let user = await User.findOne({ phone });
  if (!user) user = await User.create({ name: 'User', email: phone + '@otp.curfee.com', phone });
  user.otp = otp; user.otpExpiry = new Date(Date.now() + 10 * 60000); await user.save();
  console.log(`📱 OTP for ${phone}: ${otp}`);
  res.json({ message: 'OTP sent', demo_otp: otp });
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  const user = await User.findOne({ phone });
  if (!user || user.otp !== otp || user.otpExpiry < new Date()) return res.status(400).json({ message: 'Invalid OTP' });
  user.otp = undefined; user.otpExpiry = undefined; await user.save();
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: genToken(user._id, user.role) });
});

// Get profile
router.get('/profile', auth, async (req, res) => { res.json(req.user); });

// Update profile
router.put('/profile', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.name) user.name = req.body.name;
  if (req.body.phone) user.phone = req.body.phone;
  await user.save();
  res.json(user);
});

// Manage addresses
router.post('/address', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses.push(req.body);
  await user.save();
  res.json(user.addresses);
});

module.exports = router;
