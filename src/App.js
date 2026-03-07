import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Menu from './menu';
import Usuario from './usuario';
import LoginPage from './Login';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './authContext';
import ModeloDespiece from "./ModeloDespiece";
import Recuperar from './recuperar';
import AdminUsuarios from './AdminUsuarios';

function App() {
  return (
    <AuthProvider>
      <Router basename="/">
        <main aria-label="Aplicación ADN">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recuperar" element={<Recuperar />} />
            <Route
              path="/menu"
              element={
                <ProtectedRoute>
                  <Menu />
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuario"
              element={
                <ProtectedRoute>
                  <Usuario />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/modelo-despiece" 
              element={
                <ProtectedRoute>
                  <ModeloDespiece />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/modelo-despiece/:id" 
              element={
                <ProtectedRoute>
                  <ModeloDespiece />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin/usuarios"
              element={
                <ProtectedRoute>
                  <AdminUsuarios />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;