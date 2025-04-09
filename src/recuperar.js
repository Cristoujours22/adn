import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "./Assets/ADN.png";
import estilos from "./App.module.css";
import "./App.module.css";
function Recovery() {
  const [correo, setCorreo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Correo enviado:", correo);
  };

  return (
    <div >
      <header className={estilos.header1}>
        <div className="logo">
          <img className={estilos.ADN1} src={logo} alt="logo programa" />
        </div>
      </header>

      <main className={estilos.main1}>
        <section className={estilos.section1}>
          <p>
            Si has olvidado tus credenciales, ingresa tu correo y te enviaremos una nueva contraseña.
          </p>

          <input
            className={estilos.controls1}
            type="email"
            placeholder="Ingrese su correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
          <label className={estilos.label1}>RECAPTCHA AQUÍ</label>
          <button
            className={estilos.butom1}
            onClick={handleSubmit}
          >
            Recuperar
          </button>
          <p >
            <Link to="/" className="text-blue-500 hover:underline">
              Volver al login
            </Link>
          </p>
        </section>
      </main>

      <footer className={estilos.footer1}></footer>
    </div>
  );
}

export default Recovery;
