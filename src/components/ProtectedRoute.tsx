import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  isAllowed: boolean | undefined;
  redirectPath?: string;
  children?: React.ReactNode;
};

const ProtectedRoute = ({ isAllowed, redirectPath = '/signin', children }:ProtectedRouteProps) => {
  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
