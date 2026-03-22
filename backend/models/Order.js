const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderNumber: { type: String, unique: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String, image: String, price: Number, quantity: Number, weight: String
  }],
  shippingAddress: {
    fullName: String, phone: String, addressLine1: String, addressLine2: String,
    city: String, state: String, pincode: String
  },
  paymentMethod: { type: String, enum: ['upi', 'credit_card', 'debit_card', 'razorpay', 'stripe', 'cod'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentId: { type: String },
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'], default: 'placed' },
  statusHistory: [{ status: String, date: { type: Date, default: Date.now }, note: String }],
  deliverySlot: { date: String, timeSlot: String },
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'COM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
