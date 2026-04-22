/* ============================================================
   Curfee — Products Routes (MySQL)
   GET /          — list with search, category, price filter
   GET /:id       — single product
   GET /slug/:slug — single product by slug
   POST /         — create product (admin)
   PUT /:id       — update product (admin)
   DELETE /:id    — delete product (admin)
   POST /:id/reviews — submit review
   ============================================================ */
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { auth, adminAuth } = require('../middleware/auth');

// ── GET all products (with filters) ──
router.get('/', async (req, res) => {
  try {
    const { category, search, featured, bestseller, minPrice, maxPrice, rating, sort, page = 1, limit = 12 } = req.query;

    let where = [];
    let params = [];

    if (category)   { where.push('category = ?');       params.push(category); }
    if (featured)   { where.push('is_featured = 1'); }
    if (bestseller) { where.push('is_bestseller = 1'); }
    if (search)     { where.push('MATCH(name, description) AGAINST(? IN BOOLEAN MODE)'); params.push(search + '*'); }
    if (minPrice)   { where.push('price >= ?');          params.push(Number(minPrice)); }
    if (maxPrice)   { where.push('price <= ?');          params.push(Number(maxPrice)); }
    if (rating)     { where.push('rating >= ?');         params.push(Number(rating)); }

    const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

    let orderBy = 'ORDER BY created_at DESC';
    if (sort === 'price_low')  orderBy = 'ORDER BY price ASC';
    if (sort === 'price_high') orderBy = 'ORDER BY price DESC';
    if (sort === 'rating')     orderBy = 'ORDER BY rating DESC';

    const offset = (Number(page) - 1) * Number(limit);

    // Count total
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM products ${whereSQL}`, params);
    const total = countRows[0].total;

    // Fetch products
    const [products] = await pool.query(
      `SELECT * FROM products ${whereSQL} ${orderBy} LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    // Parse JSON fields
    products.forEach(p => {
      try { p.images = JSON.parse(p.images); } catch { p.images = []; }
      try { p.nutritional_info = JSON.parse(p.nutritional_info); } catch { p.nutritional_info = {}; }
      try { p.farm_source = JSON.parse(p.farm_source); } catch { p.farm_source = {}; }
      try { p.tags = JSON.parse(p.tags); } catch { p.tags = []; }
      // Map snake_case to camelCase for frontend compatibility
      p._id = p.id;
      p.discountPrice = p.discount_price;
      p.isOrganic = !!p.is_organic;
      p.isFeatured = !!p.is_featured;
      p.isBestSeller = !!p.is_bestseller;
      p.numReviews = p.num_reviews;
      p.nutritionalInfo = p.nutritional_info;
      p.farmSource = p.farm_source;
      p.deliveryInfo = p.delivery_info;
      p.returnPolicy = p.return_policy;
      p.videoUrl = p.video_url;
    });

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET product by ID ──
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    const p = formatProduct(rows[0]);

    // Fetch weights
    const [weights] = await pool.query('SELECT label, price, discount_price as discountPrice FROM product_weights WHERE product_id = ?', [p.id]);
    p.weights = weights;

    // Fetch reviews
    const [reviews] = await pool.query('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 10', [p.id]);
    p.reviews = reviews;

    res.json(p);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET product by slug ──
router.get('/slug/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE slug = ?', [req.params.slug]);
    if (!rows.length) return res.status(404).json({ message: 'Product not found' });
    const p = formatProduct(rows[0]);

    const [weights] = await pool.query('SELECT label, price, discount_price as discountPrice FROM product_weights WHERE product_id = ?', [p.id]);
    p.weights = weights;

    const [reviews] = await pool.query('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 10', [p.id]);
    p.reviews = reviews;

    res.json(p);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST create product (admin) ──
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, slug, description, category, price, discountPrice, images, stock, isOrganic, isFeatured, isBestSeller, nutritionalInfo, farmSource, deliveryInfo, returnPolicy, tags, videoUrl, weights } = req.body;

    const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const [result] = await pool.query(
      `INSERT INTO products (name, slug, description, category, price, discount_price, images, stock, is_organic, is_featured, is_bestseller, nutritional_info, farm_source, delivery_info, return_policy, tags, video_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, productSlug, description || '', category, price, discountPrice || null, JSON.stringify(images || []),
       stock || 100, isOrganic !== false ? 1 : 0, isFeatured ? 1 : 0, isBestSeller ? 1 : 0,
       JSON.stringify(nutritionalInfo || {}), JSON.stringify(farmSource || {}),
       deliveryInfo || 'Delivered in 2-4 days', returnPolicy || '7-day easy returns',
       JSON.stringify(tags || []), videoUrl || '']
    );

    // Insert weight variants
    if (weights && weights.length > 0) {
      for (const w of weights) {
        await pool.query('INSERT INTO product_weights (product_id, label, price, discount_price) VALUES (?, ?, ?, ?)',
          [result.insertId, w.label, w.price, w.discountPrice || null]);
      }
    }

    res.status(201).json({ id: result.insertId, _id: result.insertId, name, slug: productSlug, message: 'Product created' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PUT update product (admin) ──
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const fields = req.body;
    const updates = [];
    const values = [];

    const fieldMap = {
      name: 'name', slug: 'slug', description: 'description', category: 'category',
      price: 'price', discountPrice: 'discount_price', stock: 'stock',
      isOrganic: 'is_organic', isFeatured: 'is_featured', isBestSeller: 'is_bestseller',
      deliveryInfo: 'delivery_info', returnPolicy: 'return_policy', videoUrl: 'video_url',
      rating: 'rating', numReviews: 'num_reviews'
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (fields[key] !== undefined) {
        updates.push(`${col} = ?`);
        values.push(fields[key]);
      }
    }

    // JSON fields
    if (fields.images)          { updates.push('images = ?');           values.push(JSON.stringify(fields.images)); }
    if (fields.nutritionalInfo) { updates.push('nutritional_info = ?'); values.push(JSON.stringify(fields.nutritionalInfo)); }
    if (fields.farmSource)      { updates.push('farm_source = ?');      values.push(JSON.stringify(fields.farmSource)); }
    if (fields.tags)            { updates.push('tags = ?');             values.push(JSON.stringify(fields.tags)); }

    if (updates.length) {
      values.push(req.params.id);
      await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    // Update weight variants
    if (fields.weights) {
      await pool.query('DELETE FROM product_weights WHERE product_id = ?', [req.params.id]);
      for (const w of fields.weights) {
        await pool.query('INSERT INTO product_weights (product_id, label, price, discount_price) VALUES (?, ?, ?, ?)',
          [req.params.id, w.label, w.price, w.discountPrice || null]);
      }
    }

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(formatProduct(rows[0]));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE product (admin) ──
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST review ──
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    await pool.query(
      'INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, req.user.id, req.user.name, rating, comment || '']
    );

    // Update product rating
    const [stats] = await pool.query('SELECT COUNT(*) as cnt, AVG(rating) as avg_rating FROM reviews WHERE product_id = ?', [req.params.id]);
    await pool.query('UPDATE products SET num_reviews = ?, rating = ? WHERE id = ?',
      [stats[0].cnt, stats[0].avg_rating, req.params.id]);

    res.status(201).json({ message: 'Review submitted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Helper: format product for frontend ──
function formatProduct(p) {
  try { p.images = JSON.parse(p.images); } catch { p.images = []; }
  try { p.nutritional_info = JSON.parse(p.nutritional_info); } catch { p.nutritional_info = {}; }
  try { p.farm_source = JSON.parse(p.farm_source); } catch { p.farm_source = {}; }
  try { p.tags = JSON.parse(p.tags); } catch { p.tags = []; }
  p._id = p.id;
  p.discountPrice = p.discount_price;
  p.isOrganic = !!p.is_organic;
  p.isFeatured = !!p.is_featured;
  p.isBestSeller = !!p.is_bestseller;
  p.numReviews = p.num_reviews;
  p.nutritionalInfo = p.nutritional_info;
  p.farmSource = p.farm_source;
  p.deliveryInfo = p.delivery_info;
  p.returnPolicy = p.return_policy;
  p.videoUrl = p.video_url;
  return p;
}

module.exports = router;
