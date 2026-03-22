require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Product = require('./models/Product');
const User = require('./models/User');
const Review = require('./models/Review');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/curfee';

const products = [
  // ======== VEGETABLES ========
  { name:'Organic Tomato', slug:'organic-tomato', category:'vegetables', price:60, discountPrice:49, stock:150, isFeatured:true, isBestSeller:true, rating:4.5, numReviews:128,
    description:'Farm-fresh organic tomatoes bursting with flavour and nutrition. Grown without synthetic pesticides, our tomatoes are hand-picked at peak ripeness from certified organic farms in Nashik, Maharashtra. Rich in lycopene — a powerful antioxidant that supports heart health and protects skin against UV damage — these tomatoes also deliver vitamin C, potassium, and folate. Perfect for salads, curries, sauces, and soups. Each tomato is carefully inspected for quality and washed in purified water before packaging.',
    weights:[{label:'250g',price:20,discountPrice:15},{label:'500g',price:35,discountPrice:28},{label:'1kg',price:60,discountPrice:49}],
    nutritionalInfo:{calories:'18 kcal per 100g',protein:'0.9g',carbs:'3.9g',fat:'0.2g',fiber:'1.2g'},
    farmSource:{farmName:'Green Valley Organic Farm',location:'Nashik, Maharashtra',description:'A 50-acre NPOP-certified organic farm operating since 1998. They practice crop rotation, vermicomposting, and natural pest management using neem-based sprays. The farm supplies over 200 tonnes of organic produce annually.'},
    deliveryInfo:'Harvested fresh on the day of dispatch. Delivered within 2-3 business days in insulated, eco-friendly packaging to maintain freshness. Temperature-controlled logistics in summer months.',
    returnPolicy:'7-day freshness guarantee. If the product does not meet quality standards upon delivery, we offer a full refund or free replacement. No questions asked.',
    videoUrl:'', tags:['tomato','vegetables','salad','lycopene'] },

  { name:'Organic Carrot', slug:'organic-carrot', category:'vegetables', price:55, discountPrice:45, stock:120, isFeatured:true, rating:4.6, numReviews:86,
    description:'Sweet, crunchy organic carrots packed with beta-carotene. Sourced from the cool hill farms of Ooty, Tamil Nadu, these carrots are naturally sweet due to the altitude and climate. Beta-carotene converts to Vitamin A in the body, supporting eye health, immune function, and skin renewal. Our carrots are grown in nutrient-rich red soil without chemical fertilisers, resulting in a deeper orange colour and richer taste than conventional carrots.',
    weights:[{label:'250g',price:18,discountPrice:14},{label:'500g',price:30,discountPrice:25},{label:'1kg',price:55,discountPrice:45}],
    nutritionalInfo:{calories:'41 kcal per 100g',protein:'0.9g',carbs:'9.6g',fat:'0.2g',fiber:'2.8g'},
    farmSource:{farmName:'Sunrise Hill Organics',location:'Ooty, Tamil Nadu',description:'Nestled at 2,200 metres above sea level, this family-run organic farm specialises in root vegetables. The cool Nilgiri climate and mineral-rich mountain soil produce carrots with exceptional sweetness and crunch.'},
    deliveryInfo:'Hand-harvested and cleaned within 12 hours of dispatch. Delivered in breathable jute bags within 2-4 business days. Same-day delivery available in select metro cities.',
    returnPolicy:'7-day freshness guarantee with full refund or replacement for any quality concerns.',
    videoUrl:'', tags:['carrot','vegetables','root','beta-carotene'] },

  { name:'Organic Spinach', slug:'organic-spinach', category:'vegetables', price:35, discountPrice:28, stock:80, isFeatured:true, rating:4.4, numReviews:62,
    description:'Tender, dark-green organic spinach leaves — nature\'s iron supplement. Packed with iron, calcium, vitamin K, and folate, spinach is a true superfood for bone health, blood formation, and energy. Our spinach is grown hydroponically in controlled greenhouses near Pune, ensuring zero exposure to soil-borne pathogens. Washed three times in filtered water and packed in nitrogen-flushed bags to retain freshness for up to 5 days.',
    weights:[{label:'250g',price:12,discountPrice:10},{label:'500g',price:20,discountPrice:16},{label:'1kg',price:35,discountPrice:28}],
    nutritionalInfo:{calories:'23 kcal per 100g',protein:'2.9g',carbs:'3.6g',fat:'0.4g',fiber:'2.2g'},
    farmSource:{farmName:'Green Leaf Hydroponics',location:'Pune, Maharashtra',description:'A modern organic hydroponic facility using mineral-enriched water and natural sunlight. Produces year-round pesticide-free greens with 40% higher nutrient density than field-grown spinach.'},
    deliveryInfo:'Packed in nitrogen-flushed bags for maximum freshness. Delivered within 1-3 business days. Refrigerate upon receipt.',
    returnPolicy:'Full refund if wilted or damaged upon delivery. Contact us within 24 hours of receiving the order.',
    videoUrl:'', tags:['spinach','greens','iron','superfood'] },

  { name:'Organic Broccoli', slug:'organic-broccoli', category:'vegetables', price:85, discountPrice:72, stock:60, isFeatured:true, rating:4.7, numReviews:45,
    description:'Premium organic broccoli florets from the Himalayan foothills of Shimla. Broccoli is one of the most nutrient-dense vegetables on earth — rich in sulforaphane (a compound with potent anti-cancer properties), vitamin C (more per gram than oranges!), vitamin K, and chromium. Our broccoli is harvested young for tender, sweet florets and immediately cold-chained to preserve nutrients and colour.',
    weights:[{label:'250g',price:25,discountPrice:20},{label:'500g',price:45,discountPrice:38},{label:'1kg',price:85,discountPrice:72}],
    nutritionalInfo:{calories:'34 kcal per 100g',protein:'2.8g',carbs:'7g',fat:'0.4g',fiber:'2.6g'},
    farmSource:{farmName:'Hill Top Organics',location:'Shimla, Himachal Pradesh',description:'A 30-acre terrace farm at 2,000m elevation specialising in cruciferous vegetables. Uses snow-melt water irrigation and cow-dung compost from their own dairy herd.'},
    deliveryInfo:'Cold-chain delivered within 2-3 days. Packed with ice packs in insulated cartons.',
    returnPolicy:'7-day return policy. Full refund for any quality issues.',
    videoUrl:'', tags:['broccoli','cruciferous','superfood','vitamin-c'] },

  { name:'Organic Onion', slug:'organic-onion', category:'vegetables', price:45, discountPrice:38, stock:200, isBestSeller:true, rating:4.3, numReviews:95,
    description:'Essential kitchen staple — organic red onions grown in the volcanic soil of Nashik. These onions have a deep purple-red skin with a pungent, rich flavour. Free from growth hormones and chemical treatments, they contain quercetin — a powerful anti-inflammatory flavonoid — along with prebiotic fibres that support gut health. Our onions are naturally cured for 2 weeks after harvest to ensure longer shelf life.',
    weights:[{label:'250g',price:15,discountPrice:12},{label:'500g',price:25,discountPrice:20},{label:'1kg',price:45,discountPrice:38}],
    nutritionalInfo:{calories:'40 kcal per 100g',protein:'1.1g',carbs:'9.3g',fat:'0.1g',fiber:'1.7g'},
    farmSource:{farmName:'Desi Organic Farm Collective',location:'Nashik, Maharashtra',description:'A cooperative of 15 smallholder organic farmers in the Nashik belt, India\'s onion capital. They practise intercropping with marigold to naturally repel pests.'},
    deliveryInfo:'Naturally cured and dry. Delivered in mesh bags for ventilation. Shelf life of 3-4 weeks at room temperature.',
    returnPolicy:'Replacement or refund for sprouted or damaged onions.',
    videoUrl:'', tags:['onion','essential','cooking','quercetin'] },

  { name:'Organic Potato', slug:'organic-potato', category:'vegetables', price:40, discountPrice:32, stock:300, isBestSeller:true, rating:4.2, numReviews:73,
    description:'Versatile organic potatoes from the cool Himalayan slopes of Shimla. These medium-sized, golden-skinned potatoes have a creamy, fluffy texture when cooked — perfect for curries, mashing, roasting, or making crispy fries. Grown in mineral-rich mountain soil at 2,500m altitude where cold nights produce starchier, more flavourful tubers. Free from sprouting inhibitors like chlorpropham (CIPC) that conventional potatoes are treated with.',
    weights:[{label:'250g',price:12,discountPrice:10},{label:'500g',price:22,discountPrice:18},{label:'1kg',price:40,discountPrice:32}],
    nutritionalInfo:{calories:'77 kcal per 100g',protein:'2g',carbs:'17g',fat:'0.1g',fiber:'2.2g'},
    farmSource:{farmName:'Mountain View Farm',location:'Shimla, Himachal Pradesh',description:'A heritage potato farm that grows 6 indigenous varieties at high altitude using only manure and wood-ash as fertilisers.'},
    deliveryInfo:'Sorted by size and packed in paper sacks. Delivered within 3-5 business days. Store in a cool, dark place.',
    returnPolicy:'Full replacement for potatoes that are green, sprouted, or rotten on arrival.',
    videoUrl:'', tags:['potato','staple','versatile'] },

  // ======== FRUITS ========
  { name:'Organic Banana', slug:'organic-banana', category:'fruits', price:50, discountPrice:42, stock:200, isFeatured:true, isBestSeller:true, rating:4.5, numReviews:156,
    description:'Naturally ripened organic Robusta bananas from the tropical groves of Kerala. Unlike conventional bananas that are artificially ripened using ethylene gas in chambers, our bananas are harvested slightly green and allowed to ripen naturally over 3-4 days, developing deeper flavour, higher antioxidant content, and a creamier texture. Rich in potassium (essential for heart rhythm and blood pressure), vitamin B6, and natural energy from fructose — the perfect pre/post-workout snack.',
    weights:[{label:'250g (2-3pcs)',price:15,discountPrice:12},{label:'500g (5-6pcs)',price:30,discountPrice:25},{label:'1kg (10-12pcs)',price:50,discountPrice:42}],
    nutritionalInfo:{calories:'89 kcal per 100g',protein:'1.1g',carbs:'23g',fat:'0.3g',fiber:'2.6g'},
    farmSource:{farmName:'Tropical Farms Co-op',location:'Wayanad, Kerala',description:'A fair-trade organic banana cooperative with 40 member farmers. They intercrop bananas with coffee and pepper, following traditional agroforestry methods.'},
    deliveryInfo:'Packed in ventilated cartons with banana leaves for cushioning. Delivered in 2-3 days. May arrive slightly green — will ripen at room temperature in 1-2 days.',
    returnPolicy:'Full refund if bananas arrive bruised or damaged beyond normal transit marks.',
    videoUrl:'', tags:['banana','fruits','energy','potassium'] },

  { name:'Organic Mango', slug:'organic-mango', category:'fruits', price:350, discountPrice:299, stock:50, isFeatured:true, isBestSeller:true, rating:4.8, numReviews:210,
    description:'Premium Alphonso organic mangoes — the undisputed "King of Mangoes." Sourced from heritage orchards in Ratnagiri, Maharashtra, these mangoes are famous worldwide for their intoxicating aroma, saffron-coloured pulp, and rich, non-fibrous sweetness. Our Alphonso mangoes are tree-ripened (not carbide-treated) and hand-selected for uniform size and zero blemishes. Each mango is individually wrapped in tissue paper for protection. Available seasonally from April to June.',
    weights:[{label:'250g (1pc)',price:90,discountPrice:75},{label:'500g (2pcs)',price:180,discountPrice:150},{label:'1kg (3-4pcs)',price:350,discountPrice:299}],
    nutritionalInfo:{calories:'60 kcal per 100g',protein:'0.8g',carbs:'15g',fat:'0.4g',fiber:'1.6g'},
    farmSource:{farmName:'Ratnagiri Mango Estate',location:'Ratnagiri, Maharashtra',description:'A 100-year-old family orchard with 500 Alphonso trees. The laterite soil and coastal breeze of the Konkan region give Ratnagiri Alphonso its signature flavour that cannot be replicated anywhere else in the world.'},
    deliveryInfo:'Each mango is individually wrapped and packed in custom mango crates. Express 1-2 day delivery during season. Mangoes are shipped at 80% ripeness — will be perfectly ripe in 1-2 days at room temperature.',
    returnPolicy:'100% replacement for unripe mangoes that fail to ripen within 3 days, or mangoes with internal damage.',
    videoUrl:'', tags:['mango','alphonso','premium','seasonal'] },

  { name:'Organic Apple', slug:'organic-apple', category:'fruits', price:180, discountPrice:155, stock:90, isFeatured:true, rating:4.6, numReviews:132,
    description:'Crisp, naturally sweet organic Shimla apples harvested from orchards above 2,000 metres in Himachal Pradesh. These apples have a red-green skin with a satisfying crunch and balanced sweet-tart flavour. Unlike wax-coated supermarket apples, ours are unwaxed and unpolished — just washed and packed. Rich in pectin fibre (great for gut health), vitamin C, and polyphenol antioxidants concentrated in the skin. "An apple a day keeps the doctor away" — but only if it\'s organic!',
    weights:[{label:'250g (1-2pcs)',price:50,discountPrice:42},{label:'500g (3-4pcs)',price:95,discountPrice:80},{label:'1kg (6-7pcs)',price:180,discountPrice:155}],
    nutritionalInfo:{calories:'52 kcal per 100g',protein:'0.3g',carbs:'14g',fat:'0.2g',fiber:'2.4g'},
    farmSource:{farmName:'Himalayan Apple Orchards',location:'Kotgarh, Shimla, HP',description:'A 75-year-old orchard in the Kotgarh belt — India\'s apple country. Uses no pesticides; relies on ladybugs and bird nesting boxes for natural pest control.'},
    deliveryInfo:'Hand-sorted for size uniformity. Packed with fruit-grade foam nets and corrugated cartons. Delivered within 3-4 days.',
    returnPolicy:'Full replacement for bruised apples or those with internal browning.',
    videoUrl:'', tags:['apple','fruit','fiber','antioxidant'] },

  { name:'Organic Strawberry', slug:'organic-strawberry', category:'fruits', price:120, discountPrice:99, stock:40, isFeatured:true, rating:4.7, numReviews:89,
    description:'Plump, ruby-red organic strawberries from the misty hills of Mahabaleshwar. These strawberries are sweeter and more aromatic than conventional ones — grown in raised beds with coco-peat mulching and drip irrigation for perfect moisture control. Strawberries are rich in vitamin C (more than oranges!), manganese, and ellagic acid — a compound that protects skin from UV damage and supports collagen production. Best enjoyed fresh, or blended into smoothies and desserts.',
    weights:[{label:'250g',price:65,discountPrice:55},{label:'500g',price:120,discountPrice:99}],
    nutritionalInfo:{calories:'32 kcal per 100g',protein:'0.7g',carbs:'7.7g',fat:'0.3g',fiber:'2g'},
    farmSource:{farmName:'Berry Fields Organic',location:'Mahabaleshwar, Maharashtra',description:'A boutique strawberry farm at 1,300m altitude. The cool, misty climate of Mahabaleshwar produces berries with intense flavour and deep red colour.'},
    deliveryInfo:'Packed in ventilated clamshell containers with cold packs. Express 1-2 day delivery to maintain freshness. Refrigerate immediately upon receipt.',
    returnPolicy:'Full refund if berries arrive mouldy or crushed. Report within 12 hours of delivery with photos.',
    videoUrl:'', tags:['strawberry','berry','vitamin-c'] },

  { name:'Organic Papaya', slug:'organic-papaya', category:'fruits', price:65, discountPrice:55, stock:70, rating:4.3, numReviews:67,
    description:'Ripe, golden-fleshed organic papaya from Goa. Papaya contains papain — a proteolytic enzyme that aids digestion and reduces bloating. Also rich in vitamin A, vitamin C, and folate. Our papayas are harvested at 75% ripeness and ripen fully during transit, ensuring you receive the perfect fruit. The bright orange flesh has a buttery, tropical flavour — excellent for smoothie bowls, salads, or eating fresh with lime.',
    weights:[{label:'250g',price:18,discountPrice:15},{label:'500g',price:35,discountPrice:28},{label:'1kg',price:65,discountPrice:55}],
    nutritionalInfo:{calories:'43 kcal per 100g',protein:'0.5g',carbs:'11g',fat:'0.3g',fiber:'1.7g'},
    farmSource:{farmName:'Tropical Fruits Co.',location:'Ponda, Goa',description:'An organic multi-fruit farm near the Western Ghats, specialising in papaya, guava, and jackfruit. Uses traditional Goan composting methods.'},
    deliveryInfo:'Wrapped individually in butter paper. Delivered in 2-3 days. May arrive slightly firm — ripen at room temperature for 1-2 days.',
    returnPolicy:'Full replacement for papayas that are overripe, fermented, or damaged internally.',
    videoUrl:'', tags:['papaya','tropical','digestion','papain'] },

  { name:'Organic Guava', slug:'organic-guava', category:'fruits', price:70, discountPrice:58, stock:85, rating:4.4, numReviews:53,
    description:'Fresh, fragrant organic guavas from the orchards of Allahabad — India\'s guava capital. One guava contains 4x more vitamin C than an orange and more potassium than a banana! The high dietary fibre content (5.4g per guava) makes it one of the best fruits for digestive health. Our guavas have a crisp, white-pink flesh with a unique sweet-tangy flavour. Eat them raw with a sprinkle of chaat masala, or make classic guava jelly.',
    weights:[{label:'250g',price:20,discountPrice:16},{label:'500g',price:38,discountPrice:30},{label:'1kg',price:70,discountPrice:58}],
    nutritionalInfo:{calories:'68 kcal per 100g',protein:'2.6g',carbs:'14g',fat:'1g',fiber:'5.4g'},
    farmSource:{farmName:'Allahabad Orchard Valley',location:'Prayagraj, Uttar Pradesh',description:'Known for producing India\'s finest guavas. The Gangetic alluvial soil gives the fruit its characteristic sweetness and aroma.'},
    deliveryInfo:'Packed in cushioned cartons. Delivered in 2-4 days. Best consumed within 3-4 days of delivery.',
    returnPolicy:'Replacement for fruits with pest damage or rot.',
    videoUrl:'', tags:['guava','vitamin-c','fiber'] },

  // ======== DAIRY ========
  { name:'Organic Milk', slug:'organic-milk', category:'dairy', price:75, discountPrice:65, stock:50, isFeatured:true, isBestSeller:true, rating:4.8, numReviews:234,
    description:'Fresh A2 organic cow milk from grass-fed Gir cows — the purest milk you can find. A2 milk contains A2 beta-casein protein (unlike A1 in regular milk), which is easier to digest and does not cause the bloating or discomfort many people experience with regular milk. Our cows graze on organic pastures, receive no hormones or antibiotics, and are milked by hand. The milk is gently pasteurised (not UHT processed) to retain natural enzymes and flavour. Rich, creamy, and naturally sweet.',
    weights:[{label:'250ml',price:22,discountPrice:18},{label:'500ml',price:40,discountPrice:35},{label:'1L',price:75,discountPrice:65}],
    nutritionalInfo:{calories:'62 kcal per 100ml',protein:'3.2g',carbs:'4.8g',fat:'3.3g',fiber:'0g'},
    farmSource:{farmName:'Gau Organics Dairy',location:'Anand, Gujarat',description:'An ethical A2 dairy farm with 200 indigenous Gir cows. The cows are free-range, fed organic fodder, and treated with Ayurvedic remedies instead of allopathic medicines. Each cow has a name and is cared for even after lactation ceases.'},
    deliveryInfo:'Cold-chain delivered in insulated bottles with frozen gel packs. Delivered within 24-48 hours from milking. Same-day delivery in Mumbai, Delhi, Bangalore.',
    returnPolicy:'Full refund if milk is sour or curdled upon delivery. Report within 2 hours of receiving.',
    videoUrl:'', tags:['milk','a2','dairy','calcium','protein'] },

  { name:'Organic Paneer', slug:'organic-paneer', category:'dairy', price:150, discountPrice:130, stock:60, isFeatured:true, isBestSeller:true, rating:4.5, numReviews:112,
    description:'Soft, melt-in-your-mouth organic paneer (cottage cheese) made from fresh A2 organic milk. Our paneer is hand-set using natural lemon juice coagulation — not industrial citric acid — resulting in a softer, creamier texture. With 18g of protein per 100g, paneer is a vegetarian protein powerhouse. Perfect for palak paneer, tikka, butter paneer, or simply grilled with herbs. Made fresh daily in small batches.',
    weights:[{label:'250g',price:85,discountPrice:72},{label:'500g',price:150,discountPrice:130}],
    nutritionalInfo:{calories:'265 kcal per 100g',protein:'18g',carbs:'1.2g',fat:'20g',fiber:'0g'},
    farmSource:{farmName:'Gau Organics Dairy',location:'Anand, Gujarat',description:'Made in the same ethical dairy as our A2 milk. Each batch uses 6.5 litres of fresh milk to produce 1 kg of paneer.'},
    deliveryInfo:'Vacuum-sealed and cold-chain delivered with ice packs. Shelf life of 7 days refrigerated. Delivered within 1-2 days.',
    returnPolicy:'Full refund if paneer is sour, discoloured, or has off-odour upon delivery.',
    videoUrl:'', tags:['paneer','cheese','protein','vegetarian'] },

  { name:'Organic Ghee', slug:'organic-ghee', category:'dairy', price:650, discountPrice:549, stock:45, isFeatured:true, isBestSeller:true, rating:4.9, numReviews:305,
    description:'Pure A2 organic ghee, hand-churned using the ancient Vedic bilona method. In this traditional process, A2 milk is first cultured into curd, then hand-churned to extract makkhan (butter), which is slow-cooked over a wood fire until golden ghee separates. This yields only 1 litre of ghee from 30 litres of milk! The result is a ghee with an intoxicating nutty aroma, granular texture, and deep golden colour. Rich in butyrate (supports gut lining repair), conjugated linoleic acid (CLA), and fat-soluble vitamins A, D, E, and K.',
    weights:[{label:'250ml',price:350,discountPrice:299},{label:'500ml',price:650,discountPrice:549},{label:'1L',price:1200,discountPrice:999}],
    nutritionalInfo:{calories:'900 kcal per 100g',protein:'0g',carbs:'0g',fat:'99.7g',fiber:'0g'},
    farmSource:{farmName:'Vedic Ghee Co.',location:'Jaipur, Rajasthan',description:'A family of traditional ghee-makers following the Ayurvedic bilona method passed down through 5 generations. Their 80 Sahiwal cows are worshipped and never sold.'},
    deliveryInfo:'Packed in glass jars (not plastic) for purity. Ghee is stable at room temperature — no refrigeration needed. Delivered within 3-5 days.',
    returnPolicy:'Full refund if ghee has rancid smell, abnormal colour, or impurities.',
    videoUrl:'', tags:['ghee','clarified-butter','a2','bilona','ayurvedic'] },

  { name:'Organic Butter', slug:'organic-butter', category:'dairy', price:120, discountPrice:105, stock:80, isBestSeller:true, rating:4.6, numReviews:98,
    description:'Creamy, golden organic butter made from fresh A2 milk cream. Our butter is cultured (fermented) for 12 hours before churning, giving it a rich, tangy depth of flavour that pasteurised-cream butter simply cannot match. Spread it on toast, melt it into dal, or use it for baking — the flavour is unmistakable. Contains healthy saturated fats, CLA, and fat-soluble vitamins.',
    weights:[{label:'100g',price:55,discountPrice:48},{label:'250g',price:95,discountPrice:82},{label:'500g',price:120,discountPrice:105}],
    nutritionalInfo:{calories:'717 kcal per 100g',protein:'0.9g',carbs:'0.1g',fat:'81g',fiber:'0g'},
    farmSource:{farmName:'Amul Organic',location:'Anand, Gujarat',description:'India\'s trusted dairy cooperative, now with a certified organic line sourced from Gir cow farms across Gujarat.'},
    deliveryInfo:'Cold-chain delivered in insulated packaging. Refrigerate upon receipt. Best before 30 days from manufacture.',
    returnPolicy:'Replace or refund for rancid or unusually soft butter.',
    videoUrl:'', tags:['butter','spread','dairy','cultured'] },

  { name:'Organic Yogurt', slug:'organic-yogurt', category:'dairy', price:55, discountPrice:45, stock:70, rating:4.4, numReviews:87,
    description:'Thick, creamy organic yogurt (dahi) made by fermenting fresh A2 milk with live probiotic cultures. Our yogurt contains Lactobacillus and Bifidobacterium strains that support gut microbiome diversity, improve digestion, and boost immunity. Set in traditional clay pots for 8 hours, then chilled. No thickeners, stabilisers, or added sugar — just pure, tangy, probiotic-rich curd.',
    weights:[{label:'250g',price:30,discountPrice:25},{label:'500g',price:55,discountPrice:45}],
    nutritionalInfo:{calories:'59 kcal per 100g',protein:'3.5g',carbs:'4.7g',fat:'3.3g',fiber:'0g'},
    farmSource:{farmName:'Gau Organics',location:'Anand, Gujarat',description:'Made fresh daily in the dairy\'s culture lab using proprietary probiotic mother cultures maintained for over 20 years.'},
    deliveryInfo:'Cold-chain delivered in sealed glass jars. Shelf life 5 days refrigerated. Same-day delivery in metros.',
    returnPolicy:'Full refund if curd is sour beyond normal tang, or if the seal is broken.',
    videoUrl:'', tags:['yogurt','probiotic','curd','gut-health'] },

  // ======== SNACKS & BISCUITS ========
  { name:'Organic Millet Cookies', slug:'organic-millet-cookies', category:'snacks', price:180, discountPrice:149, stock:120, isFeatured:true, isBestSeller:true, rating:4.6, numReviews:94,
    description:'Crispy, melt-in-your-mouth organic millet cookies made with ragi (finger millet), organic jaggery, and cold-pressed coconut oil. Zero refined sugar, zero maida. Ragi is a superfood grain rich in calcium (3x more than milk!), iron, and amino acids. These cookies are baked (not fried), wheat-free, and naturally sweetened — making them a guilt-free snack for the whole family. Each batch is handmade in small quantities for artisanal quality.',
    weights:[{label:'100g',price:65,discountPrice:55},{label:'250g',price:180,discountPrice:149},{label:'500g',price:320,discountPrice:269}],
    nutritionalInfo:{calories:'420 kcal per 100g',protein:'7.5g',carbs:'62g',fat:'15g',fiber:'4g'},
    farmSource:{farmName:'Ancient Grains Bakery',location:'Bengaluru, Karnataka',description:'An artisanal organic bakery specialising in millet-based snacks. They source ragi from tribal farmers in Karnataka and use solar-powered ovens.'},
    deliveryInfo:'Packed in airtight, food-grade zip-lock pouches. Shelf life 60 days. Delivered within 3-5 business days.',
    returnPolicy:'Replacement for broken cookies or stale products. Report within 3 days of delivery.',
    videoUrl:'', tags:['cookies','biscuits','millet','ragi','snacks','wheat-free'] },

  { name:'Organic Quinoa Crackers', slug:'organic-quinoa-crackers', category:'snacks', price:220, discountPrice:189, stock:80, isFeatured:true, rating:4.5, numReviews:67,
    description:'Crunchy organic quinoa crackers seasoned with Himalayan pink salt and herbs. Made from a blend of organic quinoa, flaxseeds, and sesame seeds — these crackers are protein-packed, gluten-free, and fibre-rich. Each cracker delivers the nutty goodness of three superfoods. Perfect for pairing with hummus, guacamole, or cheese. Baked to a crispy golden perfection with no artificial flavours.',
    weights:[{label:'100g',price:85,discountPrice:72},{label:'250g',price:220,discountPrice:189}],
    nutritionalInfo:{calories:'380 kcal per 100g',protein:'12g',carbs:'55g',fat:'12g',fiber:'6g'},
    farmSource:{farmName:'Himalayan Superfoods',location:'Dehradun, Uttarakhand',description:'Sources quinoa from organic farms at 3,000m in Ladakh — one of the few regions in India where quinoa thrives naturally.'},
    deliveryInfo:'Sealed in nitrogen-flushed packs for crunch retention. Shelf life 90 days. Delivered in 3-5 days.',
    returnPolicy:'Full replacement for crushed or stale crackers.',
    videoUrl:'', tags:['crackers','quinoa','gluten-free','snacks','protein'] },

  { name:'Organic Jaggery Biscuits', slug:'organic-jaggery-biscuits', category:'snacks', price:120, discountPrice:99, stock:150, isBestSeller:true, rating:4.4, numReviews:118,
    description:'Wholesome organic biscuits sweetened with unrefined jaggery (gur) and made with whole wheat flour, organic butter, and cardamom. Jaggery retains its natural minerals — iron, magnesium, and potassium — unlike refined white sugar. These biscuits have a warm, caramel-like sweetness with a hint of cardamom fragrance. Ideal for tea-time or as a healthy lunch-box snack for kids. No preservatives, no artificial colours.',
    weights:[{label:'100g',price:45,discountPrice:38},{label:'250g',price:120,discountPrice:99},{label:'500g',price:210,discountPrice:179}],
    nutritionalInfo:{calories:'440 kcal per 100g',protein:'6g',carbs:'68g',fat:'16g',fiber:'3g'},
    farmSource:{farmName:'Village Bakehouse',location:'Kolhapur, Maharashtra',description:'A rural women\'s cooperative that hand-bakes organic biscuits using traditional clay ovens fired with sustainably harvested firewood.'},
    deliveryInfo:'Packed in eco-friendly cardboard boxes with food-grade wax paper lining. Shelf life 45 days. Delivered in 3-5 days.',
    returnPolicy:'Full refund or replacement for broken or stale biscuits.',
    videoUrl:'', tags:['biscuits','jaggery','whole-wheat','snacks','tea-time'] },

  { name:'Organic Dry Fruit Trail Mix', slug:'organic-trail-mix', category:'snacks', price:350, discountPrice:299, stock:60, isFeatured:true, rating:4.7, numReviews:78,
    description:'A premium blend of organic almonds, cashews, raisins, dried cranberries, pumpkin seeds, and sunflower seeds — roasted with a touch of Himalayan pink salt and cold-pressed olive oil. This trail mix is a powerhouse of healthy fats, protein, fibre, and antioxidants. Perfect for on-the-go energy, gym sessions, or as a mid-meal snack. Each ingredient is individually sourced from certified organic farms.',
    weights:[{label:'100g',price:120,discountPrice:99},{label:'250g',price:350,discountPrice:299},{label:'500g',price:650,discountPrice:549}],
    nutritionalInfo:{calories:'520 kcal per 100g',protein:'15g',carbs:'42g',fat:'32g',fiber:'7g'},
    farmSource:{farmName:'Nutri Harvest Organics',location:'Jammu & Kashmir / Kerala',description:'Almonds from Kashmir, cashews from Kerala, pumpkin seeds from Rajasthan — each ingredient is traced to its origin farm.'},
    deliveryInfo:'Packed in resealable zip-lock pouches. Shelf life 120 days. Delivered in 4-6 days.',
    returnPolicy:'Replacement for rancid nuts or incorrect weight.',
    videoUrl:'', tags:['trail-mix','nuts','dry-fruits','snacks','energy','protein'] },

  // ======== HERBAL PRODUCTS ========
  { name:'Organic Neem Soap', slug:'organic-neem-soap', category:'herbal', price:150, discountPrice:125, stock:200, isFeatured:true, isBestSeller:true, rating:4.6, numReviews:176,
    description:'Handcrafted organic neem soap made through traditional cold-process method. Neem (Azadirachta indica) has been used in Ayurveda for thousands of years for its powerful antibacterial, antifungal, and anti-inflammatory properties. This soap combines cold-pressed neem oil, neem leaf extract, organic coconut oil, and turmeric to create a gentle yet effective cleansing bar. Ideal for acne-prone skin, body odour, and minor skin irritations. Free from SLS, parabens, synthetic fragrances, and palm oil.',
    weights:[{label:'75g (1 bar)',price:80,discountPrice:65},{label:'125g (1 bar)',price:150,discountPrice:125},{label:'375g (3 bars)',price:400,discountPrice:340}],
    nutritionalInfo:{calories:'N/A',protein:'N/A',carbs:'N/A',fat:'N/A',fiber:'N/A'},
    farmSource:{farmName:'Ayur Herbals Workshop',location:'Thrissur, Kerala',description:'An Ayurvedic soap workshop run by 3rd-generation herbalists. Every bar is cold-processed for 6 weeks, hand-cut, and naturally cured — no machinery is used.'},
    deliveryInfo:'Wrapped in handmade paper and packed in cardboard boxes. Shelf life 18 months. Delivered in 4-6 days.',
    returnPolicy:'Full replacement for soaps that are cracked, crumbled, or have unusual odour.',
    videoUrl:'', tags:['soap','neem','herbal','antibacterial','skincare'] },

  { name:'Organic Cold-Pressed Coconut Oil', slug:'organic-coconut-oil', category:'herbal', price:350, discountPrice:299, stock:120, isFeatured:true, isBestSeller:true, rating:4.8, numReviews:245,
    description:'Pure organic virgin coconut oil extracted through cold-pressing of fresh coconut meat — never from dried copra. Cold-pressing at temperatures below 50°C preserves all the natural lauric acid (a medium-chain fatty acid with antimicrobial properties), vitamin E, and polyphenol antioxidants. Multi-purpose: use for cooking (high smoke point of 177°C), oil-pulling for oral health, deep hair conditioning, skin moisturising, and baby massage. This is the only oil you will ever need.',
    weights:[{label:'250ml',price:190,discountPrice:160},{label:'500ml',price:350,discountPrice:299},{label:'1L',price:650,discountPrice:549}],
    nutritionalInfo:{calories:'862 kcal per 100ml',protein:'0g',carbs:'0g',fat:'100g',fiber:'0g'},
    farmSource:{farmName:'Kera Organics',location:'Kozhikode, Kerala',description:'A traditional coconut oil mill in the Malabar region. Fresh coconuts are harvested, de-shelled, and cold-pressed within 24 hours to produce the purest virgin coconut oil.'},
    deliveryInfo:'Packed in food-grade glass bottles with tamper-proof seals. Oil may solidify in winter — this is normal; warm the bottle in lukewarm water. Delivered in 3-5 days.',
    returnPolicy:'Full refund for leaking bottles or oil with rancid smell.',
    videoUrl:'', tags:['coconut-oil','cold-pressed','hair','skin','cooking','herbal'] },

  { name:'Organic Lip Balm (Beetroot)', slug:'organic-lip-balm', category:'herbal', price:199, discountPrice:169, stock:150, isFeatured:true, rating:4.5, numReviews:132,
    description:'A 100% natural organic lip balm that heals, protects, and gives a subtle rosy tint to your lips. Made with organic beeswax, cold-pressed almond oil, shea butter, vitamin E, and natural beetroot pigment for a delicate pink hue. Provides deep moisturisation for dry, chapped, and sun-damaged lips. The beeswax creates a protective barrier against wind and cold, while almond oil softens and nourishes. No petroleum jelly, no synthetic dyes, no chemical SPF — just pure, edible-grade ingredients.',
    weights:[{label:'5g (1 stick)',price:99,discountPrice:85},{label:'10g (1 tin)',price:199,discountPrice:169},{label:'30g (3 tins)',price:520,discountPrice:449}],
    nutritionalInfo:{calories:'N/A',protein:'N/A',carbs:'N/A',fat:'N/A',fiber:'N/A'},
    farmSource:{farmName:'Bloom Organics',location:'Kodaikanal, Tamil Nadu',description:'A women-led social enterprise making organic skincare in the Kodaikanal hills. They harvest wild beeswax from local beekeepers and grow beetroot organically for their tint.'},
    deliveryInfo:'Packed in recycled aluminium tins or FSC-certified cardboard tubes. Shelf life 12 months. Delivered in 4-6 days.',
    returnPolicy:'Replacement for melted, damaged, or incorrectly labelled products.',
    videoUrl:'', tags:['lip-balm','beeswax','beetroot','moisturising','herbal'] },

  { name:'Organic Bhringraj Hair Oil', slug:'organic-hair-oil', category:'herbal', price:320, discountPrice:269, stock:90, isFeatured:true, isBestSeller:true, rating:4.7, numReviews:198,
    description:'A potent Ayurvedic hair oil infused with Bhringraj (Eclipta alba) — the "King of Herbs" for hair. This oil is prepared using the traditional Taila Paka Vidhi (Ayurvedic oil infusion method): organic Bhringraj leaves, Amla, Brahmi, fenugreek, curry leaves, and hibiscus are slow-cooked in cold-pressed organic coconut oil and sesame oil for 72 hours until the herbs fully infuse. Promotes hair growth, prevents premature greying, reduces dandruff, and deeply conditions the scalp. Suitable for all hair types.',
    weights:[{label:'100ml',price:150,discountPrice:125},{label:'250ml',price:320,discountPrice:269},{label:'500ml',price:580,discountPrice:499}],
    nutritionalInfo:{calories:'N/A',protein:'N/A',carbs:'N/A',fat:'N/A',fiber:'N/A'},
    farmSource:{farmName:'Vaidya Herbals',location:'Coimbatore, Tamil Nadu',description:'Run by an Ayurvedic physician with 30 years of practice. All herbs are grown in their own organic herbal garden. The oil is prepared in copper vessels over firewood — exactly as prescribed in ancient Ayurvedic texts.'},
    deliveryInfo:'Packed in amber glass bottles to protect from UV degradation. Shelf life 18 months. Delivered in 4-6 days.',
    returnPolicy:'Full replacement for leaked, expired, or contaminated products.',
    videoUrl:'', tags:['hair-oil','bhringraj','ayurvedic','hair-growth','herbal'] },

  { name:'Organic Multani Mitti Face Pack', slug:'organic-face-pack', category:'herbal', price:180, discountPrice:149, stock:100, isFeatured:true, rating:4.5, numReviews:109,
    description:'A deep-cleansing Ayurvedic face pack made with pure organic Multani Mitti (Fuller\'s Earth), organic turmeric, sandalwood powder, rose petal powder, and Kashmiri saffron. Multani Mitti absorbs excess oil and impurities from pores, turmeric brightens and evens skin tone, sandalwood soothes inflammation, and saffron gives a natural glow. Mix 1 tablespoon with rose water or raw milk, apply for 15 minutes, and wash off for instantly refreshed, tight, and radiant skin. Suitable for oily and combination skin types.',
    weights:[{label:'50g',price:80,discountPrice:65},{label:'100g',price:180,discountPrice:149},{label:'250g',price:380,discountPrice:320}],
    nutritionalInfo:{calories:'N/A',protein:'N/A',carbs:'N/A',fat:'N/A',fiber:'N/A'},
    farmSource:{farmName:'Sacred Earth Ayurveda',location:'Bikaner, Rajasthan',description:'Sources the purest food-grade Multani Mitti from the ancient lake beds of Rajasthan. Turmeric is sourced from Erode (Tamil Nadu), and saffron from Kashmir.'},
    deliveryInfo:'Packed in sealed, food-grade HDPE jars. Shelf life 24 months. Delivered in 4-6 days.',
    returnPolicy:'Full replacement if the product is open/tampered or has unusual texture.',
    videoUrl:'', tags:['face-pack','multani-mitti','turmeric','skincare','herbal'] },

  { name:'Organic Amla Hair Pack', slug:'organic-hair-pack', category:'herbal', price:160, discountPrice:135, stock:110, rating:4.4, numReviews:87,
    description:'A strengthening Ayurvedic hair pack powder made from organic Amla (Indian Gooseberry), Shikakai, Reetha (soapnut), Brahmi, and Hibiscus flower powder. Amla is the richest natural source of Vitamin C and a cornerstone of Ayurvedic hair care — it strengthens hair follicles, prevents premature greying, adds shine, and reduces hair fall. Mix 3 tablespoons with warm water or yogurt, apply to hair and scalp for 30 minutes, then wash off. Acts as a natural shampoo and conditioner in one!',
    weights:[{label:'50g',price:65,discountPrice:55},{label:'100g',price:160,discountPrice:135},{label:'250g',price:350,discountPrice:299}],
    nutritionalInfo:{calories:'N/A',protein:'N/A',carbs:'N/A',fat:'N/A',fiber:'N/A'},
    farmSource:{farmName:'Herbal Heritage',location:'Pratapgarh, Rajasthan',description:'A community of tribal women who hand-harvest wild Amla from the Aravalli forests and sun-dry them to retain maximum vitamin C content.'},
    deliveryInfo:'Packed in resealable kraft pouches. Shelf life 18 months. Delivered in 4-6 days.',
    returnPolicy:'Replacement for products with moisture damage or incorrect weight.',
    videoUrl:'', tags:['hair-pack','amla','shikakai','ayurvedic','herbal'] },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    await Product.deleteMany({}); await User.deleteMany({}); await Review.deleteMany({});
    const createdProducts = await Product.insertMany(products.map(p => ({ ...p, isOrganic: true, images: [] })));
    console.log(`🌿 ${createdProducts.length} products seeded`);
    const adminHash = await bcrypt.hash('admin123', 10);
    await User.create({ name:'Admin', email:'admin@curfee.com', password:adminHash, role:'admin', phone:'7845744038' });
    console.log('👑 Admin created (admin@curfee.com / admin123)');
    const demoHash = await bcrypt.hash('demo123', 10);
    const demo = await User.create({ name:'Demo User', email:'demo@curfee.com', password:demoHash, role:'user', phone:'7845744038', addresses:[{fullName:'Demo User',phone:'7845744038',addressLine1:'123 Organic Lane',addressLine2:'Green Colony',city:'Mumbai',state:'Maharashtra',pincode:'400001',isDefault:true}] });
    console.log('👤 Demo user created (demo@curfee.com / demo123)');
    const sampleReviews = [
      { product:createdProducts[0]._id, user:demo._id, userName:'Demo User', rating:5, comment:'Best organic tomatoes! Very fresh, juicy and flavourful. The sweetness is unmatched.', isVerifiedPurchase:true },
      { product:createdProducts[7]._id, user:demo._id, userName:'Demo User', rating:5, comment:'Alphonso mangoes are incredible. Tree-ripened perfection! Will order every season.', isVerifiedPurchase:true },
      { product:createdProducts[12]._id, user:demo._id, userName:'Demo User', rating:5, comment:'Fresh A2 milk delivered perfectly chilled. Can taste the difference immediately!', isVerifiedPurchase:true },
      { product:createdProducts[14]._id, user:demo._id, userName:'Demo User', rating:5, comment:'The bilona ghee is exceptional. Aroma fills the whole kitchen! Worth every rupee.', isVerifiedPurchase:true },
    ];
    await Review.insertMany(sampleReviews);
    console.log('⭐ Sample reviews added');
    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (err) { console.error('❌ Seed error:', err.message); process.exit(1); }
}
seed();
