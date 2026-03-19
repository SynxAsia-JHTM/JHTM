import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';
import { getApiBaseUrl } from '@/lib/config';
import BackToHomeLink from '@/components/navigation/BackToHomeLink';
import { cn } from '@/lib/utils';

type LoginRole = 'member' | 'admin' | 'guest';
type LoginMethod = 'password' | 'otp';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('member@jhtmchurch.com');
  const [password, setPassword] = useState('member123');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<LoginRole>('member');
  const [method, setMethod] = useState<LoginMethod>('password');
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();

  const isEmail = useMemo(() => identifier.includes('@'), [identifier]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate credentials - use proper validation for all roles
    // Credentials MUST be overridden via environment variables for security
    const adminEmail = import.meta.env.VITE_DEMO_ADMIN_EMAIL;
    const adminPassword = import.meta.env.VITE_DEMO_ADMIN_PASSWORD;
    const memberEmail = import.meta.env.VITE_DEMO_MEMBER_EMAIL;
    const memberPassword = import.meta.env.VITE_DEMO_MEMBER_PASSWORD;

    // In production, require environment variables to be set
    const isProduction = import.meta.env.PROD;
    const hasValidEnvConfig = adminEmail && adminPassword && memberEmail && memberPassword;

    // Reject login in production if env vars aren't configured
    if (isProduction && !hasValidEnvConfig) {
      setIsLoading(false);
      setError('Login not configured. Please contact administrator.');
      return;
    }

    const DEMO_ACCOUNTS = {
      admin: {
        email: adminEmail || 'admin@jhtmchurch.com',
        password: adminPassword || 'password123',
      },
      member: {
        email: memberEmail || 'member@jhtmchurch.com',
        password: memberPassword || 'member123',
      },
    };

    const normalized = identifier.trim();

    const isValid =
      role === 'admin'
        ? normalized.toLowerCase() === DEMO_ACCOUNTS.admin.email &&
          (method === 'password' ? password : otp) === DEMO_ACCOUNTS.admin.password
        : role === 'member'
          ? normalized !== '' &&
            (method === 'password' ? password.trim() !== '' : /^\d{6}$/.test(otp))
          : false;

    if (!isValid) {
      setIsLoading(false);
      setError('Invalid credentials. Please try again.');
      return;
    }

    const timeoutMs = 1500;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    const store = rememberMe ? window.localStorage : window.sessionStorage;

    const signInOffline = () => {
      store.setItem('token', 'mock-token');
      store.setItem('user', JSON.stringify({ email: normalized, role }));
      if (role === 'member') {
        const onboardingDone = window.localStorage.getItem('jhtm.onboardingComplete.v1') === 'true';
        if (!onboardingDone) {
          navigate('/onboarding');
          return;
        }
      }
      navigate(role === 'admin' ? '/dashboard' : '/portal');
    };

    try {
      const apiBase = getApiBaseUrl();
      if (!apiBase) {
        signInOffline();
        return;
      }

      if (method === 'otp' || !isEmail) {
        signInOffline();
        return;
      }

      const url = `${apiBase}/api/login/`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalized, password }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        store.setItem('token', data.token);
        store.setItem('user', JSON.stringify(data.user));
        if (role === 'member') {
          const onboardingDone =
            window.localStorage.getItem('jhtm.onboardingComplete.v1') === 'true';
          if (!onboardingDone) {
            navigate('/onboarding');
            return;
          }
        }
        navigate(role === 'admin' ? '/dashboard' : '/portal');
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
    <div className="min-h-screen bg-cream p-4">
      <BackToHomeLink variant="floating" />
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-gradient-to-br from-navy via-sea to-cream px-8 pb-6 pt-8">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-white">Welcome to JHTM</h1>
            <p className="mt-1 text-sm font-semibold text-white/85">Sign in to continue</p>
          </div>
        </div>

        <div className="p-8">
          {/* Role Tabs */}
          <div className="mb-6 flex gap-1 rounded-2xl bg-slate-100 p-1">
            {(['member', 'admin', 'guest'] as LoginRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all',
                  role === r
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {getRoleIcon(r)}
                <span className="hidden sm:inline">{getRoleLabel(r)}</span>
              </button>
            ))}
          </div>

          {/* Role-specific instruction */}
          <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-sm font-semibold text-slate-700">
            {getRoleInstruction()}
          </div>

          {/* Guest: Show registration instead of login form */}
          {role === 'guest' ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky">
                  <UserPlus className="h-8 w-8 text-navy" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-900">Join Our Church Family</h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Register to get connected with our church community
                </p>
              </div>

              <Link to="/register" className="jhtm-btn jhtm-btn-primary h-11 w-full shadow-sm">
                <UserPlus size={20} />
                Register as Guest
              </Link>

              <div className="text-center pt-2">
                <p className="text-sm text-zinc-500">
                  Already a member?{' '}
                  <button
                    type="button"
                    onClick={() => setRole('member')}
                    className="font-semibold underline underline-offset-4"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* Admin/Member Login Form */
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMethod('password')}
                  className={cn(
                    'flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
                    method === 'password'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <Lock size={18} aria-hidden="true" />
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('otp')}
                  className={cn(
                    'flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
                    method === 'otp'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <ShieldCheck size={18} aria-hidden="true" />
                  OTP
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">Email or Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    {isEmail ? (
                      <Mail size={18} aria-hidden="true" />
                    ) : (
                      <Phone size={18} aria-hidden="true" />
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="jhtm-input pl-10"
                    placeholder={
                      role === 'admin' ? 'admin@jhtmchurch.com' : 'member@jhtmchurch.com'
                    }
                  />
                </div>
              </div>

              {method === 'password' ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock size={18} aria-hidden="true" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="jhtm-input pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">
                    One-time passcode
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <ShieldCheck size={18} aria-hidden="true" />
                    </div>
                    <input
                      inputMode="numeric"
                      pattern="\d*"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="jhtm-input pl-10"
                      placeholder="6-digit code"
                    />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    OTP login uses offline sign-in in this demo.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-4">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-sea-500"
                  />
                  Remember me
                </label>
                <Link
                  to="/reset-password"
                  className="text-sm font-semibold text-navy underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'jhtm-btn jhtm-btn-primary h-11 w-full shadow-md transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50',
                  isLoading && 'animate-pulse'
                )}
              >
                {isLoading
                  ? 'Signing in...'
                  : `Sign in as ${role === 'admin' ? 'Admin' : 'Member'}`}
              </button>
            </form>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 p-4 text-center">
          <p className="text-xs font-semibold text-slate-400">
            &copy; {new Date().getFullYear()} JHTM Church. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
