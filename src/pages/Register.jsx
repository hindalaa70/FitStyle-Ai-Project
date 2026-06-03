import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ShoppingBag } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && userRole) {
      navigate(userRole === 'owner' ? '/admin' : '/studio');
    }
  }, [currentUser, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await register(email, password, 'shopper');
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err?.message?.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.\?$/, '') || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg text-surface-text flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl grid lg:grid-cols-[1.15fr_0.95fr] gap-8">
        <section className="hidden lg:flex flex-col justify-between light-card p-10 overflow-hidden rounded-[2rem]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-3xl bg-accent-light px-4 py-3">
              <span className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-surface-muted">FitStyle AI</p>
                <p className="text-sm font-semibold text-surface-text">Shopper registration</p>
              </div>
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl font-outfit font-bold tracking-tight text-surface-text">Create your style profile</h1>
              <p className="max-w-xl text-sm leading-7 text-surface-muted">
                Register quickly and begin receiving outfit recommendations tailored to your body shape and occasion.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-surface-border bg-surface-card p-8">
            <div className="grid gap-4">
              <div className="rounded-3xl bg-white/90 border border-surface-border p-4">
                <p className="text-sm font-semibold text-surface-text">Personal styling made accessible</p>
                <p className="text-xs text-surface-muted mt-1">Fast onboarding for shoppers and immediate AI try-on access.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-surface-muted">
                <div className="rounded-3xl border border-surface-border bg-surface-bg p-3">
                  <p className="font-semibold text-surface-text">Easy setup</p>
                  <p className="mt-1">Register with email and you’re ready to try it.</p>
                </div>
                <div className="rounded-3xl border border-surface-border bg-surface-bg p-3">
                  <p className="font-semibold text-surface-text">AI styling</p>
                  <p className="mt-1">Get outfit guidance for every occasion.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="light-card rounded-[2rem] p-10 shadow-sm">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-3xl bg-accent-light text-accent mb-4">
              <span className="text-lg font-bold">F</span>
            </div>
            <h2 className="text-3xl font-outfit font-bold mb-2">Create Your Shopper Account</h2>
            <p className="text-sm text-surface-muted">Set up your account to unlock AI styling guidance and virtual try-on.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-3xl border border-accent/20 bg-accent-light/60 p-4 text-sm text-accent">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p>{error}</p>
              </div>
            </div>
          )}

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
              <label className="text-xs font-semibold uppercase tracking-[0.32em] text-surface-muted">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-surface-muted"><Lock className="h-5 w-5" /></span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="input-light w-full py-3 pl-11 pr-4 text-sm"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Register;
