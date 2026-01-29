// Currency formatting utility for Pakistani Rupees (PKR)

export const formatPKR = (amount) => {
    if (amount === null || amount === undefined) return 'PKR 0';

    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
};

// Format without currency symbol
export const formatNumber = (amount) => {
    if (amount === null || amount === undefined) return '0';

    return new Intl.NumberFormat('en-PK', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
};

// Calculate percentage
export const calculatePercentage = (part, total) => {
    if (!total || total === 0) return 0;
    return ((part / total) * 100).toFixed(2);
};

// Calculate profit margin
export const calculateProfitMargin = (sellingPrice, costPrice) => {
    if (!sellingPrice || sellingPrice === 0) return 0;
    const profit = sellingPrice - costPrice;
    return ((profit / sellingPrice) * 100).toFixed(2);
};
