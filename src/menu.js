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
  const [despieces] = useState([
    { id: 1, proyecto: "Proyecto A", cliente: "Cliente X", fecha: "2025-05-10" },
    { id: 2, proyecto: "Proyecto B", cliente: "Cliente Y", fecha: "2025-05-11" },
  ]);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
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
      }
    });

    return () => unsubscribe();
  }, []);

  const irADespieces = () => {
    // Agregué la navegación al modelo de despiece
    navigate("/modelo-despiece");
  };

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
          <img src={userIcon} alt="Usuario" className={estilos.userIcon} />
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
          {window.location.pathname === "/usuario" && (
            <Link to="/menu" className={estilos.menuitem}>
            <span className={estilos.menuitemicon}>
              <FaHome />
            </span>
            Inicio
            </Link>
          )}
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
        <section className={estilos.despiecesSection}>
          <h2>Despieces Guardados</h2>
          <button className={estilos.botonAgregar} onClick={irADespieces}>
            Agregar Nuevo Despiece
          </button>
          <ul className={estilos.despiecesList}>
            {despieces.map((despiece) => (
              <li key={despiece.id} className={estilos.despieceItem}>
                <h3>{despiece.proyecto}</h3>
                <p>Cliente: {despiece.cliente}</p>
                <p>Fecha: {despiece.fecha}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default Menu;
