import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import OrderManager from './pages/OrderManager';
import RiderManager from './pages/RiderManager';
import CategoryManager from './pages/CategoryManager';
import MenuItemManager from './pages/MenuItemManager';
import InventoryManager from './pages/InventoryManager';
import SliderManager from './pages/SliderManager';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import ExpenseManager from './pages/ExpenseManager';
import FinancialDashboard from './pages/FinancialDashboard';
import { onAuthChange, subscribeToOrders } from './services/firebase'; // Updated import
import './styles/admin.css';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const audioContextRef = React.useRef(null);
    const prevOrdersRef = React.useRef([]);
    // Tracks if a new order arrived while the tab was hidden
    const pendingSoundRef = React.useRef(false);

    // ── Audio Context helpers ─────────────────────────────────────────────────

    const getAudioContext = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContextRef.current;
    };

    // Unlock AudioContext on first user interaction (browser autoplay policy)
    useEffect(() => {
        const unlock = () => {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') ctx.resume();
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
        return () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
        };
    }, []);

    // ── Buzzer ────────────────────────────────────────────────────────────────

    const playBuzzer = async () => {
        try {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') await ctx.resume();

            // Triple urgent beep pattern
            [0, 0.28, 0.56].forEach((offset) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(520, ctx.currentTime + offset);
                gain.gain.setValueAtTime(0.4, ctx.currentTime + offset);
                gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + offset + 0.22);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + offset);
                osc.stop(ctx.currentTime + offset + 0.22);
            });
        } catch (e) {
            console.error('Audio playback failed', e);
        }
    };

    // ── Browser Notification ──────────────────────────────────────────────────

    const requestNotificationPermission = async () => {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    };

    const showOrderNotification = (count) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        const n = new Notification('🍔 New Order!', {
            body: count === 1
                ? 'A new order has been placed. Tap to view.'
                : `${count} new orders have been placed. Tap to view.`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'new-order',        // replaces previous notification instead of stacking
            renotify: true,          // vibrate/sound even if tag already shown
            requireInteraction: true // stays on screen until dismissed
        });
        // Clicking the notification focuses the admin tab
        n.onclick = () => {
            window.focus();
            n.close();
        };
    };

    // ── Visibility-change: play immediately when tab regains focus ────────────

    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible' && pendingSoundRef.current) {
                pendingSoundRef.current = false;
                playBuzzer();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, []);

    // ── Order subscription ────────────────────────────────────────────────────

    useEffect(() => {
        let unsubscribeOrders;
        const unsubscribeAuth = onAuthChange((currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (currentUser) {
                // Request notification permission as soon as user is logged in
                requestNotificationPermission();

                unsubscribeOrders = subscribeToOrders((newOrders) => {
                    if (prevOrdersRef.current.length > 0) {
                        const previousIds = new Set(prevOrdersRef.current.map(o => o.id));
                        const newPendingOrders = newOrders.filter(
                            o => !previousIds.has(o.id) && o.status === 'pending'
                        );

                        if (newPendingOrders.length > 0) {
                            if (document.visibilityState === 'visible') {
                                // Tab is active → play immediately
                                playBuzzer();
                            } else {
                                // Tab is in background → queue the sound + show notification
                                pendingSoundRef.current = true;
                                showOrderNotification(newPendingOrders.length);
                            }
                        }
                    }
                    prevOrdersRef.current = newOrders;
                });
            } else {
                if (unsubscribeOrders) unsubscribeOrders();
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeOrders) unsubscribeOrders();
        };
    }, []);

    const handleLoginSuccess = (loggedInUser) => {
        setUser(loggedInUser);
    };

    const handleLogout = () => {
        setUser(null);
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: 'var(--color-black)',
                color: 'var(--color-white)'
            }}>
                Loading...
            </div>
        );
    }

    if (!user) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <Router>
            <div className="admin-layout">
                <Sidebar onLogout={handleLogout} />
                <main className="admin-main">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/orders" element={<OrderManager />} />
                        <Route path="/riders" element={<RiderManager />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/categories" element={<CategoryManager />} />
                        <Route path="/menu-items" element={<MenuItemManager />} />
                        <Route path="/inventory" element={<InventoryManager />} />
                        <Route path="/expenses" element={<ExpenseManager />} />
                        <Route path="/financial-dashboard" element={<FinancialDashboard />} />
                        <Route path="/sliders" element={<SliderManager />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
