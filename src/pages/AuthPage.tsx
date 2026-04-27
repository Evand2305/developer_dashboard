// Login/register page. Redirects already-authenticated users to the dashboard
// immediately so they never see the auth card unnecessarily.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }   from '@/contexts/AuthContext';
import AuthCard      from '@/components/auth/AuthCard';
import '@/styles/pages/auth.scss';

export default function AuthPage() {
  const { user, loading } = useAuth();
  const navigate          = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/');
  }, [user, loading, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-logo">dev<span>.</span>dash</h1>
        <p className="auth-subtitle">Your developer dashboard</p>
        <AuthCard />
      </div>
    </div>
  );
}
