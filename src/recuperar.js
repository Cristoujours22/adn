import React, { useState } from "react"; // Añadir React si no estaba explícito
import { Link } from "react-router-dom";
import { auth } from "./credenciales"; // Importar la instancia auth
import { sendPasswordResetEmail } from "firebase/auth"; // Importar la función necesaria
import logo from "./Assets/ADN.png";
import estilos from "./App.module.css";
// No necesitas importar "./App.module.css" dos veces

function Recuperar() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState(""); // Para mostrar mensajes de éxito/error
  const [loading, setLoading] = useState(false); // Para indicar proceso en curso

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(""); // Limpiar mensajes anteriores
    if (!correo) {
      setMensaje("❌ Por favor, ingresa tu correo electrónico.");
      return;
    }
    setLoading(true); // Indicar que el proceso ha comenzado

    try {
      // Intentar enviar el correo de restablecimiento
      await sendPasswordResetEmail(auth, correo);
      setMensaje(
        "✅ Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña en breve."
      );
      setCorreo(""); // Limpiar el campo de correo tras el éxito
    } catch (error) {
      console.error("Error al enviar correo de recuperación:", error);
      // Proporcionar un mensaje de error más genérico al usuario
      if (error.code === 'auth/invalid-email') {
          setMensaje("❌ El formato del correo electrónico no es válido.");
      } else if (error.code === 'auth/user-not-found') {
          // Aunque Firebase puede lanzar este error, por seguridad es mejor
          // dar el mismo mensaje genérico que en caso de éxito.
          setMensaje(
            "✅ Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña en breve."
          );
      }
       else {
          setMensaje("❌ Ocurrió un error al intentar enviar el correo. Inténtalo de nuevo.");
      }
    } finally {
      setLoading(false); // Indicar que el proceso ha terminado
    }
  };

  return (
    <div>
      <header className={estilos.header1}>
        <div className="logo">
          <img className={estilos.ADN1} src={logo} alt="logo programa" />
        </div>
      </header>

      <main className={estilos.main1}>
        <section className={estilos.section1}>
          <p>
            Ingresa tu correo electrónico registrado y te enviaremos un enlace
            para que puedas restablecer tu contraseña.
          </p>

          {/* Usar form para mejor semántica y accesibilidad */}
          <form onSubmit={handleSubmit}>
            <input
              className={estilos.controls1}
              type="email"
              placeholder="Ingrese su correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required // Añadir validación básica HTML5
              disabled={loading} // Deshabilitar mientras carga
            />

            {/* Mensaje de estado */}
            {mensaje && (
              <p className={mensaje.includes('Error') || mensaje.includes('❌') ? estilos.error : estilos.exito}>
                  {mensaje}
              </p>
            )}

            {/* Placeholder para ReCAPTCHA - Implementación futura */}
            {/* <label className={estilos.label1}>RECAPTCHA AQUÍ</label> */}

            <button
              type="submit" // Usar type="submit" dentro del form
              className={estilos.butom1}
              disabled={loading} // Deshabilitar mientras carga
            >
              {loading ? "Enviando..." : "Recuperar Contraseña"}
            </button>
          </form>

          <p>
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

export default Recuperar;