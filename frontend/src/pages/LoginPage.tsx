import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../hooks/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-surface p-8 rounded-xl border border-border shadow-2xl w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-primary rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-2xl font-bold text-white">FF</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-textMuted mt-2">Sign in to manage your feature flags</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primaryHover text-white font-medium py-2 px-4 rounded-lg transition-colors mt-6 shadow-lg shadow-primary/25"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-textMuted">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:text-primaryHover font-medium transition-colors">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
