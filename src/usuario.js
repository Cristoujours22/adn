import React, { useEffect, useState } from "react";
import logo from "./Assets/ADN.png";
import img from "./Assets/FotoPerfil.jpeg";
import estilos from "./App.module.css";
import { auth, db } from "./credenciales";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function Usuario() {
  const [userName, setUserName] = useState("Nombre usuario");
  const [userCargo, setUserCargo] = useState("Cargo usuario"); // <--- Agregamos este estado

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
              setUserCargo(userData.Cargo || "Cargo usuario"); // <--- Aquí leemos el cargo
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
                  <p className={estilos.Textop}>{userCargo}</p> {/* <--- Aquí se muestra */}
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
