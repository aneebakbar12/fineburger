/**
 * Fine Burger Demo Menu Seed Script
 * Run: node scripts/seed-menu.js
 *
 * Seeds realistic menu items with current Pakistani market prices (PKR 2026)
 * matching Fine Burger & Fast Food, Baghbanpura, Lahore.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../functions/service-account.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const CATEGORIES = [
    { id: 'cat_burgers', name: 'Burgers', order: 1 },
    { id: 'cat_rolls', name: 'Shawarma & Rolls', order: 2 },
    { id: 'cat_pizzas', name: 'Pizzas', order: 3 },
    { id: 'cat_fries', name: 'Fries & Sides', order: 4 },
    { id: 'cat_beverages', name: 'Beverages', order: 5 },
    { id: 'cat_deals', name: 'Special Deals', order: 6 },
];

const MENU_ITEMS = [
    // Burgers
    {
        name: 'Fine Special Zinger Burger', categoryId: 'cat_burgers', price: 420, available: true, inStock: true, stockLevel: 100, featured: true,
        description: 'Crispy fried chicken fillet, double coated in secret spices, iceberg lettuce & garlic mayo in a toasted sesame bun.',
        imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80',
        variations: [{ name: 'Cheese Slice', options: ['No Cheese', 'Add Cheddar Slice (+Rs. 50)'] }]
    },
    {
        name: 'Special Egg Shami Burger', categoryId: 'cat_burgers', price: 200, available: true, inStock: true, stockLevel: 80, featured: true,
        description: 'Authentic Lahore street favorite! Spiced daal & chicken shami patty fried with egg omelet, onions, ketchup & mint chutney.',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
        variations: [{ name: 'Egg Style', options: ['Single Egg', 'Double Egg (+Rs. 40)'] }]
    },
    {
        name: 'Double Zinger Mighty Burger', categoryId: 'cat_burgers', price: 620, available: true, inStock: true, stockLevel: 50, featured: true,
        description: 'Two massive crispy chicken zinger fillets stacked with double cheese, jalapeños & house chipotle sauce.',
        imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80'
    },
    {
        name: 'Classic Beef Burger', categoryId: 'cat_burgers', price: 420, available: true, inStock: true, stockLevel: 60,
        description: 'Pure grilled beef patty, melted cheese, sliced pickles, fresh tomatoes, shredded lettuce & creamy burger sauce.',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80'
    },
    {
        name: 'Double Beef Cheese Burger', categoryId: 'cat_burgers', price: 620, available: true, inStock: true, stockLevel: 45, featured: true,
        description: 'Two juicy beef patties grilled with melted cheddar, sautéed onions & signature smoky burger sauce.',
        imageUrl: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=600&q=80'
    },

    // Rolls & Shawarma
    {
        name: 'Special Chicken Shawarma', categoryId: 'cat_rolls', price: 260, available: true, inStock: true, stockLevel: 80, featured: true,
        description: 'Marinated shredded chicken, garlic mayo sauce, pickled cucumbers & chili sauce wrapped in warm pita bread.',
        imageUrl: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&q=80',
        variations: [{ name: 'Cheese', options: ['Regular (No Cheese)', 'Cheese Shawarma (+Rs. 50)'] }]
    },
    {
        name: 'Zinger Paratha Roll', categoryId: 'cat_rolls', price: 340, available: true, inStock: true, stockLevel: 75, featured: true,
        description: 'Crispy crunchy zinger strips wrapped in a crispy golden layered paratha with spicy garlic mayo & chopped salad.',
        imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80'
    },

    // Pizzas
    {
        name: 'Chicken Tikka Pizza', categoryId: 'cat_pizzas', price: 490, available: true, inStock: true, stockLevel: 40, featured: true,
        description: 'Smoky chicken tikka chunks, sliced onions, bell peppers, black olives & 100% mozzarella cheese.',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
        variations: [{ name: 'Size', options: ['Small 7 inch', 'Medium 10 inch (+Rs. 400)', 'Large 13 inch (+Rs. 750)'] }]
    },
    {
        name: 'Chicken Fajita Pizza', categoryId: 'cat_pizzas', price: 490, available: true, inStock: true, stockLevel: 35,
        description: 'Spicy fajita chicken, crunchy capsicum, sweet corn, mushrooms and abundant gooey mozzarella.',
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
        variations: [{ name: 'Size', options: ['Small 7 inch', 'Medium 10 inch (+Rs. 400)', 'Large 13 inch (+Rs. 750)'] }]
    },

    // Fries & Sides
    {
        name: 'Crispy French Fries (Masala / Plain)', categoryId: 'cat_fries', price: 180, available: true, inStock: true, stockLevel: 100,
        description: 'Fresh cut golden potatoes tossed in spicy chaat masala or sea salt. Served with dip.',
        imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&q=80',
        variations: [{ name: 'Flavor', options: ['Lahori Chaat Masala', 'Plain Salted', 'Garlic Mayo'] }]
    },
    {
        name: 'Loaded Melted Cheese Fries', categoryId: 'cat_fries', price: 320, available: true, inStock: true, stockLevel: 60, featured: true,
        description: 'Hot fries drenched in warm cheddar cheese sauce, pickled jalapeños & mayo garlic.',
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80'
    },

    // Drinks
    {
        name: 'Chilled Soft Drink', categoryId: 'cat_beverages', price: 80, available: true, inStock: true, stockLevel: 200,
        description: 'Chilled carbonated soft drink in your favorite flavor.',
        imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&q=80',
        variations: [{ name: 'Flavor', options: ['Pepsi', '7Up', 'Mirinda', 'Mountain Dew'] }]
    },
    {
        name: 'Oreo Thick Milkshake', categoryId: 'cat_beverages', price: 320, available: true, inStock: true, stockLevel: 40, featured: true,
        description: 'Thick shake made with vanilla ice cream, whole milk & crushed Oreo cookies.',
        imageUrl: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=600&q=80'
    },

    // Deals
    {
        name: 'Solo Deal 1 — Zinger + Fries + Drink', categoryId: 'cat_deals', price: 580, available: true, inStock: true, stockLevel: 999, featured: true,
        description: '1 Special Zinger Burger + Regular Masala Fries + 1 Chilled Drink. Total meal combo!',
        imageUrl: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80'
    },
    {
        name: 'Twin Zinger Combo — 2 Zingers + Fries + 2 Drinks', categoryId: 'cat_deals', price: 1050, available: true, inStock: true, stockLevel: 999, featured: true,
        description: '2 Crispy Zinger Burgers + 1 Large Masala Fries + 2 Chilled Soft Drinks.',
        imageUrl: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=600&q=80'
    },
    {
        name: 'Family Mega Box — 4 Zingers + 2 Fries + 1.5L Drink', categoryId: 'cat_deals', price: 1990, available: true, inStock: true, stockLevel: 999, featured: true,
        description: '4 Signature Zinger Burgers + 2 Large Fries Baskets + 1.5 Liter Chilled Bottle + Sauces.',
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80'
    }
];

async function seed() {
    console.log('🌱 Seeding categories...');
    for (const cat of CATEGORIES) {
        await db.collection('categories').doc(cat.id).set({ name: cat.name, order: cat.order });
        console.log(`  ✓ ${cat.name}`);
    }

    console.log('\n🌱 Seeding menu items...');
    const batch = db.batch();
    for (const item of MENU_ITEMS) {
        const ref = db.collection('items').doc();
        batch.set(ref, { ...item, createdAt: new Date(), updatedAt: new Date() });
        console.log(`  ✓ ${item.name} — Rs. ${item.price}`);
    }
    await batch.commit();

    console.log('\n✅ Seed complete! Categories and menu items saved to Firestore.');
    process.exit(0);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
