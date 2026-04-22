/* ============================================================
   Curfee Organic Market — Server (MySQL)
   ============================================================ */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection, pool } = require('./config/db');

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Serve frontend static files ──
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API Routes ──
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/payment',  require('./routes/payment'));

// ── Wishlist (inline — MySQL) ──
const { auth } = require('./middleware/auth');

app.post('/api/wishlist/toggle', auth, async (req, res) => {
  try {
    const { productId } = req.body;
    const [existing] = await pool.query('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    if (existing.length) {
      await pool.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
    } else {
      await pool.query('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', [req.user.id, productId]);
    }
    const [items] = await pool.query('SELECT product_id FROM wishlist WHERE user_id = ?', [req.user.id]);
    res.json(items.map(i => i.product_id));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/wishlist', auth, async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT p.* FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = ?
    `, [req.user.id]);
    items.forEach(p => { try { p.images = JSON.parse(p.images); } catch { p.images = []; } p._id = p.id; });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Support (inline) ──
app.post('/api/support/contact', async (req, res) => {
  console.log('📧 Support message:', req.body);
  res.json({ message: 'Message received! We will respond within 24 hours.' });
});

// ── Serve frontend for non-API routes ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ── Start server ──
const PORT = process.env.PORT || 5000;

async function start() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🌿 Curfee server running at http://localhost:${PORT}`);
    console.log(`📂 Frontend served from: ${path.join(__dirname, '..', 'frontend')}`);
    console.log(`🗄️  Database: MySQL (${process.env.MYSQL_HOST || 'localhost'}:${process.env.MYSQL_PORT || 3306}/${process.env.MYSQL_DATABASE || 'curfee'})`);
  });
}

start();
