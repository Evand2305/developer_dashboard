// Email/password sign-in form. Shows a friendly error on failure and
// navigates to the dashboard on success.
import { useState } from 'react';
import { useNavigate }     from 'react-router-dom';
import { signInWithEmail } from '@/services/firebase/auth';
import { parseAuthError }  from '@/utils/parseAuthError';

export default function LoginForm() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      navigate('/');
    } catch (err) {
      setError(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="login-email">Email</label>
        <input id="login-email" type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" required autoComplete="email" />
      </div>
      <div className="form-group">
        <label htmlFor="login-password">Password</label>
        <input id="login-password" type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••" required autoComplete="current-password" />
      </div>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
