import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AuthModal from './AuthModal';
import { useStaffMode } from '../contexts/StaffModeContext';
import '../styles/Header.css';

const Header = ({ cartItemCount, onCartClick, user, onLogout, onSearchClick }) => {
    const { isStaffMode } = useStaffMode();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const logoTapsRef = useRef(0);
    const lastTapTimeRef = useRef(0);

    const handleLogoClick = (e) => {
        const now = Date.now();
        if (now - lastTapTimeRef.current < 600) {
            logoTapsRef.current += 1;
        } else {
            logoTapsRef.current = 1;
        }
        lastTapTimeRef.current = now;

        if (logoTapsRef.current >= 5) {
            e.preventDefault();
            logoTapsRef.current = 0;
            window.dispatchEvent(new CustomEvent('openStaffPinModal'));
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeNav = () => setIsMenuOpen(false);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

    // Handle window resize from mobile to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768 && isMenuOpen) {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMenuOpen]);

    // Handle Escape key to close navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsMenuOpen(false);
                setIsUserMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setIsUserMenuOpen(false);
            }
        };
        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
        }
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isUserMenuOpen]);

    return (
        <>
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        {/* Logo */}
                        <Link to="/" className="logo" onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                            <img src="/logo.webp" alt="Fine Burger & Fast Food" className="header-logo-img" style={{ height: '60px', width: 'auto', borderRadius: '8px' }} />
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="desktop-nav" aria-label="Main Navigation">
                            {!isStaffMode && <Link to="/" className="nav-link">Home</Link>}
                            <Link to="/menu" className="nav-link">Menu</Link>
                            {!isStaffMode && <Link to="/track-order" className="nav-link">Track Order</Link>}
                            {!isStaffMode && <Link to="/about" className="nav-link">About Us</Link>}
                        </nav>

                        {/* Right side actions */}
                        <div className="header-actions">
                            {/* Search Button */}
                            <button
                                className="cart-button"
                                onClick={onSearchClick}
                                aria-label="Search menu"
                                style={{ marginRight: '8px' }}
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                            </button>

                            {/* Cart Button */}
                            <button
                                className="cart-button"
                                onClick={onCartClick}
                                aria-label="Shopping cart"
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                                {cartItemCount > 0 && (
                                    <span className="cart-badge">{cartItemCount}</span>
                                )}
                            </button>

                            {user ? (
                                <div className="user-menu-container" ref={userMenuRef}>
                                    <button
                                        className="user-btn"
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <span className="user-name">{user.displayName ? user.displayName.split(' ')[0] : 'User'}</span>
                                    </button>

                                    {isUserMenuOpen && (
                                        <div className="user-dropdown">
                                            <Link to="/orders" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>My Orders</Link>
                                            <button
                                                className="dropdown-item logout-btn"
                                                onClick={() => {
                                                    onLogout();
                                                    setIsUserMenuOpen(false);
                                                }}
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                isStaffMode ? (
                                    <button
                                        className="login-btn"
                                        onClick={() => {
                                            if (window.confirm('Exit Staff Mode?')) {
                                                // Access deactivateStaffMode from context
                                                const event = new CustomEvent('exitStaffMode');
                                                window.dispatchEvent(event);
                                            }
                                        }}
                                        style={{
                                            background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                                            color: '#000',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        🔒 Exit Staff Mode
                                    </button>
                                ) : (
                                    <button
                                        className="login-btn"
                                        onClick={() => setIsAuthModalOpen(true)}
                                    >
                                        Login
                                    </button>
                                )
                            )}

                            {/* Mobile menu toggle */}
                            <button
                                type="button"
                                className="mobile-menu-toggle"
                                onClick={toggleMenu}
                                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                                aria-expanded={isMenuOpen}
                            >
                                <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer rendered outside backdrop-filtered header */}
            <aside
                className={`mobile-nav-drawer ${isMenuOpen ? 'open' : ''}`}
                aria-label="Mobile Navigation"
                aria-hidden={!isMenuOpen}
            >
                <div className="mobile-nav-header">
                    <div className="mobile-nav-brand">
                        <img src="/logo.webp" alt="Fine Burger" style={{ height: '46px', width: 'auto', borderRadius: '6px' }} />
                        <span>Fine Burger</span>
                    </div>
                    <button
                        type="button"
                        className="mobile-nav-close"
                        onClick={closeNav}
                        aria-label="Close navigation menu"
                    >
                        ✕
                    </button>
                </div>

                <div className="nav-links-list">
                    {!isStaffMode && (
                        <Link to="/" className="nav-link" onClick={closeNav}>
                            <span className="nav-link-icon">🏠</span>
                            <span>Home</span>
                        </Link>
                    )}
                    <Link to="/menu" className="nav-link" onClick={closeNav}>
                        <span className="nav-link-icon">🍔</span>
                        <span>Menu</span>
                    </Link>
                    {!isStaffMode && (
                        <Link to="/track-order" className="nav-link" onClick={closeNav}>
                            <span className="nav-link-icon">🛵</span>
                            <span>Track Order</span>
                        </Link>
                    )}
                    {!isStaffMode && (
                        <Link to="/about" className="nav-link" onClick={closeNav}>
                            <span className="nav-link-icon">ℹ️</span>
                            <span>About Us</span>
                        </Link>
                    )}
                </div>

                {/* Mobile Drawer Account & Quick Actions */}
                <div className="mobile-nav-footer">
                    {user ? (
                        <>
                            <Link to="/orders" className="mobile-nav-user-item" onClick={closeNav}>
                                <span>📦</span>
                                <span>My Orders ({user.displayName ? user.displayName.split(' ')[0] : 'Profile'})</span>
                            </Link>
                            <button
                                type="button"
                                className="mobile-nav-logout-btn"
                                onClick={() => {
                                    onLogout();
                                    closeNav();
                                }}
                            >
                                <span>🚪</span>
                                <span>Logout</span>
                            </button>
                        </>
                    ) : isStaffMode ? (
                        <button
                            type="button"
                            className="mobile-nav-staff-btn"
                            onClick={() => {
                                if (window.confirm('Exit Staff Mode?')) {
                                    const event = new CustomEvent('exitStaffMode');
                                    window.dispatchEvent(event);
                                    closeNav();
                                }
                            }}
                        >
                            <span>🔒</span>
                            <span>Exit Staff Mode</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="mobile-nav-login-btn"
                            onClick={() => {
                                closeNav();
                                setIsAuthModalOpen(true);
                            }}
                        >
                            <span>👤</span>
                            <span>Login / Register</span>
                        </button>
                    )}

                    <div className="mobile-nav-contact">
                        <span>Tel: </span>
                        <a href="tel:04236840007" className="mobile-nav-phone">042-36840007</a>
                        <span style={{ margin: '0 6px', opacity: 0.5 }}>•</span>
                        <span>WA: </span>
                        <a href="https://wa.me/923251842184" target="_blank" rel="noopener noreferrer" className="mobile-nav-phone" style={{ color: '#25D366' }}>0325-1842184</a>
                    </div>
                </div>
            </aside>

            {/* Mobile Nav Backdrop */}
            {isMenuOpen && (
                <div
                    className="nav-backdrop"
                    onClick={closeNav}
                    aria-hidden="true"
                />
            )}

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
        </>
    );
};

export default Header;
