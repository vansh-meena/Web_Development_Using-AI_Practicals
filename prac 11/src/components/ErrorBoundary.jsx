import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Something went wrong.' };
  }

  componentDidCatch(error, info) {
    console.error('PostForge error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-card">
            <h1>PostForge hit a snag</h1>
            <p>{this.state.message}</p>
            <button onClick={this.handleReload} className="btn btn-primary">
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
