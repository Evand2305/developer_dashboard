// Toggles between Login and Register forms on the auth page.
// GitHub OAuth sits above both forms as a primary sign-in option.
import { useState } from 'react';
import LoginForm    from './LoginForm';
import RegisterForm from './RegisterForm';
import GitHubButton from './GitHubButton';

type Mode = 'login' | 'register';

export default function AuthCard() {
  const [mode, setMode] = useState<Mode>('login');

  return (
    <>
      <GitHubButton />

      <div className="auth-divider"><span>or</span></div>

      {mode === 'login' ? <LoginForm /> : <RegisterForm />}

      <p className="auth-toggle">
        {mode === 'login' ? (
          <>No account?{' '}<button type="button" onClick={() => setMode('register')}>Register</button></>
        ) : (
          <>Have an account?{' '}<button type="button" onClick={() => setMode('login')}>Sign in</button></>
        )}
      </p>
    </>
  );
}
