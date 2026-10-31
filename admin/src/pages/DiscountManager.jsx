import React, { useState, useEffect, useMemo } from 'react';
import {
    getDiscounts,
    addDiscount,
    updateDiscount,
    deleteDiscount,
    getMenuItems,
    getCategories
} from '../services/firebase';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { PlusIcon, EditIcon, TrashIcon, CloseIcon, DiscountIcon } from '../components/Icons';
import '../styles/admin.css';

const DiscountManager = () => {
    const toast = useToast();
    const [discounts, setDiscounts] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [discountToDelete, setDiscountToDelete] = useState(null);

    // Filter controls for menu item checkbox selection
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

    const [formData, setFormData] = useState({
        title: '',
        type: 'global', // 'global', 'item', or 'coupon'
        code: '',
        itemId: '',
        itemName: '',
        itemIds: [],
        discountType: 'percentage', // 'percentage' or 'flat'
        value: '',
        minOrderAmount: '',
        startDate: '',
        endDate: '',
        active: true,
        description: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [discountsData, itemsData, categoriesData] = await Promise.all([
                getDiscounts(),
                getMenuItems(),
                getCategories()
            ]);
            setDiscounts(discountsData || []);
            setMenuItems(itemsData || []);
            setCategories(categoriesData || []);
        } catch (err) {
            toast.error('Failed to load discounts: ' + err.message);
        }
        setLoading(false);
    };

    // Filtered menu items for multi-select checkbox list
    const visibleItems = useMemo(() => {
        return menuItems.filter(item => {
            if (selectedCategoryFilter !== 'all') {
                const matchCategory = item.categoryId === selectedCategoryFilter ||
                    (categories.find(c => c.id === selectedCategoryFilter)?.name === item.category);
                if (!matchCategory) return false;
            }
            if (itemSearchQuery.trim()) {
                const q = itemSearchQuery.toLowerCase().trim();
                const nameMatch = (item.name || '').toLowerCase().includes(q);
                const catMatch = (item.category || '').toLowerCase().includes(q);
                if (!nameMatch && !catMatch) return false;
            }
            return true;
        });
    }, [menuItems, selectedCategoryFilter, itemSearchQuery, categories]);

    const handleToggleItem = (itemId) => {
        setFormData(prev => {
            const currentIds = prev.itemIds || [];
            const isSelected = currentIds.includes(itemId);
            const nextIds = isSelected
                ? currentIds.filter(id => id !== itemId)
                : [...currentIds, itemId];
            const firstItem = menuItems.find(i => i.id === nextIds[0]);
            return {
                ...prev,
                itemIds: nextIds,
                itemId: nextIds[0] || '',
                itemName: nextIds.length === 1 ? (firstItem?.name || '') : (nextIds.length > 1 ? `${nextIds.length} Items Selected` : '')
            };
        });
    };

    const handleSelectAllVisible = () => {
        const visibleIds = visibleItems.map(i => i.id);
        setFormData(prev => {
            const currentIds = prev.itemIds || [];
            const merged = Array.from(new Set([...currentIds, ...visibleIds]));
            const firstItem = menuItems.find(i => i.id === merged[0]);
            return {
                ...prev,
                itemIds: merged,
                itemId: merged[0] || '',
                itemName: merged.length === 1 ? (firstItem?.name || '') : `${merged.length} Items Selected`
            };
        });
    };

    const handleDeselectVisible = () => {
        const visibleIds = visibleItems.map(i => i.id);
        setFormData(prev => {
            const currentIds = prev.itemIds || [];
            const nextIds = currentIds.filter(id => !visibleIds.includes(id));
            const firstItem = menuItems.find(i => i.id === nextIds[0]);
            return {
                ...prev,
                itemIds: nextIds,
                itemId: nextIds[0] || '',
                itemName: nextIds.length === 1 ? (firstItem?.name || '') : (nextIds.length > 1 ? `${nextIds.length} Items Selected` : '')
            };
        });
    };

    const handleClearAllItems = () => {
        setFormData(prev => ({
            ...prev,
            itemIds: [],
            itemId: '',
            itemName: ''
        }));
    };

    const handleEdit = (discount) => {
        setEditingDiscount(discount);
        let initialItemIds = [];
        if (Array.isArray(discount.itemIds) && discount.itemIds.length > 0) {
            initialItemIds = [...discount.itemIds];
        } else if (discount.itemId) {
            initialItemIds = [discount.itemId];
        }

        setFormData({
            title: discount.title || '',
            type: discount.type || 'global',
            code: discount.code || '',
            itemId: discount.itemId || (initialItemIds[0] || ''),
            itemName: discount.itemName || '',
            itemIds: initialItemIds,
            discountType: discount.discountType || 'percentage',
            value: discount.value !== undefined ? discount.value : '',
            minOrderAmount: discount.minOrderAmount !== undefined ? discount.minOrderAmount : '',
            startDate: discount.startDate || '',
            endDate: discount.endDate || '',
            active: discount.active !== undefined ? discount.active : true,
            description: discount.description || ''
        });
        setItemSearchQuery('');
        setSelectedCategoryFilter('all');
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({
            title: '',
            type: 'global',
            code: '',
            itemId: '',
            itemName: '',
            itemIds: [],
            discountType: 'percentage',
            value: '',
            minOrderAmount: '',
            startDate: '',
            endDate: '',
            active: true,
            description: ''
        });
        setItemSearchQuery('');
        setSelectedCategoryFilter('all');
        setEditingDiscount(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            toast.error('Discount campaign title is required');
            return;
        }

        const val = parseFloat(formData.value);
        if (isNaN(val) || val <= 0) {
            toast.error('Please enter a valid discount value greater than 0');
            return;
        }

        if (formData.discountType === 'percentage' && val > 100) {
            toast.error('Percentage discount cannot exceed 100%');
            return;
        }

        if (formData.type === 'item') {
            const selectedIds = (formData.itemIds && formData.itemIds.length > 0)
                ? formData.itemIds
                : (formData.itemId ? [formData.itemId] : []);

            if (selectedIds.length === 0) {
                toast.error('Please select at least one menu item using the checkboxes');
                return;
            }
        }

        if (formData.type === 'coupon') {
            const cleanCode = (formData.code || '').trim().toUpperCase();
            if (!cleanCode) {
                toast.error('Please specify a coupon promo code (e.g. WELCOME10)');
                return;
            }
            // Check for duplicate code
            const duplicate = discounts.find(
                d => d.type === 'coupon' &&
                (d.code || '').toUpperCase() === cleanCode &&
                (!editingDiscount || d.id !== editingDiscount.id)
            );
            if (duplicate) {
                toast.error(`A coupon with promo code "${cleanCode}" already exists.`);
                return;
            }
        }

        if (formData.startDate && formData.endDate) {
            if (new Date(formData.startDate) >= new Date(formData.endDate)) {
                toast.error('End date/time must be after the start date/time');
                return;
            }
        }

        let selectedItemNames = [];
        let primaryItemId = null;
        let primaryItemName = null;
        let finalItemIds = [];

        if (formData.type === 'item') {
            finalItemIds = (formData.itemIds && formData.itemIds.length > 0)
                ? formData.itemIds
                : (formData.itemId ? [formData.itemId] : []);

            selectedItemNames = finalItemIds.map(id => {
                const item = menuItems.find(i => i.id === id);
                return item?.name || id;
            });

            primaryItemId = finalItemIds[0] || null;
            primaryItemName = selectedItemNames.length === 1
                ? selectedItemNames[0]
                : `${selectedItemNames.length} Items Selected`;
        }

        const discountPayload = {
            title: formData.title.trim(),
            type: formData.type,
            code: formData.type === 'coupon' ? formData.code.trim().toUpperCase() : null,
            itemId: formData.type === 'item' ? primaryItemId : null,
            itemName: formData.type === 'item' ? primaryItemName : null,
            itemIds: formData.type === 'item' ? finalItemIds : null,
            itemNames: formData.type === 'item' ? selectedItemNames : null,
            discountType: formData.discountType,
            value: val,
            minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
            active: formData.active,
            description: formData.description.trim()
        };

        try {
            let result;
            if (editingDiscount) {
                result = await updateDiscount(editingDiscount.id, discountPayload);
            } else {
                result = await addDiscount(discountPayload);
            }

            if (result.success) {
                toast.success(editingDiscount ? 'Discount updated successfully!' : 'Discount created successfully!');
                resetForm();
                loadData();
            } else {
                toast.error('Error saving discount: ' + result.error);
            }
        } catch (err) {
            toast.error('Error: ' + err.message);
        }
    };

    const handleToggleActive = async (discount) => {
        const nextStatus = !discount.active;
        try {
            const result = await updateDiscount(discount.id, { active: nextStatus });
            if (result.success) {
                toast.success(`Discount "${discount.title}" is now ${nextStatus ? 'Active' : 'Inactive'}`);
                setDiscounts(prev => prev.map(d => d.id === discount.id ? { ...d, active: nextStatus } : d));
            } else {
                toast.error('Failed to update status: ' + result.error);
            }
        } catch (err) {
            toast.error('Error: ' + err.message);
        }
    };

    const confirmDelete = async () => {
        if (!discountToDelete) return;
        try {
            const result = await deleteDiscount(discountToDelete.id);
            if (result.success) {
                toast.success(`"${discountToDelete.title}" was deleted.`);
                loadData();
            } else {
                toast.error('Error deleting discount: ' + result.error);
            }
        } catch (err) {
            toast.error('Error: ' + err.message);
        }
        setDiscountToDelete(null);
    };

    const activeCount = discounts.filter(d => d.active).length;
    const globalActive = discounts.find(d => d.type === 'global' && d.active);

    const getTimingStatus = (discount) => {
        const now = new Date();
        if (discount.endDate && new Date(discount.endDate) < now) {
            return { label: 'Expired', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
        }
        if (discount.startDate && new Date(discount.startDate) > now) {
            return { label: 'Upcoming', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
        }
        if (discount.active) {
            return { label: 'Live Now', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
        }
        return { label: 'Paused', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.06)' };
    };

    return (
        <div>
            {/* Header */}
            <div className="admin-header" style={{ padding: '20px 24px', marginBottom: '24px' }}>
                <div>
                    <h1 className="admin-title" style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>🏷️</span>
                        <span>Discount & Promotions Manager</span>
                    </h1>
                    <p className="admin-subtitle" style={{ fontSize: '13px', marginTop: '4px' }}>
                        Create site-wide discounts, item-specific deals, and checkout promo coupon codes
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        if (showForm) {
                            resetForm();
                        } else {
                            setShowForm(true);
                        }
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                    {showForm ? <CloseIcon width={18} height={18} /> : <PlusIcon width={18} height={18} />}
                    <span>{showForm ? 'Close Form' : 'Create New Discount'}</span>
                </button>
            </div>

            {/* Quick KPI Overview */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div className="card" style={{ padding: '16px 20px', backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Active Promotions
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-accent, #FFB400)', marginTop: '4px' }}>
                        {activeCount} Active
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Total Campaigns: {discounts.length}
                    </div>
                </div>

                <div className="card" style={{ padding: '16px 20px', backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Menu-Wide Global Discount
                    </div>
                    <div style={{
                        fontSize: '18px',
                        fontWeight: 800,
                        color: globalActive ? '#10b981' : 'var(--text-muted)',
                        marginTop: '4px'
                    }}>
                        {globalActive ? `${globalActive.value}${globalActive.discountType === 'percentage' ? '%' : ' Rs.'} OFF All Menu` : 'None Active'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {globalActive ? `Campaign: ${globalActive.title}` : 'All items sold at regular price'}
                    </div>
                </div>

                <div className="card" style={{ padding: '16px 20px', backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Promo Voucher Coupons
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#60a5fa', marginTop: '4px' }}>
                        {discounts.filter(d => d.type === 'coupon').length} Codes
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Checkout voucher codes enabled
                    </div>
                </div>
            </div>

            {/* Discount Form Modal / Drawer */}
            {showForm && (
                <div className="card" style={{
                    marginBottom: 'var(--spacing-2xl)',
                    padding: 'var(--spacing-xl)',
                    backgroundColor: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-lg)'
                }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)', color: 'var(--text-primary)', fontWeight: 700 }}>
                        {editingDiscount ? `Edit Discount: ${editingDiscount.title}` : 'Create New Promotional Discount'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--spacing-lg)' }}>
                            <div className="form-group">
                                <label className="form-label">Campaign Title *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Weekend Special, Ramadan Deal, Welcome Voucher"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Discount Scope *</label>
                                <select
                                    className="form-select"
                                    value={formData.type}
                                    onChange={(e) => {
                                        const nextType = e.target.value;
                                        setFormData({
                                            ...formData,
                                            type: nextType,
                                            itemIds: nextType === 'item' ? (formData.itemIds.length > 0 ? formData.itemIds : (menuItems[0]?.id ? [menuItems[0].id] : [])) : [],
                                            itemId: nextType === 'item' ? (formData.itemId || menuItems[0]?.id || '') : '',
                                            code: nextType === 'coupon' ? (formData.code || 'WELCOME10') : ''
                                        });
                                    }}
                                >
                                    <option value="global">🌐 Entire Menu (All Items Auto-Discounted)</option>
                                    <option value="item">🍔 Specific Menu Items (Select Multiple Items with Checkboxes)</option>
                                    <option value="coupon">🎟️ Promo Coupon Code (Customer Enters at Cart Checkout)</option>
                                </select>
                            </div>

                            {formData.type === 'coupon' && (
                                <div className="form-group">
                                    <label className="form-label">Promo Voucher Code *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. WELCOME10, BURGER50, FREESHIP"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}
                                        required
                                    />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                                        Customer enters this exact code at cart checkout
                                    </small>
                                </div>
                            )}

                            {formData.type === 'item' && (
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '10px',
                                        flexWrap: 'wrap',
                                        gap: '8px'
                                    }}>
                                        <div>
                                            <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                                                Select Menu Items for Discount *
                                            </label>
                                            <span style={{ fontSize: '12px', color: 'var(--color-accent, #FFB400)', fontWeight: 700, marginLeft: '8px' }}>
                                                ({formData.itemIds.length} of {menuItems.length} items selected)
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button
                                                type="button"
                                                onClick={handleSelectAllVisible}
                                                style={{
                                                    padding: '5px 12px',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    backgroundColor: 'rgba(255, 180, 0, 0.15)',
                                                    color: 'var(--color-accent, #FFB400)',
                                                    border: '1px solid rgba(255, 180, 0, 0.4)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ✓ Select All {selectedCategoryFilter !== 'all' || itemSearchQuery ? 'Visible' : ''} ({visibleItems.length})
                                            </button>
                                            {formData.itemIds.length > 0 && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={handleDeselectVisible}
                                                        style={{
                                                            padding: '5px 10px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            backgroundColor: 'var(--surface-elevated)',
                                                            color: 'var(--text-secondary)',
                                                            border: '1px solid var(--surface-border)',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Deselect Visible
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleClearAllItems}
                                                        style={{
                                                            padding: '5px 10px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                                            color: '#ef4444',
                                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Clear All
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Search & Category Filter Header */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '10px',
                                        marginBottom: '12px',
                                        flexWrap: 'wrap',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="🔍 Search items by name or category..."
                                                value={itemSearchQuery}
                                                onChange={(e) => setItemSearchQuery(e.target.value)}
                                                style={{ fontSize: '13px', padding: '8px 12px', width: '100%' }}
                                            />
                                            {itemSearchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => setItemSearchQuery('')}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '8px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--text-muted)',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        {categories.length > 0 && (
                                            <div style={{
                                                display: 'flex',
                                                gap: '6px',
                                                overflowX: 'auto',
                                                paddingBottom: '2px',
                                                maxWidth: '100%',
                                                flexWrap: 'wrap'
                                            }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedCategoryFilter('all')}
                                                    style={{
                                                        padding: '5px 10px',
                                                        borderRadius: '20px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        border: selectedCategoryFilter === 'all' ? '1px solid var(--color-accent)' : '1px solid var(--surface-border)',
                                                        backgroundColor: selectedCategoryFilter === 'all' ? 'var(--color-accent)' : 'var(--surface-elevated)',
                                                        color: selectedCategoryFilter === 'all' ? '#000' : 'var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    All ({menuItems.length})
                                                </button>
                                                {categories.map(cat => {
                                                    const count = menuItems.filter(i => i.categoryId === cat.id || i.category === cat.name).length;
                                                    if (count === 0) return null;
                                                    const isCatActive = selectedCategoryFilter === cat.id;
                                                    return (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => setSelectedCategoryFilter(cat.id)}
                                                            style={{
                                                                padding: '5px 10px',
                                                                borderRadius: '20px',
                                                                fontSize: '11px',
                                                                fontWeight: isCatActive ? 800 : 600,
                                                                border: isCatActive ? '1px solid var(--color-accent)' : '1px solid var(--surface-border)',
                                                                backgroundColor: isCatActive ? 'var(--color-accent)' : 'var(--surface-elevated)',
                                                                color: isCatActive ? '#000' : 'var(--text-secondary)',
                                                                cursor: 'pointer',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {cat.icon ? `${cat.icon} ` : ''}{cat.name} ({count})
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Items Quick Badges Area */}
                                    {formData.itemIds.length > 0 && (
                                        <div style={{
                                            marginBottom: '10px',
                                            padding: '10px 12px',
                                            backgroundColor: 'rgba(255, 180, 0, 0.08)',
                                            border: '1px solid rgba(255, 180, 0, 0.25)',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent, #FFB400)', marginBottom: '6px' }}>
                                                Selected for this Discount ({formData.itemIds.length}):
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '80px', overflowY: 'auto' }}>
                                                {formData.itemIds.map(id => {
                                                    const item = menuItems.find(i => i.id === id);
                                                    return (
                                                        <span
                                                            key={id}
                                                            style={{
                                                                fontSize: '11px',
                                                                backgroundColor: 'var(--surface-card)',
                                                                border: '1px solid var(--surface-border)',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                color: 'var(--text-primary)',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}
                                                        >
                                                            <strong>{item?.name || id}</strong>
                                                            <span
                                                                onClick={() => handleToggleItem(id)}
                                                                style={{ cursor: 'pointer', color: '#ef4444', fontWeight: 'bold' }}
                                                                title="Unselect"
                                                            >
                                                                ✕
                                                            </span>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Items Checkbox Grid */}
                                    <div style={{
                                        maxHeight: '340px',
                                        overflowY: 'auto',
                                        border: '1px solid var(--surface-border)',
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--surface-elevated)',
                                        padding: '10px'
                                    }}>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                            gap: '8px'
                                        }}>
                                            {visibleItems.map(item => {
                                                const isSelected = formData.itemIds.includes(item.id);
                                                return (
                                                    <label
                                                        key={item.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            padding: '8px 12px',
                                                            borderRadius: '6px',
                                                            backgroundColor: isSelected ? 'rgba(255, 180, 0, 0.12)' : 'var(--surface-card)',
                                                            border: isSelected ? '1px solid var(--color-accent, #FFB400)' : '1px solid var(--surface-border)',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease',
                                                            userSelect: 'none'
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleToggleItem(item.id)}
                                                            style={{
                                                                width: '18px',
                                                                height: '18px',
                                                                accentColor: 'var(--color-accent, #FFB400)',
                                                                cursor: 'pointer'
                                                            }}
                                                        />
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{
                                                                fontSize: '13px',
                                                                fontWeight: isSelected ? 700 : 500,
                                                                color: isSelected ? 'var(--color-accent, #FFB400)' : 'var(--text-primary)',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}>
                                                                {item.name}
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                                                <span>Rs. {item.price}</span>
                                                                {item.category && <span style={{ opacity: 0.8 }}>{item.category}</span>}
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        {visibleItems.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                                No menu items match your search or category filter.
                                            </div>
                                        )}
                                    </div>
                                    <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px', display: 'block' }}>
                                        Check any number of items (e.g. 10, 20, or an entire category). All selected items will automatically display discounted prices on the customer site.
                                    </small>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Discount Type *</label>
                                <select
                                    className="form-select"
                                    value={formData.discountType}
                                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                >
                                    <option value="percentage">Percentage Off (%)</option>
                                    <option value="flat">Flat Amount Off (Rs.)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    {formData.discountType === 'percentage' ? 'Percentage (%) *' : 'Amount (PKR) *'}
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder={formData.discountType === 'percentage' ? 'e.g. 15 for 15%' : 'e.g. 100 for Rs. 100'}
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                    min="1"
                                    max={formData.discountType === 'percentage' ? '100' : '99999'}
                                    step="any"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Min Order Requirement (PKR, Optional)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="e.g. 500 (Leave empty for no minimum)"
                                    value={formData.minOrderAmount}
                                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Scheduling & Timer Controls */}
                        <div style={{
                            margin: 'var(--spacing-lg) 0',
                            padding: 'var(--spacing-md)',
                            backgroundColor: 'rgba(255, 180, 0, 0.03)',
                            border: '1px solid rgba(255, 180, 0, 0.2)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <label className="form-label" style={{ color: 'var(--color-accent, #FFB400)', fontWeight: 700 }}>
                                ⏰ Start & Expiry Timers (Optional)
                            </label>
                            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                                Set an automatic start and end date/time. Outside this window, the promotion will auto-expire without deleting it.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '12px' }}>Start Date & Time (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '12px' }}>End / Expiry Date & Time (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: 'var(--spacing-md)' }}>
                            <label className="form-label">Description / Customer Note (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. Valid on all orders placed this weekend"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', margin: 'var(--spacing-lg) 0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600 }}>
                                <input
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                />
                                Enable Promotion
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <button type="submit" className="btn btn-primary">
                                {editingDiscount ? 'Update Promotion' : 'Save & Publish Discount'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Discounts List Table */}
            <div className="data-table" style={{ border: '1px solid var(--surface-border)' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Campaign</th>
                            <th>Scope / Target</th>
                            <th>Discount</th>
                            <th>Schedule / Timer</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    Loading discounts...
                                </td>
                            </tr>
                        ) : discounts.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    No promotional discounts configured yet. Click "Create New Discount" above to add one!
                                </td>
                            </tr>
                        ) : (
                            discounts.map(discount => {
                                const isGlobal = discount.type === 'global';
                                const isCoupon = discount.type === 'coupon';
                                const isMultiItem = discount.type === 'item' && Array.isArray(discount.itemIds) && discount.itemIds.length > 1;
                                const item = discount.type === 'item' ? menuItems.find(i => i.id === discount.itemId) : null;

                                const targetLabel = isGlobal
                                    ? '🌐 Entire Menu'
                                    : (isCoupon
                                        ? `🎟️ Coupon: ${discount.code || 'CODE'}`
                                        : (isMultiItem
                                            ? `🍔 ${discount.itemIds.length} Items Selected`
                                            : (item ? `🍔 ${item.name}` : `🍔 ${discount.itemName || 'Single Item'}`)));

                                const discountBadge = discount.discountType === 'percentage'
                                    ? `${discount.value}% OFF`
                                    : `Rs. ${discount.value} OFF`;

                                const timing = getTimingStatus(discount);

                                return (
                                    <tr key={discount.id}>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                                                {discount.title}
                                            </div>
                                            {discount.description && (
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                    {discount.description}
                                                </div>
                                            )}
                                            {discount.minOrderAmount > 0 && (
                                                <div style={{ fontSize: '11px', color: 'var(--color-accent)', marginTop: '2px' }}>
                                                    Min Order: Rs. {discount.minOrderAmount}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '4px',
                                                backgroundColor: isGlobal
                                                    ? 'rgba(59, 130, 246, 0.15)'
                                                    : (isCoupon ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 180, 0, 0.15)'),
                                                color: isGlobal
                                                    ? '#60a5fa'
                                                    : (isCoupon ? '#c084fc' : 'var(--color-accent, #FFB400)'),
                                                fontSize: '12px',
                                                fontWeight: 600
                                            }}>
                                                {targetLabel}
                                            </span>
                                            {isMultiItem && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '240px', lineHeight: 1.3 }}>
                                                    {(discount.itemNames || discount.itemIds.map(id => menuItems.find(i => i.id === id)?.name || id)).slice(0, 3).join(', ')}
                                                    {discount.itemIds.length > 3 ? ` +${discount.itemIds.length - 3} more` : ''}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                                color: '#10b981',
                                                fontWeight: 800,
                                                fontSize: '13px'
                                            }}>
                                                {discountBadge}
                                            </span>
                                        </td>
                                        <td>
                                            <div>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    color: timing.color,
                                                    backgroundColor: timing.bg
                                                }}>
                                                    {timing.label}
                                                </span>
                                                {(discount.startDate || discount.endDate) && (
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                        {discount.startDate && `From: ${new Date(discount.startDate).toLocaleDateString()}`}
                                                        {discount.startDate && discount.endDate && ' · '}
                                                        {discount.endDate && `Until: ${new Date(discount.endDate).toLocaleDateString()}`}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleActive(discount)}
                                                style={{
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    border: 'none',
                                                    backgroundColor: discount.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                    color: discount.active ? '#10b981' : '#ef4444',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <span>{discount.active ? '● Enabled' : '○ Disabled'}</span>
                                            </button>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                                                <button
                                                    className="btn-icon-small btn-edit"
                                                    onClick={() => handleEdit(discount)}
                                                    title="Edit discount"
                                                    aria-label="Edit discount"
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '8px',
                                                        backgroundColor: 'rgba(255, 180, 0, 0.18)',
                                                        color: '#FFB400',
                                                        border: '1px solid rgba(255, 180, 0, 0.4)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                >
                                                    <EditIcon width={18} height={18} stroke="#FFB400" />
                                                </button>
                                                <button
                                                    className="btn-icon-small btn-delete"
                                                    onClick={() => setDiscountToDelete(discount)}
                                                    title="Delete discount"
                                                    aria-label="Delete discount"
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '8px',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.18)',
                                                        color: '#ef4444',
                                                        border: '1px solid rgba(239, 68, 68, 0.4)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                >
                                                    <TrashIcon width={18} height={18} stroke="#ef4444" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!discountToDelete}
                title="Delete Discount"
                message={`Are you sure you want to delete the promotion "${discountToDelete?.title}"? This cannot be undone.`}
                confirmText="Yes, Delete"
                cancelText="Keep"
                isDanger={true}
                onConfirm={confirmDelete}
                onCancel={() => setDiscountToDelete(null)}
            />
        </div>
    );
};

export default DiscountManager;
