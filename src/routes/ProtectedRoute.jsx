import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route protection gate
 * @param {React.ReactNode} children - Children to render if authorized
 * @param {Array<string>} allowedRoles - Optional array of roles allowed to view page (e.g., ['owner'])
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();

  // If still loading session details, show a simple spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold"></div>
      </div>
    );
  }

  // Redirect to login if user is not signed in
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If roles constraint is defined, check if user's role matches
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.warn(`[Route Gate] Role "${userRole}" is unauthorized to access this page. Redirecting...`);
    // Redirect shopper to studio and owner to admin
    return userRole === 'owner' 
      ? <Navigate to="/admin" replace />
      : <Navigate to="/studio" replace />;
  }

  // Authorized: render target component
  return children;
};

export default ProtectedRoute;
