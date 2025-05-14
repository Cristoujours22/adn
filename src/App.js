import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Menu from './menu';
import Usuario from './usuario';
import LoginPage from './Login';
import ProtectedRoute from './ProtectedRoute';
import { AuthProvider } from './authContext';
import ModeloDespiece from "./ModeloDespiece";

function App() {
  return (
    <AuthProvider>
      <Router basename="/">
        <main aria-label="Aplicación ADN">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recuperar" element={<div>Página de recuperación en construcción</div>} />
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
            <Route path="/modelo-despiece" element={<ModeloDespiece />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;