import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container flex items-center justify-center" style={{ minHeight: '100vh' }}>
          <div className="card" style={{ maxWidth: '600px' }}>
            <h1>Something went wrong</h1>
            <p style={{ color: 'red', marginTop: '1rem' }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button 
              className="btn-primary mt-3" 
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
