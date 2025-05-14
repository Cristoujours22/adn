import React, { useEffect, useState, useRef } from "react";
import { FaCamera } from "react-icons/fa";
import img from "./Assets/FotoPerfil.jpeg";
import estilos from "./App.module.css";
import { db } from "./credenciales";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "./authContext";
import Menu from "./menu";

function Usuario() {
  const [userName, setUserName] = useState("Nombre usuario");
  const [userCargo, setUserCargo] = useState("Cargo usuario");
  const [fechaCreacion, setFechaCreacion] = useState("");
  const [profileImage, setProfileImage] = useState(img);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
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
            if (userData.photoBase64) {
              setProfileImage(userData.photoBase64);
            }
          }
        } catch (error) {
          console.error("Error al obtener los datos del usuario:", error);
        }
      }
    };
    fetchUserData();
  }, [currentUser]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) {
      console.log('No se seleccionó archivo o no hay usuario');
      return;
    }

    // Validar el tipo y tamaño del archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('La imagen es demasiado grande. El tamaño máximo es 5MB.');
      return;
    }

    try {
      setIsUploading(true);

      // Convertir la imagen a base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;

        // Actualizar Firestore con la cadena base64
        const userDocRef = doc(db, "usuarios", currentUser.uid);
        await updateDoc(userDocRef, {
          photoBase64: base64String,
          lastPhotoUpdate: new Date().toISOString()
        });

        setProfileImage(base64String);
        console.log('Imagen almacenada en Firestore como base64');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error al procesar la imagen:", error);
      alert("Ocurrió un error al subir la imagen. Por favor, intenta de nuevo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Menu />
      <main
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <section className={estilos.section2} style={{ margin: 0 }}>
          <div className={estilos.ContenedorFoto} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative', marginRight: '20px' }}>
              <img
                className={estilos.FotoPerfil}
                src={profileImage}
                alt="Foto de perfil"
              />
              {!isUploading && (
                <button
                  className={estilos.cameraIconOverlay}
                  onClick={handleImageClick}
                  aria-label="Cambiar foto de perfil"
                >
                  <FaCamera />
                </button>
              )}
              {isUploading && (
                <div className={estilos.loadingOverlay}>Subiendo...</div>
              )}
              <input
                id="profile-photo-input"
                ref={fileInputRef}
                type="file"
                className={estilos.hiddenFileInput}
                accept="image/*"
                onChange={handleImageChange}
                aria-label="Seleccionar foto de perfil"
              />
            </div>
            <div className={estilos.ContenedorInformacion} style={{ flex: 1 }}>
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
                  <h1 className={estilos.Textoh1}>Cargo</h1>
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
                  <p className={estilos.Textop}>
                    {fechaCreacion
                      ? new Date(fechaCreacion).toLocaleDateString()
                      : "No disponible"}
                  </p>
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
