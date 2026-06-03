import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shirt, User, LayoutDashboard, ShoppingBag, LogOut } from 'lucide-react';

const Navbar = () => {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser) return null;

  const isAdminPath = location.pathname === '/admin';

  return (
    <header className="bg-white border-b border-surface-border py-4 px-6 sticky top-0 z-40 flex items-center justify-between shadow-sm">
      <div 
        onClick={() => navigate(userRole === 'owner' ? '/admin' : '/studio')} 
        className="flex items-center gap-3 cursor-pointer select-none"
      >
        <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center border border-gold/30">
          <Shirt className="h-5 w-5 text-gold" />
        </div>
        <span className="text-xl font-outfit font-bold tracking-wider text-white">
          FitStyle <span className="text-gold">AI</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Owner Nav Toggle Controls */}
        {userRole === 'owner' && (
          <>
            {isAdminPath ? (
              <button 
                onClick={() => navigate('/studio')}
                className="flex items-center gap-2 border border-rose hover:bg-rose-light/10 text-rose py-2 px-4 rounded-xl text-sm font-semibold transition-all font-outfit"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Fit Studio</span>
              </button>
            ) : (
              <button 
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 border border-gold hover:bg-gold-light/10 text-gold py-2 px-4 rounded-xl text-sm font-semibold transition-all font-outfit"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Store Admin</span>
              </button>
            )}
          </>
        )}

        {/* Sign Out Button */}
        <button 
          onClick={logout}
          title="Sign Out"
          className="glass-panel border-dark-border hover:bg-white/5 p-2 rounded-xl text-dark-muted hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
