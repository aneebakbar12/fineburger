import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import Footer from './components/Footer';
import Cart from './components/Cart';
import Home from './pages/Home';
import Menu from './pages/Menu';
import About from './pages/About';
import Orders from './pages/Orders'; // Import Orders page
import OrderTracking from './pages/OrderTracking'; // Live order tracking
import {
    subscribeToMenuItems,
    subscribeToCategories,
    subscribeToStoreSettings,
    onAuthChange,
    logoutUser
} from './services/firebase';
import { StaffModeProvider } from './contexts/StaffModeContext';
import StaffModeActivator from './components/StaffModeActivator';
import { DEMO_CATEGORIES, DEMO_MENU_ITEMS } from './data/demoMenu';
import './styles/index.css';

const DEFAULT_STORE_SETTINGS = {
    storeOpen: true,
    forceOpen: true,
    storeInfo: {
        name: 'Fine Burger & Fast Food',
        phone: '+92 321 4854410',
        address: 'Main G.T. Road, Baghbanpura, Lahore, Punjab 54890, Pakistan',
        email: 'info@fineburger.com'
    }
};

function App() {
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [storeSettings, setStoreSettings] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [firestoreLoaded, setFirestoreLoaded] = useState(false);

    // Once Firestore data has arrived, never fall back to demo data again.
    // If Firestore sends a transient empty snapshot, keep the last known real data.
    const effectiveCategories = firestoreLoaded
        ? (categories.length > 0 ? categories : DEMO_CATEGORIES)
        : DEMO_CATEGORIES;
    const effectiveMenuItems = firestoreLoaded
        ? (menuItems.length > 0 ? menuItems : DEMO_MENU_ITEMS)
        : DEMO_MENU_ITEMS;
    const effectiveSettings = storeSettings || DEFAULT_STORE_SETTINGS;

    useEffect(() => {
        let firstCategoryLoad = true;

        const handleCategories = (data) => {
            // Ignore empty snapshots once we have real data (prevents revert on transient errors)
            setCategories(prev => {
                if (prev.length > 0 && data.length === 0) return prev;
                return data;
            });
            if (firstCategoryLoad) {
                firstCategoryLoad = false;
                setFirestoreLoaded(true);
            }
        };

        const handleMenuItems = (data) => {
            setMenuItems(prev => {
                if (prev.length > 0 && data.length === 0) return prev;
                return data;
            });
        };

        const unsubscribeCategories = subscribeToCategories(handleCategories);
        const unsubscribeItems = subscribeToMenuItems(handleMenuItems);
        const unsubscribeSettings = subscribeToStoreSettings(setStoreSettings);

        const unsubscribeAuth = onAuthChange((currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });

        return () => {
            unsubscribeCategories();
            unsubscribeItems();
            unsubscribeSettings();
            unsubscribeAuth();
        };
    }, []);

    // Load cart from localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        }
    }, []);

    // Save cart to localStorage
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const handleAddToCart = (item) => {
        // Enforce inventory limit across multiple adds without exposing stock numbers
        if (item.stockLevel !== undefined) {
            const existingQty = cartItems.filter(i => i.id === item.id).reduce((sum, i) => sum + i.quantity, 0);
            if (item.stockLevel <= 0) {
                alert(`"${item.name}" is currently sold out.`);
                return;
            }
            if (existingQty + item.quantity > item.stockLevel || existingQty + item.quantity > 20) {
                alert(`You have reached the maximum quantity limit for "${item.name}".`);
                return;
            }
        }
        setCartItems(prev => [...prev, item]);
    };

    const handleUpdateQuantity = (index, newQuantity) => {
        if (newQuantity < 1) {
            handleRemoveItem(index);
            return;
        }

        const item = cartItems[index];
        if (item.stockLevel !== undefined) {
            const otherInstancesQty = cartItems
                .filter((itm, idx) => itm.id === item.id && idx !== index)
                .reduce((sum, i) => sum + i.quantity, 0);

            if (otherInstancesQty + newQuantity > item.stockLevel || otherInstancesQty + newQuantity > 20) {
                alert(`You have reached the maximum quantity limit for this item.`);
                return;
            }
        }

        setCartItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], quantity: newQuantity };
            return updated;
        });
    };

    const handleRemoveItem = (index) => {
        setCartItems(prev => prev.filter((_, i) => i !== index));
    };

    const toggleCart = () => {
        setIsCartOpen(!isCartOpen);
    };

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
    };

    const handleLogout = async () => {
        await logoutUser();
        // setUser(null); // Automated by onAuthChange
    };

    return (
        <StaffModeProvider>
            <Router>
                <ScrollToTop />
                <div className="app">
                    <StaffModeActivator />
                    <Header
                        cartItemCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
                        onCartClick={toggleCart}
                        onSearchClick={toggleSearch}
                        user={user}
                        onLogout={handleLogout}
                    />

                    <main>
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <Home
                                        categories={effectiveCategories}
                                        menuItems={effectiveMenuItems}
                                        storeSettings={effectiveSettings}
                                        onAddToCart={handleAddToCart}
                                        isSearchOpen={isSearchOpen}
                                        onSearchClose={() => setIsSearchOpen(false)}
                                    />
                                }
                            />
                            <Route
                                path="/menu"
                                element={
                                    <Menu
                                        categories={effectiveCategories}
                                        menuItems={effectiveMenuItems}
                                        storeSettings={effectiveSettings}
                                        onAddToCart={handleAddToCart}
                                        isSearchOpen={isSearchOpen}
                                        onSearchClose={() => setIsSearchOpen(false)}
                                    />
                                }
                            />
                            <Route path="/about" element={<About />} />
                            <Route path="/orders" element={<Orders user={user} />} />
                            <Route path="/track" element={<OrderTracking storeSettings={effectiveSettings} />} />
                            <Route path="/track/:orderId" element={<OrderTracking storeSettings={effectiveSettings} />} />
                        </Routes>
                    </main>

                    <Footer />

                    <Cart
                        isOpen={isCartOpen}
                        onClose={toggleCart}
                        cartItems={cartItems}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveItem={handleRemoveItem}
                        user={user} // Pass user to Cart
                        onClearCart={() => setCartItems([])} // New prop
                    />
                </div>
            </Router>
        </StaffModeProvider>
    );
}

export default App;
