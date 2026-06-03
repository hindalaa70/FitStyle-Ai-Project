import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ShoppingBag, CheckCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const getFriendlyError = (err) => {
  const code = err?.code || '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found')
    return 'Incorrect email or password. Please check your credentials.';
  if (code === 'auth/invalid-email') return 'Invalid email address format.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait and try again.';
  if (code === 'auth/network-request-failed') return 'Network error. Check your internet connection.';
  return err?.message?.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.\?$/, '') || 'Login failed. Please try again.';
};

const DEMO_EMAIL = 'shopper@fitstyle.demo';
const DEMO_PASSWORD = 'demo123456';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { login, register, resetPassword, currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && userRole) {
      navigate(userRole === 'owner' ? '/admin' : '/studio');
    }
  }, [currentUser, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
    } catch (err) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setError('');
    setSuccessMsg('');
    setDemoLoading(true);

    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        try {
          await register(DEMO_EMAIL, DEMO_PASSWORD, 'shopper');
        } catch (regErr) {
          setError(getFriendlyError(regErr));
        }
      } else {
        setError(getFriendlyError(err));
      }
    } finally {
      setDemoLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!resetEmail) {
      setError('Please enter your email address.');
      return;
    }
    try {
      setResetLoading(true);
      await resetPassword(resetEmail);
      setSuccessMsg(`Password reset email sent to ${resetEmail}. Check your inbox.`);
      setShowReset(false);
      setResetEmail('');
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setError('No account found with that email. Please register first.');
      } else {
        setError(getFriendlyError(err));
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg text-surface-text flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl grid lg:grid-cols-[1.2fr_0.9fr] gap-8">
        <section className="hidden lg:flex flex-col justify-between light-card overflow-hidden p-10 rounded-[2rem]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-3xl bg-primary/10 px-4 py-3">
              <span className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-surface-muted">FitStyle AI</p>
                <p className="text-sm font-semibold text-surface-text">Store owner dashboard</p>
              </div>
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl font-outfit font-bold tracking-tight text-surface-text">Intake smarter, not harder</h1>
              <p className="max-w-xl text-sm leading-7 text-surface-muted">
                Add new product inventory with image upload, AI metadata suggestions, and fast catalog control.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-surface-border bg-surface-card p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-surface-muted mb-4">Product intake made easy</p>
            <div className="space-y-4">
              <div className="rounded-3xl bg-white/90 border border-surface-border p-4">
                <p className="text-sm font-semibold">Instant AI product fields</p>
                <p className="text-xs text-surface-muted mt-1">Upload an image and get back suggested name, category, price, sizes, and occasions.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-surface-muted">
                <div className="rounded-3xl border border-surface-border bg-surface-bg p-3">
                  <p className="font-semibold text-surface-text">Image-based intake</p>
                  <p className="mt-1">Auto-discover attributes from product photos.</p>
                </div>
                <div className="rounded-3xl border border-surface-border bg-surface-bg p-3">
                  <p className="font-semibold text-surface-text">Inventory-ready</p>
                  <p className="mt-1">Save new styles directly to your Firestore catalogue.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="light-card rounded-[2rem] p-10 shadow-sm">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-3xl bg-primary/10 text-primary mb-4">
              <span className="text-lg font-bold">F</span>
            </div>
            <h2 className="text-3xl font-outfit font-bold mb-2">Welcome back</h2>
            <p className="text-sm text-surface-muted">Sign in to your account to continue styling.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-3xl border border-accent/20 bg-accent-light/60 p-4 text-sm text-accent">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 rounded-3xl border border-primary/20 bg-primary-light/70 p-4 text-sm text-primary">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-0.5" />
                <p>{successMsg}</p>
              </div>
            </div>
          )}

          {showReset ? (
            <form onSubmit={handlePasswordReset} className="space-y-5">
              <p className="text-sm text-surface-muted">Enter your registered email and we’ll send you a reset link.</p>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-surface-muted"><Mail className="h-5 w-5" /></span>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-light w-full py-3 pl-11 pr-4 text-sm"
                  required
                />
              </div>
              <button type="submit" disabled={resetLoading} className="btn-primary w-full py-3 text-sm">
                {resetLoading ? 'Sending...' : 'Send Reset Email'}
              </button>
              <button type="button" onClick={() => { setShowReset(false); setError(''); }} className="w-full rounded-2xl border border-surface-border py-3 text-sm text-surface-muted hover:text-surface-text transition-colors">
                ← Back to Sign In
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.32em] text-surface-muted">Email address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-surface-muted"><Mail className="h-5 w-5" /></span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input-light w-full py-3 pl-11 pr-4 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-[0.32em] text-surface-muted">Password</label>
                    <button type="button" onClick={() => { setShowReset(true); setResetEmail(email); setError(''); }} className="text-xs text-primary hover:underline">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-surface-muted"><Lock className="h-5 w-5" /></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="input-light w-full py-3 pl-11 pr-11 text-sm"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-muted hover:text-surface-text">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>

              <div className="relative my-8 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-border"></div>
                </div>
                <span className="relative bg-surface-bg px-3 text-xs text-surface-muted uppercase tracking-[0.32em]">or try demo shopper</span>
              </div>

              <button
                type="button"
                onClick={handleDemoAccess}
                disabled={demoLoading || loading}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                {demoLoading ? 'Loading demo...' : 'Try Demo Shopper'}
              </button>

              <p className="mt-6 text-center text-sm text-surface-muted">
                New shopper?{' '}
                <Link to="/register" className="text-primary font-semibold hover:underline">Create an account</Link>
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Login;
