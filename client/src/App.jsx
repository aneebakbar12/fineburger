import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Cart from './components/Cart';
import Home from './pages/Home';
import Menu from './pages/Menu';
import About from './pages/About';
import Orders from './pages/Orders'; // Import Orders page
import {
    subscribeToMenuItems,
    subscribeToCategories,
    subscribeToStoreSettings,
    onAuthChange,
    logoutUser
} from './services/firebase';
import './styles/index.css';

function App() {
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [storeSettings, setStoreSettings] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [user, setUser] = useState(null); // Auth user state
    const [authLoading, setAuthLoading] = useState(true);

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
        setCartItems(prev => [...prev, item]);
    };

    const handleUpdateQuantity = (index, newQuantity) => {
        if (newQuantity < 1) {
            handleRemoveItem(index);
            return;
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

    const handleLogout = async () => {
        await logoutUser();
        // setUser(null); // Automated by onAuthChange
    };

    return (
        <Router>
            <div className="app">
                <Header
                    cartItemCount={cartItems.length}
                    onCartClick={toggleCart}
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
                                />
                            }
                        />
                        <Route path="/about" element={<About />} />
                        <Route path="/orders" element={<Orders user={user} />} />
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
                />
            </div>
        </Router>
    );
}

export default App;
