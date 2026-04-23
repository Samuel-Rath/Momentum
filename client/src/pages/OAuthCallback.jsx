import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';

export default function OAuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('token');

    if (!token) {
      setError('Authentication failed — no token received.');
      return;
    }

    // Store token so the api interceptor can attach it to the /me request
    localStorage.setItem('momentum_token', token);

    authApi.me()
      .then((res) => {
        login(token, res.data);
        navigate('/', { replace: true });
      })
      .catch(() => {
        localStorage.removeItem('momentum_token');
        setError('Failed to verify account. Please try again.');
      });
  }, [login, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6 text-ink">
        <div className="text-center max-w-sm">
          <p className="eyebrow mb-3">/ Authentication failed</p>
          <p className="font-serif text-2xl leading-tight mb-6">{error}</p>
          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="btn-primary"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-slate"
      >
        <div className="w-3.5 h-3.5 rounded-full border border-accent border-t-transparent animate-spin" />
        Verifying your account
      </div>
    </div>
  );
}
