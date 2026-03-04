import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './credenciales';
import { collection, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import estilos from "./App.module.css"; // Assuming shared styles

const GestionCuentas = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "usuarios", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (isMountedRef.current) {
            if (userDoc.exists() && userDoc.data().Cargo === 'Administrador') {
              setIsAdmin(true);
              fetchUsers();
            } else {
              setIsAdmin(false);
            }
            setLoading(false);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          if (isMountedRef.current) {
            setIsAdmin(false);
            setLoading(false);
          }
        }
      } else {
        if (isMountedRef.current) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'usuarios');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (isMountedRef.current) {
        setUsers(usersList);
      }
    } catch (error) {
      console.error("Error fetching users: ", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'usuarios', userId));
        // We need to be careful here. Deleting the user document in Firestore
        // does not delete the user from Firebase Authentication.
        // For a full deletion, you would need to use the Firebase Admin SDK in a Cloud Function.
        alert('User document deleted from Firestore. The user may still exist in Firebase Authentication.');
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error("Error deleting user: ", error);
        alert('Failed to delete user document.');
      }
    }
  };

  if (loading) {
    return <div style={styles.container}><p>Verifying user role...</p></div>;
  }

  if (!isAdmin) {
    return <div style={styles.container}><p style={styles.error}>Access Denied. You are not authorized to view this page.</p></div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>User Account Management</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={styles.td}>{user.Nombre}</td>
                <td style={styles.td}>{user.Email || 'N/A'}</td>
                <td style={styles.td}>{user.Cargo}</td>
                <td style={styles.td}>
                  <button 
                    style={styles.deleteButton}
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.Cargo === 'Administrador'} // Prevent admin from deleting themselves
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Basic styling to make the page usable without external CSS
const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    color: '#333',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    boxShadow: '0 2px 15px rgba(0,0,0,0.1)',
    background: '#fff',
  },
  th: {
    backgroundColor: '#1976d2',
    color: 'white',
    padding: '12px 15px',
    textAlign: 'left',
  },
  td: {
    padding: '12px 15px',
    borderBottom: '1px solid #ddd',
  },
  deleteButton: {
    background:'#a31515',
    color:'#fff',
    border:'none',
    borderRadius:'4px',
    padding:'8px 12px',
    cursor:'pointer',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    fontWeight: 'bold',
  }
};

export default GestionCuentas;
