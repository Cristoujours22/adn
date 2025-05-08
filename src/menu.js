import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaSun, FaMoon } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import estilos from "./App.module.css";
import userIcon from "./Assets/usuario.png";
import { auth, db } from "./credenciales";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const Menu = () => {
  const [userName, setUserName] = useState("Nombre usuario");
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarUserMenu, setMostrarUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const userInfoRef = useRef(null);
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const toggleMenu = () => {
    setMostrarMenu(!mostrarMenu);
    setMostrarUserMenu(false);
  };

  const toggleUserMenu = () => {
    setMostrarUserMenu((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/");
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
            const userDocRef = doc(db, "usuarios", "NMrUR1aBvaR0yqndqUfI");
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserName(userData.Nombre || "Nombre usuario");
            } else {
              console.warn("El documento del usuario no existe en Firestore.");
            }
          } catch (error) {
            console.error(
              "Error al obtener los datos del usuario desde Firestore:",
              error
            );
          }
        };

        fetchUserData();
      } else {
        console.warn("No hay un usuario autenticado.");
      }
    });

    return () => unsubscribe();
  }, []);
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
              <Link
                to="/usuario"
                className={estilos.userDropdownItem}
                onClick={() => setMostrarUserMenu(false)}
              >
                Perfil
              </Link>
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

      <div
        className={
          `${estilos.menucontainer} ${mostrarMenu ? estilos.mostrar : ""} ${darkMode ? estilos.menucontainerDark : ""}`
        }
      >
        <h2 className={estilos.menutitle}>Menú Principal</h2>
        <div className={estilos.menuitem}>
          <span className={estilos.menuitemicon}>
            <FaHome />
          </span>
          Inicio
        </div>
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
      </div>
    </div>
  );
};

export default Menu;
