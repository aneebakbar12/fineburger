import React, { useState, useEffect } from 'react';
import { getSliders, addSlider, updateSlider, deleteSlider, uploadImage } from '../services/firebase';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/admin.css';

const SliderManager = () => {
    const toast = useToast();
    const [sliders, setSliders] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ title: '', subtitle: '', imageUrl: '', order: 1, active: true });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [sliderToDelete, setSliderToDelete] = useState(null);

    useEffect(() => {
        fetchSliders();
    }, []);

    const fetchSliders = async () => {
        const data = await getSliders();
        setSliders((data || []).sort((a, b) => (a.order || 0) - (b.order || 0)));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEdit = (slider) => {
        setEditingId(slider.id);
        setFormData({
            title: slider.title || '',
            subtitle: slider.subtitle || '',
            imageUrl: slider.imageUrl || '',
            order: slider.order || 1,
            active: slider.active !== false
        });
        setImagePreview(slider.imageUrl || '');
        setImageFile(null);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({ title: '', subtitle: '', imageUrl: '', order: 1, active: true });
        setImageFile(null);
        setImagePreview('');
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let imageUrl = formData.imageUrl;
        if (imageFile) {
            const result = await uploadImage(imageFile, 'sliders');
            if (result.success) {
                imageUrl = result.url;
            } else {
                toast.error('Image upload failed: ' + result.error);
                setLoading(false);
                return;
            }
        }

        const payload = {
            ...formData,
            imageUrl,
            order: parseInt(formData.order) || 1
        };

        if (editingId) {
            const result = await updateSlider(editingId, payload);
            if (result.success) {
                toast.success('Slider banner updated!');
                resetForm();
                fetchSliders();
            } else {
                toast.error('Failed to update slider: ' + result.error);
            }
        } else {
            const result = await addSlider(payload);
            if (result.success) {
                toast.success('New slider banner added!');
                resetForm();
                fetchSliders();
            } else {
                toast.error('Failed to add slider: ' + result.error);
            }
        }

        setLoading(false);
    };

    const confirmDelete = async () => {
        if (!sliderToDelete) return;
        const result = await deleteSlider(sliderToDelete.id);
        if (result.success) {
            toast.success('Slider deleted.');
            fetchSliders();
        } else {
            toast.error('Failed to delete slider: ' + result.error);
        }
        setSliderToDelete(null);
    };

    const toggleActive = async (id, currentActive) => {
        const result = await updateSlider(id, { active: !currentActive });
        if (result.success) {
            toast.success(`Banner ${!currentActive ? 'activated' : 'hidden'}`);
            fetchSliders();
        } else {
            toast.error('Failed to toggle active status');
        }
    };

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Hero Banner Carousel</h1>
                    <p className="admin-subtitle">Manage customer homepage marketing banners ({sliders.length} slides)</p>
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
                >
                    {showForm ? 'Cancel' : '+ Add Slide'}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: 'var(--spacing-2xl)', padding: 'var(--spacing-xl)', backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
                    <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '16px', fontWeight: 700 }}>
                        {editingId ? 'Edit Hero Banner' : 'Add New Hero Banner'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Headline Title *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. SIZZLING DOUBLE SMASH"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Subtitle / Promotion</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. 100% Prime Beef with Melted Cheese"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Display Order (Sequence)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Banner Image (Best size: 1920 × 600 px)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Paste Cloudinary or image URL..."
                                value={formData.imageUrl}
                                onChange={(e) => {
                                    setFormData({ ...formData, imageUrl: e.target.value });
                                    setImagePreview(e.target.value);
                                }}
                                style={{ marginBottom: '8px' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <label style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'var(--surface-elevated)',
                                    color: '#fff',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: '1px solid var(--surface-border)',
                                    fontSize: '13px'
                                }}>
                                    📁 Upload from Computer
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                {imageFile && <span style={{ color: 'var(--color-accent)', fontSize: '13px' }}>Selected: {imageFile.name}</span>}
                            </div>

                            {imagePreview && (
                                <div style={{ marginTop: '12px', height: '140px', maxWidth: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--surface-border)', backgroundImage: `url(${imagePreview})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Uploading & Saving...' : (editingId ? 'Update Banner' : 'Publish Banner')}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {sliders.map(slider => (
                    <div key={slider.id} className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)' }}>
                        <div style={{
                            height: '180px',
                            backgroundImage: `url(${slider.imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative'
                        }}>
                            <span style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                backgroundColor: slider.active ? 'rgba(16, 185, 129, 0.9)' : 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase'
                            }}>
                                {slider.active ? 'Live' : 'Hidden'}
                            </span>
                            <span style={{
                                position: 'absolute',
                                top: '12px',
                                left: '12px',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: 'var(--color-accent)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 700
                            }}>
                                Slide #{slider.order || 1}
                            </span>
                        </div>

                        <div style={{ padding: '16px' }}>
                            <h3 style={{ color: 'var(--color-white)', fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                                {slider.title}
                            </h3>
                            {slider.subtitle && (
                                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '14px' }}>
                                    {slider.subtitle}
                                </p>
                            )}

                            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--surface-border)', paddingTop: '12px' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handleEdit(slider)}
                                    style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => toggleActive(slider.id, slider.active)}
                                    style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                                >
                                    {slider.active ? 'Hide' : 'Activate'}
                                </button>
                                <button
                                    className="btn btn-delete"
                                    onClick={() => setSliderToDelete(slider)}
                                    style={{ padding: '8px 12px', fontSize: '12px' }}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmModal
                isOpen={!!sliderToDelete}
                title="Delete Slide Banner"
                message={`Are you sure you want to remove slide "${sliderToDelete?.title}" from the customer homepage?`}
                confirmText="Yes, Delete"
                cancelText="Keep"
                isDanger={true}
                onConfirm={confirmDelete}
                onCancel={() => setSliderToDelete(null)}
            />
        </div>
    );
};

export default SliderManager;