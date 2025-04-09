import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { useState } from "react";
import estilos from "./App.module.css";
import logo from "./Assets/ADN.png";
import Recovery from "./recuperar"; // Importa la página de recuperación

function App() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Usuario:", usuario, "Contraseña:", contrasena);
  };

  return (
    <Router>
      <Routes>
        {/* Página de Login */}
        <Route
          path="/"
          element={
            <div className="">
              <header className={estilos.header}>
                <div className="logo">
                  <img className={estilos.ADN} src={logo} alt="logo programa" />
                </div>
              </header>

              <main className={estilos.main}>
                <section className={estilos.section}>
                  <input
                    className={estilos.controls}
                    type="text"
                    placeholder="Ingrese usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                  />
                  <input
                    className={estilos.controls}
                    type="password"
                    placeholder="Ingrese contraseña"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                  />
                  <button
                    className={estilos.butom}
                    onClick={handleSubmit}
                  >
                    Ingresar
                  </button>
                  <p>
                    <Link to="/recuperar" className="text-blue-500 hover:underline">
                      ¿Olvidaste tus credenciales?
                    </Link>
                  </p>
                </section>
              </main>

              <footer className={estilos.footer}></footer>
            </div>
          }
        />

        {/* Página de Recuperación */}
        <Route path="/recuperar" element={<Recovery />} />
      </Routes>
    </Router>
  );
}

export default App;
