/* ============================================================
   Curfee — Orders Routes (MySQL + Nodemailer)
   POST /    — create order (after payment)
   GET /     — user's orders
   GET /:id  — single order
   PUT /:id/cancel — cancel order
   ============================================================ */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// ── Nodemailer transporter (configured from .env) ──
let transporter;
try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} catch (e) {
  console.warn('⚠️ Email not configured — order confirmations will be skipped');
}

// ── Send order confirmation email ──
async function sendConfirmationEmail(userEmail, userName, order) {
  if (!transporter || !process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com') {
    console.log('📧 Email skipped (SMTP not configured). Order:', order.order_number);
    return;
  }

  const itemRows = JSON.parse(order.items).map(i =>
    `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td>
         <td style="padding:8px;border-bottom:1px solid #eee;">${i.quantity} × ${i.weight || ''}</td>
         <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₹${i.price * i.quantity}</td></tr>`
  ).join('');

  const html = `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:linear-gradient(135deg,#2d6a4f,#40916c);padding:30px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">🌿 Order Confirmed!</h1>
        <p style="color:#d8f3dc;margin:5px 0 0;">Thank you for choosing Curfee Organic</p>
      </div>
      <div style="padding:24px;">
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Your order <strong>${order.order_number}</strong> has been placed successfully!</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead><tr style="background:#f8fafc;">
            <th style="padding:8px;text-align:left;">Item</th>
            <th style="padding:8px;text-align:left;">Qty</th>
            <th style="padding:8px;text-align:right;">Amount</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
          <tfoot><tr style="background:#f0fdf4;">
            <td colspan="2" style="padding:10px;font-weight:700;">Total</td>
            <td style="padding:10px;text-align:right;font-weight:700;color:#2d6a4f;">₹${order.total}</td>
          </tr></tfoot>
        </table>
        <p style="color:#64748b;font-size:0.9rem;">We'll update you when your order ships. Estimated delivery: 2-4 business days.</p>
      </div>
      <div style="background:#f8fafc;padding:16px;text-align:center;color:#94a3b8;font-size:0.8rem;">
        Curfee Organic Market • Fresh from farm to your door 🌿
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: userEmail,
      subject: `✅ Order Confirmed — ${order.order_number}`,
      html,
    });
    console.log(`📧 Confirmation email sent to ${userEmail}`);
  } catch (e) {
    console.warn('📧 Email send failed:', e.message);
  }
}

// ── POST create order ──
router.post('/', auth, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, paymentId, subtotal, deliveryCharge, discount, total } = req.body;
    const orderNumber = 'COM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();

    const [result] = await pool.query(
      `INSERT INTO orders (user_id, order_number, items, shipping_address, payment_method, payment_id, payment_status, subtotal, delivery_charge, discount, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'placed')`,
      [req.user.id, orderNumber, JSON.stringify(items), JSON.stringify(shippingAddress || {}),
       paymentMethod || 'cod', paymentId || null,
       paymentId ? 'paid' : 'pending',
       subtotal || total, deliveryCharge || 0, discount || 0, total]
    );

    // Add status history
    await pool.query('INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
      [result.insertId, 'placed', 'Order placed by customer']);

    // Clear user's cart
    await pool.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

    const order = { id: result.insertId, order_number: orderNumber, items: JSON.stringify(items), total };

    // Send confirmation email (non-blocking)
    sendConfirmationEmail(req.user.email, req.user.name, order).catch(() => {});

    res.status(201).json({ id: result.insertId, orderNumber, status: 'placed', total, message: 'Order placed successfully!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET user's orders ──
router.get('/', auth, async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]
    );
    orders.forEach(o => {
      try { o.items = JSON.parse(o.items); } catch { o.items = []; }
      try { o.shipping_address = JSON.parse(o.shipping_address); } catch { o.shipping_address = {}; }
      o._id = o.id;
      o.orderNumber = o.order_number;
      o.shippingAddress = o.shipping_address;
      o.paymentMethod = o.payment_method;
      o.paymentStatus = o.payment_status;
      o.paymentId = o.payment_id;
      o.deliveryCharge = o.delivery_charge;
    });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET single order ──
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    const o = rows[0];
    try { o.items = JSON.parse(o.items); } catch { o.items = []; }
    try { o.shipping_address = JSON.parse(o.shipping_address); } catch { o.shipping_address = {}; }
    o._id = o.id;
    o.orderNumber = o.order_number;
    o.shippingAddress = o.shipping_address;

    // Fetch status history
    const [history] = await pool.query('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC', [o.id]);
    o.statusHistory = history;

    res.json(o);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PUT cancel order ──
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });
    if (['shipped', 'delivered'].includes(rows[0].status)) return res.status(400).json({ message: 'Cannot cancel shipped/delivered orders' });

    const reason = req.body.reason || 'Cancelled by user';
    await pool.query('UPDATE orders SET status = ?, cancel_reason = ? WHERE id = ?', ['cancelled', reason, req.params.id]);
    await pool.query('INSERT INTO order_status_history (order_id, status, note) VALUES (?, ?, ?)',
      [req.params.id, 'cancelled', reason]);

    res.json({ message: 'Order cancelled', status: 'cancelled' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
