import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './authContext'; // Asegúrate de tener un contexto de autenticación

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  console.log("Usuario autenticado en ProtectedRoute:", currentUser);
  return currentUser ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
