import React, { useState } from "react";
import { Link, useNavigate, Navigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./credenciales";
import estilos from "./App.module.css";
import logo from "./Assets/ADN.png";
import { useAuth } from "./authContext";

function LoginPage() {
  const [usuario, setUsuario] = useState(() => localStorage.getItem("usuario") || "");
  const [contrasena, setContrasena] = useState(() => localStorage.getItem("contrasena") || "");
  const [recordar, setRecordar] = useState(() => localStorage.getItem("recordar") === "true");
  const [mensajeConexion, setMensajeConexion] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  if (currentUser) {
    const from = location.state?.from?.pathname || "/menu";
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeConexion("");

    if (!usuario || !contrasena) {
      setMensajeConexion("❌ Por favor, ingrese usuario y contraseña");
      return;
    }

    try {
      // Autenticación con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, usuario, contrasena);
      const user = userCredential.user;
      setMensajeConexion("✅ Conexión exitosa");
      console.log("Inicio de sesión exitoso para:", user.email);

      if (recordar) {
        localStorage.setItem("usuario", usuario);
        localStorage.setItem("contrasena", contrasena);
        localStorage.setItem("recordar", "true");
      } else {
        localStorage.removeItem("usuario");
        localStorage.removeItem("contrasena");
        localStorage.removeItem("recordar");
      }

      const from = location.state?.from?.pathname || "/menu";
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Error de autenticación:", error);
      switch (error.code) {
        case 'auth/invalid-email':
          setMensajeConexion("❌ El correo electrónico no es válido");
          break;
        case 'auth/user-disabled':
          setMensajeConexion("❌ Esta cuenta ha sido deshabilitada");
          break;
        case 'auth/user-not-found':
          setMensajeConexion("❌ No existe una cuenta con este correo");
          break;
        case 'auth/wrong-password':
          setMensajeConexion("❌ Contraseña incorrecta");
          break;
        default:
          setMensajeConexion("❌ Error al iniciar sesión. Por favor, intente nuevamente");
      }
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
          <h1>Iniciar sesión</h1>
          <form onSubmit={handleSubmit}>
            <input
              className={estilos.controls}
              type="email"
              id="email"
              name="email"
              placeholder="Ingrese correo electrónico"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              autoComplete="username"
            />
            <input
              className={estilos.controls}
              type="password"
              id="password"
              name="password"
              placeholder="Ingrese contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              autoComplete="current-password"
            />
            <div>
              <input
                type="checkbox"
                id="recordar"
                name="recordar"
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
              />
              <label htmlFor="recordar">Recordar datos</label>
            </div>
            <button type="submit" className={estilos.butom} id="submit" name="submit">
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

export default LoginPage;
