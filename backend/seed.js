require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('./models/Product');
const User = require('./models/User');
const Review = require('./models/Review');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/curfee';

const products = [
  { name:'Organic Tomato', slug:'organic-tomato', category:'vegetables', price:60, discountPrice:49, stock:150, description:'Farm-fresh organic tomatoes, rich in lycopene and vitamin C.', isFeatured:true, isBestSeller:true, rating:4.5, numReviews:128, weights:[{label:'250g',price:20,discountPrice:15},{label:'500g',price:35,discountPrice:28},{label:'1kg',price:60,discountPrice:49}], nutritionalInfo:{calories:'18 kcal/100g',protein:'0.9g',carbs:'3.9g',fat:'0.2g',fiber:'1.2g'}, farmSource:{farmName:'Green Valley Farm',location:'Nashik, Maharashtra',description:'Certified organic farm since 1998'}, tags:['tomato','vegetables','salad'] },
  { name:'Organic Carrot', slug:'organic-carrot', category:'vegetables', price:55, discountPrice:45, stock:120, description:'Sweet and crunchy organic carrots packed with beta-carotene.', isFeatured:true, rating:4.6, numReviews:86, weights:[{label:'250g',price:18,discountPrice:14},{label:'500g',price:30,discountPrice:25},{label:'1kg',price:55,discountPrice:45}], nutritionalInfo:{calories:'41 kcal/100g',protein:'0.9g',carbs:'9.6g',fat:'0.2g',fiber:'2.8g'}, farmSource:{farmName:'Sunrise Organics',location:'Ooty, Tamil Nadu',description:'Hill farm specializing in root vegetables'}, tags:['carrot','vegetables','root'] },
  { name:'Organic Spinach', slug:'organic-spinach', category:'vegetables', price:35, discountPrice:28, stock:80, description:'Fresh organic spinach — iron-rich superfood.', isFeatured:true, rating:4.4, numReviews:62, weights:[{label:'250g',price:12,discountPrice:10},{label:'500g',price:20,discountPrice:16},{label:'1kg',price:35,discountPrice:28}], nutritionalInfo:{calories:'23 kcal/100g',protein:'2.9g',carbs:'3.6g',fat:'0.4g',fiber:'2.2g'}, farmSource:{farmName:'Green Leaf Farm',location:'Pune, Maharashtra'}, tags:['spinach','greens','iron'] },
  { name:'Organic Broccoli', slug:'organic-broccoli', category:'vegetables', price:85, discountPrice:72, stock:60, description:'Premium organic broccoli florets, loaded with vitamins.', isFeatured:true, rating:4.7, numReviews:45, weights:[{label:'250g',price:25,discountPrice:20},{label:'500g',price:45,discountPrice:38},{label:'1kg',price:85,discountPrice:72}], nutritionalInfo:{calories:'34 kcal/100g',protein:'2.8g',carbs:'7g',fat:'0.4g',fiber:'2.6g'}, farmSource:{farmName:'Hill Top Organics',location:'Shimla, Himachal Pradesh'}, tags:['broccoli','green','superfood'] },
  { name:'Organic Onion', slug:'organic-onion', category:'vegetables', price:45, discountPrice:38, stock:200, description:'Essential organic onions for daily cooking.', isBestSeller:true, rating:4.3, numReviews:95, weights:[{label:'250g',price:15,discountPrice:12},{label:'500g',price:25,discountPrice:20},{label:'1kg',price:45,discountPrice:38}], nutritionalInfo:{calories:'40 kcal/100g',protein:'1.1g',carbs:'9.3g',fat:'0.1g',fiber:'1.7g'}, farmSource:{farmName:'Desi Organic Farm',location:'Nashik, Maharashtra'}, tags:['onion','essential','cooking'] },
  { name:'Organic Potato', slug:'organic-potato', category:'vegetables', price:40, discountPrice:32, stock:300, description:'Versatile organic potatoes, farm-to-table quality.', isBestSeller:true, rating:4.2, numReviews:73, weights:[{label:'250g',price:12,discountPrice:10},{label:'500g',price:22,discountPrice:18},{label:'1kg',price:40,discountPrice:32}], nutritionalInfo:{calories:'77 kcal/100g',protein:'2g',carbs:'17g',fat:'0.1g',fiber:'2.2g'}, farmSource:{farmName:'Mountain View Farm',location:'Shimla, HP'}, tags:['potato','staple'] },
  { name:'Organic Cucumber', slug:'organic-cucumber', category:'vegetables', price:40, discountPrice:32, stock:110, description:'Cool and refreshing organic cucumbers.', rating:4.2, numReviews:44, weights:[{label:'250g',price:12,discountPrice:10},{label:'500g',price:22,discountPrice:18},{label:'1kg',price:40,discountPrice:32}], nutritionalInfo:{calories:'15 kcal/100g',protein:'0.7g',carbs:'3.6g',fat:'0.1g',fiber:'0.5g'}, farmSource:{farmName:'Fresh Fields',location:'Bengaluru, Karnataka'}, tags:['cucumber','salad'] },
  { name:'Organic Bell Pepper', slug:'organic-bell-pepper', category:'vegetables', price:95, discountPrice:82, stock:55, description:'Colorful organic bell peppers — red, yellow, green.', isFeatured:true, rating:4.5, numReviews:58, weights:[{label:'250g',price:28,discountPrice:23},{label:'500g',price:50,discountPrice:43},{label:'1kg',price:95,discountPrice:82}], nutritionalInfo:{calories:'31 kcal/100g',protein:'1g',carbs:'6g',fat:'0.3g',fiber:'2.1g'}, farmSource:{farmName:'Rainbow Organics',location:'Pune, MH'}, tags:['bell-pepper','capsicum','colorful'] },
  { name:'Organic Cabbage', slug:'organic-cabbage', category:'vegetables', price:30, discountPrice:25, stock:100, description:'Crunchy organic cabbage for coleslaw and curries.', rating:4.1, numReviews:38, weights:[{label:'250g',price:10,discountPrice:8},{label:'500g',price:18,discountPrice:15},{label:'1kg',price:30,discountPrice:25}], farmSource:{farmName:'Green Acres',location:'Mahabaleshwar, MH'}, tags:['cabbage','greens'] },
  { name:'Organic Banana', slug:'organic-banana', category:'fruits', price:50, discountPrice:42, stock:200, description:'Naturally ripened organic bananas — energy-rich fruit.', isFeatured:true, isBestSeller:true, rating:4.5, numReviews:156, weights:[{label:'6 pcs',price:30,discountPrice:25},{label:'12 pcs',price:50,discountPrice:42}], nutritionalInfo:{calories:'89 kcal/100g',protein:'1.1g',carbs:'23g',fat:'0.3g',fiber:'2.6g'}, farmSource:{farmName:'Tropical Farms',location:'Kerala'}, tags:['banana','fruits','energy'] },
  { name:'Organic Mango', slug:'organic-mango', category:'fruits', price:350, discountPrice:299, stock:50, description:'Premium Alphonso organic mangoes — king of fruits!', isFeatured:true, isBestSeller:true, rating:4.8, numReviews:210, weights:[{label:'500g',price:180,discountPrice:150},{label:'1kg',price:350,discountPrice:299},{label:'2kg',price:650,discountPrice:549}], nutritionalInfo:{calories:'60 kcal/100g',protein:'0.8g',carbs:'15g',fat:'0.4g',fiber:'1.6g'}, farmSource:{farmName:'Ratnagiri Mango Estate',location:'Ratnagiri, Maharashtra',description:'Heritage mango orchard'}, tags:['mango','alphonso','premium'] },
  { name:'Organic Apple', slug:'organic-apple', category:'fruits', price:180, discountPrice:155, stock:90, description:'Crisp organic Shimla apples, naturally sweet.', isFeatured:true, rating:4.6, numReviews:132, weights:[{label:'500g',price:95,discountPrice:80},{label:'1kg',price:180,discountPrice:155}], nutritionalInfo:{calories:'52 kcal/100g',protein:'0.3g',carbs:'14g',fat:'0.2g',fiber:'2.4g'}, farmSource:{farmName:'Himalayan Orchards',location:'Shimla, HP'}, tags:['apple','fruit'] },
  { name:'Organic Strawberry', slug:'organic-strawberry', category:'fruits', price:120, discountPrice:99, stock:40, description:'Sweet organic strawberries from Mahabaleshwar.', isFeatured:true, rating:4.7, numReviews:89, weights:[{label:'250g',price:65,discountPrice:55},{label:'500g',price:120,discountPrice:99}], nutritionalInfo:{calories:'32 kcal/100g',protein:'0.7g',carbs:'7.7g',fat:'0.3g',fiber:'2g'}, farmSource:{farmName:'Berry Fields',location:'Mahabaleshwar, MH'}, tags:['strawberry','berry'] },
  { name:'Organic Papaya', slug:'organic-papaya', category:'fruits', price:65, discountPrice:55, stock:70, description:'Ripe organic papaya — rich in papain enzyme.', rating:4.3, numReviews:67, weights:[{label:'500g',price:35,discountPrice:28},{label:'1kg',price:65,discountPrice:55}], farmSource:{farmName:'Tropical Fruits Co',location:'Goa'}, tags:['papaya','tropical'] },
  { name:'Organic Guava', slug:'organic-guava', category:'fruits', price:70, discountPrice:58, stock:85, description:'Fresh organic guavas, vitamin C powerhouse.', rating:4.4, numReviews:53, weights:[{label:'500g',price:38,discountPrice:30},{label:'1kg',price:70,discountPrice:58}], farmSource:{farmName:'Orchard Valley',location:'Allahabad, UP'}, tags:['guava','vitamin-c'] },
  { name:'Organic Milk', slug:'organic-milk', category:'dairy', price:75, discountPrice:65, stock:50, description:'Fresh A2 organic cow milk from grass-fed cows — no antibiotics.', isFeatured:true, isBestSeller:true, rating:4.8, numReviews:234, weights:[{label:'500ml',price:40,discountPrice:35},{label:'1L',price:75,discountPrice:65},{label:'2L',price:140,discountPrice:120}], nutritionalInfo:{calories:'62 kcal/100ml',protein:'3.2g',carbs:'4.8g',fat:'3.3g',fiber:'0g'}, farmSource:{farmName:'Gau Organics Dairy',location:'Anand, Gujarat',description:'Ethical A2 dairy farm'}, tags:['milk','a2','dairy'] },
  { name:'Organic Paneer', slug:'organic-paneer', category:'dairy', price:150, discountPrice:130, stock:60, description:'Soft and fresh organic paneer (cottage cheese).', isFeatured:true, isBestSeller:true, rating:4.5, numReviews:112, weights:[{label:'200g',price:75,discountPrice:65},{label:'500g',price:150,discountPrice:130}], nutritionalInfo:{calories:'265 kcal/100g',protein:'18g',carbs:'1.2g',fat:'20g',fiber:'0g'}, farmSource:{farmName:'Gau Organics Dairy',location:'Anand, Gujarat'}, tags:['paneer','cheese','protein'] },
  { name:'Organic Ghee', slug:'organic-ghee', category:'dairy', price:650, discountPrice:549, stock:45, description:'Pure A2 organic ghee — hand-churned using traditional bilona method.', isFeatured:true, isBestSeller:true, rating:4.9, numReviews:305, weights:[{label:'250ml',price:350,discountPrice:299},{label:'500ml',price:650,discountPrice:549},{label:'1L',price:1200,discountPrice:999}], nutritionalInfo:{calories:'900 kcal/100g',protein:'0g',carbs:'0g',fat:'99.7g',fiber:'0g'}, farmSource:{farmName:'Vedic Ghee Co.',location:'Jaipur, Rajasthan',description:'Traditional bilona ghee makers'}, tags:['ghee','clarified-butter','a2'] },
  { name:'Organic Butter', slug:'organic-butter', category:'dairy', price:120, discountPrice:105, stock:80, description:'Creamy organic butter from grass-fed cows.', isBestSeller:true, rating:4.6, numReviews:98, weights:[{label:'100g',price:55,discountPrice:48},{label:'200g',price:95,discountPrice:82},{label:'500g',price:120,discountPrice:105}], farmSource:{farmName:'Amul Organic',location:'Anand, Gujarat'}, tags:['butter','spread','dairy'] },
  { name:'Organic Yogurt', slug:'organic-yogurt', category:'dairy', price:55, discountPrice:45, stock:70, description:'Probiotic-rich organic yogurt — gut-friendly.', rating:4.4, numReviews:87, weights:[{label:'200g',price:28,discountPrice:23},{label:'500g',price:55,discountPrice:45}], nutritionalInfo:{calories:'59 kcal/100g',protein:'3.5g',carbs:'4.7g',fat:'3.3g',fiber:'0g'}, farmSource:{farmName:'Gau Organics',location:'Anand, Gujarat'}, tags:['yogurt','probiotic','curd'] },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});

    // Create products
    const createdProducts = await Product.insertMany(products.map(p => ({ ...p, isOrganic: true, images: [] })));
    console.log(`🌿 ${createdProducts.length} products seeded`);

    // Create admin user
    const adminHash = await bcrypt.hash('admin123', 10);
    const admin = await User.create({ name: 'Admin', email: 'admin@curfee.com', password: adminHash, role: 'admin', phone: '9000000001' });
    console.log('👑 Admin user created (admin@curfee.com / admin123)');

    // Create demo user
    const demoHash = await bcrypt.hash('demo123', 10);
    const demo = await User.create({ name: 'Demo User', email: 'demo@curfee.com', password: demoHash, role: 'user', phone: '9000000002',
      addresses: [{ fullName: 'Demo User', phone: '9876543210', addressLine1: '123 Organic Lane', addressLine2: 'Green Colony', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', isDefault: true }]
    });
    console.log('👤 Demo user created (demo@curfee.com / demo123)');

    // Add sample reviews
    const sampleReviews = [
      { product: createdProducts[0]._id, user: demo._id, userName: 'Demo User', rating: 5, comment: 'Best organic tomatoes! Very fresh and juicy.', isVerifiedPurchase: true },
      { product: createdProducts[10]._id, user: demo._id, userName: 'Demo User', rating: 5, comment: 'Alphonso mangoes are incredible. Will order again!', isVerifiedPurchase: true },
      { product: createdProducts[15]._id, user: demo._id, userName: 'Demo User', rating: 5, comment: 'Fresh A2 milk delivered perfectly chilled. Love it!', isVerifiedPurchase: true },
    ];
    await Review.insertMany(sampleReviews);
    console.log('⭐ Sample reviews added');

    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
