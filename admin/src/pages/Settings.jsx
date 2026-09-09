import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, addSettings } from '../services/firebase';

const Settings = () => {
    const [settings, setSettings] = useState(null);
    const [formData, setFormData] = useState({
        storeOpen: true,
        forceOpen: false,
        storeInfo: { name: '', phone: '', email: '', address: '' },
        operatingHours: {
            monday: { open: '10:00', close: '22:00' },
            tuesday: { open: '10:00', close: '22:00' },
            wednesday: { open: '10:00', close: '22:00' },
            thursday: { open: '10:00', close: '22:00' },
            friday: { open: '10:00', close: '22:00' },
            saturday: { open: '11:00', close: '23:00' },
            sunday: { open: '11:00', close: '23:00' }
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const data = await getSettings();
        if (data) {
            setSettings(data);
            setFormData(data);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (settings) {
            const result = await updateSettings(settings.id, formData);
            if (result.success) {
                alert('Settings updated successfully!');
            }
        } else {
            // First-time setup — create the document
            const result = await addSettings(formData);
            if (result.success) {
                alert('Settings created successfully!');
                fetchSettings();
            }
        }
    };

    const updateHours = (day, field, value) => {
        setFormData({
            ...formData,
            operatingHours: {
                ...formData.operatingHours,
                [day]: { ...formData.operatingHours[day], [field]: value }
            }
        });
    };

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Settings</h1>
                    <p className="admin-subtitle">Configure store settings</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card" style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-xl)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-lg)', color: 'var(--color-white)' }}>
                        Store Status
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--color-white)', fontSize: 'var(--font-size-lg)' }}>
                            <input
                                type="checkbox"
                                checked={formData.storeOpen}
                                onChange={(e) => setFormData({ ...formData, storeOpen: e.target.checked })}
                                style={{ width: '20px', height: '20px' }}
                            />
                            Store is Open
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--color-white)', fontSize: 'var(--font-size-lg)' }}>
                            <input
                                type="checkbox"
                                checked={formData.forceOpen || false}
                                onChange={(e) => setFormData({ ...formData, forceOpen: e.target.checked })}
                                style={{ width: '20px', height: '20px' }}
                            />
                            Force Store Open (Override Schedule)
                        </label>

                        {formData.forceOpen && (
                            <div style={{
                                padding: 'var(--spacing-md)',
                                backgroundColor: 'rgba(255, 180, 0, 0.2)',
                                border: '2px solid #FFB400',
                                borderRadius: 'var(--radius-md)',
                                color: '#FFB400',
                                fontSize: 'var(--font-size-md)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)'
                            }}>
                                <span style={{ fontSize: '20px' }}>⚠️</span>
                                <span>Manual override is active - store will be open regardless of scheduled hours</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-xl)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-lg)', color: 'var(--color-white)' }}>
                        Store Information
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
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
                            <label className="form-label">Phone</label>
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
                                placeholder="e.g. 5892 (default is 1234)"
                                value={formData.staffPin || ''}
                                onChange={(e) => setFormData({ ...formData, staffPin: e.target.value })}
                            />
                            <small style={{ color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                                Secret PIN used by in-store waitstaff to unlock quick Dine-in POS mode on the customer website.
                            </small>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 'var(--spacing-xl)', padding: 'var(--spacing-xl)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-lg)', color: 'var(--color-white)' }}>
                        Operating Hours
                    </h2>
                    {Object.keys(formData.operatingHours).map(day => (
                        <div key={day} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', alignItems: 'center' }}>
                            <label style={{ color: 'var(--color-white)', textTransform: 'capitalize', fontWeight: 600 }}>{day}</label>
                            <input
                                type="time"
                                className="form-input"
                                value={formData.operatingHours[day].open}
                                onChange={(e) => updateHours(day, 'open', e.target.value)}
                            />
                            <input
                                type="time"
                                className="form-input"
                                value={formData.operatingHours[day].close}
                                onChange={(e) => updateHours(day, 'close', e.target.value)}
                            />
                        </div>
                    ))}
                </div>

                <button type="submit" className="btn btn-primary">Save Settings</button>
            </form>
        </div>
    );
};

export default Settings;
