/* ============================================================
   Curfee — MySQL Database Setup Script
   Creates all required tables if they don't exist.
   Run:  node setup-db.js
   ============================================================ */
require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_NAME = process.env.MYSQL_DATABASE || 'curfee';

async function setup() {
  // Connect WITHOUT specifying database (to create it if needed)
  const conn = await mysql.createConnection({
    host:     process.env.MYSQL_HOST     || 'localhost',
    port:     process.env.MYSQL_PORT     || 3306,
    user:     process.env.MYSQL_USER     || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  });

  console.log('✅ Connected to MySQL server');

  // Create database
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${DB_NAME}\``);
  console.log(`📦 Using database: ${DB_NAME}`);

  // ── Users Table ──
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(255) NOT NULL,
      email       VARCHAR(255) NOT NULL UNIQUE,
      password    VARCHAR(255),
      phone       VARCHAR(20),
      role        ENUM('user','admin') DEFAULT 'user',
      avatar      VARCHAR(500),
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  console.log('✅ Table: users');

  // ── User Addresses Table ──
  await conn.query(`
    CREATE TABLE IF NOT EXISTS user_addresses (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      user_id      INT NOT NULL,
      full_name    VARCHAR(255),
      phone        VARCHAR(20),
      address_line1 VARCHAR(500),
      address_line2 VARCHAR(500),
      city         VARCHAR(100),
      state        VARCHAR(100),
      pincode      VARCHAR(10),
      is_default   TINYINT(1) DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log('✅ Table: user_addresses');

  // ── Products Table ──
  await conn.query(`
    CREATE TABLE IF NOT EXISTS products (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      name           VARCHAR(255) NOT NULL,
      slug           VARCHAR(255) NOT NULL UNIQUE,
      description    TEXT,
      category       VARCHAR(100) NOT NULL,
      price          DECIMAL(10,2) NOT NULL,
      discount_price DECIMAL(10,2),
      images         JSON,
      stock          INT DEFAULT 100,
      is_organic     TINYINT(1) DEFAULT 1,
      is_featured    TINYINT(1) DEFAULT 0,
      is_bestseller  TINYINT(1) DEFAULT 0,
      rating         DECIMAL(3,2) DEFAULT 0,
      num_reviews    INT DEFAULT 0,
      nutritional_info JSON,
      farm_source    JSON,
      delivery_info  VARCHAR(500) DEFAULT 'Delivered in 2-4 days',
      return_policy  VARCHAR(500) DEFAULT '7-day easy returns',
      tags           JSON,
      video_url      VARCHAR(500) DEFAULT '',
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FULLTEXT INDEX idx_search (name, description)
    ) ENGINE=InnoDB
  `);
  console.log('✅ Table: products');

  // ── Product Weights (variants) ──
  await conn.query(`
    CREATE TABLE IF NOT EXISTS product_weights (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      product_id     INT NOT NULL,
      label          VARCHAR(50) NOT NULL,
      price          DECIMAL(10,2) NOT NULL,
      discount_price DECIMAL(10,2),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log('✅ Table: product_weights');

  // ── Reviews Table ──
  await conn.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      product_id  INT NOT NULL,
      user_id     INT NOT NULL,
      user_name   VARCHAR(255),
      rating      INT NOT NULL,
      comment     TEXT,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log('✅ Table: reviews');

  // ── Cart Table ──
  await conn.query(`
    CREATE TABLE IF NOT EXISTS cart (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,
      product_id  INT NOT NULL,
      quantity    INT DEFAULT 1,
      weight      VARCHAR(50) DEFAULT '500g',
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE KEY unique_cart_item (user_id, product_id, weight)
    ) ENGINE=InnoDB
  `);
  console.log('✅ Table: cart');

  // ── Orders Table ──
  await conn.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      user_id          INT NOT NULL,
      order_number     VARCHAR(50) NOT NULL UNIQUE,
      items            JSON NOT NULL,
      shipping_address JSON,
      payment_method   VARCHAR(50) DEFAULT 'cod',
      payment_status   ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
      payment_id       VARCHAR(255),
      subtotal         DECIMAL(10,2) NOT NULL,
      delivery_charge  DECIMAL(10,2) DEFAULT 0,
      discount         DECIMAL(10,2) DEFAULT 0,
      total            DECIMAL(10,2) NOT NULL,
      status           ENUM('placed','confirmed','packed','shipped','delivered','cancelled') DEFAULT 'placed',
      cancel_reason    TEXT,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log('✅ Table: orders');

  // ── Order Status History ──
  await conn.query(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      order_id  INT NOT NULL,
      status    VARCHAR(50) NOT NULL,
      note      TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log('✅ Table: order_status_history');

  // ── Wishlist Table ──
  await conn.query(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,
      product_id  INT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE KEY unique_wish (user_id, product_id)
    ) ENGINE=InnoDB
  `);
  console.log('✅ Table: wishlist');

  // ── Create default admin user (password: admin123) ──
  const bcrypt = require('bcryptjs');
  const adminPass = await bcrypt.hash('admin123', 10);
  await conn.query(`
    INSERT IGNORE INTO users (name, email, password, phone, role)
    VALUES ('Admin', 'admin@curfee.com', ?, '9999999999', 'admin')
  `, [adminPass]);
  console.log('👤 Default admin: admin@curfee.com / admin123');

  await conn.end();
  console.log('\n🎉 Database setup complete! Run: npm start');
}

setup().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});
