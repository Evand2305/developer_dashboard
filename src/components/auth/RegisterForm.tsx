// New-account form. Validates password length and confirmation before
// calling Firebase, then navigates to the dashboard on success.
import { useState } from 'react';
import { useNavigate }        from 'react-router-dom';
import { registerWithEmail }  from '@/services/firebase/auth';
import { parseAuthError }     from '@/utils/parseAuthError';

export default function RegisterForm() {
  const [displayName, setDisplayName]         = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                     = useState('');
  const [loading, setLoading]                 = useState(false);
  const navigate                              = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    // Client-side checks before hitting Firebase.
    if (password.length < 6)          { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword)  { setError('Passwords do not match.');                return; }
    setLoading(true);
    try {
      await registerWithEmail(email, password, displayName);
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
        <label htmlFor="reg-name">Name</label>
        <input id="reg-name" type="text" value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Your name" required autoComplete="name" />
      </div>
      <div className="form-group">
        <label htmlFor="reg-email">Email</label>
        <input id="reg-email" type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" required autoComplete="email" />
      </div>
      <div className="form-group">
        <label htmlFor="reg-password">Password</label>
        <input id="reg-password" type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Min. 6 characters" required autoComplete="new-password" />
      </div>
      <div className="form-group">
        <label htmlFor="reg-confirm-password">Confirm Password</label>
        <input id="reg-confirm-password" type="password" value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password" required autoComplete="new-password" />
      </div>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
}
