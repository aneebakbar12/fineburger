import React, { useEffect } from 'react';
import { AlertCircleIcon } from './Icons';

const ConfirmModal = ({
    isOpen,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false,
    onConfirm,
    onCancel
}) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
            <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className={`confirm-modal-icon-badge ${isDanger ? 'danger' : 'warning'}`}>
                    <AlertCircleIcon width={24} height={24} stroke={isDanger ? '#ef4444' : '#f59e0b'} />
                </div>
                <h3 className="confirm-modal-title">{title}</h3>
                <p className="confirm-modal-message">{message}</p>
                <div className="confirm-modal-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={onCancel}
                        style={{ padding: '8px 18px', fontSize: '0.9rem' }}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`btn ${isDanger ? 'btn-delete' : 'btn-primary'}`}
                        onClick={() => {
                            onConfirm();
                        }}
                        style={{
                            padding: '8px 18px',
                            fontSize: '0.9rem',
                            backgroundColor: isDanger ? '#ef4444' : 'var(--color-accent)',
                            color: isDanger ? '#ffffff' : '#000000',
                            fontWeight: 700
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
