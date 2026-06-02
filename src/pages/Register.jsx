import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shirt, Lock, Mail, AlertCircle, ShoppingBag, Store } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('shopper'); // shopper or owner
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (currentUser && userRole) {
      if (userRole === 'owner') {
        navigate('/admin');
      } else {
        navigate('/studio');
      }
    }
  }, [currentUser, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all email and password fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await register(email, password, role);
      // Success redirection is handled by the useEffect above
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (code === 'auth/invalid-email') {
        setError('The email address format is invalid.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err?.message?.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.?$/, '') || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full glass-panel-gold rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background blur objects */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-rose/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gold/10 rounded-full blur-2xl"></div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rose/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose/30">
            <Shirt className="h-8 w-8 text-rose" />
          </div>
          <h2 className="text-3xl font-outfit font-bold tracking-tight text-white">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-dark-muted font-inter">
            Your Personal Stylist Awaits
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-light border border-rose/30 rounded-xl flex items-start gap-3 text-rose text-sm font-inter">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role selector selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-muted uppercase tracking-wider block mb-2">
              Choose Profile Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('shopper')}
                className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 border font-medium text-sm transition-all ${
                  role === 'shopper'
                    ? 'border-rose bg-rose-light text-rose'
                    : 'border-dark-border bg-[#131518]/40 text-dark-muted hover:border-white/20'
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Online Shopper</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 border font-medium text-sm transition-all ${
                  role === 'owner'
                    ? 'border-gold bg-gold-light text-gold'
                    : 'border-dark-border bg-[#131518]/40 text-dark-muted hover:border-white/20'
                }`}
              >
                <Store className="h-4 w-4" />
                <span>Store Owner</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-muted uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                <Mail className="h-5 w-5" />
              </span>
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
            <label className="text-xs font-semibold text-dark-muted uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-dark-muted">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-[#131518]/70 border border-dark-border rounded-xl py-3 pl-11 pr-4 text-white placeholder-dark-muted/65 focus:outline-none focus:border-gold transition-colors font-inter text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-black font-semibold py-3 px-4 rounded-xl transition-all shadow-lg font-outfit transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none mt-2 ${
              role === 'owner' ? 'bg-gold hover:bg-gold-hover' : 'bg-rose hover:bg-rose-hover'
            }`}
          >
            {loading ? 'Creating Account...' : 'Register & Onboard'}
          </button>
        </form>

        <div className="text-center font-inter text-sm mt-6 text-dark-muted">
          <span>Already have an account? </span>
          <Link to="/login" className="text-gold hover:underline font-semibold transition-all">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
