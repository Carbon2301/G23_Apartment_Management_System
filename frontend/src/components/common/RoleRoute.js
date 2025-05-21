import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import Message from './Message';

/**
 * Component for protecting routes based on user roles
 * @param {string[]} allowedRoles - Array of roles that are allowed to access the route
 */
const RoleRoute = ({ allowedRoles }) => {
  const { userInfo, loading } = useContext(AuthContext);
  const location = useLocation();

  // While checking authentication state, show nothing
  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!userInfo) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check if user has required role
  const hasRequiredRole = allowedRoles.includes(userInfo.role);
  
  if (!hasRequiredRole) {
    return (
      <div className="mt-5">
        <Message variant="danger">
          You do not have permission to access this page. This area is restricted to {allowedRoles.join(', ')} users.
        </Message>
      </div>
    );
  }

  // If authenticated and has required role, render the child routes
  return <Outlet />;
};

export default RoleRoute; 