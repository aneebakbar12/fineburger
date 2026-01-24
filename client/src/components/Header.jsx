import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';

const Header = ({ cartItemCount, onCartClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
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
                                <path d="M9 2L7.17 4H3a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-4.17L15 2H9z" />
                                <circle cx="12" cy="13" r="3" />
                            </svg>
                            {cartItemCount > 0 && (
                                <span className="cart-badge">{cartItemCount}</span>
                            )}
                        </button>

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
    );
};

export default Header;
