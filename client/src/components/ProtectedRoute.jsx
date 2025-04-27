import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Check role-based access if roles are specified
  if (allowedRoles && allowedRoles.length > 0 && user) {
    // Get user role from user object
    const userRole = user.role || 'student';
    
    // If user doesn't have the required role, redirect to dashboard
    if (!allowedRoles.includes(userRole)) {
      return (
        <Navigate 
          to="/dashboard" 
          state={{ 
            accessDenied: true,
            message: `Access denied. This section requires ${allowedRoles.join(' or ')} permissions.`
          }} 
          replace 
        />
      );
    }
  }
  
  // If all checks pass, render the protected component
  return children;
};

export default ProtectedRoute; 