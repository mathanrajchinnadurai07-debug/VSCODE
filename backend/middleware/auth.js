/* Curfee — JWT Auth Middleware (MySQL) */
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'curfee_secret');
    const [rows] = await pool.query('SELECT id, name, email, phone, role, avatar, created_at FROM users WHERE id = ?', [decoded.id]);
    if (!rows.length) return res.status(401).json({ message: 'User not found' });

    req.user = rows[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
      next();
    });
  } catch (error) {
    res.status(403).json({ message: 'Admin access denied' });
  }
};

module.exports = { auth, adminAuth };
