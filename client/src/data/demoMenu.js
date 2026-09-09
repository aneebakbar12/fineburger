// Fine Burger & Fast Food — Baghbanpura, Lahore Menu
// Authentic local fast food menu with current Lahore market prices (PKR 2026)

export const DEMO_CATEGORIES = [
    { id: 'cat_burgers', name: 'Burgers', icon: '🍔', order: 1 },
    { id: 'cat_rolls', name: 'Shawarma & Rolls', icon: '🌯', order: 2 },
    { id: 'cat_pizzas', name: 'Pizzas', icon: '🍕', order: 3 },
    { id: 'cat_fries', name: 'Fries & Sides', icon: '🍟', order: 4 },
    { id: 'cat_beverages', name: 'Beverages', icon: '🥤', order: 5 },
    { id: 'cat_deals', name: 'Special Deals', icon: '🎉', order: 6 },
];

export const DEMO_MENU_ITEMS = [
    // ==========================================
    // 🍔 BURGERS
    // ==========================================
    {
        id: 'fb_b1',
        name: 'Fine Special Zinger Burger',
        categoryId: 'cat_burgers',
        price: 420,
        description: 'Our signature crispy fried chicken fillet, double coated in secret spices, iceberg lettuce & garlic mayo in a toasted sesame bun.',
        imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 100,
        featured: true,
        variations: [
            { name: 'Cheese Slice', options: ['No Cheese', 'Add Cheddar Slice (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_b2',
        name: 'Special Egg Shami Burger',
        categoryId: 'cat_burgers',
        price: 200,
        description: 'Authentic Lahore street favorite! Spiced daal & chicken shami patty fried with fresh egg omelet, onions, ketchup & mint chutney in a soft bun.',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 80,
        featured: true,
        variations: [
            { name: 'Egg Style', options: ['Single Egg', 'Double Egg (+Rs. 40)'] }
        ]
    },
    {
        id: 'fb_b3',
        name: 'Double Zinger Mighty Burger',
        categoryId: 'cat_burgers',
        price: 620,
        description: 'Two massive crispy chicken zinger fillets stacked high with double cheese, jalapeños & house chipotle sauce.',
        imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 50,
        featured: true
    },
    {
        id: 'fb_b4',
        name: 'Classic Beef Burger',
        categoryId: 'cat_burgers',
        price: 420,
        description: 'Pure grilled beef patty, melted cheese, sliced pickles, fresh tomatoes, shredded lettuce & creamy burger sauce.',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 60
    },
    {
        id: 'fb_b5',
        name: 'Double Beef Cheese Burger',
        categoryId: 'cat_burgers',
        price: 620,
        description: 'Two juicy beef patties grilled to perfection with melted cheddar, sautéed onions & signature smoky burger sauce.',
        imageUrl: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 45,
        featured: true
    },
    {
        id: 'fb_b6',
        name: 'Smoky BBQ Grilled Burger',
        categoryId: 'cat_burgers',
        price: 480,
        description: 'Charcoal grilled chicken breast fillet glazed with hickory BBQ glaze, caramelized onions & cheese.',
        imageUrl: 'https://images.unsplash.com/photo-1619881590738-a111d176d906?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 40
    },
    {
        id: 'fb_b7',
        name: 'Chicken Patty Burger',
        categoryId: 'cat_burgers',
        price: 280,
        description: 'Seasoned minced chicken patty fried golden with lettuce, mayo & ketchup. A classic budget-friendly treat!',
        imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 70
    },

    // ==========================================
    // 🌯 SHAWARMA & ROLLS
    // ==========================================
    {
        id: 'fb_r1',
        name: 'Special Chicken Shawarma',
        categoryId: 'cat_rolls',
        price: 260,
        description: 'Marinated shredded chicken, garlic mayo sauce, pickled cucumbers & chili sauce wrapped in warm pita bread.',
        imageUrl: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 80,
        featured: true,
        variations: [
            { name: 'Cheese', options: ['Regular (No Cheese)', 'Cheese Shawarma (+Rs. 50)'] }
        ]
    },
    {
        id: 'fb_r2',
        name: 'Zinger Paratha Roll',
        categoryId: 'cat_rolls',
        price: 340,
        description: 'Crispy crunchy zinger strips wrapped in a crispy golden layered paratha with spicy garlic mayo & chopped salad.',
        imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 75,
        featured: true
    },
    {
        id: 'fb_r3',
        name: 'Chicken Tikka Paratha Roll',
        categoryId: 'cat_rolls',
        price: 320,
        description: 'Smoky barbecued chicken tikka pieces, sliced red onions & mint raita rolled into a hot buttered paratha.',
        imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 70
    },
    {
        id: 'fb_r4',
        name: 'Shawarma Platter (Open)',
        categoryId: 'cat_rolls',
        price: 450,
        description: 'Generous portion of spiced grilled chicken, 2 pita breads, french fries, pickled vegetables, garlic mayo & hot sauce.',
        imageUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 30
    },

    // ==========================================
    // 🍕 PIZZAS
    // ==========================================
    {
        id: 'fb_p1',
        name: 'Chicken Tikka Pizza',
        categoryId: 'cat_pizzas',
        price: 490,
        description: 'Local favorite: smoky chicken tikka chunks, sliced onions, green bell peppers, black olives & 100% mozzarella cheese.',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 40,
        featured: true,
        variations: [
            { name: 'Size', options: ['Small 7 inch', 'Medium 10 inch (+Rs. 400)', 'Large 13 inch (+Rs. 750)'] }
        ]
    },
    {
        id: 'fb_p2',
        name: 'Chicken Fajita Pizza',
        categoryId: 'cat_pizzas',
        price: 490,
        description: 'Mexican style spicy fajita chicken, crunchy capsicum, sweet corn, mushrooms and abundant gooey mozzarella.',
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 35,
        variations: [
            { name: 'Size', options: ['Small 7 inch', 'Medium 10 inch (+Rs. 400)', 'Large 13 inch (+Rs. 750)'] }
        ]
    },
    {
        id: 'fb_p3',
        name: 'Cheese Lover Margherita Pizza',
        categoryId: 'cat_pizzas',
        price: 440,
        description: 'Loaded with rich double mozzarella cheese blend over Italian herb tomato base with oregano sprinkle.',
        imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 30,
        variations: [
            { name: 'Size', options: ['Small 7 inch', 'Medium 10 inch (+Rs. 350)', 'Large 13 inch (+Rs. 650)'] }
        ]
    },

    // ==========================================
    // 🍟 FRIES & SIDES
    // ==========================================
    {
        id: 'fb_f1',
        name: 'Crispy French Fries (Masala / Plain)',
        categoryId: 'cat_fries',
        price: 180,
        description: 'Fresh cut, perfectly fried golden potatoes tossed in spicy chaat masala or classic sea salt. Served with dip.',
        imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 100,
        variations: [
            { name: 'Flavor', options: ['Lahori Chaat Masala', 'Plain Salted', 'Garlic Mayo'] },
            { name: 'Portion', options: ['Regular', 'Large (+Rs. 70)'] }
        ]
    },
    {
        id: 'fb_f2',
        name: 'Loaded Melted Cheese Fries',
        categoryId: 'cat_fries',
        price: 320,
        description: 'Generous box of crispy hot fries drenched in warm cheddar cheese sauce, pickled jalapeño slices & mayo garlic.',
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 60,
        featured: true
    },
    {
        id: 'fb_f3',
        name: 'Crispy Chicken Nuggets (6 Pcs)',
        categoryId: 'cat_fries',
        price: 280,
        description: 'Tender chicken breast nuggets fried crispy golden with chili garlic and tomato ketchup dips.',
        imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 70
    },
    {
        id: 'fb_f4',
        name: 'Crispy Hot Wings (6 Pcs)',
        categoryId: 'cat_fries',
        price: 340,
        description: 'Juicy chicken wings coated in a fiery crispy batter, deep-fried crunchy with spicy dip.',
        imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 50
    },

    // ==========================================
    // 🥤 BEVERAGES
    // ==========================================
    {
        id: 'fb_d1',
        name: 'Chilled Soft Drink (Regular)',
        categoryId: 'cat_beverages',
        price: 80,
        description: 'Refreshing chilled carbonated drink — choose your favorite flavor.',
        imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 200,
        variations: [
            { name: 'Flavor', options: ['Pepsi', '7Up', 'Mirinda', 'Mountain Dew', 'Diet 7Up'] }
        ]
    },
    {
        id: 'fb_d2',
        name: 'Soft Drink Bottle (500ml)',
        categoryId: 'cat_beverages',
        price: 120,
        description: 'Half-liter chilled bottle for on the go refreshment.',
        imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 150,
        variations: [
            { name: 'Flavor', options: ['Pepsi 500ml', '7Up 500ml', 'Dew 500ml'] }
        ]
    },
    {
        id: 'fb_d3',
        name: 'Oreo Thick Milkshake',
        categoryId: 'cat_beverages',
        price: 320,
        description: 'Handcrafted thick shake made with whole milk, vanilla dairy ice cream & blended Oreo cookies.',
        imageUrl: 'https://images.unsplash.com/photo-1570696516188-ade861b84a49?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 40,
        featured: true
    },
    {
        id: 'fb_d4',
        name: 'Fresh Mint Margarita / Lemonade',
        categoryId: 'cat_beverages',
        price: 160,
        description: 'Crushed ice, fresh mint sprigs, lemon juice, 7Up and black salt. The ultimate Lahore thirst quencher!',
        imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 60
    },

    // ==========================================
    // 🎉 SPECIAL DEALS
    // ==========================================
    {
        id: 'fb_dl1',
        name: 'Solo Deal 1 — Zinger + Fries + Drink',
        categoryId: 'cat_deals',
        price: 580,
        description: '1 Special Zinger Burger + Regular Masala Fries + 1 Chilled Drink. Total satisfaction at a bargain price!',
        imageUrl: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 999,
        featured: true,
        variations: [
            { name: 'Drink', options: ['Pepsi', '7Up', 'Mirinda'] }
        ]
    },
    {
        id: 'fb_dl2',
        name: 'Twin Zinger Combo — 2 Zingers + Fries + 2 Drinks',
        categoryId: 'cat_deals',
        price: 1050,
        description: '2 Crispy Zinger Burgers + 1 Large Masala Fries + 2 Chilled Soft Drinks. Best deal for couples & friends!',
        imageUrl: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 999,
        featured: true,
        variations: [
            { name: 'Drinks', options: ['2x Pepsi', '2x 7Up', '1 Pepsi + 1 7Up'] }
        ]
    },
    {
        id: 'fb_dl3',
        name: 'Pizza & Burger Feast Deal',
        categoryId: 'cat_deals',
        price: 1350,
        description: '1 Medium Tikka or Fajita Pizza + 1 Special Zinger Burger + 1 Liter Cold Drink Bottle.',
        imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 999,
        featured: true,
        variations: [
            { name: 'Pizza Flavor', options: ['Chicken Tikka', 'Chicken Fajita'] }
        ]
    },
    {
        id: 'fb_dl4',
        name: 'Family Mega Box — 4 Zingers + 2 Fries + 1.5L Drink',
        categoryId: 'cat_deals',
        price: 1990,
        description: '4 Signature Zinger Burgers + 2 Large Fries Baskets + 1.5 Liter Chilled Bottle + Dipping Sauces.',
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80',
        available: true,
        inStock: true,
        stockLevel: 999,
        featured: true
    }
];
