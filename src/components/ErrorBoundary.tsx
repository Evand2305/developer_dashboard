// Class component required by React's error boundary API. Catches uncaught
// errors in any child component and shows a recovery UI instead of a blank screen.
import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import '@/styles/components/error-boundary.scss';

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  // Triggered during render when a child throws — switches to error UI.
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  // Logs the component stack for debugging; does not affect render.
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
          {/* Resets error state so the user can retry without a full page reload. */}
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
