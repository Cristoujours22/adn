import React, { useEffect, useState, useRef } from "react";
import { FaCamera, FaCalendarAlt, FaProjectDiagram, FaUserShield, FaClock } from "react-icons/fa";
import img from "./Assets/FotoPerfil.jpeg";
import estilos from "./App.module.css";
import { db } from "./credenciales";
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { useAuth } from "./authContext";
import { useTheme } from "./ThemeContext";
import Menu from "./menu";

function Usuario() {
  const [userName, setUserName] = useState("Nombre usuario");
  const [userCargo, setUserCargo] = useState("Cargo usuario");
  const [fechaCreacion, setFechaCreacion] = useState("");
  const [profileImage, setProfileImage] = useState(img);
  const [isUploading, setIsUploading] = useState(false);
  const [userStats, setUserStats] = useState({ totalProyectos: 0, ultimoProyecto: null });
  
  // Password State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

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

          // Consultar Estadísticas de Despieces del Usuario
          const q = query(collection(db, "despieces"), where("userId", "==", currentUser.uid));
          const querySnapshot = await getDocs(q);
          
          let total = 0;
          let ultimaFecha = null;

          querySnapshot.forEach((docSnap) => {
            total++;
            const data = docSnap.data();
            if (data.ultimaModificacion || data.fechaCreacion) {
              // Convertir formato DD/MM/YYYY a Comparable (muy básico, si aplica)
              const dateStr = data.ultimaModificacion || data.fechaCreacion;
              // Simulamos la mas reciente por ahora guardando la iterada si existe
              ultimaFecha = dateStr; 
            }
          });

          setUserStats({
            totalProyectos: total,
            ultimoProyecto: ultimaFecha || "Ninguno"
          });

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await updatePassword(currentUser, newPassword);
      setPasswordSuccess("¡Contraseña actualizada exitosamente!");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setShowPasswordForm(false), 3000);
    } catch (error) {
      console.error("Error al actualizar contraseña:", error);
      if (error.code === 'auth/requires-recent-login') {
        setPasswordError("Por seguridad, debes cerrar sesión y volver a ingresar para realizar este cambio.");
      } else {
        setPasswordError("Ocurrió un error. Intenta nuevamente.");
      }
    } finally {
      setIsUpdatingPassword(false);
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
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: "100px",
          paddingBottom: "50px",
          gap: "2rem",
        }}
      >
        <section className={estilos.profileBentoContainer}>
          <div className={`${estilos.glassBentoBox} ${darkMode ? estilos.glassBentoBoxDark : ''}`}>
            
            {/* FOTO BENTO CELL */}
            <div className={estilos.profilePhotoBox}>
              <img
                className={estilos.profilePhotoImg}
                src={profileImage}
                alt="Foto de perfil"
              />
              
              {!isUploading && (
                <div 
                  className={estilos.profilePhotoOverlay} 
                  onClick={handleImageClick}
                  aria-label="Cambiar foto de perfil"
                >
                  <FaCamera className={estilos.cameraIconHover} />
                </div>
              )}
              
              {isUploading && (
                <div className={estilos.loadingOverlay} style={{ borderRadius: '50%' }}>Subiendo...</div>
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

            {/* INFO BENTO CELL */}
            <div className={estilos.profileInfoBox}>
              
              <div className={estilos.infoItemBox}>
                <span className={`${estilos.infoLabel} ${darkMode ? estilos.infoLabelDark : ''}`}>
                  Nombre
                </span>
                <span className={estilos.infoValueName}>
                  {userName}
                </span>
              </div>

              <div className={estilos.infoItemBox}>
                <span className={`${estilos.infoLabel} ${darkMode ? estilos.infoLabelDark : ''}`}>
                  Cargo
                </span>
                <span className={`${estilos.infoValueRole} ${userCargo.toLowerCase().includes('admin') ? estilos.infoValueYellow : ''}`}>
                  {userCargo}
                </span>
              </div>

              <div className={estilos.infoItemBox}>
                <span className={`${estilos.infoLabel} ${darkMode ? estilos.infoLabelDark : ''}`}>
                  Miembro desde
                </span>
                <span className={estilos.infoValueDate}>
                  <FaCalendarAlt style={{ opacity: 0.7 }} />
                  {fechaCreacion
                    ? new Date(fechaCreacion).toLocaleDateString()
                    : "No disponible"}
                </span>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span className={`${estilos.infoLabel} ${darkMode ? estilos.infoLabelDark : ''}`} style={{ margin: 0 }}>
                  Seguridad
                </span>
                <button 
                  className={estilos.botonAgregar} 
                  onClick={() => setShowPasswordForm(true)}
                  style={{ margin: 0, padding: '8px 20px', width: 'auto', backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', color: '#fff' }}
                >
                  Cambiar Contraseña
                </button>
              </div>

            </div>

            {/* STATS BENTO CELL */}
            <div className={estilos.profileStatsBox}>
              
              <div className={estilos.statCard}>
                <div className={estilos.statIconBox}>
                  <FaProjectDiagram />
                </div>
                <div className={estilos.statInfo}>
                  <span className={estilos.statValue}>{userStats.totalProyectos}</span>
                  <span className={estilos.statLabel}>Proyectos Guardados</span>
                </div>
              </div>

              <div className={estilos.statCard}>
                <div className={estilos.statIconBox} style={{ filter: 'hue-rotate(150deg)' }}>
                  <FaClock />
                </div>
                <div className={estilos.statInfo}>
                  <span className={estilos.statValue} style={{ fontSize: '1.2rem' }}>{userStats.ultimoProyecto}</span>
                  <span className={estilos.statLabel}>Última Actividad</span>
                </div>
              </div>

              {userCargo.toLowerCase().includes('admin') && (
                <div className={estilos.statCard} style={{ background: 'rgba(255, 214, 0, 0.05)', borderColor: 'rgba(255, 214, 0, 0.2)' }}>
                  <div className={estilos.statIconBox} style={{ background: 'transparent' }}>
                    <FaUserShield style={{ fontSize: '1.8rem' }} />
                  </div>
                  <div className={estilos.statInfo}>
                    <span className={estilos.statValue} style={{ color: '#FFD600', fontSize: '1.2rem' }}>Privilegiado</span>
                    <span className={estilos.statLabel} style={{ color: 'rgba(255, 214, 0, 0.7)' }}>Nivel de Acceso</span>
                  </div>
                </div>
              )}

            </div>

          </div>
        </section>

        {/* MODAL PARA CAMBIAR CONTRASEÑA */}
        {showPasswordForm && (
          <div className={estilos.modalOverlay}>
            <div className={`${estilos.modalContent} ${darkMode ? estilos.modalContentDark : ''}`} style={{ maxWidth: '400px', backgroundColor: darkMode ? '#222' : '#fff' }}>
              <button 
                className={estilos.closeButton} 
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordError("");
                  setPasswordSuccess("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                ×
              </button>
              <h3 style={{ color: darkMode ? 'white' : '#333', textAlign: 'center', marginBottom: '20px' }}>Cambiar Contraseña</h3>
              
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {passwordError && <div style={{ color: '#ff6b6b', background: 'rgba(255, 107, 107, 0.1)', padding: '10px', borderRadius: '8px', fontSize: '14px' }}>{passwordError}</div>}
                
                {passwordSuccess && <div style={{ color: '#51cf66', background: 'rgba(81, 207, 102, 0.1)', padding: '10px', borderRadius: '8px', fontSize: '14px' }}>{passwordSuccess}</div>}

                {!passwordSuccess && (
                  <>
                    <input
                      type="password"
                      placeholder="Nueva Contraseña"
                      className={estilos.controls}
                      style={{ margin: 0 }}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Confirmar Nueva Contraseña"
                      className={estilos.controls}
                      style={{ margin: 0 }}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="submit" 
                      className={estilos.butom} 
                      disabled={isUpdatingPassword}
                      style={{ marginTop: '10px' }}
                    >
                      {isUpdatingPassword ? 'Actualizando...' : 'Actualizar'}
                    </button>
                  </>
                )}
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Usuario;
