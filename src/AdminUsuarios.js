import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './credenciales';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useAuth } from './authContext';
import Menu from './menu';
import estilos from './App.module.css';
import { useNavigate } from 'react-router-dom';

function AdminUsuarios() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [userCargo, setUserCargo] = useState("");
    const [showAddUserForm, setShowAddUserForm] = useState(false);
    const [newUserData, setNewUserData] = useState({ Nombre: '', email: '', password: '', Cargo: 'Vendedor' });
    const [isAddingUser, setIsAddingUser] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            if (currentUser) {
                const userDocRef = doc(db, "usuarios", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const cargo = userData.Cargo || "";
                    setUserCargo(cargo);
                    if (cargo !== 'Administrador') {
                        console.warn("Acceso no autorizado a la página de administración.");
                        navigate('/menu'); // Redirigir si no es admin
                    }
                } else {
                    console.warn("No se encontró el documento del usuario, redirigiendo.");
                    navigate('/menu'); // Redirigir si el documento del usuario no existe
                }
            } else {
                // Si no hay usuario, redirigir al login. ProtectedRoute ya debería hacer esto.
                navigate('/login');
            }
        };
        checkAdmin();
    }, [currentUser, navigate]);

    useEffect(() => {
        if (userCargo === 'Administrador') {
            fetchUsers();
        }
    }, [userCargo]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const usersCollection = collection(db, 'usuarios');
            const usersSnapshot = await getDocs(usersCollection);
            const usersList = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersList);
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBlockUser = async (userId, isBlocked) => {
        if (userId === currentUser.uid) {
            alert("No puedes bloquearte a ti mismo.");
            return;
        }
        try {
            const userDocRef = doc(db, 'usuarios', userId);
            await updateDoc(userDocRef, {
                bloqueado: !isBlocked
            });
            setUsers(users.map(user =>
                user.id === userId ? { ...user, bloqueado: !isBlocked } : user
            ));
            alert(`Usuario ${!isBlocked ? 'bloqueado' : 'desbloqueado'} correctamente.`);
        } catch (error) {
            console.error("Error al actualizar estado de bloqueo del usuario:", error);
            alert("Error al actualizar el estado del usuario.");
        }
    };

    const handleAddNewUser = async (e) => {
        e.preventDefault();
        if (!newUserData.Nombre || !newUserData.email || !newUserData.password || !newUserData.Cargo) {
            alert("Por favor, complete todos los campos.");
            return;
        }
        setIsAddingUser(true);
        try {
            // NOTA: Esto desconectará al administrador actual y conectará al nuevo usuario.
            // La forma correcta de hacer esto sin desconectar al admin es con Cloud Functions.
            const userCredential = await createUserWithEmailAndPassword(auth, newUserData.email, newUserData.password);
            const newUser = userCredential.user;

            // Crear el documento en Firestore para el nuevo usuario
            await setDoc(doc(db, "usuarios", newUser.uid), {
                Nombre: newUserData.Nombre,
                Cargo: newUserData.Cargo,
                email: newUserData.email,
                creationTime: newUser.metadata.creationTime,
                lastSignInTime: newUser.metadata.lastSignInTime,
                bloqueado: false
            });

            // Desconectar al nuevo usuario y forzar al admin a iniciar sesión de nuevo
            await signOut(auth);
            alert('Usuario agregado exitosamente. Se ha cerrado tu sesión, por favor vuelve a iniciar sesión.');
            navigate('/login');

        } catch (error) {
            console.error("Error al crear usuario:", error);
            alert("Error al crear usuario: " + error.message);
        } finally {
            setIsAddingUser(false);
            setShowAddUserForm(false);
            setNewUserData({ Nombre: '', email: '', password: '', Cargo: 'Vendedor' });
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (userId === currentUser.uid) {
            alert("No puedes eliminarte a ti mismo.");
            return;
        }
        if (window.confirm(`¿Seguro que quieres eliminar al usuario ${userEmail}?\nEsta acción solo borra los datos de la aplicación, no la cuenta de autenticación.`)) {
            try {
                await deleteDoc(doc(db, "usuarios", userId));
                setUsers(users.filter(user => user.id !== userId));
                alert('Usuario eliminado de la base de datos de la aplicación.');
            } catch (error) {
                console.error("Error al eliminar usuario:", error);
                alert("Error al eliminar el usuario.");
            }
        }
    };

    if (userCargo !== 'Administrador') {
        // Muestra un loader o nada mientras se verifica el rol
        return <div><Menu /><p>Verificando permisos...</p></div>;
    }

    return (
        <div>
            <Menu />
            <div className={estilos.despiecesSection} style={{ margin: '20px' }}>
                <h2>Gestión de Usuarios</h2>
                <button onClick={() => setShowAddUserForm(!showAddUserForm)} className={estilos.botonAgregar} style={{ marginBottom: '20px' }}>
                    {showAddUserForm ? 'Cancelar' : 'Agregar Nuevo Usuario'}
                </button>

                {showAddUserForm && (
                    <form onSubmit={handleAddNewUser} className={estilos.section} style={{ width: '100%', maxWidth: '500px', margin: '20px auto', background: 'rgba(255,255,255,0.1)' }}>
                        <h3 style={{ color: 'white', textAlign: 'center' }}>Nuevo Usuario</h3>
                        <input
                            type="text"
                            placeholder="Nombre Completo"
                            value={newUserData.Nombre}
                            onChange={(e) => setNewUserData({ ...newUserData, Nombre: e.target.value })}
                            className={estilos.controls}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Correo Electrónico"
                            value={newUserData.email}
                            onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                            className={estilos.controls}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={newUserData.password}
                            onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                            className={estilos.controls}
                            required
                        />
                        <select
                            value={newUserData.Cargo}
                            onChange={(e) => setNewUserData({ ...newUserData, Cargo: e.target.value })}
                            className={estilos.controls}
                        >
                            <option value="Vendedor">Vendedor</option>
                            <option value="Diseñador">Diseñador</option>
                            <option value="Administrador">Administrador</option>
                        </select>
                        <button type="submit" className={estilos.butom} disabled={isAddingUser}>
                            {isAddingUser ? 'Agregando...' : 'Crear Usuario'}
                        </button>
                    </form>
                )}

                {loading ? <p>Cargando usuarios...</p> : (
                    <div className={estilos.tablaDespiece}>
                        <div className={estilos.filaDespiece}>
                            <div className={estilos.celdaTitulo}>Nombre</div>
                            <div className={estilos.celdaTitulo}>Email</div>
                            <div className={estilos.celdaTitulo}>Fecha de Creación</div>
                            <div className={estilos.celdaTitulo}>Último Ingreso</div>
                            <div className={estilos.celdaTitulo}>Estado</div>
                            <div className={estilos.celdaTitulo}>Acciones</div>
                        </div>
                        {users.map(user => (
                            <div key={user.id} className={estilos.filaDespiece}>
                                <div className={estilos.celdaDespiece}>{user.Nombre || 'No asignado'}</div>
                                <div className={estilos.celdaDespiece}>{user.email || 'No asignado'}</div>
                                <div className={estilos.celdaDespiece}>
                                    {user.creationTime ? new Date(user.creationTime).toLocaleDateString() : 'N/A'}
                                </div>
                                <div className={estilos.celdaDespiece}>
                                    {user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleString() : 'Nunca'}
                                </div>
                                <div className={estilos.celdaDespiece}>
                                    {user.bloqueado ? <span style={{ color: 'red', fontWeight: 'bold' }}>Bloqueado</span> : <span style={{ color: 'green', fontWeight: 'bold' }}>Activo</span>}
                                </div>
                                <div className={estilos.celdaDespiece}>
                                    {currentUser.uid !== user.id && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                                            <button
                                                onClick={() => toggleBlockUser(user.id, user.bloqueado)}
                                                className={user.bloqueado ? estilos.botonAgregar : estilos.botonEliminar}
                                                style={{ width: '110px', margin: 0, padding: '6px 10px', fontSize: '13px' }}
                                            >
                                                {user.bloqueado ? 'Desbloquear' : 'Bloquear'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id, user.email)}
                                                className={estilos.botonEliminar}
                                                style={{ width: '110px', margin: 0 }}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminUsuarios;