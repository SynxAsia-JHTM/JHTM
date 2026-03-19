import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Users, UserCog, UserPlus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getApiBaseUrl } from '@/lib/config';
import BackToHomeLink from '@/components/navigation/BackToHomeLink';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type LoginRole = 'member' | 'admin' | 'guest';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@jhtmchurch.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<LoginRole>('member');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Different credentials for demo
    const isValid = role === 'admin' 
      ? (email.trim().toLowerCase() === 'admin@jhtmchurch.com' && password === 'password123')
      : (email.trim() !== '' && password.trim() !== '');

    if (!isValid) {
      setIsLoading(false);
      setError('Invalid credentials. Please try again.');
      return;
    }

    const timeoutMs = 1500;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    const signInOffline = () => {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ email, role }));
      if (role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/portal');
      }
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
        if (role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/portal');
        }
        return;
      }

      const message =
        data?.non_field_errors?.[0] ||
        data?.detail ||
        (typeof data === 'string' ? data : null) ||
        `Login failed (HTTP ${response.status}).`;
      setError(message);
    } catch (err) {
      const errorObj = err as { name?: string; message?: string };
      if (errorObj?.name === 'AbortError') {
        signInOffline();
      } else {
        signInOffline();
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  // Get icon for each role
  const getRoleIcon = (r: LoginRole) => {
    switch (r) {
      case 'admin':
        return <UserCog size={18} />;
      case 'member':
        return <Users size={18} />;
      case 'guest':
        return <UserPlus size={18} />;
    }
  };

  // Get label for each role
  const getRoleLabel = (r: LoginRole) => {
    switch (r) {
      case 'admin':
        return 'Admin';
      case 'member':
        return 'Member';
      case 'guest':
        return 'Guest';
    }
  };

  // Get role-specific instruction
  const getRoleInstruction = () => {
    switch (role) {
      case 'admin':
        return 'Sign in to access the church administration dashboard';
      case 'member':
        return 'Sign in to access your member portal';
      case 'guest':
        return 'New here? Register to get connected with our church family';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <BackToHomeLink variant="floating" />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-100">
        <div className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Welcome to JHTM</h1>
            <p className="text-zinc-500 text-sm">Sign in to continue</p>
          </div>

          {/* Role Tabs */}
          <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl mb-6">
            {(['member', 'admin', 'guest'] as LoginRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                  role === r
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                )}
              >
                {getRoleIcon(r)}
                <span className="hidden sm:inline">{getRoleLabel(r)}</span>
              </button>
            ))}
          </div>

          {/* Role-specific instruction */}
          <div className="mb-5 p-3 rounded-lg bg-blue-50 text-blue-800 text-sm text-center">
            {getRoleInstruction()}
          </div>

          {/* Guest: Show registration instead of login form */}
          {role === 'guest' ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <UserPlus className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-900">Join Our Church Family</h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Register to get connected with our church community
                </p>
              </div>
              
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-all"
              >
                <UserPlus size={20} />
                Register as Guest
              </Link>

              <div className="text-center pt-2">
                <p className="text-sm text-zinc-500">
                  Already a member?{' '}
                  <button
                    type="button"
                    onClick={() => setRole('member')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* Admin/Member Login Form */
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 block">Email Address</label>
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
                    placeholder={role === 'admin' ? 'admin@jhtmchurch.com' : 'member@example.com'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 block">Password</label>
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
                  'w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2',
                  isLoading && 'animate-pulse'
                )}
              >
                {isLoading ? 'Signing in...' : `Sign in as ${role === 'admin' ? 'Admin' : 'Member'}`}
              </button>
            </form>
          )}
        </div>

        <div className="bg-zinc-50 p-4 text-center border-t border-zinc-100">
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} JHTM Church. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
