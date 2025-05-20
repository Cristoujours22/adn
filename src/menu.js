import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaSun, FaMoon } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import estilos from "./App.module.css";
import userIcon from "./Assets/usuario.png";
import { auth, db } from "./credenciales";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

const Menu = () => {
  const location = useLocation();
  const [userName, setUserName] = useState("Nombre usuario");
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarUserMenu, setMostrarUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [despieces, setDespieces] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [userPhoto, setUserPhoto] = useState(userIcon);
  const [loadingDespieces, setLoadingDespieces] = useState(true);
  const userMenuRef = useRef(null);
  const userInfoRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setMostrarMenu(!mostrarMenu);
    setMostrarUserMenu(false);
  };

  const toggleUserMenu = () => {
    setMostrarUserMenu((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      // Limpiar datos locales
      localStorage.removeItem("usuario");
      localStorage.removeItem("contrasena");
      localStorage.removeItem("recordar");
      
      // Cerrar sesión en Firebase
      await signOut(auth);
      
      // Redirigir al login
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("darkMode", JSON.stringify(newMode));
      if (newMode) {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
      return newMode;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mostrarUserMenu &&
        userInfoRef.current &&
        !userInfoRef.current.contains(event.target) &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setMostrarUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mostrarUserMenu]);

  const claseContenedor = estilos.App;

  // Utilidad para recargar despieces desde Firestore
  const fetchDespieces = async () => {
    try {
      setLoadingDespieces(true);
      const { getDocs, collection } = await import("firebase/firestore");
      const despiecesSnapshot = await getDocs(collection(db, "despieces"));
      const despiecesData = despiecesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(d => d.id); // Solo los que tienen id válido
      setDespieces(despiecesData);
    } catch (error) {
      console.error("Error al obtener los despieces:", error);
    } finally {
      setLoadingDespieces(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.photoURL) {
          setUserPhoto(user.photoURL);
        } else {
          setUserPhoto(userIcon);
        }
        const fetchUserData = async () => {
          try {
            const userDocRef = doc(db, "usuarios", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserName(userData.Nombre || "Nombre usuario");
            }
          } catch (error) {
            console.error("Error al obtener los datos del usuario:", error);
          }
        };
        fetchUserData();
        fetchDespieces(); // Usar la función utilitaria
      } else {
        setUserPhoto(userIcon);
        setDespieces([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const irADespieces = () => {
    // Agregué la navegación al modelo de despiece
    navigate("/modelo-despiece");
  };

  // Filtrado de despieces
  const despiecesFiltrados = despieces.filter((despiece) => {
    const proyecto = despiece.proyecto || "";
    const cliente = despiece.cliente || "";
    const coincideBusqueda =
      proyecto.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFecha =
      !filtroFecha || despiece.fecha === filtroFecha;
    return coincideBusqueda && coincideFecha;
  });

  // Renderizar solo proyectos con id único y key robusto
  const uniqueDespieces = [];
  const seenIds = new Set();
  despiecesFiltrados.forEach(d => {
    if (d.id && !seenIds.has(d.id)) {
      uniqueDespieces.push(d);
      seenIds.add(d.id);
    } else if (d.id) {
      console.warn('Proyecto duplicado con id:', d.id, d);
    }
  });

  return (
    <div className={claseContenedor}>
      <header className={`${estilos.topBar} ${darkMode ? estilos.topBarDark : ""}`}>
        <button
          className={estilos.botonHamburguesa}
          onClick={toggleMenu}
          aria-label="Menu hamburguesa"
        >
          <GiHamburgerMenu />
        </button>
        <div className={estilos.logo2}>
          <img
            className={estilos.ADN1}
            src={require("./Assets/ADN.png")}
            alt="logo programa"
          />
        </div>
        <div
          className={estilos.userInfo}
          onClick={toggleUserMenu}
          ref={userInfoRef}
          style={{ cursor: "pointer", position: "relative" }}
        >
          <span>{userName}</span>
          <img src={userPhoto} alt="Usuario" className={estilos.userIcon} onError={e => { e.target.onerror = null; e.target.src = userIcon; }} />
          {mostrarUserMenu && (
            <div className={`${estilos.userDropdown} ${darkMode ? estilos.userDropdownDark : ""}`} ref={userMenuRef}>
              {window.location.pathname !== "/usuario" && (
              <Link
                to="/usuario"
                className={estilos.userDropdownItem}
                onClick={() => setMostrarUserMenu(false)}
              >
                Perfil
              </Link>
              )}
              <button
                onClick={handleLogout}
                className={estilos.userDropdownItem}
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <main aria-label="Menú principal">
        <nav
          className={
            `${estilos.menucontainer} ${mostrarMenu ? estilos.mostrar : ""} ${darkMode ? estilos.menucontainerDark : ""}`
          }
          aria-label="Menú lateral"
        >
          <h2 className={estilos.menutitle}>Menú Principal</h2>
          <Link to="/menu" className={estilos.menuitem}>
            <span className={estilos.menuitemicon}>
              <FaHome />
            </span>
            Inicio
          </Link>
          <div
            className={estilos.menuitem}
            onClick={toggleDarkMode}
            style={{ cursor: "pointer" }}
          >
            <span className={estilos.menuitemicon}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </span>
            {darkMode ? "Modo Claro" : "Modo Oscuro"}
          </div>
        </nav>
      </main>

      {/* Sección de despieces ubicada más abajo */}
      {location.pathname === "/menu" && (
        <section className={`${estilos.despiecesSection} ${darkMode ? estilos.despiecesSectionDark : ""}`}>
          <h2>Despieces Guardados</h2>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <input
              id="busquedaProyecto"
              name="busquedaProyecto"
              type="text"
              placeholder="Buscar por proyecto o cliente"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className={estilos.inputBuscar}
            />
            {/* Hacer visible y accesible la etiqueta del filtro de fecha */}
            <label htmlFor="filtroFecha" style={{marginRight: "0.5rem", fontWeight: "bold"}}>
              Filtrar por fecha
            </label>
            <input
              id="filtroFecha"
              name="filtroFecha"
              type="date"
              value={filtroFecha}
              onChange={e => setFiltroFecha(e.target.value)}
              className={estilos.inputBuscar}
              aria-label="Filtrar por fecha"
            />
          </div>
          <button className={estilos.botonAgregar} onClick={irADespieces}>
            Agregar Nuevo Despiece
          </button>
          {loadingDespieces ? (
            <p style={{textAlign:'center', color:'#888', marginTop:'2rem'}}>Cargando proyectos...</p>
          ) : uniqueDespieces.length > 0 ? (
            <ul className={estilos.despiecesList}>
              {uniqueDespieces.map((despiece) => (
                <li key={despiece.id + '-' + (despiece.proyecto || '')} className={estilos.despieceItem}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem'}}>
                    <h3 style={{cursor:'pointer', color:'#1976d2', textDecoration:'underline', margin:0}}
                        onClick={() => navigate(`/modelo-despiece/${despiece.id}`)}>
                      {despiece.proyecto}
                    </h3>
                    {/* Mejorar contraste del botón Eliminar */}
                    <button
                      style={{
                        background:'#a31515', // Color más oscuro para mejor contraste (#a31515 sobre blanco: 6.13:1)
                        color:'#fff',
                        border:'none',
                        borderRadius:'4px',
                        padding:'4px 10px',
                        cursor:'pointer',
                        fontWeight: 'bold'
                      }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if(window.confirm('¿Seguro que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) {
                          try {
                            const { doc, deleteDoc } = await import('firebase/firestore');
                            await deleteDoc(doc(db, 'despieces', despiece.id));
                            setDespieces([]); // Limpiar la lista antes de recargar
                            await fetchDespieces(); // Recarga desde Firestore
                            alert('Proyecto eliminado correctamente.');
                          } catch (err) {
                            alert('Error al eliminar el proyecto: ' + (err && err.message ? err.message : JSON.stringify(err)));
                            console.error('Error al eliminar el proyecto:', err);
                          }
                        }
                      }}
                    >Eliminar</button>
                  </div>
                  <p>Cliente: {despiece.cliente}</p>
                  <p>Fecha de Creación: {despiece.fechaCreacion || despiece.fecha || '-'}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{textAlign:'center', color:'#888', marginTop:'2rem'}}>No hay proyectos guardados.</p>
          )}
        </section>
      )}
    </div>
  );
};

export default Menu;
