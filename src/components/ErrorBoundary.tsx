import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import '@/styles/components/error-boundary.scss';

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(_error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <span className="error-boundary-icon">⚠</span>
          <h2 className="error-boundary-title">Something went wrong</h2>
          <p className="error-boundary-msg">{this.state.message}</p>
          <button
            className="error-boundary-btn"
            onClick={() => this.setState({ hasError: false, message: '' })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
