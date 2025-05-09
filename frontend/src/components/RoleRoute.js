import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice';

const RoleRoute = ({ children, roles }) => {
  const user = useSelector(selectCurrentUser);

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RoleRoute; 