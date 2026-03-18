import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getApiBaseUrl } from '@/lib/config';
import BackToHomeLink from '@/components/navigation/BackToHomeLink';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@jhtmchurch.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (email.trim().toLowerCase() !== 'admin@jhtmchurch.com' || password !== 'password123') {
      setIsLoading(false);
      setError('Invalid credentials. Please try again.');
      return;
    }

    const timeoutMs = 8000;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    const signInOffline = () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ email: 'admin@jhtmchurch.com' }));
      navigate('/dashboard');
    };

    try {
      const apiBase = getApiBaseUrl();
      if (!apiBase) {
        signInOffline();
        return;
      }

      const url = `${apiBase}/api/login/`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
        return;
      }

      const message =
        data?.non_field_errors?.[0] ||
        data?.detail ||
        (typeof data === 'string' ? data : null) ||
        `Login failed (HTTP ${response.status}).`;
      console.error('Login failed', { url, status: response.status, data });
      setError(message);
    } catch (err) {
      const errorObj = err as { name?: string; message?: string };
      if (errorObj?.name === 'AbortError') {
        signInOffline();
      } else {
        console.error('Login request network error', err);
        signInOffline();
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <BackToHomeLink variant="floating" />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-100">
        <div className="p-8">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">
              JHTM Church Management System
            </h1>
            <p className="text-zinc-500 text-sm">
              Sign in to manage your church operations
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="admin@jhtmchurch.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm animate-pulse">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                isLoading && "animate-pulse"
              )}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        
        <div className="bg-zinc-50 p-4 text-center border-t border-zinc-100">
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} JHTM Church Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
