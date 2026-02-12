import React from 'react';
import '../styles/MenuItem.css';

const MenuItem = ({ item, onClick }) => {
    const { name, price, imageUrl, available, inStock } = item;

    const isAvailable = available && inStock;

    return (
        <div
            className={`menu-item ${!isAvailable ? 'unavailable' : ''}`}
            onClick={() => isAvailable && onClick(item)}
            style={{ backgroundImage: `url(${imageUrl})` }}
        >
            <div className="menu-item-overlay"></div>

            {!isAvailable && (
                <div className="unavailable-badge">Out of Stock</div>
            )}

            <div className="menu-item-content">
                <h3 className="menu-item-name">{name}</h3>
                <div className="menu-item-footer">
                    <span className="menu-item-price">Rs. {price}</span>
                    <button
                        className="menu-item-btn"
                        disabled={!isAvailable}
                    >
                        {isAvailable ? 'Add to Cart' : 'Unavailable'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuItem;
