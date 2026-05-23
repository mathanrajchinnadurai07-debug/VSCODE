/* ==========================================================
   Curfee — Firestore Seed Script
   Open this file in browser console OR include in an HTML page
   to populate Firestore with sample data.
   Run ONCE only — then remove.
   ========================================================== */

async function seedFirestore() {
  if (!window.db) { console.error('Firebase not initialized'); return; }

  console.log('🌱 Seeding Firestore...');

  // ── 1. Sample Products (5 biscuits + samples from other categories) ──
  const products = [
    // BISCUITS (5 samples)
    { name: 'Organic Wheat Biscuits', description: 'Crispy whole wheat biscuits made with organic jaggery. No maida, no refined sugar.', price: 89, originalPrice: 120, imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', category: 'biscuits', stock: 50, isBestseller: true, isFeatured: true, unit: '200g' },
    { name: 'Millet Cookies', description: 'Crunchy cookies made from finger millet (ragi) and organic honey. Rich in calcium.', price: 129, originalPrice: 160, imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400', category: 'biscuits', stock: 40, isBestseller: false, isFeatured: true, unit: '250g' },
    { name: 'Jaggery Digestive Biscuits', description: 'High-fiber digestive biscuits sweetened with organic jaggery. Perfect with tea.', price: 75, originalPrice: 99, imageUrl: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=400', category: 'biscuits', stock: 80, isBestseller: true, isFeatured: false, unit: '150g' },
    { name: 'Coconut Macaroons', description: 'Chewy coconut macaroons made with desiccated coconut and natural sweeteners.', price: 149, originalPrice: 190, imageUrl: 'https://images.unsplash.com/photo-1571506165871-ee72a35bc9d4?w=400', category: 'biscuits', stock: 30, isBestseller: false, isFeatured: false, unit: '200g' },
    { name: 'Turmeric Oat Cookies', description: 'Anti-inflammatory turmeric cookies with rolled oats and black pepper. Vegan.', price: 110, originalPrice: 140, imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400', category: 'biscuits', stock: 60, isBestseller: true, isFeatured: true, unit: '180g' },

    // SNACKS
    { name: 'Roasted Masala Makhana', description: 'Crunchy fox nuts roasted with Himalayan salt and Indian spices.', price: 199, originalPrice: 250, imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400', category: 'snacks', stock: 45, isBestseller: true, isFeatured: true, unit: '100g' },
    { name: 'Trail Mix Organic', description: 'Mix of almonds, cashews, raisins, dried cranberries and pumpkin seeds.', price: 349, originalPrice: 450, imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400', category: 'snacks', stock: 35, isBestseller: false, isFeatured: true, unit: '200g' },

    // MUSHROOM
    { name: 'Oyster Mushroom Fresh', description: 'Farm-fresh oyster mushrooms. Rich in protein and vitamins.', price: 120, originalPrice: 150, imageUrl: 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=400', category: 'mushroom', stock: 20, isBestseller: true, isFeatured: false, unit: '200g' },

    // CHICKEN
    { name: 'Free-Range Chicken Breast', description: 'Antibiotic-free, pasture-raised chicken breast. Hormone free.', price: 350, originalPrice: 420, imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400', category: 'chicken', stock: 25, isBestseller: true, isFeatured: true, unit: '500g' },

    // GROCERY
    { name: 'Organic Toor Dal', description: 'Premium organic toor dal (arhar). Pesticide-free, stone-ground.', price: 189, originalPrice: 220, imageUrl: 'https://images.unsplash.com/photo-1585996068684-8c0eb6a7b0e4?w=400', category: 'grocery', stock: 100, isBestseller: true, isFeatured: true, unit: '1kg' },

    // HERBAL
    { name: 'Tulsi Green Tea', description: 'Organic tulsi (holy basil) green tea. Boosts immunity and reduces stress.', price: 249, originalPrice: 320, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', category: 'herbal', stock: 60, isBestseller: true, isFeatured: true, unit: '100g' },

    // DRYFRUITS
    { name: 'Premium California Almonds', description: 'Raw, unpasteurized California almonds. Rich in Vitamin E.', price: 499, originalPrice: 650, imageUrl: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400', category: 'dryfruits', stock: 40, isBestseller: true, isFeatured: true, unit: '500g' },

    // FLOUR
    { name: 'Stone-Ground Atta', description: 'Traditional stone-ground whole wheat flour. No chemicals, no bleaching.', price: 85, originalPrice: 110, imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', category: 'flour', stock: 150, isBestseller: false, isFeatured: true, unit: '1kg' },

    // BEVERAGES
    { name: 'Cold-Pressed Orange Juice', description: 'Fresh cold-pressed orange juice. No sugar, no preservatives.', price: 149, originalPrice: 180, imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', category: 'beverages', stock: 30, isBestseller: false, isFeatured: true, unit: '500ml' },

    // SPREADS
    { name: 'Raw Forest Honey', description: 'Unprocessed raw honey from forest beehives. Pure and natural.', price: 399, originalPrice: 499, imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400', category: 'spreads', stock: 35, isBestseller: true, isFeatured: true, unit: '500g' },

    // VEGETABLES
    { name: 'Organic Broccoli', description: 'Fresh organic broccoli. Pesticide-free, farm-to-table.', price: 79, originalPrice: 99, imageUrl: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400', category: 'vegetables', stock: 40, isBestseller: false, isFeatured: true, unit: '500g' },

    // FRUITS
    { name: 'Alphonso Mango', description: 'Premium Ratnagiri Alphonso mangoes. Naturally ripened.', price: 599, originalPrice: 799, imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', category: 'fruits', stock: 20, isBestseller: true, isFeatured: true, unit: '1kg' },
  ];

  const batch = db.batch();
  products.forEach(p => {
    const ref = db.collection('products').doc();
    batch.set(ref, { ...p, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  });
  await batch.commit();
  console.log(`✅ Added ${products.length} products`);

  // ── 2. Admins Config ──
  await db.collection('admins').doc('config').set({
    emails: ['admin@curfee.com', 'curfeeorganic@gmail.com']
  }, { merge: true });
  console.log('✅ Admins config set');

  console.log('🎉 Firestore seed complete!');
}

// Auto-run if called directly
if (typeof window !== 'undefined') {
  window.seedFirestore = seedFirestore;
}
