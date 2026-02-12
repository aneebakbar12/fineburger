import React, { useState, useEffect } from 'react';
import { getCategories, getMenuItems, subscribeToOrders } from '../services/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
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

    useEffect(() => {
        const fetchData = async () => {
            // 1. Fetch Static Data
            const categories = await getCategories();
            const items = await getMenuItems();

            // 2. Subscribe to Orders for Real-time Analytics
            const unsubscribe = subscribeToOrders((orders) => {
                processAnalytics(orders, items, categories);
            });

            return () => unsubscribe();
        };

        fetchData();
    }, []);

    const processAnalytics = (orders, items, categories) => {
        // --- KPI Calculations ---
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const avgOrderValue = orders.length > 0 ? (totalRevenue / orders.length).toFixed(0) : 0;

        setStats({
            totalRevenue,
            totalOrders: orders.length,
            avgOrderValue,
            pendingOrders
        });

        // --- Graph Data (Last 7 Days Revenue) ---
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const revenueByDay = last7Days.map(date => {
            const dayOrders = orders.filter(o => {
                if (!o.createdAt) return false;
                const orderDate = new Date(o.createdAt.seconds * 1000).toISOString().split('T')[0];
                return orderDate === date;
            });
            return {
                name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                sales: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0)
            };
        });
        setGraphData(revenueByDay);

        // --- Category Distribution ---
        const categoryCounts = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                // Find item category (would be better if item stored categoryName, but we map it)
                const originalItem = items.find(i => i.id === item.id);
                if (originalItem) {
                    const catId = originalItem.categoryId;
                    const catName = categories.find(c => c.id === catId)?.name || 'Other';
                    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
                }
            });
        });

        const pieData = Object.keys(categoryCounts).map(key => ({
            name: key,
            value: categoryCounts[key]
        }));
        setCategoryData(pieData);

        // --- AI Insights Generation ---
        const insights = [];

        // 1. Stock Intelligence
        const lowStock = items.filter(i => i.stockLevel <= (i.lowStockThreshold || 5) && i.available);
        if (lowStock.length > 0) {
            insights.push({
                type: 'critical',
                icon: '⚠️',
                title: 'Inventory Alert',
                message: `${lowStock.length} items are critically low on stock. Restock suggested for: ${lowStock.slice(0, 2).map(i => i.name).join(', ')}.`
            });
        }

        // 2. Sales Trend Intelligence
        const todayStr = new Date().toISOString().split('T')[0];
        const todaySales = orders.filter(o => {
            if (!o.createdAt) return false;
            return new Date(o.createdAt.seconds * 1000).toISOString().split('T')[0] === todayStr;
        }).reduce((sum, o) => sum + o.total, 0);

        if (todaySales > 5000) {
            insights.push({
                type: 'positive',
                icon: '🚀',
                title: 'High Performance',
                message: `Sales are booming today! You've generated Rs. ${todaySales} so far. Getting close to daily target.`
            });
        }

        // 3. Product Intelligence
        if (items.length > 0) {
            const topItem = pieData.sort((a, b) => b.value - a.value)[0];
            if (topItem) {
                insights.push({
                    type: 'info',
                    icon: '💡',
                    title: 'Popular Demand',
                    message: `Customers are loving "${topItem.name}". Consider adding a special offer to boost it further.`
                });
            }
        }

        // 4. Operational Health
        if (pendingOrders > 5) {
            insights.push({
                type: 'warning',
                icon: '⏱️',
                title: 'Kitchen Load',
                message: `Kitchen is getting busy with ${pendingOrders} pending orders. Consider pausing online orders temporarily if overwhelmed.`
            });
        }

        if (insights.length === 0) {
            insights.push({ type: 'info', icon: '🤖', title: 'System Status', message: 'All systems operational. No critical anomalies detected.' });
        }

        setAiInsights(insights);
        setLoading(false);
    };

    const COLORS = ['#FFB400', '#FF6B6B', '#4ADE80', '#3B82F6', '#9333EA'];

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Dashboard</h1>
                    <p className="admin-subtitle">Live Business Intelligence</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#888' }}>Run Rate</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80' }}>
                        Rs. {stats.totalRevenue.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '30px' }}>
                <KPICard title="Total Orders" value={stats.totalOrders} icon="📦" trend="+12%" trendUp={true} />
                <KPICard title="Pending Orders" value={stats.pendingOrders} icon="⏳" trend={stats.pendingOrders > 5 ? "High Load" : "Normal"} trendUp={stats.pendingOrders < 5} />
                <KPICard title="Avg. Order Value" value={`Rs. ${stats.avgOrderValue}`} icon="💰" trend="+5%" trendUp={true} />
                <KPICard title="Menu Items" value={stats.totalRevenue > 0 ? "Active" : "Inactive"} icon="🍔" trend="Stable" trendUp={true} />
            </div>

            <div className="dashboard-main-grid">
                {/* Main Graph */}
                <div style={{ backgroundColor: '#1a1a1a', padding: '25px', borderRadius: '16px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, color: 'white' }}>Revenue Trend</h3>
                        <span style={{ color: '#888', fontSize: '13px' }}>Last 7 Days</span>
                    </div>
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer>
                            <LineChart data={graphData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ color: '#FFB400' }}
                                />
                                <Line type="monotone" dataKey="sales" stroke="#FFB400" strokeWidth={3} dot={{ r: 4, fill: '#FFB400' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Insights Panel */}
                <div style={{ backgroundColor: '#1a1a1a', padding: '25px', borderRadius: '16px', border: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(45deg, #FFB400, #FF6B6B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✨</div>
                        <h3 style={{ margin: 0, background: 'linear-gradient(90deg, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Assistant</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', maxHeight: '300px' }}>
                        {aiInsights.map((insight, idx) => (
                            <div key={idx} style={{
                                padding: '15px',
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                borderLeft: `3px solid ${insight.type === 'critical' ? '#FF6B6B' : insight.type === 'positive' ? '#4ADE80' : '#FFB400'}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '16px' }}>{insight.icon}</span>
                                    <span style={{ fontWeight: 'bold', color: 'white', fontSize: '14px' }}>{insight.title}</span>
                                </div>
                                <p style={{ margin: 0, color: '#aaa', fontSize: '13px', lineHeight: '1.4' }}>
                                    {insight.message}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="dashboard-secondary-grid">
                {/* Category Pie Chart */}
                <div style={{ backgroundColor: '#1a1a1a', padding: '25px', borderRadius: '16px', border: '1px solid #333' }}>
                    <h3 style={{ margin: '0 0 20px 0', color: 'white' }}>Category Sales</h3>
                    <div style={{ width: '100%', height: '250px' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#000', borderRadius: '8px', border: 'none' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '15px', justifyContent: 'center' }}>
                        {categoryData.map((entry, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>
                                {entry.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions (Mini) */}
                <div style={{ backgroundColor: '#1a1a1a', padding: '25px', borderRadius: '16px', border: '1px solid #333' }}>
                    <h3 style={{ margin: '0 0 20px 0', color: 'white' }}>Quick Actions</h3>
                    <div className="quick-actions-grid">
                        <ActionButton label="Add Item" icon="Example" onClick={() => window.location.href = '/menu-items'} color="#FFB400" />
                        <ActionButton label="Categories" icon="Example" onClick={() => window.location.href = '/categories'} color="#3B82F6" />
                        <ActionButton label="Inventory" icon="Example" onClick={() => window.location.href = '/inventory'} color="#4ADE80" />
                        <ActionButton label="Settings" icon="Example" onClick={() => window.location.href = '/settings'} color="#9333EA" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ title, value, icon, trend, trendUp }) => (
    <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '14px', border: '1px solid #333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: 'rgba(255,180,0,0.1)', color: '#FFB400',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
            }}>
                {icon}
            </div>
            {trend && (
                <div style={{
                    fontSize: '12px', fontWeight: 'bold',
                    color: trendUp ? '#4ADE80' : '#FF6B6B',
                    backgroundColor: trendUp ? 'rgba(74,222,128,0.1)' : 'rgba(255,107,107,0.1)',
                    padding: '4px 8px', borderRadius: '6px'
                }}>
                    {trend}
                </div>
            )}
        </div>
        <div style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{value}</div>
        <div style={{ fontSize: '13px', color: '#888' }}>{title}</div>
    </div>
);

const ActionButton = ({ label, onClick, color }) => (
    <button onClick={onClick} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #333',
        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', gap: '10px'
    }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = color; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = '#333'; }}
    >
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 10px ${color}` }}></div>
        <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{label}</span>
    </button>
);

export default Dashboard;
