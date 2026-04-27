// Shown for any URL that doesn't match a defined route.
import { useNavigate } from 'react-router-dom';
import '@/styles/pages/not-found.scss';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="not-found">
      <span className="not-found-code">404</span>
      <p className="not-found-msg">Page not found.</p>
      <button className="not-found-btn" onClick={() => navigate('/')}>
        Back to dashboard
      </button>
    </div>
  );
}
