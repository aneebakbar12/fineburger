import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("Admin ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px 20px',
                    color: '#f8fafc',
                    backgroundColor: '#0c0e14',
                    minHeight: '100vh',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍔</div>
                    <h1 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                        Fine Burger <span style={{ color: '#FFB400' }}>Admin Console</span>
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '480px', marginBottom: '24px', lineHeight: 1.5 }}>
                        An unexpected display issue occurred in this section. The database and orders remain completely safe.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.href = '/dashboard';
                            }}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#FFB400',
                                color: '#000000',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            Return to Dashboard
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: '#1d222d',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            Reload Page
                        </button>
                    </div>
                    {this.state.error && (
                        <details style={{
                            marginTop: '28px',
                            textAlign: 'left',
                            maxWidth: '600px',
                            width: '100%',
                            whiteSpace: 'pre-wrap',
                            color: '#f87171',
                            backgroundColor: '#14171f',
                            padding: '16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            <summary style={{ cursor: 'pointer', color: '#94a3b8', marginBottom: '8px' }}>View diagnostic details</summary>
                            {this.state.error.toString()}
                            {this.state.errorInfo?.componentStack}
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
