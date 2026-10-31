import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import Footer from './components/Footer';
import Cart from './components/Cart';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import Home from './pages/Home';
import Menu from './pages/Menu';
import About from './pages/About';
import Orders from './pages/Orders';
import OrderTracking from './pages/OrderTracking';
import {
    subscribeToMenuItems,
    subscribeToCategories,
    subscribeToStoreSettings,
    subscribeToDiscounts,
    subscribeToInventory,
    onAuthChange,
    logoutUser
} from './services/firebase';
import { StaffModeProvider } from './contexts/StaffModeContext';
import StaffModeActivator from './components/StaffModeActivator';
import { calculateItemDiscount, isDiscountInEffect } from './utils/discountUtils';
import './styles/index.css';

const DEFAULT_STORE_SETTINGS = {
    storeOpen: true,
    forceOpen: true,
    storeInfo: {
        name: 'Fine Burger & Fast Food',
        phone: '042-36840007',
        whatsapp: '0325-1842184',
        address: 'Main G.T. Road, Baghbanpura, Lahore, Punjab 54890, Pakistan',
        email: 'info@fineburger.com'
    }
};

function App() {
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [menuLoading, setMenuLoading] = useState(true);
    const [discounts, setDiscounts] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [storeSettings, setStoreSettings] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Official Fine Burger Menu State
    // Synchronized live from Firestore items and categories
    const effectiveCategories = useMemo(() => {
        return [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [categories]);

    const effectiveMenuItems = useMemo(() => {
        return menuItems;
    }, [menuItems]);

    // Compute menu items enriched with real-time active promotional discounts
    // AND automatically enforce "Sold Out" if any linked inventory ingredient is depleted (stockLevel <= 0)
    const enrichedMenuItems = useMemo(() => {
        const activeDiscounts = (discounts || []).filter(d => d.active !== false);
        return effectiveMenuItems.map(item => {
            const discountInfo = calculateItemDiscount(item, activeDiscounts);

            // Auto "Sold Out" check: if any linked recipe ingredient in inventory is <= 0
            const isIngredientDepleted = Array.isArray(item.ingredients) && item.ingredients.length > 0 && item.ingredients.some(ing => {
                const matchedInv = inventoryItems.find(i => i.id === ing.inventoryItemId);
                return matchedInv && (Number(matchedInv.stockLevel) <= 0);
            });

            const inStockEffective = item.inStock !== false && !isIngredientDepleted;

            return {
                ...item,
                ...discountInfo,
                inStock: inStockEffective,
                ingredientOutOfStock: isIngredientDepleted,
                price: discountInfo.hasDiscount ? discountInfo.discountedPrice : item.price,
                originalPrice: item.price
            };
        });
    }, [effectiveMenuItems, discounts, inventoryItems]);

    // Active global promotion (if any) to display sitewide banner
    const activeGlobalDiscount = useMemo(() => {
        return (discounts || []).find(d => d.type === 'global' && isDiscountInEffect(d));
    }, [discounts]);

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
            setMenuLoading(false);
        };

        const unsubscribeCategories = subscribeToCategories(handleCategories);
        const unsubscribeItems = subscribeToMenuItems(handleMenuItems);
        const unsubscribeSettings = subscribeToStoreSettings(setStoreSettings);
        const unsubscribeDiscounts = subscribeToDiscounts(setDiscounts);
        const unsubscribeInventory = subscribeToInventory(setInventoryItems);

        const unsubscribeAuth = onAuthChange((currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });

        return () => {
            unsubscribeCategories();
            unsubscribeItems();
            unsubscribeSettings();
            unsubscribeDiscounts();
            unsubscribeInventory();
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

    // Auto-synchronize cart item prices, stock levels, and names with live Firestore menu
    useEffect(() => {
        if (!enrichedMenuItems || enrichedMenuItems.length === 0) return;

        setCartItems(prevCart => {
            if (!prevCart || prevCart.length === 0) return prevCart;

            let hasChanges = false;
            const updatedCart = prevCart.map(cartItem => {
                const liveItem = enrichedMenuItems.find(m => m.id === cartItem.id);
                if (!liveItem) return cartItem;

                // Re-evaluate variation price delta
                let variationDelta = 0;
                if (cartItem.selectedVariations && typeof cartItem.selectedVariations === 'object') {
                    Object.values(cartItem.selectedVariations).forEach(val => {
                        if (typeof val === 'string') {
                            const match = val.match(/\(\s*\+\s*(?:Rs\.?|PKR)?\s*([0-9]+)\s*\)/i);
                            if (match && match[1]) {
                                variationDelta += Number(match[1]);
                            }
                        }
                    });
                }

                const liveBasePrice = Number(liveItem.hasDiscount ? liveItem.discountedPrice : liveItem.price) || 0;
                const liveOriginalBasePrice = Number(liveItem.originalPrice || liveItem.price) || 0;
                const liveUnitPrice = liveBasePrice + variationDelta;
                const liveOriginalUnitPrice = liveOriginalBasePrice + variationDelta;
                const liveInStock = liveItem.inStock !== false;

                if (
                    cartItem.price !== liveUnitPrice ||
                    cartItem.originalUnitPrice !== liveOriginalUnitPrice ||
                    cartItem.basePrice !== liveBasePrice ||
                    cartItem.originalPrice !== liveOriginalBasePrice ||
                    cartItem.inStock !== liveInStock ||
                    cartItem.name !== liveItem.name
                ) {
                    hasChanges = true;
                    return {
                        ...cartItem,
                        name: liveItem.name,
                        basePrice: liveBasePrice,
                        price: liveUnitPrice,
                        originalUnitPrice: liveOriginalUnitPrice,
                        originalPrice: liveOriginalBasePrice,
                        totalPrice: liveUnitPrice * cartItem.quantity,
                        inStock: liveInStock,
                        stockLevel: liveItem.stockLevel,
                        hasDiscount: Boolean(liveItem.hasDiscount),
                        discountAmountPerUnit: liveItem.hasDiscount ? Math.max(0, liveOriginalUnitPrice - liveUnitPrice) : 0,
                        badge: liveItem.badge
                    };
                }
                return cartItem;
            });

            return hasChanges ? updatedCart : prevCart;
        });
    }, [enrichedMenuItems]);

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
                newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    quantity: newItems[existingItemIndex].quantity + qty
                };
                return newItems;
            } else {
                return [...prevItems, { ...product, quantity: qty, selectedVariations: variations }];
            }
        });
        setIsCartOpen(true);
    };

    const updateQuantity = (index, deltaOrQuantity, isAbsolute = false) => {
        setCartItems(prevItems => {
            if (!prevItems[index]) return prevItems;
            const newItems = [...prevItems];
            const currentItem = newItems[index];
            let nextQty = currentItem.quantity;

            if (!isAbsolute && (deltaOrQuantity === 1 || deltaOrQuantity === -1)) {
                nextQty += deltaOrQuantity;
            } else if (typeof deltaOrQuantity === 'number') {
                nextQty = deltaOrQuantity;
            }

            if (nextQty <= 0) {
                newItems.splice(index, 1);
            } else {
                newItems[index] = { ...currentItem, quantity: nextQty };
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
                        cartItemCount={cartItems.reduce((sum, item) => sum + (Number(item?.quantity) || 1), 0)}
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
                                        menuItems={enrichedMenuItems}
                                        menuLoading={menuLoading}
                                        storeSettings={effectiveSettings}
                                        onAddToCart={addToCart}
                                        isSearchOpen={isSearchOpen}
                                        onSearchClose={() => setIsSearchOpen(false)}
                                        globalDiscount={activeGlobalDiscount}
                                    />
                                }
                            />
                            <Route
                                path="/menu"
                                element={
                                    <Menu
                                        categories={effectiveCategories}
                                        menuItems={enrichedMenuItems}
                                        menuLoading={menuLoading}
                                        storeSettings={effectiveSettings}
                                        onAddToCart={addToCart}
                                        isSearchOpen={isSearchOpen}
                                        onSearchClose={() => setIsSearchOpen(false)}
                                        globalDiscount={activeGlobalDiscount}
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
                        discounts={discounts}
                    />

                    <FloatingWhatsApp />
                </div>
            </Router>
        </StaffModeProvider>
    );
}

export default App;
