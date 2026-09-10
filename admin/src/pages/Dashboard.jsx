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
    AlertCircleIcon,
    CheckIcon
} from '../components/Icons';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        pendingOrders: 0
    });
    const [graphData, setGraphData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [aiInsights, setAiInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const unsubscribeRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            const categories = await getCategories();
            const items = await getMenuItems();
            if (cancelled) return;

            unsubscribeRef.current = subscribeToOrders((orders) => {
                processAnalytics(orders, items, categories);
                setLoading(false);
            });
        };

        fetchData();
        return () => {
            cancelled = true;
            if (unsubscribeRef.current) unsubscribeRef.current();
        };
    }, []);

    const processAnalytics = (orders, items, categories) => {
        const deliveredOrders = orders.filter(o => o.status === 'delivered');
        const totalRevenue = deliveredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const avgOrderValue = deliveredOrders.length > 0 ? (totalRevenue / deliveredOrders.length).toFixed(0) : 0;

        setStats({
            totalRevenue,
            totalOrders: orders.length,
            avgOrderValue,
            pendingOrders
        });

        // Last 7 Days Revenue
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const revenueByDay = last7Days.map(date => {
            const dayOrders = orders.filter(o => {
                if (!o.createdAt) return false;
                const orderDate = new Date(o.createdAt.seconds * 1000).toISOString().split('T')[0];
                return orderDate === date && o.status === 'delivered';
            });
            return {
                name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                sales: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
            };
        });
        setGraphData(revenueByDay);

        // Category Distribution
        const categoryCounts = {};
        orders.forEach(order => {
            (order.items || []).forEach(item => {
                const originalItem = items.find(i => i.id === item.id);
                if (originalItem) {
                    const catId = originalItem.categoryId;
                    const catName = categories.find(c => c.id === catId)?.name || 'Other';
                    categoryCounts[catName] = (categoryCounts[catName] || 0) + (item.quantity || 1);
                }
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
        const lowStock = items.filter(i => (i.stockLevel || 0) <= (i.lowStockThreshold || 10) && i.available);
        if (lowStock.length > 0) {
            insights.push({
                type: 'critical',
                title: 'Inventory Alert',
                message: `${lowStock.length} items critically low on stock. Check ${lowStock.slice(0, 2).map(i => i.name).join(', ')}.`
            });
        }

        // 2. Sales Velocity
        const todayStr = new Date().toISOString().split('T')[0];
        const todaySales = orders.filter(o => {
            if (!o.createdAt) return false;
            return new Date(o.createdAt.seconds * 1000).toISOString().split('T')[0] === todayStr && o.status === 'delivered';
        }).reduce((sum, o) => sum + (o.total || 0), 0);

        if (todaySales > 0) {
            insights.push({
                type: 'positive',
                title: 'Today\'s Sales Activity',
                message: `Generated Rs. ${todaySales.toLocaleString()} today. Keeping a healthy pace.`
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
        setLoading(false);
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

            {/* KPI Cards Grid */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <KPICard
                    title="Total Orders"
                    value={stats.totalOrders}
                    Icon={OrdersIcon}
                    accentColor="#3b82f6"
                    badge="All Time"
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
                    value={`${stats.totalOrders > 0 ? Math.round((orders.filter(o => o.status === 'delivered').length / stats.totalOrders) * 100) : 0}%`}
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
                                    formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Delivered Sales']}
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

                {/* Operations & AI Assistant */}
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
            gap: '8px'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = color;
            e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--surface-elevated)';
            e.currentTarget.style.borderColor = 'var(--surface-border)';
            e.currentTarget.style.transform = 'translateY(0)';
        }}
    >
        <div style={{ color }}>
            <Icon width={22} height={22} stroke={color} />
        </div>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' }}>{label}</span>
    </button>
);

export default Dashboard;
