import React, { useState, useEffect, useRef } from 'react';
import MenuItem from './MenuItem';
import '../styles/SearchModal.css';

const SearchModal = ({ isOpen, onClose, menuItems, onAddToCart, onItemClick }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [isOpen]);

    // Clear search when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Filter menu items based on search query
    const filteredItems = searchQuery
        ? menuItems.filter(item =>
            item.available && (
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
            )
        )
        : [];

    if (!isOpen) return null;

    return (
        <>
            <div className="search-backdrop" onClick={onClose}></div>
            <div className={`search-modal ${isOpen ? 'open' : ''}`}>
                <div className="search-modal-header">
                    <h2>🔍 Search Menu</h2>
                    <button className="search-close" onClick={onClose} aria-label="Close search">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="search-input-container">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="search-icon"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for burgers, fries, drinks..."
                        className="search-input"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="search-clear"
                            aria-label="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="search-results">
                    {!searchQuery ? (
                        <div className="search-empty">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <p>Start typing to search menu items...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="search-empty">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p>No items found for "{searchQuery}"</p>
                            <small>Try a different search term</small>
                        </div>
                    ) : (
                        <>
                            <div className="search-results-header">
                                Found {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                            </div>
                            <div className="search-results-grid">
                                {filteredItems.map(item => (
                                    <MenuItem
                                        key={item.id}
                                        item={item}
                                        onClick={onItemClick}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default SearchModal;
