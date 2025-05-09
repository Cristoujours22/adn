import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './authContext'; // Asegúrate de tener un contexto de autenticación

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, error } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>Error de autenticación: {error.message}</div>;
  }

  if (!currentUser) {
    // Guardamos la ubicación actual para redireccionar después del login
    const from = location.pathname;
    return <Navigate to="/login" state={{ from }} replace />;
  }

  return children;
};

export default ProtectedRoute;
