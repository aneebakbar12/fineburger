/**
 * Fine Burger Client Web Push & Notification Service
 */

export const isNotificationSupported = () => {
    return 'Notification' in window;
};

export const getNotificationPermission = () => {
    if (!isNotificationSupported()) return 'unsupported';
    return Notification.permission;
};

export const requestNotificationPermission = async () => {
    if (!isNotificationSupported()) {
        console.warn('Notifications not supported in this browser.');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (err) {
        console.error('Error requesting notification permission:', err);
        return false;
    }
};

/**
 * Trigger an OS notification using Service Worker or browser Notification API
 */
export const showPushNotification = async (title, options = {}) => {
    if (getNotificationPermission() !== 'granted') return false;

    const defaultOptions = {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        tag: 'order-status',
        renotify: true,
        ...options
    };

    try {
        // Try displaying via Service Worker for PWA compatibility
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration && registration.showNotification) {
                await registration.showNotification(title, defaultOptions);
                return true;
            }
        }

        // Fallback to standard Window Notification
        new Notification(title, defaultOptions);
        return true;
    } catch (err) {
        console.error('Failed to show push notification:', err);
        return false;
    }
};

/**
 * Trigger an automated notification when order status advances
 */
export const notifyOrderStatusChange = (order, newStatus) => {
    if (!order || !newStatus) return;

    const ref = order.orderReference || order.id?.substring(0, 5).toUpperCase() || 'FB';
    let title = `🍔 Fine Burger — Order #${ref}`;
    let body = 'Your order status has been updated.';

    switch (newStatus) {
        case 'pending':
            title = `📋 Order #${ref} Received!`;
            body = 'Your order has reached the restaurant and is queued for the kitchen.';
            break;
        case 'preparing':
            title = `🔥 Kitchen is Cooking — Order #${ref}`;
            body = 'Our chefs have started preparing your fresh gourmet burgers!';
            break;
        case 'out_for_delivery':
            title = `🛵 On The Way — Order #${ref}`;
            body = 'Your rider has picked up your food and is heading to your address.';
            break;
        case 'ready':
            title = `✨ Order #${ref} is Ready!`;
            body = order.orderType === 'Dine-in'
                ? 'Your meal is being brought to your table now.'
                : 'Your order is packed fresh and ready for pickup!';
            break;
        case 'delivered':
            title = `🎉 Order #${ref} Delivered!`;
            body = 'Your meal has been delivered. Enjoy every bite!';
            break;
        case 'cancelled':
            title = `❌ Order #${ref} Cancelled`;
            body = 'This order was cancelled. Please tap to view details or contact us.';
            break;
        default:
            body = `Status changed to ${newStatus}.`;
    }

    showPushNotification(title, {
        body,
        data: {
            url: `/track/${order.id || ''}`
        }
    });
};
