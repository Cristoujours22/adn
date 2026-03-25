import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaSun, FaMoon, FaUsersCog, FaCommentDots, FaBell } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import estilos from "./App.module.css";
import userIcon from "./Assets/usuario.png";
import adnLogo from "./Assets/ADN.png"; // Import at top
import { auth, db } from "./credenciales";
import { doc, getDoc, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useAuth } from "./authContext";
import { useTheme } from "./ThemeContext";

const Menu = () => {
  const location = useLocation();
  const [userName, setUserName] = useState("Nombre usuario");
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarUserMenu, setMostrarUserMenu] = useState(false);
  const { darkMode, highContrast, toggleDarkMode, toggleHighContrast } = useTheme();
  
  const [despieces, setDespieces] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [userPhoto, setUserPhoto] = useState(userIcon);
  const [loadingDespieces, setLoadingDespieces] = useState(true);
  const [userCargo, setUserCargo] = useState("");
  const userMenuRef = useRef(null);
  const userInfoRef = useRef(null);
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filtroUsuario, setFiltroUsuario] = useState("");

  // Sugerencias States
  const [mostrarModalSugerencias, setMostrarModalSugerencias] = useState(false);
  const [textoSugerencia, setTextoSugerencia] = useState("");
  const [enviandoSugerencia, setEnviandoSugerencia] = useState(false);
  const [sugerencias, setSugerencias] = useState([]);
  const [sugerenciasSinLeer, setSugerenciasSinLeer] = useState(0);
  const [mostrarInbox, setMostrarInbox] = useState(false);

  const toggleMenu = () => {
    setMostrarMenu(!mostrarMenu);
    setMostrarUserMenu(false);
  };

  const toggleUserMenu = () => {
    setMostrarUserMenu((prev) => !prev);
  };

  const handleDispararAlerta = async () => {
    if (window.confirm("⚠️ ATENCIÓN: Esta acción enviará una pantalla roja de alerta a TODOS los usuarios conectados en este momento.\n\n¿Estás seguro de continuar con la alerta de actualización de servidor?")) {
      try {
        const alertaRef = doc(db, 'configuracion', 'alertaGlobal');
        await setDoc(alertaRef, {
          activa: true,
          mensaje: "El servidor se actualizará pronto, por favor guarda tu información inmediatamente para no perder tus cambios.",
          timestamp: serverTimestamp()
        });
        alert("Alerta global disparada correctamente. Todos los usuarios la están viendo.");
      } catch (error) {
        console.error("Error al disparar la alerta global:", error);
        alert("Hubo un error al intentar mandar la alerta.");
      }
    }
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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
  const fetchDespieces = useCallback(async () => {
    if (!isMountedRef.current || !currentUser) {
        if (isMountedRef.current) {
            setDespieces([]);
            setLoadingDespieces(false);
        }
        return;
    }
    setLoadingDespieces(true);
    try {
      const { getDocs, collection, query, where } = await import("firebase/firestore");
      const despiecesCollectionRef = collection(db, 'despieces');
      let q;

      if (userCargo === "Administrador") {
        // Admin gets all despieces
        q = query(despiecesCollectionRef);
      } else {
        // Regular user gets only their own despieces
        q = query(despiecesCollectionRef, where("userId", "==", currentUser.uid));
      }

      const despiecesSnapshot = await getDocs(q);
      // Ordenar por ultimaModificacion (timestamp numérico) - más reciente primero
      const despiecesData = despiecesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(d => d.id)
        .sort((a, b) => (b.ultimaModificacion || 0) - (a.ultimaModificacion || 0));
      if (isMountedRef.current) setDespieces(despiecesData);
    } catch (error) {
      if (isMountedRef.current) console.error("Error al obtener los despieces:", error);
    } finally {
      if (isMountedRef.current) setLoadingDespieces(false);
    }
  }, [currentUser, userCargo]);

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
              if (userData.photoBase64) {
                setUserPhoto(userData.photoBase64);
              }
            }
          } catch (error) {
            if (isMountedRef.current) console.error("Error al obtener los datos del usuario:", error);
          }
        };
        fetchUserData();
      } else {
        setUserPhoto(userIcon);
        setDespieces([]);
        setUserCargo("");
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch despieces when user info is available to avoid race conditions
  useEffect(() => {
    if (currentUser && userCargo) {
      fetchDespieces();
    } else if (!currentUser) {
      setDespieces([]);
    }
  }, [currentUser, userCargo, fetchDespieces]);

  // Cargar lista de usuarios para el filtro de administrador
  useEffect(() => {
    if (userCargo === 'Administrador') {
      const fetchUsersList = async () => {
        try {
          const { collection, getDocs } = await import("firebase/firestore");
          const usersCollection = collection(db, 'usuarios');
          const usersSnapshot = await getDocs(usersCollection);
          const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().Nombre }));
          if (isMountedRef.current) {
            setUsers(usersList);
          }
        } catch (error) {
          console.error("Error al cargar usuarios:", error);
        }
      };
      fetchUsersList();
    }
  }, [userCargo]);

  // Listener para Sugerencias (solo Admin)
  useEffect(() => {
    let unsubscribe = () => {};
    if (userCargo === 'Administrador') {
      const q = query(collection(db, "sugerencias"), orderBy("fecha", "desc"));
      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMountedRef.current) return;
        
        const sugList = [];
        let sinLeer = 0;
        const now = new Date();

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          
          // Auto-delete logic: Si está leída y pasó más de 24 hs desde que se marcó como leída
          if (data.leida && data.leidaAt) {
            const leidaDate = data.leidaAt.toDate();
            const diffHours = (now - leidaDate) / (1000 * 60 * 60);
            if (diffHours > 24) {
              // Delete quietly in background
              deleteDoc(docSnap.ref).catch(err => console.error("Error auto-deleting", err));
              return; // Skip adding to user view
            }
          }

          if (!data.leida) sinLeer++;
          sugList.push({ id: docSnap.id, ...data });
        });

        setSugerencias(sugList);
        setSugerenciasSinLeer(sinLeer);
      }, (err) => {
        console.error("Error listening to sugerencias: ", err);
      });
    }
    return () => unsubscribe();
  }, [userCargo]);

  const handleEnviarSugerencia = async () => {
    if (!textoSugerencia.trim()) return;
    setEnviandoSugerencia(true);
    try {
      await addDoc(collection(db, "sugerencias"), {
        texto: textoSugerencia.trim(),
        usuarioId: currentUser.uid,
        nombreUsuario: userName,
        fecha: serverTimestamp(),
        leida: false
      });
      alert("¡Sugerencia enviada con éxito! Gracias por ayudarnos a mejorar.");
      setMostrarModalSugerencias(false);
      setTextoSugerencia("");
    } catch (error) {
      console.error("Error enviando sugerencia: ", error);
      alert("Hubo un error al enviar la sugerencia. Inténtalo más tarde.");
    } finally {
      if (isMountedRef.current) setEnviandoSugerencia(false);
    }
  };

  const handleMarcarLeida = async (id) => {
    try {
      const sugRef = doc(db, "sugerencias", id);
      await updateDoc(sugRef, {
        leida: true,
        leidaAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error marcando sugerencia como leída: ", error);
    }
  };

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

    const coincideUsuario = userCargo === 'Administrador' ? (!filtroUsuario || despiece.userId === filtroUsuario) : true;

    return coincideBusqueda && coincideFecha && coincideUsuario;
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
          {location.pathname.includes('/modelo-despiece') && (
            <div
              className={estilos.menuitem}
              onClick={() => {
                window.dispatchEvent(new Event('openNomenclaturesModal'));
                toggleMenu(); // Cerrar menú
              }}
              style={{ cursor: "pointer" }}
            >
              <span className={estilos.menuitemicon}>
                📋
              </span>
              Nomenclaturas / Servicios
            </div>
          )}
          {userCargo === 'Administrador' && (
            <Link to="/admin/usuarios" className={estilos.menuitem}>
              <span className={estilos.menuitemicon}>
                <FaUsersCog />
              </span>
              Gestionar Usuarios
            </Link>
          )}
          {/* Botón de Sugerencias para usuarios */}
          <div
            className={estilos.menuitem}
            onClick={() => {
              setMostrarModalSugerencias(true);
              toggleMenu();
            }}
            style={{ cursor: "pointer", borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "10px" }}
          >
            <span className={estilos.menuitemicon}>
              <FaCommentDots />
            </span>
            Sugerencias
          </div>
          {/* Botón de Alerta Global para Administradores */}
          {userCargo === 'Administrador' && (
            <div
              className={estilos.menuitem}
              onClick={() => {
                handleDispararAlerta();
                toggleMenu();
              }}
              style={{ cursor: "pointer", color: "#dc3545", fontWeight: "bold" }}
            >
              <span className={estilos.menuitemicon} style={{ color: "#dc3545" }}>
                ⚠️
              </span>
              Alerta Actualización
            </div>
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
            {userCargo === 'Administrador' && (
              <select
                className={estilos.inputBuscar}
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
                aria-label="Filtrar por usuario"
              >
                <option value="">Todos los usuarios</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.nombre || "Usuario sin nombre"}</option>
                ))}
              </select>
            )}
          </div>
          <button className={estilos.botonAgregar} onClick={irADespieces}>
            Agregar Nuevo Despiece
          </button>
          {loadingDespieces ? (
            <p style={{textAlign:'center', color:'#888', marginTop:'2rem'}}>Cargando proyectos...</p>
          ) : uniqueDespieces.length > 0 ? (
            <ul className={estilos.despiecesList}>
              {uniqueDespieces.map((despiece) => (
                <li key={despiece.id} className={estilos.despieceItem} style={{ padding: '12px' }}>
                  {/* Primera línea: Proyecto + Cliente + Acciones */}
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', marginBottom:'8px'}}>
                    <div style={{flex:1}}>
                      <h3 style={{cursor:'pointer', color:'#1976d2', margin:0, fontSize:'16px'}}
                          onClick={() => navigate(`/modelo-despiece/${despiece.id}`)}>
                        {despiece.proyecto}
                      </h3>
                      <p style={{margin:'4px 0 0', color:'#666', fontSize:'13px'}}>Cliente: {despiece.cliente}</p>
                    </div>
                    <button
                      style={{
                        background:'#dc3545',
                        color:'#fff',
                        border:'none',
                        borderRadius:'4px',
                        padding:'6px 12px',
                        cursor:'pointer',
                        fontSize:'12px',
                        fontWeight: 'bold'
                      }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if(window.confirm('¿Eliminar este proyecto?')) {
                          try {
                            const { doc, deleteDoc } = await import('firebase/firestore');
                            await deleteDoc(doc(db, 'despieces', despiece.id));
                            await fetchDespieces();
                          } catch (err) {
                            alert('Error al eliminar: ' + err.message);
                          }
                        }
                      }}
                    >Eliminar</button>
                  </div>
                  {/* Segunda línea: Fechas */}
                  <div style={{display:'flex', gap:'20px', fontSize:'12px', color:'#888', borderTop:'1px solid #eee', paddingTop:'8px'}}>
                    <span>Creación: {despiece.fechaCreacion || despiece.fecha || '-'}</span>
                    <span>Última modificación: {
                      (() => {
                        if (despiece.ultimaModificacion && typeof despiece.ultimaModificacion === 'number') {
                          const fecha = new Date(despiece.ultimaModificacion);
                          return fecha.toLocaleDateString('es-AR') + ' ' + fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                        }
                        if (despiece.ultimaModificacionStr) return despiece.ultimaModificacionStr;
                        if (despiece.ultimaModificacion && typeof despiece.ultimaModificacion === 'string') {
                          return despiece.ultimaModificacion;
                        }
                        return '-';
                      })()
                    }</span>
                  </div>
                  {userCargo === 'Administrador' && (
                    <p style={{margin:'4px 0 0', fontSize:'11px', color:'#aaa'}}>Creado por: {users.find(u => u.id === despiece.userId)?.nombre || 'Desconocido'}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{textAlign:'center', color:'#888', marginTop:'2rem'}}>No hay proyectos guardados.</p>
          )}
        </section>
      )}

      {/* MODAL DE SUGERENCIAS */}
      {mostrarModalSugerencias && (
        <div className={estilos.modalOverlaySugerencias} onClick={(e) => { if(e.target === e.currentTarget) setMostrarModalSugerencias(false); }}>
          <div className={estilos.modalContentSugerencias}>
            <h3>Enviar Sugerencia</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc' }}>Hola {userName || 'diseñador/asesor'}, envíanos tus ideas o reporta un problema. Trataremos de revisarlo pronto.</p>
            <textarea
              className={estilos.textareaSugerencia}
              placeholder="Escribe tu sugerencia aquí..."
              value={textoSugerencia}
              onChange={(e) => setTextoSugerencia(e.target.value)}
            />
            <div className={estilos.sugerenciasAcciones}>
              <button className={estilos.btnCancelarSugerencia} onClick={() => setMostrarModalSugerencias(false)}>Cancelar</button>
              <button 
                className={estilos.btnSugerencia} 
                onClick={handleEnviarSugerencia}
                disabled={enviandoSugerencia || !textoSugerencia.trim()}
              >
                {enviandoSugerencia ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BELL PARA ADMIN */}
      {userCargo === 'Administrador' && sugerenciasSinLeer > 0 && (
        <div className={estilos.floatingBellContainer} onClick={() => setMostrarInbox(true)} aria-label="Bandeja de sugerencias">
          <FaBell />
          <div className={estilos.floatingBellBadge}>{sugerenciasSinLeer}</div>
        </div>
      )}

      {/* MODAL INBOX PARA ADMIN */}
      {mostrarInbox && (
        <div className={estilos.modalOverlaySugerencias} onClick={(e) => { if(e.target === e.currentTarget) setMostrarInbox(false); }}>
          <div className={estilos.modalContentInbox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>Buzón de Sugerencias</h3>
              <button className={estilos.botonHamburguesa} onClick={() => setMostrarInbox(false)} style={{ fontSize: '1.2rem' }}>✖</button>
            </div>
            
            <div className={estilos.inboxList}>
              {sugerencias.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>No hay sugerencias recientes.</p>
              ) : (
                sugerencias.map((sug) => (
                  <div key={sug.id} className={`${estilos.inboxItem} ${sug.leida ? estilos.leida : ''}`}>
                    <div className={estilos.inboxItemHeader}>
                      <strong>{sug.nombreUsuario || 'Usuario Anónimo'}</strong>
                      <span>{sug.fecha ? sug.fecha.toDate().toLocaleDateString() : 'Reciente'}</span>
                    </div>
                    <p className={estilos.inboxItemText}>{sug.texto}</p>
                    
                    {!sug.leida && (
                      <div style={{ textAlign: 'right', marginTop: '10px' }}>
                        <button className={estilos.btnMarcarLeida} onClick={() => handleMarcarLeida(sug.id)}>
                          ✔ Marcar como leída
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
