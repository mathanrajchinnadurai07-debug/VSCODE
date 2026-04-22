/* ============================================================
   Curfee — Cart Routes (MySQL)
   POST /add, GET /, PUT /:id, DELETE /:id, DELETE /clear
   ============================================================ */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');

// ── GET cart (with product details) ──
router.get('/', auth, async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT c.id, c.quantity, c.weight, c.product_id,
             p.name, p.slug, p.price, p.discount_price as discountPrice, p.images, p.stock
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    items.forEach(item => {
      try { item.images = JSON.parse(item.images); } catch { item.images = []; }
      item._id = item.id;
    });

    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST add to cart ──
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, quantity = 1, weight = '500g' } = req.body;

    // Check if item already in cart
    const [existing] = await pool.query(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND weight = ?',
      [req.user.id, productId, weight]
    );

    if (existing.length) {
      // Update quantity
      await pool.query('UPDATE cart SET quantity = quantity + ? WHERE id = ?', [quantity, existing[0].id]);
    } else {
      // Insert new item
      await pool.query('INSERT INTO cart (user_id, product_id, quantity, weight) VALUES (?, ?, ?, ?)',
        [req.user.id, productId, quantity, weight]);
    }

    // Return updated cart
    const [items] = await pool.query(`
      SELECT c.id, c.quantity, c.weight, c.product_id,
             p.name, p.slug, p.price, p.discount_price as discountPrice, p.images
      FROM cart c JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `, [req.user.id]);

    items.forEach(item => { try { item.images = JSON.parse(item.images); } catch { item.images = []; } });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PUT update cart item quantity ──
router.put('/:id', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    await pool.query('UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?',
      [Math.max(1, quantity), req.params.id, req.user.id]);

    const [items] = await pool.query(`
      SELECT c.id, c.quantity, c.weight, c.product_id,
             p.name, p.slug, p.price, p.discount_price as discountPrice, p.images
      FROM cart c JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `, [req.user.id]);

    items.forEach(item => { try { item.images = JSON.parse(item.images); } catch { item.images = []; } });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE cart item ──
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM cart WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Item removed from cart' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE clear entire cart ──
router.delete('/clear/all', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
