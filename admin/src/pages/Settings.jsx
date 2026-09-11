import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, addSettings } from '../services/firebase';
import { useToast } from '../context/ToastContext';
import '../styles/admin.css';

const DAYS_OF_WEEK = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
];

const DEFAULT_HOURS = {
    monday: { open: '17:00', close: '03:00' },
    tuesday: { open: '17:00', close: '03:00' },
    wednesday: { open: '17:00', close: '03:00' },
    thursday: { open: '17:00', close: '03:00' },
    friday: { open: '17:00', close: '03:00' },
    saturday: { open: '17:00', close: '03:00' },
    sunday: { open: '17:00', close: '03:00' }
};

// Normalize operating hours so day keys are always lowercase and standard
const normalizeOperatingHours = (rawHours) => {
    const normalized = { ...DEFAULT_HOURS };
    if (!rawHours || typeof rawHours !== 'object') return normalized;

    DAYS_OF_WEEK.forEach(({ key }) => {
        // Find matching key case-insensitively
        const matchingKey = Object.keys(rawHours).find(k => k.toLowerCase().trim() === key);
        if (matchingKey && rawHours[matchingKey]) {
            normalized[key] = {
                open: rawHours[matchingKey].open || '17:00',
                close: rawHours[matchingKey].close || '03:00'
            };
        }
    });

    return normalized;
};

const Settings = () => {
    const toast = useToast();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        storeOpen: true,
        forceOpen: true,
        storeInfo: {
            name: 'Fine Burger & Fast Food (Since 1981)',
            phone: '0321-4854410',
            email: 'info@fineburger.com',
            address: 'Main G.T. Road, Baghbanpura, Lahore'
        },
        operatingHours: DEFAULT_HOURS,
        deliveryFee: 120,
        staffPin: '1234'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const data = await getSettings();
        if (data) {
            setSettings(data);
            setFormData({
                ...data,
                operatingHours: normalizeOperatingHours(data.operatingHours),
                storeOpen: data.storeOpen !== false,
                forceOpen: data.forceOpen !== false,
                storeInfo: {
                    name: data.storeInfo?.name || '',
                    phone: data.storeInfo?.phone || '',
                    email: data.storeInfo?.email || '',
                    address: data.storeInfo?.address || ''
                },
                deliveryFee: data.deliveryFee !== undefined ? data.deliveryFee : 120,
                staffPin: data.staffPin || '1234'
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            operatingHours: normalizeOperatingHours(formData.operatingHours),
            deliveryFee: Number(formData.deliveryFee) || 0
        };

        if (settings) {
            const result = await updateSettings(settings.id, payload);
            if (result.success) {
                toast.success('Store settings saved successfully!');
            } else {
                toast.error('Failed to update settings: ' + result.error);
            }
        } else {
            const result = await addSettings(payload);
            if (result.success) {
                toast.success('Store settings initialized successfully!');
                fetchSettings();
            } else {
                toast.error('Failed to save settings: ' + result.error);
            }
        }

        setLoading(false);
    };

    const updateHours = (dayKey, field, value) => {
        setFormData(prev => ({
            ...prev,
            operatingHours: {
                ...prev.operatingHours,
                [dayKey]: {
                    ...(prev.operatingHours[dayKey] || { open: '17:00', close: '03:00' }),
                    [field]: value
                }
            }
        }));
    };

    return (
        <div style={{ maxWidth: '900px' }}>
            <div className="admin-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="admin-title">Store Settings</h1>
                    <p className="admin-subtitle">Configure operating hours, fulfillment rules, and store information</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Store Status Card */}
                <div className="card" style={{ marginBottom: '24px', padding: '24px', backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
                    <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700 }}>
                        Store Operating Status
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontSize: '16px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.storeOpen}
                                onChange={(e) => setFormData({ ...formData, storeOpen: e.target.checked })}
                                style={{ width: '20px', height: '20px', accentColor: 'var(--color-accent)' }}
                            />
                            <span><strong>Store is Open for Orders</strong> (Turn off to pause taking orders immediately)</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontSize: '16px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.forceOpen || false}
                                onChange={(e) => setFormData({ ...formData, forceOpen: e.target.checked })}
                                style={{ width: '20px', height: '20px', accentColor: 'var(--color-accent)' }}
                            />
                            <span><strong>Force Store Open (24/7 Override)</strong> — Keep store open regardless of clock schedule</span>
                        </label>

                        {formData.forceOpen && (
                            <div style={{
                                padding: '12px 16px',
                                backgroundColor: 'rgba(255, 180, 0, 0.12)',
                                border: '1px solid var(--color-accent)',
                                borderRadius: '8px',
                                color: 'var(--color-accent)',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span style={{ fontSize: '18px' }}>⚡</span>
                                <span>24/7 Manual override is active. Customers can order at any time.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Operating Hours (Ordered Mon-Sun) */}
                <div className="card" style={{ marginBottom: '24px', padding: '24px', backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                            <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
                                Weekly Operating Hours
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                                Ordered Monday through Sunday. Cross-midnight shifts (e.g. 5:00 PM to 3:00 AM) are fully supported.
                            </p>
                        </div>
                    </div>

                    {/* Table Headers */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '160px 1fr 1fr',
                        gap: '16px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid var(--surface-border)',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        <span>Day of Week</span>
                        <span>Opening Time</span>
                        <span>Closing Time</span>
                    </div>

                    {/* Day Rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                        {DAYS_OF_WEEK.map(({ key, label }) => {
                            const hours = formData.operatingHours?.[key] || { open: '17:00', close: '03:00' };

                            return (
                                <div
                                    key={key}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '160px 1fr 1fr',
                                        gap: '16px',
                                        alignItems: 'center',
                                        padding: '6px 0'
                                    }}
                                >
                                    <label style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px' }}>
                                        {label}
                                    </label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={hours.open}
                                        onChange={(e) => updateHours(key, 'open', e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={hours.close}
                                        onChange={(e) => updateHours(key, 'close', e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Store Information */}
                <div className="card" style={{ marginBottom: '24px', padding: '24px', backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
                    <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: 700 }}>
                        Restaurant Details
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Restaurant Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.storeInfo?.name || ''}
                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, name: e.target.value } })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contact Phone (Shown to customers)</label>
                            <input
                                type="tel"
                                className="form-input"
                                value={formData.storeInfo?.phone || ''}
                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, phone: e.target.value } })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={formData.storeInfo?.email || ''}
                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, email: e.target.value } })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Standard Delivery Fee (PKR)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.deliveryFee}
                                onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                                min="0"
                            />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Address</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.storeInfo?.address || ''}
                                onChange={(e) => setFormData({ ...formData, storeInfo: { ...formData.storeInfo, address: e.target.value } })}
                            />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Staff Mode Dine-In PIN</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Default is 1234"
                                value={formData.staffPin || ''}
                                onChange={(e) => setFormData({ ...formData, staffPin: e.target.value })}
                                style={{ maxWidth: '240px' }}
                            />
                            <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                PIN entered by in-store waitstaff to unlock table POS mode on the customer website.
                            </small>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '12px 28px', fontSize: '15px' }}>
                        {loading ? 'Saving Settings...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;