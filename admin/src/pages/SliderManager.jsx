import React, { useState, useEffect } from 'react';
import { getSliders, addSlider, updateSlider, deleteSlider, uploadImage } from '../services/firebase';

const SliderManager = () => {
    const [sliders, setSliders] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ title: '', subtitle: '', imageUrl: '', order: 1, active: true });
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSliders();
    }, []);

    const fetchSliders = async () => {
        const data = await getSliders();
        setSliders(data);
    };

    const handleImageChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        let imageUrl = formData.imageUrl;
        if (imageFile) {
            const result = await uploadImage(imageFile, 'sliders');
            if (result.success) imageUrl = result.url;
        }

        const result = await addSlider({ ...formData, imageUrl, order: parseInt(formData.order) });
        if (result.success) {
            alert('Slider added!');
            setFormData({ title: '', subtitle: '', imageUrl: '', order: 1, active: true });
            setImageFile(null);
            setShowForm(false);
            fetchSliders();
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this slider?')) {
            await deleteSlider(id);
            fetchSliders();
        }
    };

    const toggleActive = async (id, active) => {
        await updateSlider(id, { active: !active });
        fetchSliders();
    };

    return (
        <div>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Hero Sliders</h1>
                    <p className="admin-subtitle">Manage homepage slider images</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Add Slider'}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: 'var(--spacing-2xl)', padding: 'var(--spacing-xl)' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input type="text" className="form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Subtitle</label>
                            <input type="text" className="form-input" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Image URL</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter Image URL"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                style={{ marginBottom: 'var(--spacing-sm)' }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Or Upload Image</label>
                            <input type="file" accept="image/*" onChange={handleImageChange} />
                            {imageFile && <span style={{ marginLeft: '10px', color: 'var(--color-accent)' }}>Selected: {imageFile.name}</span>}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Order</label>
                            <input type="number" className="form-input" value={formData.order} onChange={(e) => setFormData({ ...formData, order: e.target.value })} min="1" />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Slider'}
                        </button>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
                {sliders.map(slider => (
                    <div key={slider.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ height: '200px', backgroundImage: `url(${slider.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                        <div style={{ padding: 'var(--spacing-md)' }}>
                            <h3 style={{ color: 'var(--color-white)', marginBottom: 'var(--spacing-xs)' }}>{slider.title}</h3>
                            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-md)' }}>{slider.subtitle}</p>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <button className="btn btn-secondary" onClick={() => toggleActive(slider.id, slider.active)}>
                                    {slider.active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button className="btn btn-delete" onClick={() => handleDelete(slider.id)}>Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SliderManager;
