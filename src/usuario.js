import React, { useEffect, useState } from "react";
import img from "./Assets/FotoPerfil.jpeg";
import estilos from "./App.module.css";
import { db } from "./credenciales";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "./authContext";
import Menu from "./menu";

function Usuario() {
  const [userName, setUserName] = useState("Nombre usuario");
  const [userCargo, setUserCargo] = useState("Cargo usuario");
  const [fechaCreacion, setFechaCreacion] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        setFechaCreacion(currentUser.metadata.creationTime);
        try {
          const userDocRef = doc(db, "usuarios", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.Nombre || "Nombre usuario");
            setUserCargo(userData.Cargo || "Cargo usuario");
          } else {
            console.warn("El documento del usuario no existe en Firestore.");
          }
        } catch (error) {
          console.error(
            "Error al obtener los datos del usuario desde Firestore:",
            error
          );
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  if (!currentUser) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Menu />
      <main style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <section className={estilos.section2} style={{ margin: 0 }}>
          <div className={estilos.ContenedorFoto} style={{ justifyContent: "center", width: "100%" }}>
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
                  <p className={estilos.Textop}>{userCargo}</p>
                </li>
              </ul>
              <ul>
                <li>
                  <h1 className={estilos.Textoh1}>Fecha de creación</h1>
                </li>
              </ul>
              <ul>
                <li>
                  <p className={estilos.Textop}>{fechaCreacion ? new Date(fechaCreacion).toLocaleDateString() : "No disponible"}</p>
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
