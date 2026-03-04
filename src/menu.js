import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaSun, FaMoon, FaUsersCog } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import estilos from "./App.module.css";
import userIcon from "./Assets/usuario.png";
import adnLogo from "./Assets/ADN.png"; // Import at top
import { auth, db } from "./credenciales";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useAuth } from "./authContext";

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
  const [highContrast, setHighContrast] = useState(() => {
    const saved = localStorage.getItem("highContrast");
    return saved ? JSON.parse(saved) : false;
  });
  const [userCargo, setUserCargo] = useState("");
  const userMenuRef = useRef(null);
  const userInfoRef = useRef(null);
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const { currentUser } = useAuth();

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

  const toggleHighContrast = () => {
    setHighContrast((prev) => {
      const newVal = !prev;
      localStorage.setItem("highContrast", JSON.stringify(newVal));
      if (newVal) {
        document.body.classList.add("high-contrast");
      } else {
        document.body.classList.remove("high-contrast");
      }
      return newVal;
    });
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Aplicar alto contraste al cargar
    if (highContrast) {
      document.body.classList.add("high-contrast");
    } else {
      document.body.classList.remove("high-contrast");
    }
  }, [highContrast]);

  useEffect(() => {
    // Use a stable event handler and always remove it on cleanup
    function handleClickOutside(event) {
      // Only close menu if refs are attached and dropdown is visible
      if (
        mostrarUserMenu &&
        userInfoRef.current &&
        userMenuRef.current &&
        !userInfoRef.current.contains(event.target) &&
        !userMenuRef.current.contains(event.target)
      ) {
        setMostrarUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mostrarUserMenu]);

  // Utilidad para recargar despieces desde Firestore
  const fetchDespieces = async () => {
    if (!isMountedRef.current) return;
    setLoadingDespieces(true);
    try {
      const { getDocs, collection, query, where, collectionGroup } = await import("firebase/firestore");
      let q;
      if (currentUser && userCargo === "Administrador") {
        // Collection group query for admins to get all despieces from all users
        q = query(collectionGroup(db, 'despieces'));
      } else if (currentUser) {
        // Query for the subcollection of the current user
        q = collection(db, "usuarios", currentUser.uid, "despieces");
      } else {
        // No user logged in, so no despieces to show.
        if (isMountedRef.current) setDespieces([]);
        if (isMountedRef.current) setLoadingDespieces(false);
        return;
      }

      const despiecesSnapshot = await getDocs(q);
      const despiecesData = despiecesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(d => d.id);
      if (isMountedRef.current) setDespieces(despiecesData);
    } catch (error) {
      if (isMountedRef.current) console.error("Error al obtener los despieces:", error);
    } finally {
      if (isMountedRef.current) setLoadingDespieces(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isMountedRef.current) return;
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
            if (userDoc.exists() && isMountedRef.current) {
              const userData = userDoc.data();
              setUserName(userData.Nombre || "Nombre usuario");
              setUserCargo(userData.Cargo || "");
            }
          } catch (error) {
            if (isMountedRef.current) console.error("Error al obtener los datos del usuario:", error);
          }
        };
        fetchUserData();
        fetchDespieces();
      } else {
        setUserPhoto(userIcon);
        setDespieces([]);
        setUserCargo("");
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

    // Normalizar filtroFecha (YYYY-MM-DD) a DD/MM/YYYY para comparar con Firestore
    let filtroFechaNormalizado = filtroFecha;
    if (filtroFecha && filtroFecha.includes("-")) {
      const [yyyy, mm, dd] = filtroFecha.split("-");
      filtroFechaNormalizado = `${parseInt(dd,10)}/${parseInt(mm,10)}/${yyyy}`;
    }

    // fechaCreacion en Firestore es 'DD/MM/YYYY' (string)
    const fechaNormalizada = despiece.fechaCreacion || "";
    const coincideFecha = !filtroFecha || fechaNormalizada === filtroFechaNormalizado;

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

  const claseContenedor = estilos.App;

  return (
    <div className={claseContenedor} role="main" aria-label="Aplicación ADN">
      <header className={`${estilos.topBar} ${darkMode ? estilos.topBarDark : ""}`} role="banner">
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
            src={adnLogo}
            alt="logo programa"
          />
        </div>
        <div
          className={estilos.userInfo}
          onClick={toggleUserMenu}
          ref={userInfoRef}
          style={{ cursor: "pointer", position: "relative" }}
          tabIndex={0}
          aria-haspopup="true"
          aria-expanded={mostrarUserMenu}
          aria-label="Menú de usuario"
        >
          <span>{userName}</span>
          <img src={userPhoto} alt="Usuario" className={estilos.userIcon} onError={e => { e.target.onerror = null; e.target.src = userIcon; }} />
          {/* Always render the dropdown, toggle visibility with CSS */}
          <div
            className={
              `${estilos.userDropdown} ${darkMode ? estilos.userDropdownDark : ""} ${mostrarUserMenu ? estilos.userDropdownVisible : estilos.userDropdownHidden}`
            }
            ref={userMenuRef}
            style={{
              display: mostrarUserMenu ? "block" : "none",
              position: "absolute",
              right: 0,
              zIndex: 1000
            }}
            role="menu"
            aria-label="Opciones de usuario"
          >
            {window.location.pathname !== "/usuario" && (
              <Link
                to="/usuario"
                className={estilos.userDropdownItem}
                onClick={() => setMostrarUserMenu(false)}
                role="menuitem"
              >
                Perfil
              </Link>
            )}
            <button
              onClick={handleLogout}
              className={estilos.userDropdownItem}
              role="menuitem"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div aria-label="Menú principal">
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
          {/* Botón de alto contraste SOLO en el menú lateral */}
          <div
            className={estilos.menuitem}
            onClick={toggleHighContrast}
            style={{ cursor: "pointer", fontWeight: highContrast ? 'bold' : 'normal', color: highContrast ? '#FFD600' : undefined }}
            aria-pressed={highContrast}
            aria-label={highContrast ? "Desactivar alto contraste" : "Activar alto contraste"}
            tabIndex={0}
            role="button"
          >
            <span className={estilos.menuitemicon}>
              {highContrast ? '🟨' : '⬛'}
            </span>
            {highContrast ? 'Alto Contraste ON' : 'Alto Contraste'}
          </div>
          {userCargo === 'Administrador' && (
            <Link to="/admin/usuarios" className={estilos.menuitem}>
              <span className={estilos.menuitemicon}>
                <FaUsersCog />
              </span>
              Gestionar Usuarios
            </Link>
          )}
        </nav>
      </div>

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
            <label
              htmlFor="filtroFecha"
              style={{
                marginRight: "0.5rem",
                fontWeight: "bold",
                color: darkMode ? "#fff" : "#333"
              }}
            >
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
                <li key={despiece.id} className={estilos.despieceItem}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem'}}>
                    <h3 style={{cursor:'pointer', color:'#1976d2', textDecoration:'underline', margin:0}}
                        onClick={() => navigate(`/modelo-despiece/${despiece.id}`)}>
                      {despiece.proyecto}
                    </h3>
                    {/* Mejorar contraste del botón Eliminar */}
                    <button
                      style={{
                        background:'#a31515',
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
                            await fetchDespieces();
                            if (isMountedRef.current) {
                              alert('Proyecto eliminado correctamente.');
                            }
                          } catch (err) {
                            if (isMountedRef.current) {
                              alert('Error al eliminar el proyecto: ' + (err && err.message ? err.message : JSON.stringify(err)));
                            }
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
