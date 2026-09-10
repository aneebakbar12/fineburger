import React, { useState, useEffect } from 'react';
import { getFinancialSummary } from '../services/firebase';
import { getPKTRange, formatCurrency } from '../utils/dateUtils';
import {
    FinanceIcon,
    ExpensesIcon,
    TrendingUpIcon,
    CheckIcon,
    AlertCircleIcon
} from '../components/Icons';
import '../styles/admin.css';

const FinancialDashboard = () => {
    const [summary, setSummary] = useState({
        revenue: 0,
        expenses: 0,
        profit: 0,
        profitMargin: 0
    });
    const [dateRange, setDateRange] = useState('month');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFinancialData();
    }, [dateRange]);

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
                        padding: '20px'
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
                </>
            )}
        </div>
    );
};

export default FinancialDashboard;
