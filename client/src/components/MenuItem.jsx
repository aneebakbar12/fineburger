import React from 'react';
import '../styles/MenuItem.css';

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80';

const MenuItem = ({ item, onClick }) => {
    const { name, price, imageUrl, available, inStock, variations, isVeg, isSpicy } = item;

    // Check availability robustly (handles missing/undefined inStock gracefully)
    const isAvailable = available !== false && inStock !== false && (item.stockLevel === undefined || item.stockLevel > 0);
    const hasVariations = Array.isArray(variations) && variations.length > 0;
    const bgImage = imageUrl && imageUrl.trim() !== '' ? imageUrl : DEFAULT_FOOD_IMAGE;

    const handleKeyDown = (e) => {
        if (isAvailable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick(item);
        }
    };

    return (
        <div
            className={`menu-item ${!isAvailable ? 'unavailable' : ''}`}
            onClick={() => isAvailable && onClick(item)}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={isAvailable ? 0 : -1}
            aria-label={`${name} - Rs. ${price}${hasVariations ? ' (Customizable)' : ''}${!isAvailable ? ' (Out of stock)' : ''}`}
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <div className="menu-item-overlay"></div>

            {/* Badges */}
            <div className="menu-item-badges">
                {!isAvailable && (
                    <div className="unavailable-badge">Out of Stock</div>
                )}
                {isAvailable && isSpicy && (
                    <div className="spicy-badge" title="Spicy">🌶️ Spicy</div>
                )}
                {isAvailable && isVeg && (
                    <div className="veg-badge" title="Vegetarian">🌱 Veg</div>
                )}
            </div>

            <div className="menu-item-content">
                <h3 className="menu-item-name">{name}</h3>
                {item.description && (
                    <p className="menu-item-short-desc">{item.description}</p>
                )}
                <div className="menu-item-footer">
                    <span className="menu-item-price">
                        {hasVariations ? <span className="price-from">From </span> : null}
                        Rs. {price}
                    </span>
                    <span
                        className={`menu-item-btn ${!isAvailable ? 'disabled' : ''}`}
                        aria-hidden="true"
                    >
                        {isAvailable ? (hasVariations ? 'Customize ➔' : 'Add to Cart +') : 'Sold Out'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MenuItem;