import React, { useEffect, useState } from "react";
import logo from "./Assets/ADN.png";
import img from "./Assets/FotoPerfil.jpeg";
import estilos from "./App.module.css";
import { auth, db } from "./credenciales";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function Usuario() {
  const [userName, setUserName] = useState("Nombre usuario");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("Usuario autenticado:", user.uid); // Depuración
        const fetchUserName = async () => {
          try {
            const userDocRef = doc(db, "usuarios", "NMrUR1aBvaR0yqndqUfI"); // Usando el ID correcto
            console.log("Referencia al documento del usuario:", userDocRef.path); // Depuración
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log("Datos del usuario obtenidos de Firestore:", userData); // Depuración
              setUserName(userData.Nombre || "Nombre usuario");
            } else {
              console.warn("El documento del usuario no existe en Firestore.");
            }
          } catch (error) {
            console.error(
              "Error al obtener el nombre del usuario desde Firestore:",
              error
            );
          }
        };

        fetchUserName();
      } else {
        console.warn("No hay un usuario autenticado.");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <header className={estilos.header1}>
        <div className={estilos.logo}>
          <img className={estilos.ADN1} src={logo} alt="logo programa" />
        </div>
      </header>

      <nav className={estilos.nav1}></nav>

      <main className={estilos.main1}>
        <section className={estilos.section2}>
          <div className={estilos.ContenedorFoto}>
            <img
              className={estilos.FotoPerfil}
              src={img}
              alt="Foto de perfil"
            />
            <div className={estilos.ContenedorInformacion}>
              <ul>
                <li>
                  <h1 className={estilos.Textoh1}>Nombre</h1>
                </li>
              </ul>
              <ul>
                <li>
                  <p className={estilos.Textop}>{userName}</p>
                </li>
              </ul>
              <ul>
                <li>
                  <h1 className={estilos.Textoh1}>Cargo </h1>
                </li>
              </ul>
              <ul>
                <li>
                  <p className={estilos.Textop}>Cargo usuario</p>
                </li>
              </ul>
              <ul>
                <li>
                  <h1 className={estilos.Textoh1}>Fecha de creación</h1>
                </li>
              </ul>
              <ul>
                <li>
                  <p className={estilos.Textop}>12/04/2024</p>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Usuario;
