import React, { useState, useEffect } from 'react';
import '../styles/ItemModal.css';

const ItemModal = ({ item, isOpen, onClose, onAddToCart, storeOpen }) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariations, setSelectedVariations] = useState({});
    const [variationError, setVariationError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setQuantity(1);
            setSelectedVariations({});
            setVariationError('');
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !item) return null;

    const handleVariationChange = (variationName, option) => {
        setSelectedVariations(prev => ({
            ...prev,
            [variationName]: option
        }));
        setVariationError('');
    };

    const incrementQuantity = () => {
        if (item.stockLevel !== undefined && quantity >= item.stockLevel) return;
        setQuantity(prev => prev + 1);
    };

    const decrementQuantity = () => {
        setQuantity(prev => (prev > 1 ? prev - 1 : 1));
    };

    const handleAddToCart = () => {
        if (item.variations && item.variations.length > 0) {
            const missing = item.variations.find(v => !selectedVariations[v.name]);
            if (missing) {
                setVariationError(`Please select an option for "${missing.name}".`);
                return;
            }
        }
        setVariationError('');

        const cartItem = {
            ...item,
            quantity,
            selectedVariations,
            totalPrice: item.price * quantity
        };
        onAddToCart(cartItem);
        onClose();
    };

    const canAddToCart = storeOpen && item.available && item.inStock;

    return (
        <>
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal">
                <div className="modal-content">
                    {/* Close button */}
                    <button className="modal-close" onClick={onClose} aria-label="Close modal">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Item Image */}
                    <div
                        className="modal-image"
                        style={{ backgroundImage: `url(${item.imageUrl})` }}
                    >
                        <div className="modal-image-overlay"></div>
                    </div>

                    {/* Item Details */}
                    <div className="modal-body">
                        <h2 className="modal-title">{item.name}</h2>

                        {item.description && (
                            <p className="modal-description">{item.description}</p>
                        )}

                        <div className="modal-price">Rs. {item.price}</div>

                        {/* Variations */}
                        {item.variations && item.variations.length > 0 && (
                            <div className="modal-variations">
                                {item.variations.map((variation, index) => (
                                    <div key={index} className="variation-group">
                                        <label className="variation-label">{variation.name}</label>
                                        <select
                                            className="variation-select"
                                            value={selectedVariations[variation.name] || ''}
                                            onChange={(e) => handleVariationChange(variation.name, e.target.value)}
                                        >
                                            <option value="">Select {variation.name}</option>
                                            {variation.options.map((option, optIndex) => (
                                                <option key={optIndex} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Quantity Selector */}
                        <div className="quantity-selector">
                            <label className="quantity-label">Quantity</label>
                            <div className="quantity-controls">
                                <button
                                    className="quantity-btn"
                                    onClick={decrementQuantity}
                                    aria-label="Decrease quantity"
                                >
                                    −
                                </button>
                                <span className="quantity-value">{quantity}</span>
                                <button
                                    className="quantity-btn"
                                    onClick={incrementQuantity}
                                    aria-label="Increase quantity"
                                    disabled={item.stockLevel !== undefined && quantity >= item.stockLevel}
                                    style={{ opacity: item.stockLevel !== undefined && quantity >= item.stockLevel ? 0.5 : 1 }}
                                >
                                    +
                                </button>
                                {item.stockLevel !== undefined && (
                                    <span style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>
                                        (Max: {item.stockLevel})
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Validation error */}
                        {variationError && (
                            <div style={{
                                color: '#f87171',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '8px 12px',
                                fontSize: 'var(--font-size-sm)',
                                marginBottom: 'var(--spacing-md)'
                            }}>
                                ⚠️ {variationError}
                            </div>
                        )}

                        {/* Store Status Message */}
                        {!storeOpen && (
                            <div className="store-closed-message">
                                Sorry, we are closed now. You can place orders during our operating hours.
                            </div>
                        )}

                        {/* Add to Cart Button */}
                        <button
                            className="modal-add-btn"
                            onClick={handleAddToCart}
                            disabled={!canAddToCart}
                        >
                            {canAddToCart ? `Add to Cart - Rs. ${item.price * quantity}` : 'Currently Unavailable'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ItemModal;
