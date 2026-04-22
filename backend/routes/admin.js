/* ============================================================
   Curfee — Admin Routes (MySQL)
   GET /analytics, CRUD products, Manage orders, Customers
   ============================================================ */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { adminAuth } = require('../middleware/auth');

// ── Analytics Dashboard ──
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) as totalProducts FROM products');
    const [[{ totalOrders }]]   = await pool.query('SELECT COUNT(*) as totalOrders FROM orders');
    const [[{ totalCustomers }]] = await pool.query("SELECT COUNT(*) as totalCustomers FROM users WHERE role = 'user'");
    const [[{ totalRevenue }]]  = await pool.query("SELECT COALESCE(SUM(total), 0) as totalRevenue FROM orders WHERE status != 'cancelled'");

    const [recentOrders] = await pool.query(
      'SELECT o.id, o.order_number as orderNumber, o.total, o.status, o.created_at, u.name as userName FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5'
    );

    res.json({ totalProducts, totalOrders, totalCustomers, totalRevenue, recentOrders });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── CRUD Products (admin) ──
router.post('/products', adminAuth, async (req, res) => {
  try {
    const { name, description, category, price, discountPrice, images, stock, slug, weights } = req.body;
    const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const [result] = await pool.query(
      'INSERT INTO products (name, slug, description, category, price, discount_price, images, stock) VALUES (?,?,?,?,?,?,?,?)',
      [name, productSlug, description || '', category, price, discountPrice || null, JSON.stringify(images || []), stock || 100]
    );

    if (weights && weights.length > 0) {
      for (const w of weights) {
        await pool.query('INSERT INTO product_weights (product_id, label, price, discount_price) VALUES (?,?,?,?)',
          [result.insertId, w.label, w.price, w.discountPrice || null]);
      }
    }

    res.status(201).json({ id: result.insertId, name, slug: productSlug });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/products/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, category, price, discountPrice, images, stock, weights } = req.body;
    await pool.query(
      'UPDATE products SET name=COALESCE(?,name), description=COALESCE(?,description), category=COALESCE(?,category), price=COALESCE(?,price), discount_price=COALESCE(?,discount_price), images=COALESCE(?,images), stock=COALESCE(?,stock) WHERE id=?',
      [name, description, category, price, discountPrice, images ? JSON.stringify(images) : null, stock, req.params.id]
    );

    if (weights) {
      await pool.query('DELETE FROM product_weights WHERE product_id = ?', [req.params.id]);
      for (const w of weights) {
        await pool.query('INSERT INTO product_weights (product_id, label, price, discount_price) VALUES (?,?,?,?)',
          [req.params.id, w.label, w.price, w.discountPrice || null]);
      }
    }

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/products/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Manage Orders ──
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, u.name as userName, u.email as userEmail
      FROM orders o LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    orders.forEach(o => {
      try { o.items = JSON.parse(o.items); } catch { o.items = []; }
      try { o.shipping_address = JSON.parse(o.shipping_address); } catch { o.shipping_address = {}; }
      o._id = o.id;
      o.orderNumber = o.order_number;
    });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, note } = req.body;
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    await pool.query('INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
      [req.params.id, status, note || '']);
    res.json({ message: 'Order status updated', status });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Customers ──
router.get('/customers', adminAuth, async (req, res) => {
  try {
    const [customers] = await pool.query(
      "SELECT id, name, email, phone, role, created_at FROM users WHERE role = 'user' ORDER BY created_at DESC"
    );
    res.json(customers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
