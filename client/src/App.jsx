import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import './styles/index.css';

function App() {
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [storeSettings, setStoreSettings] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [user, setUser] = useState(null); // Auth user state
    const [authLoading, setAuthLoading] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Subscribe to real-time updates and auth
    useEffect(() => {
        const unsubscribeCategories = subscribeToCategories(setCategories);
        const unsubscribeItems = subscribeToMenuItems(setMenuItems);
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
        // Enforce inventory limit across multiple adds
        if (item.stockLevel !== undefined) {
            const existingQty = cartItems.filter(i => i.id === item.id).reduce((sum, i) => sum + i.quantity, 0);
            if (existingQty + item.quantity > item.stockLevel) {
                alert(`Cannot add more. You have ${existingQty} in cart and stock is ${item.stockLevel}.`);
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

            if (otherInstancesQty + newQuantity > item.stockLevel) {
                alert(`Cannot increase quantity. Stock limit is ${item.stockLevel}.`);
                return;
            }
        }

        setCartItems(prev => {
            const updated = [...prev];
            updated[index].quantity = newQuantity;
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
                <div className="app">
                    <StaffModeActivator />
                    <Header
                        cartItemCount={cartItems.length}
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
                                        categories={categories}
                                        menuItems={menuItems}
                                        storeSettings={storeSettings}
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
                                        categories={categories}
                                        menuItems={menuItems}
                                        storeSettings={storeSettings}
                                        onAddToCart={handleAddToCart}
                                        isSearchOpen={isSearchOpen}
                                        onSearchClose={() => setIsSearchOpen(false)}
                                    />
                                }
                            />
                            <Route path="/about" element={<About />} />
                            <Route path="/orders" element={<Orders user={user} />} />
                            <Route path="/track" element={<OrderTracking storeSettings={storeSettings} />} />
                            <Route path="/track/:orderId" element={<OrderTracking storeSettings={storeSettings} />} />
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
