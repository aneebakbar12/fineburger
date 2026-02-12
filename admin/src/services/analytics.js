// Analytics utility functions for order data aggregation and reporting

/**
 * Get orders within a date range
 */
export const getOrdersByDateRange = (orders, startDate, endDate) => {
    if (!orders || orders.length === 0) return [];

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return orders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.seconds
            ? new Date(order.createdAt.seconds * 1000)
            : new Date(order.createdAt);
        return orderDate >= start && orderDate <= end;
    });
};

/**
 * Calculate best-selling items from orders
 */
export const getBestSellingItems = (orders, limit = 10) => {
    if (!orders || orders.length === 0) return [];

    const itemStats = {};

    // Only count delivered orders
    const deliveredOrders = orders.filter(o => o.status === 'delivered');

    deliveredOrders.forEach(order => {
        if (!order.items) return;

        order.items.forEach(item => {
            const key = item.id || item.name;
            if (!itemStats[key]) {
                itemStats[key] = {
                    name: item.name,
                    quantity: 0,
                    revenue: 0
                };
            }
            itemStats[key].quantity += item.quantity || 1;
            itemStats[key].revenue += (item.price || 0) * (item.quantity || 1);
        });
    });

    return Object.values(itemStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);
};

/**
 * Calculate revenue by day for the last N days
 */
export const getRevenueByDay = (orders, days = 7) => {
    if (!orders || orders.length === 0) return [];

    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const dayOrders = orders.filter(order => {
            if (!order.createdAt || order.status !== 'delivered') return false;
            const orderDate = order.createdAt.seconds
                ? new Date(order.createdAt.seconds * 1000)
                : new Date(order.createdAt);
            return orderDate >= date && orderDate < nextDay;
        });

        const revenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        result.push({
            date: date.toISOString().split('T')[0],
            dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: revenue,
            orders: dayOrders.length
        });
    }

    return result;
};

/**
 * Calculate revenue by month for the last N months
 */
export const getRevenueByMonth = (orders, months = 6) => {
    if (!orders || orders.length === 0) return [];

    const result = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

        const monthOrders = orders.filter(order => {
            if (!order.createdAt || order.status !== 'delivered') return false;
            const orderDate = order.createdAt.seconds
                ? new Date(order.createdAt.seconds * 1000)
                : new Date(order.createdAt);
            return orderDate >= date && orderDate < nextMonth;
        });

        const revenue = monthOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        result.push({
            month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
            revenue: revenue,
            orders: monthOrders.length
        });
    }

    return result;
};

/**
 * Get overall order statistics
 */
export const getOrderStats = (orders) => {
    if (!orders || orders.length === 0) {
        return {
            totalOrders: 0,
            totalRevenue: 0,
            todayOrders: 0,
            todayRevenue: 0,
            thisMonthOrders: 0,
            thisMonthRevenue: 0,
            averageOrderValue: 0
        };
    }

    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = deliveredOrders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.seconds
            ? new Date(order.createdAt.seconds * 1000)
            : new Date(order.createdAt);
        return orderDate >= today && orderDate < tomorrow;
    });
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    // This month's stats
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const thisMonthOrders = deliveredOrders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.seconds
            ? new Date(order.createdAt.seconds * 1000)
            : new Date(order.createdAt);
        return orderDate >= monthStart && orderDate < monthEnd;
    });
    const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    return {
        totalOrders: deliveredOrders.length,
        totalRevenue: totalRevenue,
        todayOrders: todayOrders.length,
        todayRevenue: todayRevenue,
        thisMonthOrders: thisMonthOrders.length,
        thisMonthRevenue: thisMonthRevenue,
        averageOrderValue: deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0
    };
};

/**
 * Get date range presets
 */
export const getDateRangePreset = (preset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    let startDate = new Date(today);

    switch (preset) {
        case 'today':
            break;
        case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case 'all':
            startDate = new Date(2020, 0, 1); // Far past date
            break;
        default:
            break;
    }

    return { startDate, endDate };
};
