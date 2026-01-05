import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary for YouTube Embed Components
 * 
 * Catches React errors during:
 * - Component rendering
 * - Lifecycle methods
 * - Constructors
 * 
 * Note: Does NOT catch:
 * - Event handlers
 * - Asynchronous code
 * - Server-side rendering
 * - Errors in the boundary itself
 */
export class YouTubeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('YouTube Embed Error:', error, errorInfo);
    
    // Log to error tracking service (Sentry, LogRocket, etc.)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Optional: Send to backend analytics
    // logErrorToService(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h3 style={styles.title}>Something went wrong</h3>
            <p style={styles.message}>
              We encountered an error while loading the video player.
            </p>
            {this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details</summary>
                <pre style={styles.errorText}>{this.state.error.message}</pre>
              </details>
            )}
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={styles.button}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center',
    minHeight: '300px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    maxWidth: '500px',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#856404',
  },
  message: {
    fontSize: '16px',
    color: '#856404',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  details: {
    textAlign: 'left',
    marginBottom: '16px',
    backgroundColor: '#fff',
    padding: '12px',
    borderRadius: '4px',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: '8px',
  },
  errorText: {
    fontSize: '12px',
    color: '#721c24',
    overflow: 'auto',
    maxHeight: '200px',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#ffc107',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

export default YouTubeErrorBoundary;
