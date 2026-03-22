const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Review = require('../models/Review');
const { auth } = require('../middleware/auth');

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const { category, search, featured, bestseller, minPrice, maxPrice, rating, sort, page = 1, limit = 12 } = req.query;
    let query = {};
    if (category) query.category = category;
    if (featured) query.isFeatured = true;
    if (bestseller) query.isBestSeller = true;
    if (search) query.$text = { $search: search };
    if (minPrice || maxPrice) { query.price = {}; if (minPrice) query.price.$gte = Number(minPrice); if (maxPrice) query.price.$lte = Number(maxPrice); }
    if (rating) query.rating = { $gte: Number(rating) };

    let sortOption = { createdAt: -1 };
    if (sort === 'price_low') sortOption = { price: 1 };
    else if (sort === 'price_high') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query).sort(sortOption).skip((page - 1) * limit).limit(Number(limit));
    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get product by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 }).limit(10);
    res.json({ ...product.toObject(), reviews });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Submit review
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.create({ product: req.params.id, user: req.user._id, userName: req.user.name, rating, comment });
    const reviews = await Review.find({ product: req.params.id });
    const product = await Product.findById(req.params.id);
    product.numReviews = reviews.length;
    product.rating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await product.save();
    res.status(201).json(review);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
