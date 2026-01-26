import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthModal from './AuthModal';
import '../styles/Header.css';

const Header = ({ cartItemCount, onCartClick, user, onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <>
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        {/* Logo */}
                        <Link to="/" className="logo">
                            <span className="logo-text">FINE</span>
                            <span className="logo-accent">BURGER</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
                            <Link to="/" className="nav-link">Home</Link>
                            <Link to="/menu" className="nav-link">Menu</Link>
                            <Link to="/about" className="nav-link">About Us</Link>
                        </nav>

                        {/* Right side actions */}
                        <div className="header-actions">
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
                                <div className="user-menu-container">
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
                                <button
                                    className="login-btn"
                                    onClick={() => setIsAuthModalOpen(true)}
                                >
                                    Login
                                </button>
                            )}

                            {/* Mobile menu toggle */}
                            <button
                                className="mobile-menu-toggle"
                                onClick={toggleMenu}
                                aria-label="Toggle menu"
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

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
        </>
    );
};

export default Header;
