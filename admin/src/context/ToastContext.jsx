import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckIcon, AlertCircleIcon, CloseIcon } from '../components/Icons';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 3500) => {
        const id = Date.now() + Math.random().toString(36).substr(2, 5);
        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
        return id;
    }, [removeToast]);

    const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
    const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
    const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
            {children}
            <div className="toast-container" aria-live="polite" role="region">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast-item toast-${toast.type}`}
                        role="alert"
                    >
                        <div className="toast-icon">
                            {toast.type === 'success' && <CheckIcon width={18} height={18} stroke="#10b981" />}
                            {toast.type === 'error' && <AlertCircleIcon width={18} height={18} stroke="#ef4444" />}
                            {toast.type === 'info' && <AlertCircleIcon width={18} height={18} stroke="#FFB400" />}
                        </div>
                        <div className="toast-message">{toast.message}</div>
                        <button
                            className="toast-close-btn"
                            onClick={() => removeToast(toast.id)}
                            aria-label="Dismiss notification"
                        >
                            <CloseIcon width={14} height={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastContext;
