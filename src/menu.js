import React, { useState, useEffect, useRef } from 'react';
import logo from "./Assets/ADN.png";
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaSun, FaMoon } from 'react-icons/fa';
import { GiHamburgerMenu } from 'react-icons/gi';
import estilos from "./App.module.css";
import userIcon from './Assets/usuario.png';

const Menu = () => {
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [mostrarUserMenu, setMostrarUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const userInfoRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setMostrarMenu(prev => !prev);
    setMostrarUserMenu(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const toggleUserMenu = () => {
    setMostrarUserMenu(prev => !prev);
  };

  const handleLogout = () => {
    setMostrarUserMenu(false);
    navigate("/");
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', JSON.stringify(true));
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', JSON.stringify(false));
    }
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mostrarUserMenu &&
        userMenuRef.current && !userMenuRef.current.contains(event.target) &&
        userInfoRef.current && !userInfoRef.current.contains(event.target)
      ) {
        setMostrarUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mostrarUserMenu]);

  return (
    <>
      <header className={estilos.topBar}>
        <button className={estilos.botonHamburguesa} onClick={toggleMenu} aria-label="Abrir menú">
          <GiHamburgerMenu />
        </button>
        <div className={estilos.logo2}>
          <img className={estilos.ADN1} src={logo} alt="logo programa" />
        </div>
        <div
          className={estilos.userInfo}
          onClick={toggleUserMenu}
          ref={userInfoRef}
          style={{ cursor: 'pointer', position: 'relative' }}
        >
          <span>Usuario</span>
          <img src={userIcon} alt="Usuario" className={estilos.userIcon} />
          {mostrarUserMenu && (
            <div className={estilos.userDropdown} ref={userMenuRef}>
              <Link
                to="/usuario"
                className={estilos.userDropdownItem}
                onClick={() => setMostrarUserMenu(false)}
              >
                Perfil
              </Link>
              <button
                className={estilos.userDropdownItem}
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <div className={`${estilos.menucontainer} ${mostrarMenu ? estilos.mostrar : ""}`}>
        <h2 className={estilos.menutitle}>Menú Principal</h2>

        <div className={estilos.menuitem}>
          <span className={estilos.menuitemicon}><FaHome /></span>
          Inicio
        </div>

        <div className={estilos.menuitem} onClick={toggleDarkMode}>
          <span className={estilos.menuitemicon}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </span>
          {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
        </div>
      </div>
    </>
  );
};

export default Menu;
