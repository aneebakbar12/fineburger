import React, { useState, useEffect } from 'react';
import { getFinancialSummary } from '../services/firebase';
import { getPKTRange, formatCurrency } from '../utils/dateUtils';
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
        // Use PKT for correct date ranges
        const { startDate, endDate } = getPKTRange(dateRange);

        console.log(`Fetching financial data:`, { dateRange, startDate, endDate });

        const data = await getFinancialSummary(startDate, endDate);
        setSummary(data);
        setLoading(false);
    };

    const MetricCard = ({ icon, label, value, color, subtext }) => (
        <div style={{
            backgroundColor: '#1a1a1a',
            border: `2px solid ${color}`,
            borderRadius: '12px',
            padding: '24px',
            flex: 1,
            minWidth: '250px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '32px' }}>{icon}</span>
                <div style={{ fontSize: '14px', color: '#888' }}>{label}</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: color, marginBottom: '8px' }}>
                {value}
            </div>
            {subtext && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                    {subtext}
                </div>
            )}
        </div>
    );

    const isProfitable = summary.profit >= 0;

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">💰 Financial Dashboard</h1>
                    <p className="admin-subtitle">Track revenue, expenses, and profitability (PKR)</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className={`btn ${dateRange === 'today' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setDateRange('today')}
                    >
                        Today
                    </button>
                    <button
                        className={`btn ${dateRange === 'week' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setDateRange('week')}
                    >
                        Week
                    </button>
                    <button
                        className={`btn ${dateRange === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setDateRange('month')}
                    >
                        Month
                    </button>
                    <button
                        className={`btn ${dateRange === 'year' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setDateRange('year')}
                    >
                        Year
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                    Loading financial data...
                </div>
            ) : (
                <>
                    {/* Main Metrics */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <MetricCard
                            icon="💵"
                            label="Total Revenue"
                            value={formatCurrency(summary.revenue)}
                            color="#4ade80"
                            subtext="From completed orders"
                        />
                        <MetricCard
                            icon="💸"
                            label="Total Expenses"
                            value={formatCurrency(summary.expenses)}
                            color="#f59e0b"
                            subtext="All business costs"
                        />
                        <MetricCard
                            icon={isProfitable ? "✅" : "❌"}
                            label="Net Profit"
                            value={formatCurrency(summary.profit)}
                            color={isProfitable ? "#4ade80" : "#ef4444"}
                            subtext={`${summary.profitMargin}% profit margin`}
                        />
                    </div>

                    {/* Profit Breakdown */}
                    <div style={{
                        backgroundColor: '#1a1a1a',
                        border: '2px solid #3b82f6',
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '24px'
                    }}>
                        <h2 style={{ marginBottom: '20px', color: 'white', fontSize: '20px' }}>
                            📊 Financial Breakdown
                        </h2>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#888' }}>Revenue</span>
                                <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{formatCurrency(summary.revenue)}</span>
                            </div>
                            <div style={{
                                height: '8px',
                                backgroundColor: '#2a2a2a',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: '100%',
                                    backgroundColor: '#4ade80'
                                }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#888' }}>Expenses</span>
                                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{formatCurrency(summary.expenses)}</span>
                            </div>
                            <div style={{
                                height: '8px',
                                backgroundColor: '#2a2a2a',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: summary.revenue > 0 ? `${Math.min((summary.expenses / summary.revenue) * 100, 100)}%` : '0%',
                                    backgroundColor: '#f59e0b'
                                }} />
                            </div>
                        </div>

                        <div style={{
                            borderTop: '1px solid #333',
                            paddingTop: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>Net Profit</span>
                            <span style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: isProfitable ? '#4ade80' : '#ef4444'
                            }}>
                                {formatCurrency(summary.profit)}
                            </span>
                        </div>
                    </div>

                    {/* Insights */}
                    <div style={{
                        backgroundColor: isProfitable ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${isProfitable ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '8px',
                        padding: '20px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>{isProfitable ? '🎉' : '⚠️'}</span>
                            <div>
                                <h3 style={{
                                    margin: '0 0 8px 0',
                                    color: isProfitable ? '#4ade80' : '#ef4444',
                                    fontSize: '16px'
                                }}>
                                    {isProfitable ? 'Business is Profitable!' : 'Business is in Loss'}
                                </h3>
                                <p style={{ margin: 0, color: '#aaa', fontSize: '14px' }}>
                                    {isProfitable
                                        ? `You're making ${summary.profitMargin}% profit margin. Keep up the good work!`
                                        : `Your expenses exceed revenue by ${formatCurrency(Math.abs(summary.profit))}. Consider reducing costs or increasing prices.`
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
