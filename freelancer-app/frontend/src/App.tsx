import React from 'react';
import GhostWorkApp from './cantonlance/CantonLanceApp';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[GhostWork] Render error:', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    maxWidth: '480px', margin: '80px auto', padding: '32px',
                    background: '#fff', borderRadius: '12px', border: '1px solid #e0e0e0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#001e00', marginBottom: '8px' }}>
                        Something went wrong
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#5e6d55', margin: '0 0 16px', lineHeight: 1.5 }}>
                        An unexpected error occurred. This is usually caused by a stale ledger connection.
                    </p>
                    <pre style={{
                        fontSize: '0.72rem', color: '#dc3545', background: '#fef2f2',
                        padding: '10px 12px', borderRadius: '8px', textAlign: 'left',
                        overflow: 'auto', maxHeight: '100px', marginBottom: '16px',
                    }}>
                        {this.state.error?.message}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: '#14A800', border: 'none', color: '#fff',
                            borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem',
                            padding: '8px 20px', cursor: 'pointer',
                        }}
                    >
                        Reload App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

const App: React.FC = () => (
    <ErrorBoundary>
        <GhostWorkApp />
    </ErrorBoundary>
);

export default App;
