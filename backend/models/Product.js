const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  category: { type: String, enum: ['vegetables', 'fruits', 'dairy'], required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  images: [{ type: String }],
  stock: { type: Number, default: 100 },
  weights: [{ label: String, price: Number, discountPrice: Number }],
  isOrganic: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  nutritionalInfo: { calories: String, protein: String, carbs: String, fat: String, fiber: String },
  farmSource: { farmName: String, location: String, description: String },
  deliveryInfo: { type: String, default: 'Delivered in 2-4 days' },
  returnPolicy: { type: String, default: '7-day easy returns' },
  tags: [{ type: String }],
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
