import React, { useState, useEffect } from 'react';
import '../styles/ItemModal.css';

const parseVariationPriceDelta = (optionString) => {
    if (typeof optionString !== 'string') return 0;
    const match = optionString.match(/\(\s*\+\s*(?:Rs\.?|PKR)?\s*([0-9]+)\s*\)/i);
    return match && match[1] ? Number(match[1]) : 0;
};

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

            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = 'unset';
            };
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen, onClose]);

    if (!isOpen || !item) return null;

    const computeUnitPrice = () => {
        let base = Number(item.price) || 0;
        Object.values(selectedVariations).forEach(val => {
            base += parseVariationPriceDelta(val);
        });
        return base;
    };

    const currentUnitPrice = computeUnitPrice();
    const currentTotalPrice = currentUnitPrice * quantity;

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
            price: currentUnitPrice,
            basePrice: item.price,
            quantity,
            selectedVariations,
            totalPrice: currentTotalPrice
        };

        // Pass both full item object and explicit quantity/variations for maximum compatibility
        onAddToCart(cartItem, quantity, selectedVariations);
        onClose();
    };

    const canAddToCart = storeOpen && item.available !== false && item.inStock !== false;

    return (
        <>
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-item-title">
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
                        <h2 id="modal-item-title" className="modal-title">{item.name}</h2>

                        {item.description && (
                            <p className="modal-description">{item.description}</p>
                        )}

                        <div className="modal-price">
                            Rs. {currentUnitPrice}
                            {currentUnitPrice > item.price && (
                                <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', textDecoration: 'line-through', marginLeft: '8px' }}>
                                    Rs. {item.price}
                                </span>
                            )}
                        </div>

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
                                    disabled={quantity >= 20 || (item.stockLevel !== undefined && quantity >= item.stockLevel)}
                                    style={{ opacity: quantity >= 20 || (item.stockLevel !== undefined && quantity >= item.stockLevel) ? 0.5 : 1 }}
                                >
                                    +
                                </button>
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
                            {canAddToCart ? `Add to Cart • Rs. ${currentTotalPrice}` : 'Currently Unavailable'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ItemModal;