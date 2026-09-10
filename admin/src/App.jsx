import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
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
import { onAuthChange, subscribeToOrders } from './services/firebase';
import { ToastProvider } from './context/ToastContext';
import './styles/admin.css';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [isAudioMuted, setIsAudioMuted] = useState(() => {
        return localStorage.getItem('fineburger_audio_muted') === 'true';
    });

    const audioContextRef = useRef(null);
    const prevOrdersRef = useRef([]);
    const pendingSoundRef = useRef(false);
    const isAudioMutedRef = useRef(isAudioMuted);

    useEffect(() => {
        isAudioMutedRef.current = isAudioMuted;
        localStorage.setItem('fineburger_audio_muted', isAudioMuted.toString());
    }, [isAudioMuted]);

    const toggleAudioMute = () => {
        setIsAudioMuted((prev) => !prev);
    };

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

    // ── Buzzer & Kitchen Bell ──────────────────────────────────────────────────
    const playBuzzer = async () => {
        if (isAudioMutedRef.current) return;
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

    const playKitchenBell = async () => {
        if (isAudioMutedRef.current) return;
        try {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') await ctx.resume();

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            // Two-tone kitchen bell for preparing orders
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 2.0);
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 2.0);
        } catch (e) {
            console.error('Kitchen bell audio failed', e);
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
            tag: 'new-order',
            renotify: true,
            requireInteraction: true
        });
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
                requestNotificationPermission();

                unsubscribeOrders = subscribeToOrders((newOrders) => {
                    // Update pending count for badge
                    const pendingOrders = newOrders.filter(o => o.status === 'pending');
                    setPendingCount(pendingOrders.length);

                    if (prevOrdersRef.current.length > 0) {
                        const previousIds = new Set(prevOrdersRef.current.map(o => o.id));
                        const newPendingOrders = newOrders.filter(
                            o => !previousIds.has(o.id) && o.status === 'pending'
                        );
                        const newPreparingDineIn = newOrders.filter(
                            o => !previousIds.has(o.id) && o.status === 'preparing' && o.placedByStaff
                        );

                        if (newPendingOrders.length > 0) {
                            if (document.visibilityState === 'visible') {
                                playBuzzer();
                            } else {
                                pendingSoundRef.current = true;
                                showOrderNotification(newPendingOrders.length);
                            }
                        } else if (newPreparingDineIn.length > 0) {
                            if (document.visibilityState === 'visible') {
                                playKitchenBell();
                            } else {
                                showOrderNotification(newPreparingDineIn.length);
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
                backgroundColor: 'var(--surface-canvas)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                        <span style={{ color: 'white' }}>FINE</span>
                        <span style={{ color: 'var(--color-accent)' }}>BURGER</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading admin console...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <ToastProvider>
            <Router>
                <ScrollToTop />
                <div className="admin-layout">
                    <Sidebar
                        onLogout={handleLogout}
                        pendingCount={pendingCount}
                        isAudioMuted={isAudioMuted}
                        onToggleAudio={toggleAudioMute}
                    />
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
        </ToastProvider>
    );
}

export default App;
