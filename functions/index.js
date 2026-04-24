const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const cors = require("cors")({ origin: true }); // Error 5 Fix: CORS enabled
const crypto = require("crypto");

admin.initializeApp();

// Initialize Razorpay instance securely from Firebase config (Error 3 Fix)
// Requires: firebase functions:config:set razorpay.key_id="..." razorpay.key_secret="..."
const getRazorpayInstance = () => {
  const key_id = functions.config().razorpay?.key_id;
  const key_secret = functions.config().razorpay?.key_secret;
  
  if (!key_id || !key_secret) {
    throw new Error("Razorpay API keys not configured in Firebase Environment");
  }
  
  return new Razorpay({
    key_id: key_id,
    key_secret: key_secret
  });
};

/**
 * Endpoint to create a Razorpay order securely.
 * POST data: { amount: 500, currency: "INR", receipt: "order_123" }
 */
exports.createRazorpayOrder = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed. Use POST." });
      }

      const { amount, currency = "INR", receipt } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }

      const rzp = getRazorpayInstance();
      
      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit (paise)
        currency: currency,
        receipt: receipt || `rcpt_${Date.now()}`
      };

      const order = await rzp.orders.create(options);
      return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency });
      
    } catch (error) {
      console.error("Razorpay Order Creation Failed:", error);
      return res.status(500).json({ error: error.message || "Failed to create order" });
    }
  });
});

/**
 * Endpoint to verify Razorpay signature and finalize the order.
 * POST data: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
exports.verifyRazorpayPayment = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed. Use POST." });
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing required payment verification parameters" });
      }

      const key_secret = functions.config().razorpay?.key_secret;
      
      if (!key_secret) {
        throw new Error("Razorpay key_secret not configured");
      }

      const text = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", key_secret)
        .update(text.toString())
        .digest("hex");

      if (expectedSignature === razorpay_signature) {
        return res.status(200).json({ status: "success", message: "Payment verified successfully" });
      } else {
        return res.status(400).json({ status: "failure", error: "Invalid payment signature" });
      }

    } catch (error) {
      console.error("Payment Verification Failed:", error);
      return res.status(500).json({ error: error.message || "Verification failed" });
    }
  });
});
