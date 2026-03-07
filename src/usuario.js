import React, { useEffect, useState, useRef } from "react";
import { FaCamera } from "react-icons/fa";
import img from "./Assets/FotoPerfil.jpeg";
import estilos from "./App.module.css";
import { db } from "./credenciales";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "./authContext";
import { useTheme } from "./ThemeContext";
import Menu from "./menu";

function Usuario() {
  const [userName, setUserName] = useState("Nombre usuario");
  const [userCargo, setUserCargo] = useState("Cargo usuario");
  const [fechaCreacion, setFechaCreacion] = useState("");
  const [profileImage, setProfileImage] = useState(img);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();

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

    // Validar el tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido.');
      return;
    }

    try {
      setIsUploading(true);

      const base64String = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const maxSize = 400; // 400px maximum width/height
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxSize) {
                height = Math.round((height * maxSize) / width);
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = Math.round((width * maxSize) / height);
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.7)); // 70% quality JPEG
          };
          img.onerror = () => reject(new Error("Error al cargar la imagen."));
          img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error("Error al leer el archivo."));
        reader.readAsDataURL(file);
      });

      // Actualizar Firestore con la cadena base64
      const userDocRef = doc(db, "usuarios", currentUser.uid);
      await updateDoc(userDocRef, {
        photoBase64: base64String,
        lastPhotoUpdate: new Date().toISOString()
      });

      setProfileImage(base64String);
      alert('Foto de perfil actualizada exitosamente.');
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
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: "100px",
        }}
      >
        <section className={`${estilos.section2} ${darkMode ? estilos.despiecesSectionDark : ''}`} style={{ margin: 0, background: darkMode ? '#23272f' : 'hsla(0, 0%, 0%, 0.75)' }}>
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
                  <h1 className={estilos.Textoh1} style={{ color: darkMode ? '#e0e0e0' : 'white' }}>Nombre</h1>
                </li>
              </ul>
              <ul>
                <li>
                  <p className={estilos.Textop} style={{ color: darkMode ? '#f1f1f1' : 'white' }}>{userName}</p>
                </li>
              </ul>
              <ul>
                <li>
                  <h1 className={estilos.Textoh1} style={{ color: darkMode ? '#e0e0e0' : 'white' }}>Cargo</h1>
                </li>
              </ul>
              <ul>
                <li>
                  <p className={estilos.Textop} style={{ color: darkMode ? '#f1f1f1' : 'white' }}>{userCargo}</p>
                </li>
              </ul>
              <ul>
                <li>
                  <h1 className={estilos.Textoh1} style={{ color: darkMode ? '#e0e0e0' : 'white' }}>Fecha de creación</h1>
                </li>
              </ul>
              <ul>
                <li>
                  <p className={estilos.Textop} style={{ color: darkMode ? '#f1f1f1' : 'white' }}>
                    {fechaCreacion
                      ? new Date(fechaCreacion).toLocaleDateString()
                      : "No disponible"}
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Usuario;
