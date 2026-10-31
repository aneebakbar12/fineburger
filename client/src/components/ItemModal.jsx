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
        let base = Number(item.hasDiscount ? item.discountedPrice : item.price) || 0;
        Object.values(selectedVariations).forEach(val => {
            base += parseVariationPriceDelta(val);
        });
        return base;
    };

    const computeOriginalUnitPrice = () => {
        let base = Number(item.originalPrice || item.price) || 0;
        Object.values(selectedVariations).forEach(val => {
            base += parseVariationPriceDelta(val);
        });
        return base;
    };

    const currentUnitPrice = computeUnitPrice();
    const originalUnitPrice = computeOriginalUnitPrice();
    const effectiveQuantity = Math.max(1, Number(quantity) || 1);
    const currentTotalPrice = currentUnitPrice * effectiveQuantity;

    const handleVariationChange = (variationName, option) => {
        setSelectedVariations(prev => ({
            ...prev,
            [variationName]: option
        }));
        setVariationError('');
    };

    const incrementQuantity = () => {
        const current = Number(quantity) || 1;
        if (item.stockLevel !== undefined && current >= item.stockLevel) return;
        setQuantity(current + 1);
    };

    const decrementQuantity = () => {
        const current = Number(quantity) || 1;
        setQuantity(current > 1 ? current - 1 : 1);
    };

    const handleQuantityChange = (e) => {
        const valStr = e.target.value;
        if (valStr === '') {
            setQuantity('');
            return;
        }
        const val = parseInt(valStr, 10);
        if (isNaN(val)) return;
        if (val < 1) {
            setQuantity(1);
        } else if (item.stockLevel !== undefined && val > item.stockLevel) {
            setQuantity(item.stockLevel);
        } else {
            setQuantity(val);
        }
    };

    const handleQuantityBlur = () => {
        if (!quantity || Number(quantity) < 1) {
            setQuantity(1);
        }
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

        const finalQty = Math.max(1, Number(quantity) || 1);

        const cartItem = {
            ...item,
            price: currentUnitPrice,
            originalUnitPrice: originalUnitPrice,
            basePrice: item.hasDiscount ? item.discountedPrice : item.price,
            quantity: finalQty,
            selectedVariations,
            totalPrice: currentUnitPrice * finalQty,
            hasDiscount: Boolean(item.hasDiscount),
            discountAmountPerUnit: item.hasDiscount ? Math.max(0, originalUnitPrice - currentUnitPrice) : 0,
            badge: item.badge
        };

        // Pass both full item object and explicit quantity/variations for maximum compatibility
        onAddToCart(cartItem, finalQty, selectedVariations);
        onClose();
    };

    const canAddToCart = storeOpen && item.available !== false && item.inStock !== false && (item.stockLevel === undefined || item.stockLevel > 0);

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

                        <div className="modal-price" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--color-accent, #FFB400)', textShadow: '0 0 16px rgba(255, 180, 0, 0.45)' }}>
                                Rs. {currentUnitPrice}
                            </span>
                            {item.hasDiscount && (
                                <span className="price-strike-cut" style={{ fontSize: '15px' }}>
                                    Rs. {originalUnitPrice}
                                </span>
                            )}
                            {item.hasDiscount && item.badge && (
                                <span className="discount-badge" style={{ animation: 'promoBadgePulse 2.5s infinite ease-in-out' }}>
                                    🔥 {item.badge}
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
                                    type="button"
                                    className="quantity-btn"
                                    onClick={decrementQuantity}
                                    aria-label="Decrease quantity"
                                    disabled={Number(quantity) <= 1}
                                    style={{ opacity: Number(quantity) <= 1 ? 0.4 : 1 }}
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    className="quantity-input"
                                    value={quantity}
                                    onChange={handleQuantityChange}
                                    onBlur={handleQuantityBlur}
                                    aria-label="Item quantity"
                                />
                                <button
                                    type="button"
                                    className="quantity-btn"
                                    onClick={incrementQuantity}
                                    aria-label="Increase quantity"
                                    disabled={item.stockLevel !== undefined && Number(quantity) >= item.stockLevel}
                                    style={{ opacity: item.stockLevel !== undefined && Number(quantity) >= item.stockLevel ? 0.4 : 1 }}
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