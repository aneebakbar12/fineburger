import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import Footer from './components/Footer';
import Cart from './components/Cart';
import Home from './pages/Home';
import Menu from './pages/Menu';
import About from './pages/About';
import Orders from './pages/Orders';
import OrderTracking from './pages/OrderTracking';
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

    // Official Fine Burger Menu State
    // If Firestore is still buffering on initial load, uses the synchronized local copy.
    // As soon as Firestore data streams in, it seamlessly renders live updates without any layout jumps.
    const effectiveCategories = useMemo(() => {
        if (!categories || categories.length === 0) {
            return DEMO_CATEGORIES;
        }
        return [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [categories]);

    const effectiveMenuItems = useMemo(() => {
        if (!menuItems || menuItems.length === 0) {
            return DEMO_MENU_ITEMS;
        }
        return menuItems;
    }, [menuItems]);

    const effectiveSettings = storeSettings || DEFAULT_STORE_SETTINGS;

    useEffect(() => {
        const handleCategories = (data) => {
            setCategories(prev => {
                if (prev.length > 0 && data.length === 0) return prev;
                return data;
            });
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
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (e) {
                console.error('Error loading cart:', e);
            }
        }
    }, []);

    // Save cart to localStorage
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (item, maybeQuantity = 1, maybeVariations = {}) => {
        let qty = 1;
        let variations = {};
        let product = item;

        if (typeof maybeQuantity === 'number') {
            qty = maybeQuantity;
            variations = maybeVariations || {};
        } else if (item && typeof item.quantity === 'number') {
            qty = item.quantity;
            variations = item.selectedVariations || {};
        }

        setCartItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(
                cartItem =>
                    cartItem.id === product.id &&
                    JSON.stringify(cartItem.selectedVariations || {}) === JSON.stringify(variations || {})
            );

            if (existingItemIndex > -1) {
                const newItems = [...prevItems];
                newItems[existingItemIndex].quantity += qty;
                return newItems;
            } else {
                return [...prevItems, { ...product, quantity: qty, selectedVariations: variations }];
            }
        });
        setIsCartOpen(true);
    };

    const updateQuantity = (index, deltaOrQuantity) => {
        setCartItems(prevItems => {
            if (!prevItems[index]) return prevItems;
            const newItems = [...prevItems];
            if (deltaOrQuantity === 1 || deltaOrQuantity === -1) {
                newItems[index].quantity += deltaOrQuantity;
            } else if (typeof deltaOrQuantity === 'number') {
                newItems[index].quantity = deltaOrQuantity;
            }
            if (newItems[index].quantity <= 0) {
                newItems.splice(index, 1);
            }
            return newItems;
        });
    };

    const removeFromCart = (index) => {
        setCartItems(prevItems => prevItems.filter((_, i) => i !== index));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const handleLogout = async () => {
        await logoutUser();
        setUser(null);
    };

    return (
        <StaffModeProvider>
            <Router>
                <ScrollToTop />
                <StaffModeActivator />
                <div className="app">
                    <Header
                        cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                        onCartClick={() => setIsCartOpen(true)}
                        user={user}
                        onLogout={handleLogout}
                        onSearchClick={() => setIsSearchOpen(true)}
                    />

                    <main className="main-content">
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <Home
                                        categories={effectiveCategories}
                                        menuItems={effectiveMenuItems}
                                        storeSettings={effectiveSettings}
                                        onAddToCart={addToCart}
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
                                        onAddToCart={addToCart}
                                        isSearchOpen={isSearchOpen}
                                        onSearchClose={() => setIsSearchOpen(false)}
                                    />
                                }
                            />
                            <Route
                                path="/about"
                                element={<About storeSettings={effectiveSettings} />}
                            />
                            <Route
                                path="/orders"
                                element={<Orders user={user} />}
                            />
                            <Route
                                path="/track"
                                element={<Navigate to="/track-order" replace />}
                            />
                            <Route
                                path="/track/:orderId"
                                element={<OrderTracking storeSettings={effectiveSettings} />}
                            />
                            <Route
                                path="/track-order"
                                element={<OrderTracking storeSettings={effectiveSettings} />}
                            />
                            <Route
                                path="/track-order/:orderId"
                                element={<OrderTracking storeSettings={effectiveSettings} />}
                            />
                            <Route
                                path="*"
                                element={<Navigate to="/" replace />}
                            />
                        </Routes>
                    </main>

                    <Footer storeSettings={effectiveSettings} />

                    <Cart
                        isOpen={isCartOpen}
                        onClose={() => setIsCartOpen(false)}
                        cartItems={cartItems}
                        items={cartItems}
                        onUpdateQuantity={updateQuantity}
                        onRemoveItem={removeFromCart}
                        onClearCart={clearCart}
                        user={user}
                        storeSettings={effectiveSettings}
                    />
                </div>
            </Router>
        </StaffModeProvider>
    );
}

export default App;
