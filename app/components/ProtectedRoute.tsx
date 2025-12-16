import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const forcePath = '/force-password-change';

  // Wait for auth check to complete before redirecting
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          <div className="text-blue-700 font-medium">Loading...</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Force password change redirect for any user flagged as needs_change
  if (user.password_status === 'needs_change' && location.pathname !== forcePath) {
    return <Navigate to={forcePath} replace />;
  }

  // Allow access to the force password page itself
  return <Outlet />;
}
