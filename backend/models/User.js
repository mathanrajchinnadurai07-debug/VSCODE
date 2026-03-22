const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  googleId: { type: String },
  otp: { type: String },
  otpExpiry: { type: Date },
  avatar: { type: String },
  addresses: [{
    fullName: String, phone: String, addressLine1: String, addressLine2: String,
    city: String, state: String, pincode: String, isDefault: { type: Boolean, default: false }
  }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  cart: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 },
    weight: { type: String, default: '500g' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
