/**
 * Calculates discount details for a given menu item against active discounts.
 * Prioritizes item-specific discount over global menu-wide discount.
 *
 * @param {Object} item - Menu item object with id and price
 * @param {Array} activeDiscounts - List of all discounts
 * @returns {Object} {
 *   hasDiscount: boolean,
 *   originalPrice: number,
 *   discountedPrice: number,
 *   discountAmount: number,
 *   badge: string | null,
 *   discountTitle: string | null,
 *   discount: Object | null
 * }
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

    // 1. Look for active item-specific discount
    const itemDiscount = activeDiscounts.find(
        d => d.active !== false && d.type === 'item' && d.itemId === item.id
    );

    // 2. Look for active global discount
    const globalDiscount = activeDiscounts.find(
        d => d.active !== false && d.type === 'global'
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
