import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ShopperStudio from './pages/ShopperStudio';
import AdminDashboard from './pages/AdminDashboard';

// Coordinator for default wildcard path routing
const RootRouteRedirect = () => {
  const { currentUser, userRole } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return userRole === 'owner' 
    ? <Navigate to="/admin" replace />
    : <Navigate to="/studio" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Shopper fitting studio route */}
          <Route 
            path="/studio" 
            element={
              <ProtectedRoute>
                <ShopperStudio />
              </ProtectedRoute>
            } 
          />

          {/* Store owner catalogue admin route */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Default Wildcard redirect */}
          <Route path="*" element={<RootRouteRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
