import React, { useState } from 'react';
import { useCashierShift } from '../context/CashierShiftContext';

const CashierShiftModal = () => {
    const {
        shiftModalOpen,
        setShiftModalOpen,
        shiftModalMode,
        setShiftModalMode,
        pendingCashier,
        activeCashier,
        activeShift,
        authenticatePin,
        startShiftWithFloat,
        endActiveShift
    } = useCashierShift();

    const [pin, setPin] = useState('');
    const [openingFloat, setOpeningFloat] = useState('5000');
    const [shiftNotes, setShiftNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!shiftModalOpen) return null;

    const handlePinSubmit = async (e) => {
        e.preventDefault();
        if (!pin || pin.length < 3) return;

        setIsSubmitting(true);
        const res = await authenticatePin(pin);
        setIsSubmitting(false);

        if (res.success) {
            setPin('');
        }
    };

    const handleFloatSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        await startShiftWithFloat(openingFloat, shiftNotes);
        setIsSubmitting(false);
        setOpeningFloat('5000');
        setShiftNotes('');
    };

    const handleCloseShiftSubmit = async (e) => {
        e.preventDefault();
        const ok = window.confirm(
            `Confirm Shift Handover:\n\nAre you sure you want to end your shift?\n\nTotal cash in drawer to hand over to owner: Rs. ${totalExpectedCash}`
        );
        if (!ok) return;

        setIsSubmitting(true);
        await endActiveShift(shiftNotes);
        setIsSubmitting(false);
        setShiftNotes('');
    };

    // Calculate live drawer totals
    const floatAmount = Number(activeShift?.openingFloat) || 0;
    const counterSales = Number(activeShift?.counterCashSales) || 0;
    const riderCash = Number(activeShift?.riderCashCollected) || 0;
    const totalExpectedCash = floatAmount + counterSales + riderCash;

    // Print Shift Closing Receipt (80mm thermal)
    const handlePrintShiftSlip = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print shift closing slip.');
            return;
        }

        const openedTimeStr = activeShift?.openedAt?.seconds
            ? new Date(activeShift.openedAt.seconds * 1000).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
            : 'Earlier Today';
        const closedTimeStr = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Shift Closing Report • ${activeCashier?.name || 'Cashier'}</title>
                    <meta charset="utf-8" />
                    <style>
                        @page { size: 80mm auto; margin: 0; }
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body {
                            font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, sans-serif;
                            width: 74mm;
                            margin: 0 auto;
                            padding: 3mm 1mm 6mm;
                            color: #000;
                            background: #fff;
                            font-size: 13.5px;
                            font-weight: 700;
                            line-height: 1.35;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 6px; }
                        .header h2 { font-size: 20px; font-weight: 900; margin: 2px 0 1px; letter-spacing: 0.5px; }
                        .title { font-size: 15px; font-weight: 900; text-align: center; margin: 6px 0; padding: 5px 0; border-top: 2px dashed #000; border-bottom: 2px dashed #000; letter-spacing: 0.5px; }
                        .row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 13px; }
                        .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: 900; border-top: 2.5px dashed #000; border-bottom: 2.5px dashed #000; padding: 6px 0; margin-top: 6px; }
                        .sign-line { margin-top: 28px; border-top: 1.5px solid #000; padding-top: 4px; text-align: center; font-size: 11px; font-weight: 700; }
                        @media print { .no-print { display: none !important; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>FINE BURGER</h2>
                        <p style="font-size: 12px; font-weight: 700;">Main G.T. Road, Baghbanpura, Lahore</p>
                        <p style="font-size: 12px; font-weight: 700;">Tel: 042-36840007 • WA: 0325-1842184</p>
                    </div>

                    <div class="title">SHIFT CLOSING STATEMENT</div>

                    <div class="row"><span>Cashier:</span><strong>${activeCashier?.name || 'N/A'}</strong></div>
                    <div class="row"><span>Shift:</span><span>${activeCashier?.shiftTitle || 'Standard'}</span></div>
                    <div class="row" style="font-size: 11px;"><span>Start:</span><span>${openedTimeStr}</span></div>
                    <div class="row" style="font-size: 11px;"><span>End:</span><span>${closedTimeStr}</span></div>
                    <div class="row"><span>Orders Done:</span><span>${activeShift?.ordersCount || 0}</span></div>

                    <div style="border-top: 2px dashed #000; margin: 6px 0;"></div>

                    <div class="row">
                        <span>Starting Float (Peti):</span>
                        <span>Rs. ${floatAmount}</span>
                    </div>
                    <div class="row">
                        <span>Counter Cash Sales:</span>
                        <span>Rs. ${counterSales}</span>
                    </div>
                    <div class="row">
                        <span>Rider Cash Collected:</span>
                        <span>Rs. ${riderCash}</span>
                    </div>

                    <div class="total-row">
                        <span>DRAWER CASH TOTAL:</span>
                        <span>Rs. ${totalExpectedCash}</span>
                    </div>

                    <div style="margin-top: 8px; font-size: 11px; font-weight: 600; color: #222;">
                        Cashier verifies full shift earnings and peti amount are counted and physically handed over to restaurant owner.
                    </div>

                    <div style="display: flex; justify-content: space-between; gap: 14px; margin-top: 28px;">
                        <div style="flex: 1; border-top: 1.5px solid #000; text-align: center; font-size: 11px; font-weight: 700; padding-top: 3px;">
                            Cashier Sign
                        </div>
                        <div style="flex: 1; border-top: 1.5px solid #000; text-align: center; font-size: 11px; font-weight: 700; padding-top: 3px;">
                            Owner Sign
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 16px;" class="no-print">
                        <button onclick="window.print()" style="padding: 8px 16px; font-weight: bold; cursor: pointer;">Print Report</button>
                    </div>

                    <script>
                        window.onload = function() {
                            setTimeout(function() { window.print(); }, 250);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '20px'
        }} onClick={() => setShiftModalOpen(false)}>
            <div style={{
                backgroundColor: 'var(--surface-card, #14171f)',
                borderRadius: '14px',
                padding: '28px',
                maxWidth: '440px',
                width: '100%',
                border: '1px solid var(--surface-border)',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.65)'
            }} onClick={(e) => e.stopPropagation()}>

                {/* MODE 1: Enter Cashier PIN */}
                {shiftModalMode === 'pin' && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '36px', marginBottom: '6px' }}>🔐</div>
                            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px', fontWeight: 800 }}>
                                Cashier Terminal Unlock
                            </h2>
                            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                Enter your 4-digit Cashier PIN to unlock shift drawer.
                            </p>
                        </div>

                        <form onSubmit={handlePinSubmit}>
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength="6"
                                placeholder="••••"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                                autoFocus
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    border: '2px solid var(--color-accent, #FFB400)',
                                    backgroundColor: 'var(--surface-elevated, #1d222d)',
                                    color: '#fff',
                                    fontSize: '28px',
                                    textAlign: 'center',
                                    letterSpacing: '8px',
                                    fontWeight: 800,
                                    outline: 'none',
                                    marginBottom: '20px'
                                }}
                            />

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || pin.length < 3}
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 800 }}
                                >
                                    {isSubmitting ? 'Verifying...' : 'Unlock Drawer →'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShiftModalOpen(false)}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, padding: '12px', fontSize: '14px' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* MODE 2: Start Shift & Opening Float (Peti) */}
                {shiftModalMode === 'open_float' && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '36px', marginBottom: '6px' }}>💰</div>
                            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px', fontWeight: 800 }}>
                                Start Shift: {pendingCashier?.name}
                            </h2>
                            <p style={{ margin: '6px 0 0', color: 'var(--color-accent, #FFB400)', fontSize: '12px', fontWeight: 700 }}>
                                {pendingCashier?.shiftTitle || 'Shift Starting'}
                            </p>
                            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                Enter starting cash float (Peti / Change money) placed into this drawer.
                            </p>
                        </div>

                        <form onSubmit={handleFloatSubmit}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                                    Opening Cash Float (PKR) *
                                </label>
                                <input
                                    type="number"
                                    value={openingFloat}
                                    onChange={(e) => setOpeningFloat(e.target.value)}
                                    placeholder="e.g. 5000"
                                    min="0"
                                    step="100"
                                    required
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--surface-border)',
                                        backgroundColor: 'var(--surface-elevated)',
                                        color: '#10b981',
                                        fontSize: '20px',
                                        fontWeight: 800,
                                        outline: 'none'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                                    {['0', '2000', '3000', '5000', '10000'].map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setOpeningFloat(amt)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--surface-border)',
                                                backgroundColor: openingFloat === amt ? 'var(--color-accent)' : 'var(--surface-elevated)',
                                                color: openingFloat === amt ? '#000' : 'var(--text-secondary)',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Rs. {amt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                                    Opening Note (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={shiftNotes}
                                    onChange={(e) => setShiftNotes(e.target.value)}
                                    placeholder="e.g. Received Rs. 5000 in small change (100s & 500s)"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--surface-border)',
                                        backgroundColor: 'var(--surface-elevated)',
                                        color: '#fff',
                                        fontSize: '13px'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 800 }}
                                >
                                    {isSubmitting ? 'Starting...' : 'Open Shift & Start Drawer'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShiftModalOpen(false)}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, padding: '12px', fontSize: '14px' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* MODE 3: End Shift Handover & Closing Summary */}
                {shiftModalMode === 'close_summary' && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                            <div style={{ fontSize: '32px', marginBottom: '4px' }}>📊</div>
                            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '19px', fontWeight: 800 }}>
                                End Shift Handover Summary
                            </h2>
                            <p style={{ margin: '4px 0 0', color: 'var(--color-accent, #FFB400)', fontSize: '13px', fontWeight: 700 }}>
                                {activeCashier?.name} ({activeCashier?.shiftTitle || 'Shift'})
                            </p>
                        </div>

                        {/* Breakdown Box */}
                        <div style={{
                            backgroundColor: 'var(--surface-elevated, #1d222d)',
                            borderRadius: '10px',
                            padding: '16px',
                            marginBottom: '16px',
                            border: '1px solid var(--surface-border)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Starting Float (Peti):</span>
                                <span style={{ fontWeight: 700, color: '#3b82f6' }}>Rs. {floatAmount}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Counter Cash Sales (Dine/Take):</span>
                                <span style={{ fontWeight: 700, color: '#10b981' }}>+ Rs. {counterSales}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Rider Cash Deliveries:</span>
                                <span style={{ fontWeight: 700, color: '#10b981' }}>+ Rs. {riderCash}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                <span>Orders Processed:</span>
                                <span>{activeShift?.ordersCount || 0} orders</span>
                            </div>

                            <div style={{
                                borderTop: '2px dashed var(--surface-border)',
                                paddingTop: '10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Total Cash in Drawer
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-accent)' }}>
                                        Hand over to Restaurant Owner
                                    </div>
                                </div>
                                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-accent, #FFB400)' }}>
                                    Rs. {totalExpectedCash}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleCloseShiftSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
                                    Closing Remarks (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Handed cash to Owner Aneeb"
                                    value={shiftNotes}
                                    onChange={(e) => setShiftNotes(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--surface-border)',
                                        backgroundColor: 'var(--surface-elevated)',
                                        color: '#fff',
                                        fontSize: '13px'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                <button
                                    type="button"
                                    onClick={handlePrintShiftSlip}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    <span>🖨️</span>
                                    <span>Print Shift Slip</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: '#ef4444',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 800,
                                        fontSize: '13px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {isSubmitting ? 'Closing...' : 'Close Shift & Handover'}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShiftModalOpen(false)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                Resume Shift (Keep Open)
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashierShiftModal;
