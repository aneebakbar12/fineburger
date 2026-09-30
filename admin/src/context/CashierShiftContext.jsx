import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    verifyCashierByPin,
    openCashierShift,
    subscribeToActiveShift,
    getActiveShiftForCashier,
    closeCashierShift
} from '../services/firebase';
import { useToast } from './ToastContext';

const CashierShiftContext = createContext();

export const useCashierShift = () => {
    const context = useContext(CashierShiftContext);
    if (!context) {
        throw new Error('useCashierShift must be used within CashierShiftProvider');
    }
    return context;
};

export const CashierShiftProvider = ({ children }) => {
    const toast = useToast();
    const [activeCashier, setActiveCashier] = useState(() => {
        try {
            const saved = localStorage.getItem('fb_active_cashier');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const [activeShift, setActiveShift] = useState(null);
    const [isShiftLoading, setIsShiftLoading] = useState(true);

    // Modal state for PIN switch & shift start/end
    const [shiftModalOpen, setShiftModalOpen] = useState(false);
    const [shiftModalMode, setShiftModalMode] = useState('pin'); // 'pin' | 'open_float' | 'close_summary'
    const [pendingCashier, setPendingCashier] = useState(null);

    // Save active cashier to localStorage
    useEffect(() => {
        if (activeCashier) {
            localStorage.setItem('fb_active_cashier', JSON.stringify(activeCashier));
        } else {
            localStorage.removeItem('fb_active_cashier');
        }
    }, [activeCashier]);

    // Real-time listener for current cashier's active shift
    useEffect(() => {
        if (!activeCashier?.id) {
            setActiveShift(null);
            setIsShiftLoading(false);
            return;
        }

        setIsShiftLoading(true);
        const unsubscribe = subscribeToActiveShift(activeCashier.id, (shift) => {
            setActiveShift(shift);
            setIsShiftLoading(false);
        });

        return () => unsubscribe();
    }, [activeCashier?.id]);

    // Fast PIN verification and shift transition
    const authenticatePin = async (pin) => {
        const result = await verifyCashierByPin(pin);
        if (!result.success) {
            toast.error(result.error);
            return { success: false, error: result.error };
        }

        const cashier = result.cashier;

        // Check if cashier already has an active open shift to resume seamlessly
        const existingShift = await getActiveShiftForCashier(cashier.id);
        if (existingShift) {
            setActiveCashier(cashier);
            setActiveShift(existingShift);
            setPendingCashier(null);
            setShiftModalOpen(false);
            toast.success(`Resumed open shift for ${cashier.name}!`);
            return { success: true, cashier, resumed: true };
        }

        setPendingCashier(cashier);
        // If not, ask for opening float (peti)
        setShiftModalMode('open_float');
        return { success: true, cashier };
    };

    // Open shift with opening float (peti)
    const startShiftWithFloat = async (openingFloat = 0, notes = '') => {
        const cashier = pendingCashier || activeCashier;
        if (!cashier) return { success: false, error: 'No cashier selected.' };

        const res = await openCashierShift({
            cashierId: cashier.id,
            cashierName: cashier.name,
            openingFloat: Number(openingFloat) || 0,
            notes
        });

        if (res.success) {
            setActiveCashier(cashier);
            setActiveShift(res.shift);
            setPendingCashier(null);
            setShiftModalOpen(false);
            toast.success(`Shift active for ${cashier.name}! Peti: Rs. ${Number(openingFloat) || 0}`);
            return { success: true };
        } else {
            toast.error('Failed to start shift: ' + res.error);
            return { success: false, error: res.error };
        }
    };

    // End active shift and show summary
    const endActiveShift = async (notes = '', actualCashCounted = null) => {
        if (!activeShift?.id) {
            toast.error('No active shift to close.');
            return { success: false };
        }

        const res = await closeCashierShift(activeShift.id, {
            notes,
            actualCashCounted
        });

        if (res.success) {
            toast.success(`Shift for ${activeCashier?.name} closed! Ready for owner handover.`);
            // Lock session
            setActiveCashier(null);
            setActiveShift(null);
            setShiftModalOpen(false);
            return { success: true, expectedCash: res.expectedCash };
        } else {
            toast.error('Failed to close shift: ' + res.error);
            return { success: false, error: res.error };
        }
    };

    // Instant Lock / Switch without closing shift
    const lockSession = () => {
        setActiveCashier(null);
        setActiveShift(null);
        localStorage.removeItem('fb_active_cashier');
        toast.info('Cashier terminal locked. Enter PIN to resume.');
    };

    const value = {
        activeCashier,
        activeShift,
        isShiftLoading,
        shiftModalOpen,
        setShiftModalOpen,
        shiftModalMode,
        setShiftModalMode,
        pendingCashier,
        setPendingCashier,
        authenticatePin,
        startShiftWithFloat,
        endActiveShift,
        lockSession,
        openSwitchModal: () => {
            setShiftModalMode('pin');
            setShiftModalOpen(true);
        },
        openCloseShiftModal: () => {
            setShiftModalMode('close_summary');
            setShiftModalOpen(true);
        }
    };

    return (
        <CashierShiftContext.Provider value={value}>
            {children}
        </CashierShiftContext.Provider>
    );
};
