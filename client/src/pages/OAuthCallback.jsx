import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api';

export default function OAuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-error text-xs font-bold uppercase tracking-widest">{error}</p>
          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="text-primary text-xs uppercase tracking-widest font-bold hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-primary text-2xl animate-pulse">🔥</div>
    </div>
  );
}
