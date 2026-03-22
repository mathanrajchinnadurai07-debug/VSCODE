const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Razorpay
router.post('/razorpay/create-order', auth, async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const instance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await instance.orders.create({ amount: req.body.amount * 100, currency: 'INR', receipt: 'order_' + Date.now() });
    res.json(order);
  } catch (err) {
    // Demo mode
    res.json({ id: 'demo_rz_' + Date.now(), amount: req.body.amount * 100, currency: 'INR', status: 'created', demo: true });
  }
});

router.post('/razorpay/verify', auth, async (req, res) => {
  res.json({ verified: true, message: 'Payment verified (demo mode)' });
});

// Stripe
router.post('/stripe/create-intent', auth, async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.create({ amount: req.body.amount * 100, currency: 'inr' });
    res.json({ clientSecret: intent.client_secret, id: intent.id });
  } catch (err) {
    res.json({ clientSecret: 'demo_cs_' + Date.now(), id: 'demo_pi_' + Date.now(), demo: true });
  }
});

// Config (public keys for frontend)
router.get('/config', (req, res) => {
  res.json({
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'demo_key',
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'demo_key',
  });
});

module.exports = router;
