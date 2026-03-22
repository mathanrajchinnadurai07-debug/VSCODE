require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payment', require('./routes/payment'));

// Wishlist (inline)
const { auth } = require('./middleware/auth');
const User = require('./models/User');

app.post('/api/wishlist/toggle', auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  const idx = user.wishlist.indexOf(req.body.productId);
  if (idx > -1) user.wishlist.splice(idx, 1); else user.wishlist.push(req.body.productId);
  await user.save();
  res.json(user.wishlist);
});

app.get('/api/wishlist', auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  res.json(user.wishlist);
});

// Support (inline)
app.post('/api/support/contact', async (req, res) => {
  console.log('📧 Support message:', req.body);
  res.json({ message: 'Message received! We will respond within 24 hours.' });
});

// Serve frontend pages for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌿 Curfee server running at http://localhost:${PORT}`);
  console.log(`📂 Frontend served from: ${path.join(__dirname, '..', 'frontend')}`);
});
