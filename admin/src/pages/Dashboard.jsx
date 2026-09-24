import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories, getMenuItems, subscribeToOrders } from '../services/firebase';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    OrdersIcon,
    FinanceIcon,
    MenuIcon,
    InventoryIcon,
    CategoryIcon,
    SettingsIcon,
    ClockIcon,
    TrendingUpIcon,
    AlertCircleIcon
} from '../components/Icons';

const parseOrderDateStr = (createdAt) => {
    if (!createdAt) return null;
    try {
        let d;
        if (typeof createdAt.toDate === 'function') {
            d = createdAt.toDate();
        } else if (createdAt.seconds !== undefined && createdAt.seconds !== null) {
            d = new Date(createdAt.seconds * 1000);
        } else {
            d = new Date(createdAt);
        }
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
    } catch {
        return null;
    }
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        pendingOrders: 0,
        completionRate: 0
    });
    const [graphData, setGraphData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [aiInsights, setAiInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('all'); // 'today', '7days', '30days', 'custom', 'all'
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');
    const [rawOrders, setRawOrders] = useState([]);
    const [rawItems, setRawItems] = useState([]);
    const [rawCategories, setRawCategories] = useState([]);
    const unsubscribeRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            try {
                const [categories, items] = await Promise.all([
                    getCategories(),
                    getMenuItems()
                ]);
                if (cancelled) return;

                setRawItems(items || []);
                setRawCategories(categories || []);

                unsubscribeRef.current = subscribeToOrders((orders) => {
                    if (cancelled) return;
                    setRawOrders(orders || []);
                    setLoading(false);
                });
            } catch (err) {
                console.error("Error loading dashboard data:", err);
                if (!cancelled) setLoading(false);
            }
        };

        fetchData();
        return () => {
            cancelled = true;
            if (unsubscribeRef.current) unsubscribeRef.current();
        };
    }, []);

    useEffect(() => {
        if (rawOrders.length > 0 || !loading) {
            processAnalytics(rawOrders, rawItems, rawCategories);
        }
    }, [rawOrders, rawItems, rawCategories, dateRange, customDateFrom, customDateTo]);

    const getDateFilteredOrders = (orders) => {
        if (dateRange === 'all') return orders;

        const now = new Date();
        let startDate = null;
        let endDate = null;

        if (dateRange === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        } else if (dateRange === '7days') {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
        } else if (dateRange === '30days') {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 30);
        } else if (dateRange === 'custom') {
            if (customDateFrom) startDate = new Date(customDateFrom);
            if (customDateTo) endDate = new Date(customDateTo + 'T23:59:59');
        }

        return orders.filter(order => {
            const raw = order.createdAt;
            let orderDate;
            if (raw && typeof raw.toDate === 'function') {
                orderDate = raw.toDate();
            } else if (raw && raw.seconds !== undefined) {
                orderDate = new Date(raw.seconds * 1000);
            } else if (raw) {
                orderDate = new Date(raw);
            }
            if (!orderDate || isNaN(orderDate.getTime())) return false;
            if (startDate && orderDate < startDate) return false;
            if (endDate && orderDate > endDate) return false;
            return true;
        });
    };

    const processAnalytics = (orders, items, categories) => {
        try {
            const filtered = getDateFilteredOrders(orders);
            const deliveredOrders = filtered.filter(o => o.status === 'delivered');
            const totalRevenue = deliveredOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
            const pendingOrders = filtered.filter(o => o.status === 'pending').length;
            const avgOrderValue = deliveredOrders.length > 0 ? Math.round(totalRevenue / deliveredOrders.length) : 0;
            const completionRate = filtered.length > 0 ? Math.round((deliveredOrders.length / filtered.length) * 100) : 0;

            setStats({
                totalRevenue,
                totalOrders: filtered.length,
                avgOrderValue,
                pendingOrders,
                completionRate
            });

            // Last 7 Days Revenue
            const last7Days = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();

            const revenueByDay = last7Days.map(date => {
                const dayOrders = filtered.filter(o => {
                    const orderDate = parseOrderDateStr(o.createdAt);
                    return orderDate === date && o.status === 'delivered';
                });
                return {
                    name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                    sales: dayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
                };
            });
            setGraphData(revenueByDay);

            // Category Distribution
            const categoryCounts = {};
            filtered.forEach(order => {
                (order.items || []).forEach(item => {
                    const originalItem = items.find(i => i.id === item.id);
                    const catId = originalItem?.categoryId || item.categoryId;
                    const catName = categories.find(c => c.id === catId)?.name || item.categoryName || 'Other';
                    categoryCounts[catName] = (categoryCounts[catName] || 0) + (Number(item.quantity) || 1);
                });
            });

            const pieData = Object.keys(categoryCounts).map(key => ({
                name: key,
                value: categoryCounts[key]
            }));
            setCategoryData(pieData.length > 0 ? pieData : [{ name: 'Burgers', value: 1 }]);

            // Operational & AI Insights
            const insights = [];

            // 1. Stock Intelligence
            const lowStock = items.filter(i => (Number(i.stockLevel) || 0) <= (Number(i.lowStockThreshold) || 10) && i.available !== false);
            if (lowStock.length > 0) {
                insights.push({
                    type: 'critical',
                    title: 'Inventory Notice',
                    message: `${lowStock.length} items low on stock (${lowStock.slice(0, 2).map(i => i.name).join(', ')}).`
                });
            }

            // 2. Sales Velocity
            const todayStr = new Date().toISOString().split('T')[0];
            const todaySales = filtered.filter(o => {
                const orderDate = parseOrderDateStr(o.createdAt);
                return orderDate === todayStr && o.status === 'delivered';
            }).reduce((sum, o) => sum + (Number(o.total) || 0), 0);

            if (todaySales > 0) {
                insights.push({
                    type: 'positive',
                    title: "Today's Delivered Sales",
                    message: `Rs. ${todaySales.toLocaleString()} delivered today. Operations on track.`
                });
            }

            // 3. Operational Load
            if (pendingOrders > 4) {
                insights.push({
                    type: 'warning',
                    title: 'High Kitchen Volume',
                    message: `Kitchen has ${pendingOrders} pending orders awaiting confirmation.`
                });
            }

            if (insights.length === 0) {
                insights.push({
                    type: 'positive',
                    title: 'Smooth Operations',
                    message: 'All kitchen, menu, and dispatch metrics are healthy.'
                });
            }

            setAiInsights(insights);
        } catch (err) {
            console.error("Error processing dashboard analytics:", err);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#FFB400', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F97316'];

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div className="admin-header" style={{ padding: '20px 24px', marginBottom: '24px' }}>
                <div>
                    <h1 className="admin-title" style={{ fontSize: '24px' }}>Executive Dashboard</h1>
                    <p className="admin-subtitle" style={{ fontSize: '13px', marginTop: '4px' }}>
                        Live Sales Performance & Operations Pulse
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Delivered Revenue</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-accent)' }}>
                        Rs. {stats.totalRevenue.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Date Range Filter */}
            <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: '20px',
                padding: '12px 16px',
                backgroundColor: 'var(--surface-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--surface-border)'
            }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>📅 Period:</span>
                {[
                    { value: 'today', label: 'Today' },
                    { value: '7days', label: 'Last 7 Days' },
                    { value: '30days', label: 'Last 30 Days' },
                    { value: 'all', label: 'All Time' },
                    { value: 'custom', label: 'Custom Range' }
                ].map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setDateRange(opt.value)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: dateRange === opt.value ? '1px solid var(--color-accent)' : '1px solid var(--surface-border)',
                            backgroundColor: dateRange === opt.value ? 'rgba(255, 180, 0, 0.15)' : 'var(--surface-elevated)',
                            color: dateRange === opt.value ? 'var(--color-accent)' : 'var(--text-secondary)',
                            fontWeight: dateRange === opt.value ? 700 : 500,
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
                {dateRange === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                        <input
                            type="date"
                            value={customDateFrom}
                            onChange={(e) => setCustomDateFrom(e.target.value)}
                            style={{
                                padding: '6px 10px',
                                backgroundColor: 'var(--surface-elevated)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--surface-border)',
                                borderRadius: '6px',
                                fontSize: '12px'
                            }}
                        />
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>to</span>
                        <input
                            type="date"
                            value={customDateTo}
                            onChange={(e) => setCustomDateTo(e.target.value)}
                            style={{
                                padding: '6px 10px',
                                backgroundColor: 'var(--surface-elevated)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--surface-border)',
                                borderRadius: '6px',
                                fontSize: '12px'
                            }}
                        />
                    </div>
                )}
            </div>

            {/* KPI Cards Grid */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <KPICard
                    title="Total Orders"
                    value={stats.totalOrders}
                    Icon={OrdersIcon}
                    accentColor="#3b82f6"
                    badge={dateRange === 'all' ? 'All Time' : dateRange === 'today' ? 'Today' : dateRange === '7days' ? '7 Days' : dateRange === '30days' ? '30 Days' : 'Custom'}
                />
                <KPICard
                    title="Pending Queue"
                    value={stats.pendingOrders}
                    Icon={ClockIcon}
                    accentColor="#f59e0b"
                    badge={stats.pendingOrders > 5 ? "High Load" : "Normal"}
                    isAlert={stats.pendingOrders > 5}
                />
                <KPICard
                    title="Avg. Order Value"
                    value={`Rs. ${stats.avgOrderValue}`}
                    Icon={FinanceIcon}
                    accentColor="#10b981"
                    badge="Delivered"
                />
                <KPICard
                    title="Completion Rate"
                    value={`${stats.completionRate || 0}%`}
                    Icon={TrendingUpIcon}
                    accentColor="#FFB400"
                    badge="Fulfilled"
                />
            </div>

            {/* Main Graphs & Insights */}
            <div className="dashboard-main-grid" style={{ gap: '20px', marginBottom: '24px' }}>
                {/* Revenue Trend Chart */}
                <div style={{
                    backgroundColor: 'var(--surface-card)',
                    padding: '24px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--surface-border)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700 }}>
                            Delivered Revenue Trend
                        </h3>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Last 7 Days</span>
                    </div>
                    <div style={{ width: '100%', height: '280px' }}>
                        <ResponsiveContainer>
                            <LineChart data={graphData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--text-secondary)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={{ stroke: 'var(--surface-border)' }}
                                />
                                <YAxis
                                    stroke="var(--text-secondary)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={{ stroke: 'var(--surface-border)' }}
                                    tickFormatter={(v) => `Rs.${v}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--surface-elevated)',
                                        border: '1px solid var(--surface-border)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)'
                                    }}
                                    formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, 'Delivered Sales']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="var(--color-accent)"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: 'var(--color-accent)' }}
                                    activeDot={{ r: 7 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Operations & Intelligence */}
                <div style={{
                    backgroundColor: 'var(--surface-card)',
                    padding: '24px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--surface-border)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: 'rgba(255, 180, 0, 0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <AlertCircleIcon width={16} height={16} stroke="var(--color-accent)" />
                        </div>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700 }}>
                            Operational Intelligence
                        </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '280px' }}>
                        {aiInsights.map((insight, idx) => (
                            <div key={idx} style={{
                                padding: '14px',
                                backgroundColor: 'var(--surface-elevated)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: `3px solid ${
                                    insight.type === 'critical' ? '#ef4444' :
                                    insight.type === 'warning' ? '#f59e0b' : '#10b981'
                                }`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                                        {insight.title}
                                    </span>
                                </div>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.4' }}>
                                    {insight.message}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Secondary Grid: Category Distribution & Quick Navigation */}
            <div className="dashboard-secondary-grid" style={{ gap: '20px' }}>
                {/* Category Pie Chart */}
                <div style={{
                    backgroundColor: 'var(--surface-card)',
                    padding: '24px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--surface-border)'
                }}>
                    <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700 }}>
                        Category Distribution
                    </h3>
                    <div style={{ width: '100%', height: '220px' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--surface-elevated)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--surface-border)',
                                        color: 'white'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
                        {categoryData.map((entry, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span>{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Action Navigation */}
                <div style={{
                    backgroundColor: 'var(--surface-card)',
                    padding: '24px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--surface-border)'
                }}>
                    <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700 }}>
                        Quick Console Actions
                    </h3>
                    <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                        <ActionButton
                            label="Menu Items"
                            Icon={MenuIcon}
                            onClick={() => navigate('/menu-items')}
                            color="var(--color-accent)"
                        />
                        <ActionButton
                            label="Categories"
                            Icon={CategoryIcon}
                            onClick={() => navigate('/categories')}
                            color="#3B82F6"
                        />
                        <ActionButton
                            label="Inventory"
                            Icon={InventoryIcon}
                            onClick={() => navigate('/inventory')}
                            color="#10B981"
                        />
                        <ActionButton
                            label="Settings"
                            Icon={SettingsIcon}
                            onClick={() => navigate('/settings')}
                            color="#8B5CF6"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ title, value, Icon, accentColor, badge, isAlert }) => (
    <div style={{
        backgroundColor: 'var(--surface-card)',
        padding: '20px',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${isAlert ? 'rgba(239, 68, 68, 0.4)' : 'var(--surface-border)'}`,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: `rgba(255, 255, 255, 0.05)`,
                border: `1px solid ${accentColor}33`,
                color: accentColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Icon width={20} height={20} stroke={accentColor} />
            </div>
            {badge && (
                <div style={{
                    fontSize: '11px', fontWeight: 700,
                    color: isAlert ? '#ef4444' : 'var(--text-secondary)',
                    backgroundColor: isAlert ? 'rgba(239, 68, 68, 0.15)' : 'var(--surface-elevated)',
                    border: `1px solid ${isAlert ? 'rgba(239, 68, 68, 0.3)' : 'var(--surface-border)'}`,
                    padding: '2px 8px', borderRadius: '6px'
                }}>
                    {badge}
                </div>
            )}
        </div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {value}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{title}</div>
    </div>
);

const ActionButton = ({ label, Icon, onClick, color }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 12px',
            backgroundColor: 'var(--surface-elevated)',
            border: '1px solid var(--surface-border)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            color: 'var(--text-primary)',
            gap: '8px'
        }}
        onMouseEnter={e => {
            e.currentTarget.style.borderColor = color;
            e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--surface-border)';
            e.currentTarget.style.transform = 'translateY(0)';
        }}
    >
        <Icon width={22} height={22} stroke={color} />
        <span style={{ fontSize: '13px', fontWeight: 600 }}>{label}</span>
    </button>
);

export default Dashboard;
