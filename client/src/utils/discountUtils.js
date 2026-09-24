/**
 * Checks whether a discount is currently in effect based on its active flag and date/time limits.
 *
 * @param {Object} discount - Discount object with active, startDate, endDate
 * @returns {boolean}
 */
export const isDiscountInEffect = (discount) => {
    if (!discount || discount.active === false) return false;

    const now = new Date();

    if (discount.startDate) {
        const start = new Date(discount.startDate);
        if (!isNaN(start.getTime()) && now < start) {
            return false;
        }
    }

    if (discount.endDate) {
        const end = new Date(discount.endDate);
        if (!isNaN(end.getTime()) && now > end) {
            return false;
        }
    }

    return true;
};

/**
 * Calculates discount details for a given menu item against active discounts.
 * Prioritizes item-specific discount over global menu-wide discount.
 *
 * @param {Object} item - Menu item object with id and price
 * @param {Array} activeDiscounts - List of all discounts
 * @returns {Object}
 */
export const calculateItemDiscount = (item, activeDiscounts = []) => {
    if (!item) return {
        hasDiscount: false,
        originalPrice: 0,
        discountedPrice: 0,
        discountAmount: 0,
        badge: null,
        discountTitle: null,
        discount: null
    };

    const originalPrice = Number(item.price) || 0;
    if (originalPrice <= 0 || !Array.isArray(activeDiscounts) || activeDiscounts.length === 0) {
        return {
            hasDiscount: false,
            originalPrice,
            discountedPrice: originalPrice,
            discountAmount: 0,
            badge: null,
            discountTitle: null,
            discount: null
        };
    }

    // 1. Look for active item-specific discount currently in effect
    const itemDiscount = activeDiscounts.find(
        d => d.type === 'item' && d.itemId === item.id && isDiscountInEffect(d)
    );

    // 2. Look for active global discount currently in effect
    const globalDiscount = activeDiscounts.find(
        d => d.type === 'global' && isDiscountInEffect(d)
    );

    const applicable = itemDiscount || globalDiscount;
    if (!applicable) {
        return {
            hasDiscount: false,
            originalPrice,
            discountedPrice: originalPrice,
            discountAmount: 0,
            badge: null,
            discountTitle: null,
            discount: null
        };
    }

    let discountAmount = 0;
    let badge = '';

    if (applicable.discountType === 'percentage') {
        const pct = Math.min(100, Math.max(0, Number(applicable.value) || 0));
        discountAmount = Math.round(originalPrice * (pct / 100));
        badge = `${pct}% OFF`;
    } else {
        // Flat discount in PKR
        const flatVal = Math.max(0, Number(applicable.value) || 0);
        discountAmount = Math.min(originalPrice, flatVal);
        badge = `Rs. ${flatVal} OFF`;
    }

    const discountedPrice = Math.max(0, originalPrice - discountAmount);

    return {
        hasDiscount: discountAmount > 0,
        originalPrice,
        discountedPrice,
        discountAmount,
        badge: discountAmount > 0 ? badge : null,
        discountTitle: applicable.title || null,
        discount: applicable
    };
};

/**
 * Validates and calculates discount for an entered coupon promo code.
 *
 * @param {string} code - Customer entered code
 * @param {number} subtotal - Current cart subtotal
 * @param {Array} discountsList - List of all discounts
 * @returns {Object} { isValid, discountAmount, coupon, message }
 */
export const validateCouponCode = (code, subtotal, discountsList = []) => {
    if (!code || !code.trim()) {
        return { isValid: false, discountAmount: 0, coupon: null, message: 'Please enter a coupon code.' };
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = (discountsList || []).find(
        d => d.type === 'coupon' && (d.code || '').toUpperCase() === cleanCode
    );

    if (!coupon) {
        return { isValid: false, discountAmount: 0, coupon: null, message: 'Invalid coupon code. Please check and try again.' };
    }

    if (!isDiscountInEffect(coupon)) {
        return { isValid: false, discountAmount: 0, coupon: null, message: 'This promo code is either inactive or has expired.' };
    }

    const minAmount = Number(coupon.minOrderAmount) || 0;
    if (minAmount > 0 && subtotal < minAmount) {
        return {
            isValid: false,
            discountAmount: 0,
            coupon: null,
            message: `Order subtotal must be at least Rs. ${minAmount} to use this coupon.`
        };
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
        const pct = Math.min(100, Math.max(0, Number(coupon.value) || 0));
        discountAmount = Math.round(subtotal * (pct / 100));
    } else {
        const flatVal = Math.max(0, Number(coupon.value) || 0);
        discountAmount = Math.min(subtotal, flatVal);
    }

    return {
        isValid: true,
        discountAmount,
        coupon,
        message: `Coupon "${cleanCode}" applied! Saved Rs. ${discountAmount}.`
    };
};
