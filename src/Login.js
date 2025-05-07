import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { db } from "./credenciales";
import { collection, query, where, getDocs } from "firebase/firestore";
import estilos from "./App.module.css";
import logo from "./Assets/ADN.png";
import Recuperar from "./recuperar";
import Menu from "./menu";
import Usuario from "./usuario";

function LoginPage() {
  const [usuario, setUsuario] = useState(() => localStorage.getItem("usuario") || "");
  const [contrasena, setContrasena] = useState(() => localStorage.getItem("contrasena") || "");
  const [recordar, setRecordar] = useState(() => localStorage.getItem("recordar") === "true");
  const [mensajeConexion, setMensajeConexion] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeConexion("");

    if (!usuario || !contrasena) {
      setMensajeConexion("❌ Por favor, ingrese usuario y contraseña");
      return;
    }

    try {
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("Usuario", "==", usuario));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMensajeConexion("❌ Usuario no encontrado");
        console.error("Usuario no encontrado en la colección");
      } else {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        if (userData.Contraseña === contrasena) {
          setMensajeConexion("✅ Conexión exitosa");
          console.log("Inicio de sesión exitoso para:", userData.Usuario);

          if (recordar) {
            localStorage.setItem("usuario", usuario);
            localStorage.setItem("contrasena", contrasena);
            localStorage.setItem("recordar", "true");
          } else {
            localStorage.removeItem("usuario");
            localStorage.removeItem("contrasena");
            localStorage.removeItem("recordar");
          }

          navigate("/menu");
        } else {
          setMensajeConexion("❌ Contraseña incorrecta");
          console.error("Contraseña incorrecta");
        }
      }
    } catch (error) {
      setMensajeConexion("❌ Error al conectar con Firebase: " + error.message);
      console.error("Error de conexión o consulta:", error);
    }
  };

  return (
    <div>
      <header className={estilos.header}>
        <div className="logo">
          <img className={estilos.ADN} src={logo} alt="logo programa" />
        </div>
      </header>

      <main className={estilos.main}>
        <section className={estilos.section} id="Datos">
          <form onSubmit={handleSubmit}>
            <input
              className={estilos.controls}
              type="text"
              placeholder="Ingrese usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
            />
            <input
              className={estilos.controls}
              type="password"
              placeholder="Ingrese contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
            <div>
              <input
                type="checkbox"
                id="recordar"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
              />
              <label htmlFor="recordar">Recordar datos</label>
            </div>
            <button type="submit" className={estilos.butom}>
              Ingresar
            </button>
            <p>
              <Link to="/recuperar" className="text-blue-500 hover:underline">
                ¿Olvidaste tus credenciales?
              </Link>
            </p>

            {mensajeConexion && (
              <p
                className={
                  mensajeConexion.includes("Error") ||
                  mensajeConexion.includes("incorrecta") ||
                  mensajeConexion.includes("encontrado")
                    ? estilos.error
                    : estilos.exito
                }
              >
                {mensajeConexion}
              </p>
            )}
          </form>
        </section>
      </main>

      <footer className={estilos.footer}></footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/recuperar" element={<Recuperar />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/usuario" element={<Usuario />} />
      </Routes>
    </Router>
  );
}

export default App;
