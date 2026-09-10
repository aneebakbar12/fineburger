// ==============================================================================
// FINE BURGER (Since 1981) — OFFICIAL RESTAURANT MENU SEED SCRIPT
// Complete two-sided physical menu digitized with 10 categories and 47 items.
// ==============================================================================

import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    deleteDoc,
    doc,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyA5PAdRbFyVFkQqcqg2Z18R9i84jISIMUQ",
    authDomain: "fineburger-b1d65.firebaseapp.com",
    projectId: "fineburger-b1d65",
    storageBucket: "fineburger-b1d65.firebasestorage.app",
    messagingSenderId: "835843894036",
    appId: "1:835843894036:web:2807cd0178ad0ea53e7001"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 1. CATEGORIES ---
export const OFFICIAL_CATEGORIES = [
    { id: 'cat_burgers', name: 'Burgers', icon: '🍔', order: 1 },
    { id: 'cat_deals', name: 'Special Deals', icon: '🎉', order: 2 },
    { id: 'cat_pizzas', name: "Pizza'z", icon: '🍕', order: 3 },
    { id: 'cat_special_pizza', name: 'Special Pizza', icon: '👑', order: 4 },
    { id: 'cat_shawarma_wraps', name: 'Shawarma & Wraps', icon: '🌯', order: 5 },
    { id: 'cat_paratha_rolls', name: 'Paratha Rolls', icon: '🥖', order: 6 },
    { id: 'cat_sandwiches', name: 'Sandwiches', icon: '🥪', order: 7 },
    { id: 'cat_broast', name: 'Arabian Broast', icon: '🍗', order: 8 },
    { id: 'cat_sides', name: 'Fries, Nuggets & Wings', icon: '🍟', order: 9 },
    { id: 'cat_beverages', name: 'Beverages', icon: '🥤', order: 10 }
];

// --- 2. MENU ITEMS ---
export const OFFICIAL_MENU_ITEMS = [
    // =========================================================================
    // 🍔 BURGERS
    // =========================================================================
    {
        id: 'fb_shami',
        name: 'Shami Burger',
        categoryId: 'cat_burgers',
        price: 160,
        description: 'Authentic Lahore street-style spiced shami patty with crisp onions, ketchup & mint sauce in a toasted bun.',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 100,
        variations: [
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)', 'Mayo Dip + Cheese (+Rs. 100)'] }
        ]
    },
    {
        id: 'fb_double_anda_shami',
        name: 'Double Anda Shami Burger',
        categoryId: 'cat_burgers',
        price: 220,
        description: 'Traditional spiced shami patty topped with a double fluffy egg omelet, onions & tangy mint chutney.',
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 90,
        variations: [
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)', 'Mayo Dip + Cheese (+Rs. 100)'] }
        ]
    },
    {
        id: 'fb_chicken_burger',
        name: 'Chicken Burger',
        categoryId: 'cat_burgers',
        price: 370,
        description: 'Golden-crisp chicken patty with shredded iceberg lettuce and house garlic mayo in a soft sesame bun.',
        imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 100,
        variations: [
            { name: 'Meal Option', options: ['Single Burger (Rs. 370)', 'Combo with Fries & Drink (+Rs. 140)'] },
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_zinger_burger',
        name: 'Zinger Burger',
        categoryId: 'cat_burgers',
        price: 370,
        description: 'Crispy fried chicken thigh fillet double-coated in secret fiery spices with creamy mayo & fresh lettuce.',
        imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 120,
        featured: true,
        variations: [
            { name: 'Meal Option', options: ['Single Burger (Rs. 370)', 'Combo with Fries & Drink (+Rs. 140)'] },
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_mighty_zinger',
        name: 'Mighty Zinger Burger',
        categoryId: 'cat_burgers',
        price: 550,
        description: 'Two massive crispy chicken zinger fillets stacked high with double cheese, creamy mayo, and crisp lettuce.',
        imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 80,
        featured: true,
        variations: [
            { name: 'Meal Option', options: ['Single Burger (Rs. 550)', 'Combo with Fries & Drink (+Rs. 100)'] },
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_grill_burger',
        name: 'Grill Burger',
        categoryId: 'cat_burgers',
        price: 420,
        description: 'Tender flame-grilled chicken fillet infused with smoky spices, caramelized onions & secret burger sauce.',
        imageUrl: 'https://images.unsplash.com/photo-1619881590738-a111d176d906?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 75,
        variations: [
            { name: 'Meal Option', options: ['Single Burger (Rs. 420)', 'Combo with Fries & Drink (+Rs. 100)'] },
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_peri_peri_grill_burger',
        name: 'Peri Peri Grill Burger',
        categoryId: 'cat_burgers',
        price: 450,
        description: 'Flame-grilled chicken fillet basted in African peri-peri glaze with pickled jalapenos & chili mayo.',
        imageUrl: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 70,
        variations: [
            { name: 'Meal Option', options: ['Single Burger (Rs. 450)', 'Combo with Fries & Drink (+Rs. 120)'] },
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_mac_patty_burger',
        name: 'Mac Patty Burger (For Kids Also)',
        categoryId: 'cat_burgers',
        price: 250,
        description: 'Mild seasoned chicken patty with gentle cheese spread and mild mayo. Ideal for children and light snacks.',
        imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 80,
        variations: [
            { name: 'Meal Option', options: ['Single Burger (Rs. 250)', 'Combo with Fries & Drink (+Rs. 140)'] },
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_chicken_boti_burger',
        name: 'Chicken Boti Burger',
        categoryId: 'cat_burgers',
        price: 370,
        description: 'Charcoal-grilled tender chicken boti chunks with mint raita, onion rings, and spicy desi spices in a bun.',
        imageUrl: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 70,
        variations: [
            { name: 'Meal Option', options: ['Single Burger (Rs. 370)', 'Combo with Fries & Drink (+Rs. 120)'] },
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_crunch_burger',
        name: 'Crunch Burger',
        categoryId: 'cat_burgers',
        price: 300,
        description: 'Extra crispy battered chicken fillet topped with crunchy potato crisps, signature dressing & cheese sauce.',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 85,
        variations: [
            { name: 'Meal Option', options: ['Single Burger (Rs. 300)', 'Combo with Fries & Drink (+Rs. 150)'] },
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_special_burger',
        name: 'FB Special Burger',
        categoryId: 'cat_burgers',
        price: 490,
        description: 'Fine Burger royal specialty: double premium patties, melted cheddar, grilled smoked sausage & house secret sauce.',
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 90,
        featured: true,
        variations: [
            { name: 'Meal Option', options: ['Single Burger (Rs. 490)', 'Combo with Fries & Drink (+Rs. 110)'] },
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_gorilla_smash',
        name: 'Gorilla Smash Burger',
        categoryId: 'cat_burgers',
        price: 490,
        description: 'Giant smashed double beef/chicken patties with caramelized crispy edges, melted cheese, pickles & gorilla sauce.',
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 90,
        featured: true,
        variations: [
            { name: 'Meal Option', options: ['Single Burger (Rs. 490)', 'Combo with Fries & Drink (+Rs. 110)'] },
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },

    // =========================================================================
    // 🥪 SANDWICHES
    // =========================================================================
    {
        id: 'fb_sand_chicken',
        name: 'Chicken Sandwich',
        categoryId: 'cat_sandwiches',
        price: 420,
        description: 'Shredded seasoned chicken breast, boiled egg slices, cucumber & creamy mayo in triple-layer toasted bread.',
        imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 60,
        variations: [
            { name: 'Meal Option', options: ['Single Sandwich (Rs. 420)', 'Combo with Fries & Drink (Rs. 570)'] }
        ]
    },
    {
        id: 'fb_sand_grill',
        name: 'Grill Sandwich',
        categoryId: 'cat_sandwiches',
        price: 470,
        description: 'Charcoal-grilled smoky chicken breast strips with bell peppers, melted cheese & herb spread toasted golden.',
        imageUrl: 'https://images.unsplash.com/photo-1554433607-66b5efe9d304?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 60,
        variations: [
            { name: 'Meal Option', options: ['Single Sandwich (Rs. 470)', 'Combo with Fries & Drink (Rs. 590)'] }
        ]
    },
    {
        id: 'fb_sand_club',
        name: 'Club Sandwich',
        categoryId: 'cat_sandwiches',
        price: 420,
        description: 'Classic double-decker with chicken, fluffy omelet, cheese slice, lettuce, tomatoes and garlic mayo.',
        imageUrl: 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 70,
        featured: true,
        variations: [
            { name: 'Meal Option', options: ['Single Sandwich (Rs. 420)', 'Combo with Fries & Drink (Rs. 570)'] }
        ]
    },
    {
        id: 'fb_sand_peri_peri',
        name: 'Peri Peri Grill Sandwich',
        categoryId: 'cat_sandwiches',
        price: 520,
        description: 'Fiery peri-peri grilled chicken with melted mozzarella, jalapenos & spicy dressing in grilled crusty bread.',
        imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 50,
        variations: [
            { name: 'Meal Option', options: ['Single Sandwich (Rs. 520)', 'Combo with Fries & Drink (Rs. 620)'] }
        ]
    },

    // =========================================================================
    // 🌯 SHAWARMA & WRAPS
    // =========================================================================
    {
        id: 'fb_shaw_chicken',
        name: 'Chicken Shawarma',
        categoryId: 'cat_shawarma_wraps',
        price: 270,
        description: 'Thinly sliced rotisserie chicken, authentic garlic toum, vinegar pickles, and hot sauce in warm pita bread (Large).',
        imageUrl: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 90,
        variations: [
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_shaw_chicken_platter',
        name: 'Chicken Platter Shawarma',
        categoryId: 'cat_shawarma_wraps',
        price: 680,
        description: 'Open-style shawarma platter with carved spiced chicken, 2 warm pita breads, french fries, garlic toum & salad.',
        imageUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 50,
        featured: true,
        variations: [
            { name: 'Platter Size', options: ['Medium Platter (Rs. 680)', 'Large Platter (Rs. 760)'] },
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_shaw_zinger',
        name: 'Zinger Shawarma',
        categoryId: 'cat_shawarma_wraps',
        price: 220,
        description: 'Crunchy golden zinger chicken strips wrapped in pita bread with spicy garlic mayo sauce & shredded cabbage.',
        imageUrl: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 80,
        variations: [
            { name: 'Size', options: ['Small (Rs. 220)', 'Large (Rs. 300)'] },
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_shaw_grill',
        name: 'Grill Shawarma',
        categoryId: 'cat_shawarma_wraps',
        price: 350,
        description: 'Smoky grilled chicken boti chunks basted in olive oil & garlic, rolled in warm pita bread (Large).',
        imageUrl: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 75,
        variations: [
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_shaw_grill_platter',
        name: 'Grill Platter Shawarma',
        categoryId: 'cat_shawarma_wraps',
        price: 780,
        description: 'Generous platter of charcoal-grilled chicken cubes served with fries, garlic dip, pickled veggies & 2 pitas.',
        imageUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 50,
        variations: [
            { name: 'Platter Size', options: ['Small Platter (Rs. 780)', 'Large Platter (Rs. 850)'] },
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_wrap_zinger',
        name: 'Zinger Tortilla Wrap',
        categoryId: 'cat_shawarma_wraps',
        price: 550,
        description: 'Crispy chicken zinger fillets, iceberg lettuce, diced tomatoes, and house dressing wrapped in a soft flour tortilla.',
        imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 60,
        variations: [
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_wrap_grill_bbq',
        name: 'Grill BBQ Tortilla Wrap',
        categoryId: 'cat_shawarma_wraps',
        price: 600,
        description: 'Flame-grilled chicken glazed in barbecue sauce with sauteed peppers, onions, and melted cheese in a toasted tortilla.',
        imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 60,
        variations: [
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },

    // =========================================================================
    // 🥖 PARATHA ROLLS
    // =========================================================================
    {
        id: 'fb_paratha_kabab',
        name: 'Kabab Paratha Roll',
        categoryId: 'cat_paratha_rolls',
        price: 300,
        description: 'Juicy spiced seekh kabab grilled on charcoal and wrapped in hot crispy lachha paratha with mint chutney.',
        imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 80,
        variations: [
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_paratha_chicken',
        name: 'Chicken Paratha Roll',
        categoryId: 'cat_paratha_rolls',
        price: 320,
        description: 'Traditional chicken boti rolled in hot flaky paratha with sliced red onions and creamy garlic mayo.',
        imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 80,
        variations: [
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_paratha_zinger',
        name: 'Zinger Paratha Roll',
        categoryId: 'cat_paratha_rolls',
        price: 300,
        description: 'Crunchy golden fried zinger strips wrapped in a crispy layered paratha with spicy sauce & fresh salad.',
        imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 85,
        featured: true,
        variations: [
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_paratha_grill',
        name: 'Grill Paratha Roll',
        categoryId: 'cat_paratha_rolls',
        price: 350,
        description: 'Smoky grilled chicken pieces basted in tikka spices, wrapped in crispy layered butter paratha.',
        imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 75,
        variations: [
            { name: 'Add-ons', options: ['No Add-on', 'Mayo Dip (+Rs. 50)', 'Cheese Slice (+Rs. 50)'] }
        ]
    },

    // =========================================================================
    // 🍟 FRIES, NUGGETS & WINGS
    // =========================================================================
    {
        id: 'fb_fries_plain',
        name: 'Plain Fries',
        categoryId: 'cat_sides',
        price: 150,
        description: 'Crisp golden french fries freshly cooked and lightly seasoned with sea salt.',
        imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 100,
        variations: [
            { name: 'Size', options: ['Small (Rs. 150)', 'Medium (Rs. 200)', 'Large (Rs. 300)'] }
        ]
    },
    {
        id: 'fb_fries_masala',
        name: 'Masala Fries',
        categoryId: 'cat_sides',
        price: 160,
        description: 'Hot golden fries generously dusted with spicy traditional Lahori chaat masala seasoning.',
        imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 100,
        variations: [
            { name: 'Size', options: ['Small (Rs. 160)', 'Medium (Rs. 210)', 'Large (Rs. 310)'] }
        ]
    },
    {
        id: 'fb_fries_mayo_garlic',
        name: 'Mayo Garlic Fries',
        categoryId: 'cat_sides',
        price: 200,
        description: 'Crisp fries generously topped with our house-recipe creamy garlic mayo sauce.',
        imageUrl: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 100,
        variations: [
            { name: 'Size', options: ['Small (Rs. 200)', 'Medium (Rs. 270)', 'Large (Rs. 370)'] }
        ]
    },
    {
        id: 'fb_fries_loaded',
        name: 'Loaded Fries',
        categoryId: 'cat_sides',
        price: 600,
        description: 'Large portion of fries smothered in cheese sauce, crispy fried chicken bites, jalapenos & secret dressing.',
        imageUrl: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 70,
        featured: true
    },
    {
        id: 'fb_fries_grill_loaded',
        name: 'Grill Loaded Fries',
        categoryId: 'cat_sides',
        price: 700,
        description: 'Fries topped with tender charcoal-grilled chicken boti chunks, melted cheese, black olives, and BBQ drizzle.',
        imageUrl: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 60,
        featured: true
    },
    {
        id: 'fb_hot_wings',
        name: 'Hot Wings',
        categoryId: 'cat_sides',
        price: 300,
        description: 'Crispy batter-fried chicken wings seasoned with fiery spices and served piping hot.',
        imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 80,
        variations: [
            { name: 'Portion', options: ['5 Pieces (Rs. 300)', '10 Pieces (Rs. 500)'] }
        ]
    },
    {
        id: 'fb_nuggets',
        name: 'Chicken Nuggets',
        categoryId: 'cat_sides',
        price: 300,
        description: 'Tender all-white-meat chicken nuggets with a golden crunchy coating. Loved by kids and adults.',
        imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 90,
        variations: [
            { name: 'Portion', options: ['5 Pieces (Rs. 300)', '10 Pieces (Rs. 500)'] }
        ]
    },

    // =========================================================================
    // 🍗 ARABIAN BROAST
    // =========================================================================
    {
        id: 'fb_broast_quarter',
        name: 'Quarter Arabian Broast',
        categoryId: 'cat_broast',
        price: 750,
        description: 'Authentic deep-pressure fried Arabian chicken (1 Leg + 1 Thigh), served with soft bun, fries & special garlic dip.',
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 50,
        featured: true
    },
    {
        id: 'fb_broast_half',
        name: 'Half Arabian Broast',
        categoryId: 'cat_broast',
        price: 1150,
        description: 'Half crispy Arabian broast chicken (1 Leg + 1 Thigh + 1 Wing + 1 Chest piece), served with bun, fries & garlic dip.',
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 40,
        featured: true
    },
    {
        id: 'fb_broast_full',
        name: 'Full Arabian Broast',
        categoryId: 'cat_broast',
        price: 2200,
        description: 'Full family crispy Arabian broast (2 Legs + 2 Thighs + 2 Wings + 2 Chest pieces), served with buns, fries & garlic dips.',
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 30,
        featured: true
    },

    // =========================================================================
    // 🍕 PIZZA'Z (Regular Pizzas)
    // =========================================================================
    {
        id: 'fb_pz_tikka',
        name: 'Chicken Tikka Pizza',
        categoryId: 'cat_pizzas',
        price: 450,
        description: 'Lahore favorite: smoky chicken tikka chunks, sliced onions, green bell peppers & 100% pure mozzarella cheese.',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 60,
        featured: true,
        variations: [
            { name: 'Size', options: ['Small 7 inch (Rs. 450)', 'Medium 10 inch (Rs. 800)', 'Large 13 inch (Rs. 1200)', 'XL 17 inch (Rs. 1600)'] }
        ]
    },
    {
        id: 'fb_pz_fajita',
        name: 'Chicken Fajita Pizza',
        categoryId: 'cat_pizzas',
        price: 450,
        description: 'Marinated Mexican-spiced chicken fajita, crisp onions, green bell peppers, oregano & mozzarella.',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 60,
        variations: [
            { name: 'Size', options: ['Small 7 inch (Rs. 450)', 'Medium 10 inch (Rs. 800)', 'Large 13 inch (Rs. 1200)', 'XL 17 inch (Rs. 1600)'] }
        ]
    },
    {
        id: 'fb_pz_supreme',
        name: 'Chicken Supreme Pizza',
        categoryId: 'cat_pizzas',
        price: 450,
        description: 'Loaded with spiced chicken, smoked sausage, sliced mushrooms, capsicum, black olives & rich mozzarella.',
        imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 50,
        variations: [
            { name: 'Size', options: ['Small 7 inch (Rs. 450)', 'Medium 10 inch (Rs. 800)', 'Large 13 inch (Rs. 1200)', 'XL 17 inch (Rs. 1600)'] }
        ]
    },
    {
        id: 'fb_pz_cheese_lover',
        name: 'Cheese Lover Pizza',
        categoryId: 'cat_pizzas',
        price: 450,
        description: 'Double layer of 100% dairy mozzarella and cheddar cheese over rich Italian tomato herb sauce.',
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 60,
        variations: [
            { name: 'Size', options: ['Small 7 inch (Rs. 450)', 'Medium 10 inch (Rs. 800)', 'Large 13 inch (Rs. 1200)', 'XL 17 inch (Rs. 1600)'] }
        ]
    },
    {
        id: 'fb_pz_vegi_lover',
        name: 'Vegi Lover Pizza',
        categoryId: 'cat_pizzas',
        price: 450,
        description: 'Fresh bell peppers, red onions, mushrooms, sweet corn, juicy tomatoes & black olives on herb crust.',
        imageUrl: 'https://images.unsplash.com/photo-1576458088443-04a19bb13da6?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 50,
        variations: [
            { name: 'Size', options: ['Small 7 inch (Rs. 450)', 'Medium 10 inch (Rs. 800)', 'Large 13 inch (Rs. 1200)', 'XL 17 inch (Rs. 1600)'] }
        ]
    },
    {
        id: 'fb_pz_bbq',
        name: 'Bar-B-Q Pizza',
        categoryId: 'cat_pizzas',
        price: 450,
        description: 'Smoky barbecued chicken chunks with sweet tangy BBQ drizzle, caramelized red onions & mozzarella.',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 55,
        variations: [
            { name: 'Size', options: ['Small 7 inch (Rs. 450)', 'Medium 10 inch (Rs. 800)', 'Large 13 inch (Rs. 1200)', 'XL 17 inch (Rs. 1600)'] }
        ]
    },
    {
        id: 'fb_pz_mexican',
        name: 'Mexican Chilli Pizza',
        categoryId: 'cat_pizzas',
        price: 450,
        description: 'Spicy chicken, zesty Mexican salsa, jalapenos, chili flakes, crunchy capsicum and bubbly cheese.',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 50,
        variations: [
            { name: 'Size', options: ['Small 7 inch (Rs. 450)', 'Medium 10 inch (Rs. 800)', 'Large 13 inch (Rs. 1200)', 'XL 17 inch (Rs. 1600)'] }
        ]
    },
    {
        id: 'fb_pz_peri_peri',
        name: 'Peri Peri Pizza',
        categoryId: 'cat_pizzas',
        price: 450,
        description: 'Fiery peri-peri chicken chunks with spicy sauce swirl, onions, bell peppers & mozzarella cheese.',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 50,
        variations: [
            { name: 'Size', options: ['Small 7 inch (Rs. 450)', 'Medium 10 inch (Rs. 800)', 'Large 13 inch (Rs. 1200)', 'XL 17 inch (Rs. 1600)'] }
        ]
    },
    {
        id: 'fb_pz_malai_boti',
        name: 'Malai Boti Pizza',
        categoryId: 'cat_pizzas',
        price: 450,
        description: 'Mild, rich and creamy chicken malai boti pieces with white garlic sauce, onions and lots of mozzarella.',
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 60,
        variations: [
            { name: 'Size', options: ['Small 7 inch (Rs. 450)', 'Medium 10 inch (Rs. 800)', 'Large 13 inch (Rs. 1200)', 'XL 17 inch (Rs. 1600)'] }
        ]
    },
    {
        id: 'fb_pz_lasagnia',
        name: 'Lasagnia Pizza',
        categoryId: 'cat_pizzas',
        price: 850,
        description: 'Lasagna-style minced meat sauce layered between pizza crust, creamy bechamel & melted cheese.',
        imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 40,
        variations: [
            { name: 'Size', options: ['Medium 10 inch (Rs. 850)', 'Large 13 inch (Rs. 1300)', 'XL 17 inch (Rs. 1700)'] }
        ]
    },
    {
        id: 'fb_pz_bihari_kabab',
        name: 'Bihari Kabab Pizza',
        categoryId: 'cat_pizzas',
        price: 500,
        description: 'Tender bihari kabab chunks marinated in traditional aromatic spices, red onions & mozzarella.',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 50,
        variations: [
            { name: 'Size', options: ['Small 7 inch (Rs. 500)', 'Medium 10 inch (Rs. 850)', 'Large 13 inch (Rs. 1300)', 'XL 17 inch (Rs. 1700)'] }
        ]
    },
    {
        id: 'fb_pz_grill_smoke',
        name: 'Grill Smoke Pizza',
        categoryId: 'cat_pizzas',
        price: 500,
        description: 'Hickory-smoked grilled chicken, roasted bell peppers, red onions, smoky BBQ drizzle & melted cheese.',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 50,
        variations: [
            { name: 'Size', options: ['Small 7 inch (Rs. 500)', 'Medium 10 inch (Rs. 850)', 'Large 13 inch (Rs. 1300)', 'XL 17 inch (Rs. 1700)'] }
        ]
    },

    // =========================================================================
    // 👑 SPECIAL PIZZA
    // =========================================================================
    {
        id: 'fb_sp_fine_special',
        name: 'Fine Special Pizza',
        categoryId: 'cat_special_pizza',
        price: 1050,
        description: "Chef's ultimate crown creation: four meats blend, stuffed crust, black olives, mushrooms & overflowing cheese.",
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 40,
        featured: true,
        variations: [
            { name: 'Size', options: ['Medium 10 inch (Rs. 1050)', 'Large 13 inch (Rs. 1350)', 'XL 17 inch (Rs. 1800)'] }
        ]
    },
    {
        id: 'fb_sp_four_season',
        name: 'Four Season Pizza',
        categoryId: 'cat_special_pizza',
        price: 1050,
        description: 'Four distinct quadrants on one large artisan crust: Chicken Tikka, Fajita, Smoky BBQ, and Fresh Veggie.',
        imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 40,
        variations: [
            { name: 'Size', options: ['Medium 10 inch (Rs. 1050)', 'Large 13 inch (Rs. 1350)', 'XL 17 inch (Rs. 1800)'] }
        ]
    },
    {
        id: 'fb_sp_cheese_stuffer',
        name: 'Cheese Stuffer Pizza',
        categoryId: 'cat_special_pizza',
        price: 1050,
        description: 'Outer crust ring generously stuffed with gooey melted cheese, topped with premium grilled chicken & olives.',
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 40,
        variations: [
            { name: 'Size', options: ['Medium 10 inch (Rs. 1050)', 'Large 13 inch (Rs. 1350)', 'XL 17 inch (Rs. 1800)'] }
        ]
    },
    {
        id: 'fb_sp_kabab_stuffer',
        name: 'Kabab Stuffer Pizza',
        categoryId: 'cat_special_pizza',
        price: 1050,
        description: 'Crust stuffed with tender seekh kababs, covered in spicy chicken chunks, onions & 100% mozzarella cheese.',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 40,
        featured: true,
        variations: [
            { name: 'Size', options: ['Medium 10 inch (Rs. 1050)', 'Large 13 inch (Rs. 1350)', 'XL 17 inch (Rs. 1800)'] }
        ]
    },
    {
        id: 'fb_sp_crown_crust',
        name: 'Crown Crust Pizza',
        categoryId: 'cat_special_pizza',
        price: 1050,
        description: 'Artisan crown crust featuring regal folded pockets filled with cream cheese, surrounded by savory toppings.',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 40,
        featured: true,
        variations: [
            { name: 'Size', options: ['Medium 10 inch (Rs. 1050)', 'Large 13 inch (Rs. 1350)', 'XL 17 inch (Rs. 1800)'] }
        ]
    },

    // =========================================================================
    // 🎉 SPECIAL DEALS (Deals 1 - 9)
    // =========================================================================
    {
        id: 'fb_deal_1',
        name: 'Deal 1',
        categoryId: 'cat_deals',
        price: 590,
        description: '1 Zinger Burger + 1 PC Crispy Chicken + 1 345ml Soft Drink.',
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 100,
        featured: true
    },
    {
        id: 'fb_deal_2',
        name: 'Deal 2',
        categoryId: 'cat_deals',
        price: 1140,
        description: '2 Zinger Burgers + 2 PC Crispy Chicken + 2 345ml Soft Drinks.',
        imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 100,
        featured: true
    },
    {
        id: 'fb_deal_3',
        name: 'Deal 3',
        categoryId: 'cat_deals',
        price: 2600,
        description: '4 Zinger Burgers + 1 Large Pizza + 1.5 Ltr Cold Drink.',
        imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 80,
        featured: true
    },
    {
        id: 'fb_deal_4',
        name: 'Deal 4',
        categoryId: 'cat_deals',
        price: 990,
        description: '3 PC Crispy Chicken + 1 Large Fries + 1 500ml Cold Drink.',
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 80
    },
    {
        id: 'fb_deal_5',
        name: 'Deal 5',
        categoryId: 'cat_deals',
        price: 950,
        description: '2 Small Pizzas (Choice of Flavors) + 1 500ml Cold Drink.',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 80
    },
    {
        id: 'fb_deal_6',
        name: 'Deal 6',
        categoryId: 'cat_deals',
        price: 1700,
        description: '2 Medium Pizzas (Choice of Flavors) + 1.5 Ltr Cold Drink.',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 80,
        featured: true
    },
    {
        id: 'fb_deal_7',
        name: 'Deal 7',
        categoryId: 'cat_deals',
        price: 2500,
        description: '2 Large Pizzas (Choice of Flavors) + 1.5 Ltr Cold Drink.',
        imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 80,
        featured: true
    },
    {
        id: 'fb_deal_8',
        name: 'Deal 8',
        categoryId: 'cat_deals',
        price: 2200,
        description: '4 Zinger Burgers + 4 PC Crispy Chicken + 1.5 Ltr Cold Drink.',
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 70
    },
    {
        id: 'fb_deal_9',
        name: 'Deal 9',
        categoryId: 'cat_deals',
        price: 999,
        description: '1 Small Pizza + 1 Zinger / Chicken Burger + 1 Small Fries + 1 500ml Drink.',
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 100,
        featured: true
    },

    // =========================================================================
    // 🥤 BEVERAGES
    // =========================================================================
    {
        id: 'fb_drink_345',
        name: 'Soft Drink 345ml',
        categoryId: 'cat_beverages',
        price: 80,
        description: 'Chilled soft drink bottle (Pepsi, 7Up, Mirinda, Mountain Dew).',
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 200,
        variations: [
            { name: 'Flavor', options: ['Pepsi 345ml', '7Up 345ml', 'Mirinda 345ml', 'Mountain Dew 345ml'] }
        ]
    },
    {
        id: 'fb_drink_500',
        name: 'Soft Drink 500ml',
        categoryId: 'cat_beverages',
        price: 120,
        description: 'Chilled 500ml soft drink bottle (Pepsi, 7Up, Mirinda).',
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 150
    },
    {
        id: 'fb_drink_1500',
        name: 'Soft Drink 1.5 Liter',
        categoryId: 'cat_beverages',
        price: 220,
        description: 'Family size 1.5 liter chilled soft drink (Pepsi, 7Up, Mirinda).',
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 120
    },
    {
        id: 'fb_water_500',
        name: 'Mineral Water 500ml',
        categoryId: 'cat_beverages',
        price: 60,
        description: 'Pure purified chilled mineral water bottle 500ml.',
        imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 200
    },
    {
        id: 'fb_water_1500',
        name: 'Mineral Water 1.5 Liter',
        categoryId: 'cat_beverages',
        price: 110,
        description: 'Pure purified mineral water large family bottle 1.5 Liter.',
        imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 150
    }
];

// --- 3. HERO SLIDERS ---
export const OFFICIAL_SLIDERS = [
    {
        id: 'slider-1',
        title: 'Juicy, Sizzling & Unmatched Taste',
        subtitle: 'Since 1981 — Handcrafted gourmet burgers, crispy zingers & pure Lahore flavor',
        badge: '🔥 Signature Burgers',
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=1600&q=80',
        active: true,
        order: 1
    },
    {
        id: 'slider-2',
        title: 'Authentic Arabian Broast & Fried Chicken',
        subtitle: 'Crispy, golden, double-breaded chicken with garlic dip & crinkle fries',
        badge: '🍗 Crispy Broast',
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1600&q=80',
        active: true,
        order: 2
    },
    {
        id: 'slider-3',
        title: 'Loaded Stuffed Crust & Crown Pizzas',
        subtitle: 'Bihari kabab, malai boti & four-season pizzas with 100% pure mozzarella',
        badge: '🍕 Hot Stone Baked',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1600&q=80',
        active: true,
        order: 3
    }
];

// --- 4. SEED EXECUTION ---
async function seedDatabase() {
    console.log('🚀 Starting Complete Fine Burger Database Wipe & Seed...');

    // 1. Wipe old items
    console.log('🧹 Wiping existing items collection...');
    const itemsSnap = await getDocs(collection(db, 'items'));
    for (const d of itemsSnap.docs) {
        await deleteDoc(d.ref);
    }
    console.log(`✓ Deleted ${itemsSnap.size} old items.`);

    // 2. Wipe old categories
    console.log('🧹 Wiping existing categories collection...');
    const catSnap = await getDocs(collection(db, 'categories'));
    for (const d of catSnap.docs) {
        await deleteDoc(d.ref);
    }
    console.log(`✓ Deleted ${catSnap.size} old categories.`);

    // 3. Wipe old sliders
    console.log('🧹 Wiping existing sliders collection...');
    const sliderSnap = await getDocs(collection(db, 'sliders'));
    for (const d of sliderSnap.docs) {
        await deleteDoc(d.ref);
    }
    console.log(`✓ Deleted ${sliderSnap.size} old sliders.`);

    // 4. Seed official categories
    console.log(`📦 Seeding ${OFFICIAL_CATEGORIES.length} official categories...`);
    for (const cat of OFFICIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), {
            ...cat,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }
    console.log('✓ All categories seeded successfully.');

    // 5. Seed official menu items
    console.log(`🍔 Seeding ${OFFICIAL_MENU_ITEMS.length} official menu items...`);
    for (const item of OFFICIAL_MENU_ITEMS) {
        await setDoc(doc(db, 'items', item.id), {
            ...item,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }
    console.log('✓ All menu items seeded successfully.');

    // 6. Seed official sliders
    console.log(`🖼️ Seeding ${OFFICIAL_SLIDERS.length} hero sliders...`);
    for (const slider of OFFICIAL_SLIDERS) {
        await setDoc(doc(db, 'sliders', slider.id), {
            ...slider,
            createdAt: serverTimestamp()
        });
    }
    console.log('✓ All hero sliders seeded successfully.');

    // 7. Update store settings with official branches
    console.log('⚙️ Updating store contact & branches...');
    await setDoc(doc(db, 'settings', 'store_config'), {
        storeOpen: true,
        forceOpen: true,
        storeInfo: {
            name: 'Fine Burger & Fast Food (Since 1981)',
            phone: '0325-1842184 / 0322-4992132',
            email: 'info@fineburgerr.com',
            website: 'www.fineburgerr.com',
            branch1: 'Branch #1: 231 G.T Road, Baghbanpura Near Pakistani Bazar Lahore',
            branch2: 'Branch #2: Sehar Road, Opposite Islami Bhai, Baghbanpura Lahore',
            timing: '5:00pm to 3:00am'
        },
        operatingHours: {
            monday: { open: '17:00', close: '03:00' },
            tuesday: { open: '17:00', close: '03:00' },
            wednesday: { open: '17:00', close: '03:00' },
            thursday: { open: '17:00', close: '03:00' },
            friday: { open: '17:00', close: '03:00' },
            saturday: { open: '17:00', close: '03:00' },
            sunday: { open: '17:00', close: '03:00' }
        },
        updatedAt: serverTimestamp()
    });
    console.log('✓ Store settings updated.');

    console.log('\n🎉 SUCCESS! Fine Burger database is now 100% populated with the official menu.');
    process.exit(0);
}

seedDatabase().catch(err => {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
});
