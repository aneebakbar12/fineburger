import React from 'react';

const SearchBar = ({ searchQuery, onSearchChange, placeholder = "Search menu items..." }) => {
    return (
        <div style={{
            width: '100%',
            maxWidth: '600px',
            margin: '0 auto 24px',
            position: 'relative'
        }}>
            <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
            }}>
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                        position: 'absolute',
                        left: '16px',
                        color: '#888',
                        pointerEvents: 'none'
                    }}
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        padding: '14px 48px 14px 48px',
                        fontSize: '16px',
                        border: '2px solid #333',
                        borderRadius: '12px',
                        backgroundColor: '#1a1a1a',
                        color: '#fff',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#4ade80';
                        e.target.style.backgroundColor = '#222';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = '#333';
                        e.target.style.backgroundColor = '#1a1a1a';
                    }}
                />
                {searchQuery && (
                    <button
                        onClick={() => onSearchChange('')}
                        style={{
                            position: 'absolute',
                            right: '12px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#888',
                            fontSize: '18px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                            e.target.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.color = '#888';
                        }}
                        aria-label="Clear search"
                    >
                        ✕
                    </button>
                )}
            </div>
            {searchQuery && (
                <div style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: '#888',
                    textAlign: 'center'
                }}>
                    Searching for "{searchQuery}"
                </div>
            )}
        </div>
    );
};

export default SearchBar;
