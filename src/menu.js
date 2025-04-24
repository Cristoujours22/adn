import React, { useState, useEffect, useRef } from 'react';
import logo from "./Assets/ADN.png";
import { Link } from 'react-router-dom';
import { FaHome, FaSun, FaMoon } from 'react-icons/fa';
import { BiLogOut } from 'react-icons/bi';
import { GiHamburgerMenu } from 'react-icons/gi';
import estilos from "./App.module.css";
import userIcon from './Assets/usuario.png';

const Menu = () => {
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [mostrarUserMenu, setMostrarUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const userInfoRef = useRef(null);

  const toggleMenu = () => {
    setMostrarMenu(!mostrarMenu);
    setMostrarUserMenu(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  const toggleUserMenu = () => {
    setMostrarUserMenu(prev => !prev);
  };

  const handleLogout = () => {
    console.log("Cerrando sesión...");
    setMostrarUserMenu(false);
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
        userInfoRef.current && !userInfoRef.current.contains(event.target) &&
        userMenuRef.current && !userMenuRef.current.contains(event.target)
      ) {
        setMostrarUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarUserMenu]);

  return (
    <>
      <header className={estilos.topBar}>
        
        <button className={estilos.botonHamburguesa} onClick={toggleMenu} aria-label="Menu hamburguesa">
          <GiHamburgerMenu />
          <label></label>
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

              <button onClick={handleLogout} className={estilos.userDropdownItem}>
                Cerrar Sesión
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
        <div className={estilos.menuitem} onClick={toggleDarkMode} style={{ cursor: 'pointer' }}>
          <span className={estilos.menuitemicon}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </span>
          {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
        </div>
        <div className={estilos.menuitem}>
          <span className={estilos.menuitemicon}><BiLogOut /></span>
          Salir
        </div>
      </div>
    </>
  );
};

export default Menu;
