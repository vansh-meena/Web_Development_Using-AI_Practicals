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
    console.error('Lumora error boundary:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-card">
            <h1>Lumora hit a snag</h1>
            <p>{this.state.message || 'An unexpected error occurred in the app.'}</p>
            <button className="btn btn-primary" onClick={this.handleReload}>Reload app</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
