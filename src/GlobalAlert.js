import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './credenciales';
import { useAuth } from './authContext';

const GlobalAlert = () => {
  const [alertData, setAlertData] = useState(null);
  const [dismissedAlertTime, setDismissedAlertTime] = useState(() => {
    const saved = localStorage.getItem('dismissedAlertTime');
    return saved ? parseInt(saved, 10) : null;
  });
  const { currentUser } = useAuth(); // Only show alert if logged in

  useEffect(() => {
    if (!currentUser) return;
    
    // Listen to firestore configuracion/alertaGlobal
    const alertRef = doc(db, 'configuracion', 'alertaGlobal');
    const unsubscribe = onSnapshot(alertRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.activa) {
          // If we have a new timestamp, we should show it
          if (!dismissedAlertTime || (data.timestamp && data.timestamp.seconds > dismissedAlertTime)) {
            setAlertData(data);
          }
        } else {
            setAlertData(null);
        }
      }
    }, (error) => {
        console.error("Error listening to global alert:", error);
    });

    return () => unsubscribe();
  }, [currentUser, dismissedAlertTime]);

  if (!alertData) return null;

  const handleDismiss = () => {
    if (alertData.timestamp) {
        const time = alertData.timestamp.seconds;
        setDismissedAlertTime(time);
        localStorage.setItem('dismissedAlertTime', time.toString());
    }
    setAlertData(null);
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 9999, // Make sure it's on top of everything
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(5px)',
  };

  const modalStyle = {
    backgroundColor: '#dc3545',
    color: '#fff',
    padding: '40px',
    borderRadius: '12px',
    textAlign: 'center',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 15px 35px rgba(220,53,69,0.4)',
    border: '2px solid #ff6b6b'
  };

  const buttonStyle = {
    marginTop: '25px',
    padding: '12px 30px',
    backgroundColor: '#fff',
    color: '#dc3545',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s, background-color 0.2s',
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '1.8rem', margin: '0 0 15px 0', textTransform: 'uppercase' }}>
          <span>⚠️</span>
          <span style={{ textAlign: 'center' }}>Alerta de Sistema</span>
          <span>⚠️</span>
        </h2>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.5', marginBottom: '0' }}>{alertData.mensaje}</p>
        <button 
          style={buttonStyle} 
          onClick={handleDismiss}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f1f1'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

export default GlobalAlert;
