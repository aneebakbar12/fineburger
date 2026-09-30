import React, { useState, useEffect } from 'react';
import {
    getFinancialSummary,
    subscribeToAllShifts,
    settleShiftByOwner,
    subscribeToRiders,
    subscribeToOrders
} from '../services/firebase';
import { useToast } from '../context/ToastContext';
import { getPKTRange, formatCurrency } from '../utils/dateUtils';
import {
    FinanceIcon,
    ExpensesIcon,
    TrendingUpIcon,
    CheckIcon,
    AlertCircleIcon,
    CashierIcon,
    RidersIcon
} from '../components/Icons';
import '../styles/admin.css';

const FinancialDashboard = () => {
    const toast = useToast();
    const [summary, setSummary] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0,
        profitMargin: 0
    });
    const [dateRange, setDateRange] = useState('month');
    const [loading, setLoading] = useState(true);

    // Real-time Cashier Shift Drawers & Rider Cash Tracking
    const [shifts, setShifts] = useState([]);
    const [riders, setRiders] = useState([]);
    const [orders, setOrders] = useState([]);
    const [settlingShiftId, setSettlingShiftId] = useState(null);

    useEffect(() => {
        const unsubShifts = subscribeToAllShifts(setShifts);
        const unsubRiders = subscribeToRiders(setRiders);
        const unsubOrders = subscribeToOrders(setOrders);

        return () => {
            unsubShifts();
            unsubRiders();
            unsubOrders();
        };
    }, []);

    useEffect(() => {
        fetchFinancialData();
    }, [dateRange]);

    const handleSettleShift = async (shift) => {
        const total = (Number(shift.openingFloat) || 0) + (Number(shift.counterCashSales) || 0) + (Number(shift.riderCashCollected) || 0);
        const ok = window.confirm(
            `Owner Shift Settlement:\n\nConfirm receipt of Rs. ${total} from Cashier ${shift.cashierName}?\n\nThis will mark the shift as fully settled and clear the drawer.`
        );
        if (!ok) return;

        setSettlingShiftId(shift.id);
        const res = await settleShiftByOwner(shift.id, { settledBy: 'Owner / Admin' });
        setSettlingShiftId(null);
        if (res.success) {
            toast.success(`✓ Shift for ${shift.cashierName} settled! Received Rs. ${total}.`);
        } else {
            toast.error('Failed to settle shift: ' + res.error);
        }
    };

    const fetchFinancialData = async () => {
        setLoading(true);
        const { startDate, endDate } = getPKTRange(dateRange);
        const data = await getFinancialSummary(startDate, endDate);
        setSummary(data);
        setLoading(false);
    };

    const MetricCard = ({ Icon, label, value, color, subtext, isPositive }) => (
        <div style={{
            backgroundColor: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            borderLeft: `4px solid ${color}`,
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            flex: 1,
            minWidth: '240px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
                <div style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    backgroundColor: 'var(--surface-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: color
                }}>
                    <Icon width={18} height={18} stroke={color} />
                </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {value}
            </div>
            {subtext && (
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {subtext}
                </div>
            )}
        </div>
    );

    const hasData = summary.revenue > 0 || summary.expenses > 0;
    const isProfitable = summary.profit > 0;

    return (
        <div>
            {/* Header */}
            <div className="admin-header" style={{ padding: '20px 24px', marginBottom: '24px' }}>
                <div>
                    <h1 className="admin-title" style={{ fontSize: '24px' }}>Financial Intelligence</h1>
                    <p className="admin-subtitle" style={{ fontSize: '13px', marginTop: '4px' }}>
                        Track revenue, overhead expenses, and net profit margins (PKR)
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--surface-elevated)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
                    {['today', 'week', 'month', 'year'].map((range) => (
                        <button
                            key={range}
                            className={`btn ${dateRange === range ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setDateRange(range)}
                            style={{
                                padding: '6px 14px',
                                fontSize: '12px',
                                textTransform: 'capitalize',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)'
                            }}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        Calculating Financial Aggregates...
                    </div>
                    <p style={{ margin: 0, fontSize: '13px' }}>Compiling revenue from delivered orders and expenses</p>
                </div>
            ) : (
                <>
                    {/* Main Metrics */}
                    <div style={{ display: 'flex', gap: '18px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <MetricCard
                            Icon={FinanceIcon}
                            label="Total Revenue"
                            value={formatCurrency(summary.revenue)}
                            color="#10b981"
                            subtext="From delivered orders"
                            isPositive={true}
                        />
                        <MetricCard
                            Icon={ExpensesIcon}
                            label="Total Expenses"
                            value={formatCurrency(summary.expenses)}
                            color="#f59e0b"
                            subtext="Operational and inventory purchases"
                            isPositive={false}
                        />
                        <MetricCard
                            Icon={isProfitable ? TrendingUpIcon : AlertCircleIcon}
                            label="Net Operating Profit"
                            value={formatCurrency(summary.profit)}
                            color={!hasData ? 'var(--text-muted)' : isProfitable ? '#10b981' : summary.profit === 0 ? '#f59e0b' : '#ef4444'}
                            subtext={hasData ? `${summary.profitMargin}% profit margin` : 'No data in this window'}
                            isPositive={isProfitable}
                        />
                    </div>

                    {/* Profit Breakdown */}
                    <div style={{
                        backgroundColor: 'var(--surface-card)',
                        border: '1px solid var(--surface-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '24px',
                        marginBottom: '24px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                    }}>
                        <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: 700 }}>
                            Cashflow Ratio
                        </h2>

                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Gross Revenue</span>
                                <span style={{ color: '#10b981', fontWeight: 700 }}>{formatCurrency(summary.revenue)}</span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: 'var(--surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Operating Expenses</span>
                                <span style={{ color: '#f59e0b', fontWeight: 700 }}>{formatCurrency(summary.expenses)}</span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: 'var(--surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: summary.revenue > 0 ? `${Math.min((summary.expenses / summary.revenue) * 100, 100)}%` : '0%',
                                    backgroundColor: '#f59e0b',
                                    borderRadius: '4px'
                                }} />
                            </div>
                        </div>

                        <div style={{
                            borderTop: '1px solid var(--surface-border)',
                            paddingTop: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Net Retained Profit</span>
                            <span style={{
                                fontSize: '22px',
                                fontWeight: 800,
                                color: isProfitable ? '#10b981' : '#ef4444'
                            }}>
                                {formatCurrency(summary.profit)}
                            </span>
                        </div>
                    </div>

                    {/* Operational Summary Banner */}
                    <div style={{
                        backgroundColor: !hasData ? 'rgba(100,100,100,0.08)' : isProfitable ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        border: `1px solid ${!hasData ? 'rgba(100,100,100,0.2)' : isProfitable ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px',
                        marginBottom: '32px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                backgroundColor: isProfitable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                {isProfitable ? <CheckIcon width={18} height={18} stroke="#10b981" /> : <AlertCircleIcon width={18} height={18} stroke="#ef4444" />}
                            </div>
                            <div>
                                <h3 style={{
                                    margin: '0 0 6px 0',
                                    color: !hasData ? 'var(--text-secondary)' : isProfitable ? '#10b981' : '#ef4444',
                                    fontSize: '15px',
                                    fontWeight: 700
                                }}>
                                    {!hasData
                                        ? 'No Completed Cycles Yet'
                                        : isProfitable
                                            ? 'Store Operations are Net Profitable'
                                            : summary.profit === 0
                                                ? 'Breaking Even'
                                                : 'Expenses Exceed Revenue'}
                                </h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
                                    {!hasData
                                        ? 'Record operational expenses and ensure customer orders are marked as delivered to view real-time profitability.'
                                        : isProfitable
                                            ? `Operating at a healthy ${summary.profitMargin}% net margin over the selected time window.`
                                            : summary.profit === 0
                                                ? 'Gross revenue matches total expenses exactly. Additional order volume is needed to generate positive yield.'
                                                : `Expenses exceed gross earnings by ${formatCurrency(Math.abs(summary.profit))}. Review supplier prices and menu item cost structures.`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ======================================================== */}
                    {/* CASHIER SHIFT DRAWERS & RIDER CASH FLOW SECTION */}
                    {/* ======================================================== */}
                    {(() => {
                        const activeShiftsList = shifts.filter(s => s.status === 'open');
                        const closedUnsettledShifts = shifts.filter(s => s.status === 'closed');

                        const totalDrawerCash = activeShiftsList.reduce((sum, s) =>
                            sum + (Number(s.openingFloat) || 0) + (Number(s.counterCashSales) || 0) + (Number(s.riderCashCollected) || 0), 0);

                        const totalClosedUnsettledCash = closedUnsettledShifts.reduce((sum, s) =>
                            sum + (Number(s.openingFloat) || 0) + (Number(s.counterCashSales) || 0) + (Number(s.riderCashCollected) || 0), 0);

                        const totalFloatInCirculation = activeShiftsList.reduce((sum, s) =>
                            sum + (Number(s.openingFloat) || 0), 0);

                        // Rider cash currently floating
                        const riderCashMap = riders.map(rider => {
                            const rOrders = orders.filter(o => o.assignedRiderId === rider.id && o.status === 'delivered');
                            const unsettled = rOrders
                                .filter(o => {
                                    const isCOD = (o.paymentMethod || 'COD').toUpperCase() === 'COD';
                                    return isCOD && o.cashSettled !== true;
                                })
                                .reduce((s, o) => s + (Number(o.total) || 0), 0);
                            return { ...rider, unsettledCash: unsettled };
                        }).filter(r => r.unsettledCash > 0);

                        const totalRiderFloatingCash = riderCashMap.reduce((s, r) => s + r.unsettledCash, 0);

                        return (
                            <div style={{ marginTop: '36px', borderTop: '2px solid var(--surface-border)', paddingTop: '28px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span>💵</span>
                                            <span>Live Cash Flow & Drawer Settlements</span>
                                        </h2>
                                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            Track physical cash in cashier drawers, starting change (peti), and couriers' collected cash
                                        </p>
                                    </div>
                                </div>

                                {/* Top Cash Overview Cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{
                                        backgroundColor: 'var(--surface-card)',
                                        border: '1px solid var(--surface-border)',
                                        borderLeft: '4px solid #10b981',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '18px'
                                    }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Counter Drawers</div>
                                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>
                                            {formatCurrency(totalDrawerCash)}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            Across {activeShiftsList.length} running cashier shift(s)
                                        </div>
                                    </div>

                                    <div style={{
                                        backgroundColor: 'var(--surface-card)',
                                        border: '1px solid var(--surface-border)',
                                        borderLeft: '4px solid var(--color-accent, #FFB400)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '18px'
                                    }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Closed Shifts Awaiting Owner</div>
                                        <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--color-accent, #FFB400)', marginTop: '4px' }}>
                                            {formatCurrency(totalClosedUnsettledCash)}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {closedUnsettledShifts.length} shift(s) ready for collection
                                        </div>
                                    </div>

                                    <div style={{
                                        backgroundColor: 'var(--surface-card)',
                                        border: '1px solid var(--surface-border)',
                                        borderLeft: '4px solid #3b82f6',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '18px'
                                    }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Peti (Starting Floats)</div>
                                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#3b82f6', marginTop: '4px' }}>
                                            {formatCurrency(totalFloatInCirculation)}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            Starting change in circulation
                                        </div>
                                    </div>

                                    <div style={{
                                        backgroundColor: 'var(--surface-card)',
                                        border: '1px solid var(--surface-border)',
                                        borderLeft: '4px solid #f59e0b',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '18px'
                                    }}>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Rider Floating Cash (COD)</div>
                                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>
                                            {formatCurrency(totalRiderFloatingCash)}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            Held by {riderCashMap.length} delivery courier(s)
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 1: Closed Shifts Awaiting Owner Settlement */}
                                {closedUnsettledShifts.length > 0 && (
                                    <div style={{
                                        backgroundColor: 'rgba(255, 180, 0, 0.05)',
                                        border: '2px solid var(--color-accent, #FFB400)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '20px',
                                        marginBottom: '24px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                            <span style={{ fontSize: '24px' }}>🔔</span>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--color-accent, #FFB400)' }}>
                                                    Shift Handover Ready for Owner Collection ({closedUnsettledShifts.length})
                                                </h3>
                                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    Cashiers have ended their shift. Collect physical cash from drawer and click "Settle & Collect Cash".
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                                            {closedUnsettledShifts.map(shift => {
                                                const total = (Number(shift.openingFloat) || 0) + (Number(shift.counterCashSales) || 0) + (Number(shift.riderCashCollected) || 0);
                                                const closedTime = shift.closedAt?.seconds
                                                    ? new Date(shift.closedAt.seconds * 1000).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
                                                    : 'Just now';

                                                return (
                                                    <div
                                                        key={shift.id}
                                                        style={{
                                                            backgroundColor: 'var(--surface-card)',
                                                            border: '1px solid var(--surface-border)',
                                                            borderRadius: '10px',
                                                            padding: '16px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'space-between'
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                                <div>
                                                                    <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{shift.cashierName}</strong>
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ended: {closedTime}</div>
                                                                </div>
                                                                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255, 180, 0, 0.2)', color: 'var(--color-accent)', fontWeight: 700 }}>
                                                                    AWAITING SETTLEMENT
                                                                </span>
                                                            </div>

                                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.6' }}>
                                                                <div>Peti (Opening Float): <strong style={{ color: '#3b82f6' }}>Rs. {shift.openingFloat || 0}</strong></div>
                                                                <div>Counter Sales: <strong style={{ color: '#10b981' }}>+Rs. {shift.counterCashSales || 0}</strong></div>
                                                                <div>Rider Deliveries: <strong style={{ color: '#10b981' }}>+Rs. {shift.riderCashCollected || 0}</strong></div>
                                                                {shift.closingNotes && (
                                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                                                                        Note: "{shift.closingNotes}"
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div style={{ borderTop: '1px dashed var(--surface-border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Handover Cash</div>
                                                                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-accent)' }}>
                                                                    Rs. {total}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleSettleShift(shift)}
                                                                disabled={settlingShiftId === shift.id}
                                                                className="btn btn-primary"
                                                                style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 800 }}
                                                            >
                                                                {settlingShiftId === shift.id ? 'Settling...' : '✓ Settle & Collect Cash'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* SECTION 2: Currently Open Shift Drawers */}
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>🟢</span>
                                        <span>Active Cashier Drawers Currently Running ({activeShiftsList.length})</span>
                                    </h3>

                                    {activeShiftsList.length === 0 ? (
                                        <div style={{ padding: '20px', borderRadius: '10px', backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                            No active cashier shifts right now. Cashiers unlock terminal drawers using their 4-digit PIN in the Orders tab.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                                            {activeShiftsList.map(shift => {
                                                const total = (Number(shift.openingFloat) || 0) + (Number(shift.counterCashSales) || 0) + (Number(shift.riderCashCollected) || 0);
                                                const openedTime = shift.openedAt?.seconds
                                                    ? new Date(shift.openedAt.seconds * 1000).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
                                                    : 'Just now';

                                                return (
                                                    <div
                                                        key={shift.id}
                                                        style={{
                                                            backgroundColor: 'var(--surface-card)',
                                                            border: '1px solid #10b981',
                                                            borderRadius: '10px',
                                                            padding: '16px'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                            <div>
                                                                <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{shift.cashierName}</strong>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Opened: {openedTime}</div>
                                                            </div>
                                                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 700 }}>
                                                                ACTIVE SHIFT
                                                            </span>
                                                        </div>

                                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.6' }}>
                                                            <div>Peti (Starting Change): <strong style={{ color: '#3b82f6' }}>Rs. {shift.openingFloat || 0}</strong></div>
                                                            <div>Counter Cash Sales: <strong style={{ color: '#10b981' }}>+Rs. {shift.counterCashSales || 0}</strong></div>
                                                            <div>Rider Drops Received: <strong style={{ color: '#10b981' }}>+Rs. {shift.riderCashCollected || 0}</strong></div>
                                                            <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Orders Processed: {shift.ordersCount || 0}</div>
                                                        </div>

                                                        <div style={{ borderTop: '1px dashed var(--surface-border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Drawer Cash:</span>
                                                            <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-accent, #FFB400)' }}>
                                                                Rs. {total}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* SECTION 3: Delivery Rider Floating Cash */}
                                <div>
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>🛵</span>
                                        <span>Delivery Riders Carrying Undeposited Cash ({riderCashMap.length})</span>
                                    </h3>

                                    {riderCashMap.length === 0 ? (
                                        <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                            ✓ All delivery courier cash has been collected and deposited into cashier drawers.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                                            {riderCashMap.map(r => (
                                                <div
                                                    key={r.id}
                                                    style={{
                                                        backgroundColor: 'var(--surface-card)',
                                                        border: '1px solid var(--surface-border)',
                                                        borderRadius: '8px',
                                                        padding: '14px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{r.name}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.phone || r.email}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>To Handover</div>
                                                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#f59e0b' }}>
                                                            Rs. {r.unsettledCash}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </>
            )}
        </div>
    );
};

export default FinancialDashboard;
