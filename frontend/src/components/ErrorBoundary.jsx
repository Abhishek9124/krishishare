import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error Boundary catch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div className="card" style={{ maxWidth: '500px', margin: '0 auto', borderLeft: '6px solid var(--danger)' }}>
            <h3 style={{ color: 'var(--danger)', margin: '0 0 10px 0' }}>⚠️ Unexpected UI Error</h3>
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              {typeof this.state.error === 'string'
                ? this.state.error
                : (this.state.error?.message || 'Something went wrong rendering this component.')}
            </p>
            <button
              className="btn"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              style={{ marginTop: '16px' }}
            >
              🔄 Return to Home Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
