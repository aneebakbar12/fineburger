import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

    const effectiveCategories = useMemo(() => {
        if (!categories || categories.length === 0) {
            return DEMO_CATEGORIES;
        }

        const merged = [...DEMO_CATEGORIES];
        const addedNames = new Set(DEMO_CATEGORIES.map(c => c.name.toLowerCase().trim()));

        categories.forEach(liveCat => {
            const normName = (liveCat.name || '').toLowerCase().trim();
            if (!addedNames.has(normName) && normName !== '') {
                addedNames.add(normName);
                merged.push({
                    id: liveCat.id,
                    name: liveCat.name,
                    icon: liveCat.icon || '🍽️',
                    order: liveCat.order !== undefined ? liveCat.order + 10 : 99
                });
            }
        });

        return merged;
    }, [categories]);

    const effectiveMenuItems = useMemo(() => {
        if (!menuItems || menuItems.length === 0) {
            return DEMO_MENU_ITEMS;
        }

        const itemsMap = new Map();

        DEMO_MENU_ITEMS.forEach(item => {
            itemsMap.set(item.name.toLowerCase().trim(), { ...item });
        });

        menuItems.forEach(liveItem => {
            const key = (liveItem.name || '').toLowerCase().trim();
            if (itemsMap.has(key)) {
                itemsMap.set(key, { ...itemsMap.get(key), ...liveItem });
            } else {
                itemsMap.set(liveItem.id || key, { ...liveItem });
            }
        });

        return Array.from(itemsMap.values());
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

    const addToCart = (item, quantity = 1, selectedVariations = {}) => {
        setCartItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(
                cartItem =>
                    cartItem.id === item.id &&
                    JSON.stringify(cartItem.selectedVariations || {}) === JSON.stringify(selectedVariations || {})
            );

            if (existingItemIndex > -1) {
                const newItems = [...prevItems];
                newItems[existingItemIndex].quantity += quantity;
                return newItems;
            } else {
                return [...prevItems, { ...item, quantity, selectedVariations }];
            }
        });
        setIsCartOpen(true);
    };

    const updateQuantity = (index, delta) => {
        setCartItems(prevItems => {
            const newItems = [...prevItems];
            newItems[index].quantity += delta;
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
                                path="/track-order"
                                element={<OrderTracking />}
                            />
                            <Route
                                path="/track-order/:orderId"
                                element={<OrderTracking />}
                            />
                        </Routes>
                    </main>

                    <Footer storeSettings={effectiveSettings} />

                    <Cart
                        isOpen={isCartOpen}
                        onClose={() => setIsCartOpen(false)}
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
