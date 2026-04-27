// Root component. Wraps the app in an error boundary (catches uncaught React
// errors), the auth provider (makes the Firebase user globally available),
// and the router.
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import Router from '@/router';
import '@/styles/global.scss';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ErrorBoundary>
  );
}
