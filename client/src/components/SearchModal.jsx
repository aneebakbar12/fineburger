import React, { useState, useEffect, useRef } from 'react';
import '../styles/SearchModal.css';

const SearchModal = ({ isOpen, onClose, menuItems, onAddToCart, onItemClick }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [addedIds, setAddedIds] = useState({});
    const inputRef = useRef(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 120);
        }
    }, [isOpen]);

    // Clear search when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setAddedIds({});
        }
    }, [isOpen]);

    // Filter menu items based on search query and availability
    const filteredItems = searchQuery
        ? menuItems.filter(item =>
            item.available &&
            item.inStock !== false &&
            (item.stockLevel === undefined || item.stockLevel > 0) &&
            (
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
            )
        )
        : [];

    const handleItemClick = (item) => {
        // Always close search drawer first so item modal is visible
        onClose();
        if (onItemClick) {
            onItemClick(item);
        }
    };

    const handleDirectAddToCart = (e, item) => {
        e.stopPropagation(); // Don't trigger card click
        if (item.variations && item.variations.length > 0) {
            // Needs customization -> close search and open customization modal
            onClose();
            if (onItemClick) onItemClick(item);
        } else {
            // Direct add to cart
            if (onAddToCart) {
                onAddToCart({
                    ...item,
                    quantity: 1,
                    selectedVariations: {},
                    totalPrice: item.price
                });
            }
            // Flash "Added!" indicator
            setAddedIds(prev => ({ ...prev, [item.id]: true }));
            setTimeout(() => {
                setAddedIds(prev => ({ ...prev, [item.id]: false }));
            }, 1500);
        }
    };

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
                        placeholder="Search for burgers, wraps, fries, drinks..."
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
                            <span style={{ fontSize: '48px', marginBottom: '12px' }}>🍔</span>
                            <p>What are you craving today?</p>
                            <small>Try "beef", "zinger", "pizza", "fries", or "deal"</small>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="search-empty">
                            <span style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</span>
                            <p>No items found for "{searchQuery}"</p>
                            <small>Try another keyword or browse our full menu</small>
                        </div>
                    ) : (
                        <>
                            <div className="search-results-header">
                                Found {filteredItems.length} delicious item{filteredItems.length !== 1 ? 's' : ''}
                            </div>
                            <div className="search-results-grid">
                                {filteredItems.map(item => {
                                    const isAdded = addedIds[item.id];
                                    const hasVariations = item.variations && item.variations.length > 0;

                                    return (
                                        <div
                                            key={item.id}
                                            className="search-item-card"
                                            onClick={() => handleItemClick(item)}
                                            style={{
                                                display: 'flex',
                                                gap: '14px',
                                                padding: '12px',
                                                backgroundColor: 'var(--color-surface)',
                                                border: '1px solid var(--color-medium-gray)',
                                                borderRadius: 'var(--radius-md)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                alignItems: 'center'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-medium-gray)'}
                                        >
                                            <div
                                                style={{
                                                    width: '72px',
                                                    height: '72px',
                                                    borderRadius: 'var(--radius-md)',
                                                    backgroundImage: `url(${item.imageUrl})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    flexShrink: 0
                                                }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h4 style={{ color: 'var(--color-white)', margin: 0, fontSize: '15px', fontWeight: 700 }}>
                                                    {item.name}
                                                </h4>
                                                {item.description && (
                                                    <p style={{
                                                        color: 'var(--color-text-secondary)',
                                                        fontSize: '12px',
                                                        margin: '4px 0 6px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {item.description}
                                                    </p>
                                                )}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '15px' }}>
                                                        Rs. {item.price}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDirectAddToCart(e, item)}
                                                        style={{
                                                            padding: '6px 14px',
                                                            backgroundColor: isAdded ? '#4ade80' : 'var(--color-accent)',
                                                            color: '#000',
                                                            border: 'none',
                                                            borderRadius: 'var(--radius-sm)',
                                                            fontSize: '12px',
                                                            fontWeight: 700,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {isAdded ? (
                                                            <span>✓ Added!</span>
                                                        ) : hasVariations ? (
                                                            <span>Options ➔</span>
                                                        ) : (
                                                            <span>+ Add to Cart</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default SearchModal;
