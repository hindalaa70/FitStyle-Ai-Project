import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shirt, Lock, Mail, AlertCircle, ShoppingBag, Store, CheckCircle, KeyRound } from 'lucide-react';

// Map Firebase error codes to clean user messages
const getFriendlyError = (err) => {
  const code = err?.code || '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Incorrect email or password. Please check your credentials and try again.';
  }
  if (code === 'auth/invalid-email') return 'The email address format is invalid.';
  if (code === 'auth/too-many-requests') return 'Too many failed attempts. Please wait a moment and try again.';
  if (code === 'auth/network-request-failed') return 'Network error. Please check your internet connection.';
  if (code === 'auth/user-disabled') return 'This account has been disabled. Contact support.';
  return err?.message?.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.?$/, '') || 'Login failed. Please try again.';
};

// All possible demo passwords (legacy + current)
const DEMO_PASSWORDS = ['password123', 'demo123456', 'Password123'];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoCreating, setDemoCreating] = useState(null); // 'shopper' | 'owner' | null
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { login, register, resetPassword, currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
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
      setError('Please fill in all email and password fields.');
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

  // Try backend-forced demo account creation/reset
  const forceCreateDemoViaBackend = async (roleType) => {
    try {
      const res = await fetch('/api/create-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleType }),
      });
      if (res.ok) {
        const data = await res.json();
        return data; // { email, password }
      }
    } catch (e) {
      console.warn('[Demo] Backend create-demo failed:', e.message);
    }
    return null;
  };

  // Demo: try all legacy passwords, then register, then backend force-reset
  const handleDemoAccess = async (roleType) => {
    setError('');
    setSuccessMsg('');
    setDemoCreating(roleType);

    const demoEmail = roleType === 'owner' ? 'owner@fitstyle.demo' : 'shopper@fitstyle.demo';

    // Step 1: Try all known passwords
    for (const pwd of DEMO_PASSWORDS) {
      try {
        await login(demoEmail, pwd);
        setDemoCreating(null);
        return; // success
      } catch (err) {
        const code = err?.code || '';
        // If it's a credential mismatch just try next password
        if (code !== 'auth/invalid-credential' && code !== 'auth/wrong-password') {
          // Fatal non-password error
          setError(getFriendlyError(err));
          setDemoCreating(null);
          return;
        }
      }
    }

    // Step 2: All passwords failed — try backend force-reset
    setSuccessMsg('Resetting demo account via server...');
    const result = await forceCreateDemoViaBackend(roleType);
    if (result?.email && result?.password) {
      try {
        await login(result.email, result.password);
        setDemoCreating(null);
        return;
      } catch (loginErr) {
        console.warn('[Demo] Backend reset login failed:', loginErr.message);
      }
    }

    // Step 3: Try to register fresh (no existing account)
    setSuccessMsg(`Creating new demo ${roleType} account...`);
    try {
      await register(demoEmail, 'demo123456', roleType);
      setDemoCreating(null);
      return;
    } catch (regErr) {
      if (regErr?.code === 'auth/email-already-in-use') {
        setError(
          `Demo account exists but password is unknown.\n\nPlease go to Register and create:\nEmail: ${demoEmail}\nPassword: demo123456\nThen log in above.\n\nOr use the "Forgot Password?" link to reset it.`
        );
      } else {
        setError(getFriendlyError(regErr));
      }
    }
    setSuccessMsg('');
    setDemoCreating(null);
  };

  // Password reset flow
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Please enter your email address.');
      return;
    }
    try {
      setResetLoading(true);
      setError('');
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
    <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-panel-gold rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-gold/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-rose/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/30">
            <Shirt className="h-8 w-8 text-gold" />
          </div>
          <h2 className="text-3xl font-outfit font-bold tracking-tight text-white">Welcome back</h2>
          <p className="mt-2 text-sm text-dark-muted font-inter">Your Personal Stylist Awaits</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-5 p-4 bg-rose-light border border-rose/30 rounded-xl flex items-start gap-3 text-rose text-sm font-inter">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="whitespace-pre-line leading-relaxed">{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMsg && (
          <div className="mb-5 p-4 bg-gold/10 border border-gold/30 rounded-xl flex items-start gap-3 text-gold text-sm font-inter">
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ─── FORGOT PASSWORD PANEL ─── */}
        {showReset ? (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <p className="text-sm text-dark-muted font-inter leading-relaxed">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Your registered email"
                className="w-full bg-[#131518]/70 border border-dark-border rounded-xl py-3 pl-11 pr-4 text-white placeholder-dark-muted/65 focus:outline-none focus:border-gold transition-colors font-inter text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={resetLoading}
              className="w-full bg-gold hover:bg-gold-hover text-black font-semibold py-3 rounded-xl font-outfit transition-all disabled:opacity-50"
            >
              {resetLoading ? 'Sending...' : 'Send Reset Email'}
            </button>
            <button
              type="button"
              onClick={() => { setShowReset(false); setError(''); }}
              className="w-full text-dark-muted text-sm hover:text-white transition-colors font-inter"
            >
              ← Back to Sign In
            </button>
          </form>
        ) : (
          <>
            {/* ─── MAIN LOGIN FORM ─── */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-dark-muted uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted"><Mail className="h-5 w-5" /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. style@fitstyle.com"
                    className="w-full bg-[#131518]/70 border border-dark-border rounded-xl py-3 pl-11 pr-4 text-white placeholder-dark-muted/65 focus:outline-none focus:border-gold transition-colors font-inter text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-dark-muted uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => { setShowReset(true); setResetEmail(email); setError(''); }}
                    className="text-xs text-gold hover:underline font-inter transition-all flex items-center gap-1"
                  >
                    <KeyRound className="h-3 w-3" />
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted"><Lock className="h-5 w-5" /></span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-[#131518]/70 border border-dark-border rounded-xl py-3 pl-11 pr-4 text-white placeholder-dark-muted/65 focus:outline-none focus:border-gold transition-colors font-inter text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-hover text-black font-semibold py-3 px-4 rounded-xl transition-all shadow-lg font-outfit transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {loading ? 'Signing In...' : 'Sign In to Studio'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-border"></div>
              </div>
              <span className="relative bg-[#0d0e12] px-3 text-xs text-dark-muted font-semibold uppercase tracking-wider">
                or try demo accounts
              </span>
            </div>

            {/* Demo Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => handleDemoAccess('shopper')}
                disabled={!!demoCreating || loading}
                className="glass-panel hover:bg-white/5 border-dark-border py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 text-white font-medium transition-all disabled:opacity-60"
              >
                <ShoppingBag className="h-4 w-4 text-rose shrink-0" />
                <span>{demoCreating === 'shopper' ? 'Logging in...' : 'Demo Shopper'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoAccess('owner')}
                disabled={!!demoCreating || loading}
                className="glass-panel hover:bg-white/5 border-dark-border py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 text-white font-medium transition-all disabled:opacity-60"
              >
                <Store className="h-4 w-4 text-gold shrink-0" />
                <span>{demoCreating === 'owner' ? 'Logging in...' : 'Demo Admin'}</span>
              </button>
            </div>

            {/* Credentials hint box */}
            <div className="bg-white/[0.03] border border-dark-border/60 rounded-xl px-4 py-3 mb-5 text-[11px] text-dark-muted font-inter space-y-1">
              <p className="font-semibold text-white/50 uppercase tracking-wider mb-1.5">Demo Credentials</p>
              <p>Shopper → <span className="text-white/75 font-mono">shopper@fitstyle.demo</span></p>
              <p>Admin → <span className="text-white/75 font-mono">owner@fitstyle.demo</span></p>
              <p className="text-gold/60 pt-1">Buttons auto-login or create accounts on first use.</p>
            </div>

            <div className="text-center font-inter text-sm text-dark-muted">
              <span>Don't have an account? </span>
              <Link to="/register" className="text-gold hover:underline font-semibold transition-all">Register</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
