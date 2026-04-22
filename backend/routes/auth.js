/* ============================================================
   Curfee — Auth Routes (MySQL + bcrypt + JWT)
   POST /register, POST /login, GET /me, GET /profile, PUT /profile
   ============================================================ */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');

const genToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET || 'curfee_secret', { expiresIn: '30d' });

// ── Register ──
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required' });

    // Check if email exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
      [name, email, hashed, phone || null]
    );

    const userId = result.insertId;
    res.status(201).json({
      _id: userId, id: userId, name, email, role: 'user', phone: phone || '',
      token: genToken(userId, 'user')
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Login ──
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length || !rows[0].password) return res.status(400).json({ message: 'Invalid credentials' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    res.json({
      _id: user.id, id: user.id, name: user.name, email: user.email,
      role: user.role, phone: user.phone || '',
      token: genToken(user.id, user.role)
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Get current user (GET /me) ──
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// ── Get profile (alias) ──
router.get('/profile', auth, async (req, res) => {
  // Also fetch addresses
  const [addresses] = await pool.query('SELECT * FROM user_addresses WHERE user_id = ?', [req.user.id]);
  res.json({ ...req.user, addresses });
});

// ── Update profile ──
router.put('/profile', auth, async (req, res) => {
  const { name, phone } = req.body;
  const updates = [];
  const values = [];
  if (name)  { updates.push('name = ?');  values.push(name); }
  if (phone) { updates.push('phone = ?'); values.push(phone); }
  if (updates.length) {
    values.push(req.user.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  }
  const [rows] = await pool.query('SELECT id, name, email, phone, role, avatar FROM users WHERE id = ?', [req.user.id]);
  res.json(rows[0]);
});

// ── Add address ──
router.post('/address', auth, async (req, res) => {
  const { fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;
  await pool.query(
    'INSERT INTO user_addresses (user_id, full_name, phone, address_line1, address_line2, city, state, pincode, is_default) VALUES (?,?,?,?,?,?,?,?,?)',
    [req.user.id, fullName, phone, addressLine1, addressLine2 || '', city, state, pincode, isDefault ? 1 : 0]
  );
  const [addresses] = await pool.query('SELECT * FROM user_addresses WHERE user_id = ?', [req.user.id]);
  res.json(addresses);
});

// ── OTP Login (demo) ──
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Check if user exists
  let [rows] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
  if (!rows.length) {
    await pool.query('INSERT INTO users (name, email, phone) VALUES (?, ?, ?)', ['User', phone + '@otp.curfee.com', phone]);
  }
  console.log(`📱 OTP for ${phone}: ${otp}`);
  res.json({ message: 'OTP sent', demo_otp: otp });
});

router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  // Demo mode — accept any 6 digit OTP
  if (!otp || otp.length !== 6) return res.status(400).json({ message: 'Invalid OTP' });
  const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
  if (!rows.length) return res.status(400).json({ message: 'User not found' });
  const user = rows[0];
  res.json({
    _id: user.id, id: user.id, name: user.name, email: user.email,
    role: user.role, token: genToken(user.id, user.role)
  });
});

module.exports = router;
