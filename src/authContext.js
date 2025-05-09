import React, { useContext, useState, useEffect } from 'react';
import { auth } from './credenciales';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        if (mounted) {
          setCurrentUser(user);
          setLoading(false);
          setError(null);
        }
      },
      (error) => {
        if (mounted) {
          console.error("Error de autenticación:", error);
          setError(error);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    loading,
    error
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 