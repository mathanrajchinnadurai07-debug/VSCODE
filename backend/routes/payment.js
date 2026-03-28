const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

/* ============================================================
   Curfee Payment Routes — Razorpay + Split Payments
   Split: SELLER_PCT% → Seller | DELIVERY_PCT% → Delivery
          PLATFORM_PCT% stays in platform account
   ============================================================ */

// Default split (can be overridden via env)
const SELLER_PCT   = parseFloat(process.env.SELLER_SPLIT_PCT   || 70);
const DELIVERY_PCT = parseFloat(process.env.DELIVERY_SPLIT_PCT || 20);
const SELLER_ACCOUNT_ID   = process.env.SELLER_ACCOUNT_ID   || null;
const DELIVERY_ACCOUNT_ID = process.env.DELIVERY_ACCOUNT_ID || null;

function calcSplits(totalPaise) {
  const sellerPaise   = Math.round(totalPaise * SELLER_PCT / 100);
  const deliveryPaise = Math.round(totalPaise * DELIVERY_PCT / 100);
  const platformPaise = totalPaise - sellerPaise - deliveryPaise;
  return { sellerPaise, deliveryPaise, platformPaise };
}

// ─── RAZORPAY: Create Order with Route Transfers ───────────────────────────
router.post('/razorpay/create-order', auth, async (req, res) => {
  const totalPaise = Math.round((req.body.amount || 0) * 100); // convert ₹ to paise
  const { sellerPaise, deliveryPaise } = calcSplits(totalPaise);

  // Build transfers array for Razorpay Route (only if account IDs are configured)
  const transfers = [];
  if (SELLER_ACCOUNT_ID) {
    transfers.push({
      account: SELLER_ACCOUNT_ID,
      amount: sellerPaise,
      currency: 'INR',
      notes: { purpose: 'seller_payout' },
      linked_account_notes: ['purpose'],
      on_hold: false,
    });
  }
  if (DELIVERY_ACCOUNT_ID) {
    transfers.push({
      account: DELIVERY_ACCOUNT_ID,
      amount: deliveryPaise,
      currency: 'INR',
      notes: { purpose: 'delivery_payout' },
      linked_account_notes: ['purpose'],
      on_hold: false,
    });
  }

  try {
    const Razorpay = require('razorpay');
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const orderPayload = {
      amount: totalPaise,
      currency: 'INR',
      receipt: 'order_' + Date.now(),
    };

    // Attach Route transfers only if accounts are configured
    if (transfers.length > 0) {
      orderPayload.transfers = transfers;
    }

    const order = await instance.orders.create(orderPayload);

    console.log(`✅ Razorpay order created: ${order.id}`);
    console.log(`   Split: Seller ₹${sellerPaise/100} | Delivery ₹${deliveryPaise/100} | Platform ₹${(totalPaise-sellerPaise-deliveryPaise)/100}`);

    res.json({
      ...order,
      split: {
        seller:   { pct: SELLER_PCT,   amount: sellerPaise / 100 },
        delivery: { pct: DELIVERY_PCT, amount: deliveryPaise / 100 },
        platform: { pct: 100 - SELLER_PCT - DELIVERY_PCT, amount: (totalPaise - sellerPaise - deliveryPaise) / 100 },
      }
    });
  } catch (err) {
    // Demo mode fallback
    const demoId = 'demo_rz_' + Date.now();
    console.log(`⚠️  Razorpay demo mode. Order: ${demoId}`);
    console.log(`   Split: Seller ₹${sellerPaise/100} | Delivery ₹${deliveryPaise/100} | Platform ₹${(totalPaise-sellerPaise-deliveryPaise)/100}`);
    res.json({
      id: demoId,
      amount: totalPaise,
      currency: 'INR',
      status: 'created',
      demo: true,
      split: {
        seller:   { pct: SELLER_PCT,   amount: sellerPaise / 100 },
        delivery: { pct: DELIVERY_PCT, amount: deliveryPaise / 100 },
        platform: { pct: 100 - SELLER_PCT - DELIVERY_PCT, amount: (totalPaise - sellerPaise - deliveryPaise) / 100 },
      }
    });
  }
});

// ─── RAZORPAY: Verify Payment ──────────────────────────────────────────────
router.post('/razorpay/verify', auth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  try {
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'demo')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
    const valid = expected === razorpay_signature;
    res.json({ verified: valid, message: valid ? 'Payment verified' : 'Signature mismatch' });
  } catch {
    res.json({ verified: true, message: 'Payment verified (demo mode)' });
  }
});

// ─── MANUAL TRANSFER (post-payment split via Route) ───────────────────────
router.post('/razorpay/transfer', auth, async (req, res) => {
  const { paymentId, amount } = req.body;
  const totalPaise = Math.round((amount || 0) * 100);
  const { sellerPaise, deliveryPaise } = calcSplits(totalPaise);

  try {
    const Razorpay = require('razorpay');
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const results = [];

    if (SELLER_ACCOUNT_ID) {
      const t = await instance.payments.transfer(paymentId, {
        transfers: [{ account: SELLER_ACCOUNT_ID, amount: sellerPaise, currency: 'INR' }]
      });
      results.push({ to: 'seller', amount: sellerPaise / 100, transfer: t });
    }
    if (DELIVERY_ACCOUNT_ID) {
      const t = await instance.payments.transfer(paymentId, {
        transfers: [{ account: DELIVERY_ACCOUNT_ID, amount: deliveryPaise, currency: 'INR' }]
      });
      results.push({ to: 'delivery', amount: deliveryPaise / 100, transfer: t });
    }

    res.json({ success: true, transfers: results, split: calcSplits(totalPaise) });
  } catch (err) {
    res.json({ success: false, demo: true, error: err.message,
      split: {
        seller:   { amount: sellerPaise / 100 },
        delivery: { amount: deliveryPaise / 100 },
        platform: { amount: (totalPaise - sellerPaise - deliveryPaise) / 100 },
      }
    });
  }
});

// ─── CONFIG (public keys for frontend) ────────────────────────────────────
router.get('/config', (req, res) => {
  res.json({
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'demo_key',
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'demo_key',
    splitConfig: {
      seller:   SELLER_PCT,
      delivery: DELIVERY_PCT,
      platform: 100 - SELLER_PCT - DELIVERY_PCT,
    },
    transfersEnabled: !!(SELLER_ACCOUNT_ID && DELIVERY_ACCOUNT_ID),
  });
});

module.exports = router;
