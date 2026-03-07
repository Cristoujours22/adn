import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './credenciales';
import Menu from './menu';
import estilos from './App.module.css';
import { useAuth } from './authContext';
import TabsDespiece from './components/Despieces/TabsDespiece';
import PanelResumen from './components/Despieces/PanelResumen';
import TablaPiezas from './components/Despieces/TablaPiezas';

// Generador de ID único estable
let rowIdCounter = Date.now(); // Iniciar con timestamp para evitar colisiones entre sesiones
const createNewRow = () => ({
  id: `row_${rowIdCounter++}`,
  cant: '', largo: '', ancho: '', detalle: '', rotar: '', l1: '', l2: '', a1: '', a2: ''
});

// Generador de ID para despieces (pestañas)
let despieceIdCounter = Date.now();
const createNewDespiece = (name = "Despiece 1") => ({
  id: `tab_${despieceIdCounter++}`,
  nombre: name,
  filas: [createNewRow()]
});

// Lista de servicios por defecto basados en Excel del cliente
const DEFAULT_SERVICES = [
  { nomenclatura: 'CSARMADO', nombreOriginal: 'SERVICIO ARMADO DE PUERTA COMPLETO', tipoCobro: 'unidad' },
  { nomenclatura: 'CSRAPU1C', nombreOriginal: 'SERVICIO RANURA PUERTA 1 CARA', tipoCobro: 'unidad' },
  { nomenclatura: 'CSCORTEB', nombreOriginal: 'SERVICIO CAMBIO BASTIDOR', tipoCobro: 'unidad' },
  { nomenclatura: 'CSCORTEP', nombreOriginal: 'SERVICIO CORTE REFILADO PUERTA', tipoCobro: 'unidad' },
  { nomenclatura: 'CSHCHAPA', nombreOriginal: 'SERVICIO DE HUECO CHAPA', tipoCobro: 'unidad' },
  { nomenclatura: 'CSICHAPA', nombreOriginal: 'SERVICIO INSTALACION CHAPA TAMBOR', tipoCobro: 'unidad' },
  { nomenclatura: 'SERCORP', nombreOriginal: 'SERVICIO CORTE DE PERFILERIA ALUMINIO', tipoCobro: 'unidad' },
  { nomenclatura: 'CSPERALM', nombreOriginal: 'SERVICIO PEGADO PERFIL MANIJA ALUMINIO', tipoCobro: 'ml_largo_ancho' }, // Usualmente L o A, asumo unidad o ML
  { nomenclatura: 'CSCANTOA', nombreOriginal: 'SERVICIO PEGADO PERFIL CANTO ALUMINIO', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'SCUBMDLAR1', nombreOriginal: 'SERVICIOS CORTE CUBO MODULAR', tipoCobro: 'unidad' },
  { nomenclatura: 'SCUBMDLAR2', nombreOriginal: 'SERVICIO DE CORTE Y PERFORACIÓN CUBO MODULAR', tipoCobro: 'unidad' },
  { nomenclatura: 'SCUBMDLAR3', nombreOriginal: 'SERVICIO DE CORTE, PERFORACIÓN Y AVELLANADO', tipoCobro: 'unidad' },
  { nomenclatura: 'SESTRAL', nombreOriginal: 'SERVICIO DE CORTE MARCO DE ALUMINIO', tipoCobro: 'unidad' },
  { nomenclatura: 'SRRANUPE', nombreOriginal: 'SERVICIO RANURA PARA PERFIL', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'SERPERBIS', nombreOriginal: 'SERVICIO DE PERFORACION BISAGRA', tipoCobro: 'unidad' },
  { nomenclatura: 'CSRANUFO', nombreOriginal: 'SERVICIO DE RANURA FONDO', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'RANULED', nombreOriginal: 'SERVICIO DE RANURA PARA DIFUSOR LED', tipoCobro: 'unidad' },
  { nomenclatura: 'CSCURVA1', nombreOriginal: 'SERVICIO DE CURVA', tipoCobro: 'unidad' },
  { nomenclatura: 'SRNAR000', nombreOriginal: 'SERVICIO NARIZ, ENGRUESE', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'SRREPEGA', nombreOriginal: 'SERVICIO ENGRUESE COMPLETO O ENSANDUCHAR', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'SERVREME', nombreOriginal: 'SERVICIO ENGRUESE COMPLETO SOLO CON PEGANTE', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'SERVIMARCO', nombreOriginal: 'SERVICIO DE MARCO, ENGRUESE EN MELAMINA', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'CSCIRCULO', nombreOriginal: 'SERVICIOS DE CIRCULOS', tipoCobro: 'unidad' },
  { nomenclatura: 'SERANGUL', nombreOriginal: 'SERVICIO DE ANGULO', tipoCobro: 'escala_60' },
  { nomenclatura: 'CSCALADO', nombreOriginal: 'SERVICIO DE CALADO', tipoCobro: 'escala_60' },
  { nomenclatura: 'SRCALAEI', nombreOriginal: 'SERVICIO DE CALADO CON ENCHAPE INTERNO', tipoCobro: 'escala_60' },
  { nomenclatura: 'SERVIENL', nombreOriginal: 'SERVICIO EN L O ESCRITORIO', tipoCobro: 'unidad' },
  { nomenclatura: 'CSCHAFLA', nombreOriginal: 'SERVICIO CHAFLAN O CORTE A 45º', tipoCobro: 'unidad' },
  { nomenclatura: 'SENCHAMANUAL', nombreOriginal: 'SERVICIO DE ENCHAPE A PIEZA ESPECIAL', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'SENCHACURVA', nombreOriginal: 'SERVICIO DE ENCHAPE EN MÁQUINA CURVA', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'CSCANTOC2', nombreOriginal: 'Servicio Enchape Canto Curvo 2mm. (Rígido)', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'CSINGLES', nombreOriginal: 'SERVICIO DE CAJA MEDIA MADERA ESTANTERÍA', tipoCobro: 'unidad' },
  { nomenclatura: 'SERVICENEFA', nombreOriginal: 'SERVICIO DE CAJA CENEFA ESQUINERA', tipoCobro: 'unidad' },
  { nomenclatura: 'SERPASACABLE', nombreOriginal: 'SERVICIO DE HUECO PARA PASACABLE', tipoCobro: 'unidad' },
  { nomenclatura: 'MANICHAFLAN', nombreOriginal: 'SERVICIO DE MANIJA CHAFLAN', tipoCobro: 'unidad' },
  { nomenclatura: 'CORLISTON', nombreOriginal: 'SERVICIO CORTE LISTON MADERA', tipoCobro: 'unidad' },
  { nomenclatura: 'MANICRUS', nombreOriginal: 'SERVICIO DE CAJA PARA MANIJA DE INCRUSTAR', tipoCobro: 'unidad' },
  { nomenclatura: 'MANIGAVETA', nombreOriginal: 'SERVICIO DE CALADO PARA MANIJA EN V', tipoCobro: 'unidad' },
  { nomenclatura: 'SERCURML', nombreOriginal: 'SERVICIO DE CURVA MEDIA LUNA', tipoCobro: 'unidad' },
  { nomenclatura: 'SERMESCORTO', nombreOriginal: 'SERVICIO DE ADECUACION LADO CORTO MESON', tipoCobro: 'unidad' },
  { nomenclatura: 'SERMESLARGO', nombreOriginal: 'SERVICIO DE ADECUACION LADO LARGO MESON', tipoCobro: 'unidad' },
  { nomenclatura: 'SCALMEPOZ', nombreOriginal: 'SERVICIO DE CALADO DE POZUELO PARA MESON', tipoCobro: 'unidad' },
  { nomenclatura: 'SCALMECUB', nombreOriginal: 'SERVICIO DE CALADO DE CUBIERTA PARA MESON', tipoCobro: 'unidad' },
  { nomenclatura: 'SERSALCORTE', nombreOriginal: 'SERVICIO DE ADECUACION LADO CORTO SALPICADERO 57CM', tipoCobro: 'unidad' },
  { nomenclatura: 'SERSALLARGO', nombreOriginal: 'SERVICIO DE ADECUACION LADO LARGO SALPICADERO 57CM', tipoCobro: 'unidad' },
  { nomenclatura: 'SESUSTRALAP', nombreOriginal: 'SERVICIO DE ENCHAPE CON LAP TABLERO COMPLETO 122x244', tipoCobro: 'unidad' },
  { nomenclatura: 'SERINSKIT', nombreOriginal: 'SERVICIO DE PEGADO DE PERFIL PARA PIZARRON 122*244', tipoCobro: 'unidad' },
  { nomenclatura: 'SERVTSMU', nombreOriginal: 'SERVICIO TALADRO MULTIPLE', tipoCobro: 'unidad' },
  { nomenclatura: 'SERHRCNC', nombreOriginal: 'PAGO DE 1 HORA POR SERVICIO DE CNC', tipoCobro: 'unidad' },
  { nomenclatura: 'SERHRSACCNC', nombreOriginal: 'PAGO DE 1 HORA POR SERV DE CNC CON SACRI', tipoCobro: 'unidad' }
];

const ModeloDespiece = () => {
  const { id } = useParams();
  const [despieces, setDespieces] = useState([createNewDespiece()]);
  const [activeDespieceId, setActiveDespieceId] = useState(despieces[0]?.id);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [creationDate, setCreationDate] = useState(new Date().toLocaleDateString());
  const [lastModifiedDate, setLastModifiedDate] = useState(new Date().toLocaleDateString());
  const [services, setServices] = useState(DEFAULT_SERVICES); // Inicializar con lista excel
  const [newServiceNombre, setNewServiceNombre] = useState('');
  const [newServiceNomenclatura, setNewServiceNomenclatura] = useState('');
  const [newServiceTipoCobro, setNewServiceTipoCobro] = useState('unidad');
  const [editingService, setEditingService] = useState(null);
  const [showNomenclaturesModal, setShowNomenclaturesModal] = useState(false);
  const [totalPieces, setTotalPieces] = useState(0);
  const [serviceCounts, setServiceCounts] = useState({});
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const savedMode = localStorage.getItem("darkMode");
      if (savedMode !== null) {
        setDarkMode(JSON.parse(savedMode));
      }
    };

    const handleOpenModal = () => setShowNomenclaturesModal(true);
    
    // Listen to our custom event for instant updates within the same window
    window.addEventListener("darkModeChanged", handleStorageChange);
    window.addEventListener("highContrastChanged", handleStorageChange);
    window.addEventListener("openNomenclaturesModal", handleOpenModal);
    // Listen to storage event for cross-tab updates
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("darkModeChanged", handleStorageChange);
      window.removeEventListener("highContrastChanged", handleStorageChange);
      window.removeEventListener("openNomenclaturesModal", handleOpenModal);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Cargar despiece si hay id en la URL
  useEffect(() => {
    if (!id) return;
    const fetchDespiece = async () => {
      try {
        const despieceRef = doc(db, 'despieces', id);
        const despieceSnap = await getDoc(despieceRef);
        if (despieceSnap.exists()) {
          const data = despieceSnap.data();
          setProjectName(data.proyecto || '');
          setClientName(data.cliente || '');
          setCreationDate(data.fechaCreacion || new Date().toLocaleDateString());
          setLastModifiedDate(data.ultimaModificacion || new Date().toLocaleDateString());
          // IDs únicos y estables
          let usedIds = new Set();
          let maxRowId = rowIdCounter;
          // Compatibilidad hacia atrás: si tiene "filas" directamente asume formato viejo
          if (data.filas && Array.isArray(data.filas)) {
              const loadedRows = data.filas.map((row) => {
                  let rowId = row.id && /^row_\d+$/.test(row.id) ? parseInt(row.id.split('_')[1], 10) : null;
                  if (rowId === null || usedIds.has(row.id)) rowId = maxRowId++;
                  usedIds.add(`row_${rowId}`);
                  return { ...row, id: `row_${rowId}` };
              });
              const newTab = createNewDespiece("Mueble Principal");
              newTab.filas = loadedRows.length ? loadedRows : [createNewRow()];
              setDespieces([newTab]);
              setActiveDespieceId(newTab.id);
          } else if (data.despieces && Array.isArray(data.despieces)) {
              // Formato nuevo: sanitizar filas en TODAS las pestañas
              const loadedDespieces = data.despieces.map(desp => {
                  const safeRows = (desp.filas || []).map(row => {
                      let rowId = row.id && /^row_\d+$/.test(row.id) ? parseInt(row.id.split('_')[1], 10) : null;
                      if (rowId === null || usedIds.has(row.id)) rowId = maxRowId++;
                      usedIds.add(`row_${rowId}`);
                      return { ...row, id: `row_${rowId}` };
                  });
                  return {
                      ...desp,
                      id: desp.id || `tab_${despieceIdCounter++}`,
                      filas: safeRows.length ? safeRows : [createNewRow()]
                  };
              });
              setDespieces(loadedDespieces.length ? loadedDespieces : [createNewDespiece()]);
              if (loadedDespieces.length > 0) setActiveDespieceId(loadedDespieces[0].id);
          } else {
              const def = createNewDespiece();
              setDespieces([def]);
              setActiveDespieceId(def.id);
          }
          rowIdCounter = maxRowId;
          // Cargar servicios guardados si existen. Soportar string plano legado y convertir a objecto.
          if (data.serviciosGuardados) {
            const parsedServices = data.serviciosGuardados.map(s => {
              if (typeof s === 'string') return { nombreOriginal: s, nomenclatura: s, tipoCobro: 'unidad' };
              if (!s.tipoCobro) return { ...s, tipoCobro: 'unidad' };
              return s;
            });
            setServices(parsedServices);
          }
        }
      } catch (err) {
        alert('Error al cargar el despiece para edición.');
      }
    };
    fetchDespiece();
    // eslint-disable-next-line
  }, [id]);

  // Calcular totales (piezas y servicios) cada vez que cambien rows o services
  useEffect(() => {
    let piecesCount = 0;
    const sCounts = {};
    
    // Inicializar contadores de servicios a 0
    services.forEach(service => {
      sCounts[service.nomenclatura] = 0;
    });

    // Sumar filas de TODOS los despieces de forma segura
    despieces.forEach(despiece => {
      (despiece.filas || []).forEach(row => {
        const cant = parseInt(row?.cant, 10);
        if (!isNaN(cant) && cant > 0) {
          piecesCount += cant;
          
          // Contar servicios en el detalle usando nombre original o nomenclatura
          const detalle = row?.detalle ? row.detalle.toLowerCase() : '';
          services.forEach(service => {
          // Escapar caracteres especiales y asegurar límite de palabra (\b)
          const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regexNombre = new RegExp(`\\b${escapeRegExp(service.nombreOriginal.toLowerCase())}\\b`, 'gi');
          const regexNom = new RegExp(`\\b${escapeRegExp(service.nomenclatura.toLowerCase())}\\b`, 'gi');
          
          const matchesNombre = detalle.match(regexNombre);
          const matchesNom = detalle.match(regexNom);
          // Combine matches correctly. Since usually they just type one of them, sum them.
          // Better: just check total overlaps or use one if identical. To not double count:
          let count = 0;
          if (service.nombreOriginal.toLowerCase() === service.nomenclatura.toLowerCase()) {
             count = matchesNombre ? matchesNombre.length : 0;
          } else {
             count = (matchesNombre ? matchesNombre.length : 0) + (matchesNom ? matchesNom.length : 0);
          }
          if (count > 0) {
            // Aplicar regla de cobro
            const l = parseFloat(row.largo) || 0;
            const a = parseFloat(row.ancho) || 0;
            let multiplier = 1;
            
            switch (service.tipoCobro) {
              case 'ml_largo':
                multiplier = l / 1000;
                break;
              case 'ml_ancho':
                multiplier = a / 1000;
                break;
              case 'ml_largo_ancho':
                multiplier = (l + a) / 1000;
                break;
              case 'ml_perimetro':
                multiplier = ((l * 2) + (a * 2)) / 1000;
                break;
              case 'm2':
                multiplier = (l / 1000) * (a / 1000);
                break;
              case 'escala_60':
                // Escala: 0-600mm = 1, 601-1200mm = 2, etc. (Usando el lado más largo)
                multiplier = Math.ceil(Math.max(l, a) / 600) || 1;
                break;
              case 'unidad':
              default:
                multiplier = 1;
                break;
            }
            
            sCounts[service.nomenclatura] += (count * cant * multiplier);
          }
        });
      }
    });
    });

    setTotalPieces(piecesCount);
    setServiceCounts(sCounts);
  }, [despieces, services]);

  const handleAddService = (e) => {
    e.preventDefault();
    if (newServiceNombre.trim() && newServiceNomenclatura.trim()) {
      if (editingService) {
         // Update existing
         const exists = services.find(s => s.nomenclatura !== editingService && (s.nomenclatura.toLowerCase() === newServiceNomenclatura.trim().toLowerCase() || s.nombreOriginal.toLowerCase() === newServiceNombre.trim().toLowerCase()));
         if (exists) {
            alert('Ya existe otro servicio con ese nombre o nomenclatura.');
            return;
         }
         setServices(services.map(s => s.nomenclatura === editingService ? {
             nombreOriginal: newServiceNombre.trim(),
             nomenclatura: newServiceNomenclatura.trim(),
             tipoCobro: newServiceTipoCobro
         } : s));
         setEditingService(null);
      } else {
         // Add new
         const exists = services.find(s => s.nomenclatura.toLowerCase() === newServiceNomenclatura.trim().toLowerCase() || s.nombreOriginal.toLowerCase() === newServiceNombre.trim().toLowerCase());
         if (!exists) {
            setServices([...services, { 
                nombreOriginal: newServiceNombre.trim(), 
                nomenclatura: newServiceNomenclatura.trim(),
                tipoCobro: newServiceTipoCobro
            }]);
         } else {
            alert('Ya existe un servicio con ese nombre o nomenclatura.');
            return;
         }
      }
      setNewServiceNombre('');
      setNewServiceNomenclatura('');
      setNewServiceTipoCobro('unidad');
    } else {
        alert('Debes ingresar el nombre original y la nomenclatura.');
    }
  };

  const handleEditService = (service) => {
      setNewServiceNombre(service.nombreOriginal);
      setNewServiceNomenclatura(service.nomenclatura);
      setNewServiceTipoCobro(service.tipoCobro);
      setEditingService(service.nomenclatura);
  };

  const handleRemoveService = (nomenclaturaToRemove) => {
    setServices(services.filter(s => s.nomenclatura !== nomenclaturaToRemove));
  };

  const handleToggleServiceActive = (nomen) => {
    setServices(services.map(s => s.nomenclatura === nomen ? { ...s, activo: s.activo === false ? true : false } : s));
  };

  const handleToggleAllServices = () => {
    const allActive = services.every(s => s.activo !== false);
    setServices(services.map(s => ({ ...s, activo: !allActive })));
  };

  const handleRestoreDefaultServices = () => {
    if (window.confirm("¿Seguro que deseas restaurar los servicios predeterminados? Se perderán los que hayas agregado manualmente.")) {
      setServices(DEFAULT_SERVICES);
    }
  };

  const handleInputChange = useCallback((index, field, value) => {
    setDespieces((prevDespieces) => prevDespieces.map(despiece => {
      if (despiece.id !== activeDespieceId) return despiece;
      const newRows = [...(despiece.filas || [])];
      if (newRows[index]) {
        newRows[index] = { ...newRows[index], [field]: value };
      }
      return { ...despiece, filas: newRows };
    }));
  }, [activeDespieceId]);

  const handleRemoveRow = useCallback((indexToRemove) => {
    setDespieces((prevDespieces) => prevDespieces.map(despiece => {
      if (despiece.id !== activeDespieceId) return despiece;
      return { ...despiece, filas: (despiece.filas || []).filter((_, index) => index !== indexToRemove) };
    }));
  }, [activeDespieceId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSaveToFirestore();
  };

  // Al pegar filas, asegurar IDs únicos y evitar fila vacía inicial
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text');
    const rowsFromClipboard = clipboardData.split('\n').filter(row => row.trim() !== '');
    const newRows = rowsFromClipboard.map((row) => {
      const columns = row.split('\t').map(col => col.trim());
      return {
        id: `row_${rowIdCounter++}`,
        cant: columns[0] || '',
        largo: columns[1] || '',
        ancho: columns[2] || '',
        detalle: columns[3] || '',
        rotar: columns[4] || '',
        l1: columns[5] || '',
        l2: columns[6] || '',
        a1: columns[7] || '',
        a2: columns[8] || '',
      };
    }).filter(row => Object.values(row).some(val => val !== ''));
    setDespieces((prevDespieces) => prevDespieces.map(despiece => {
      if (despiece.id !== activeDespieceId) return despiece;
      const prevRows = despiece.filas || [];
      // Si la primera fila está vacía, reemplazarla
      if (prevRows.length === 1 && Object.values(prevRows[0] || {}).every((v, i) => v === '' || (i === 0 && (typeof v === 'string' && /^row_/.test(v))))) {
        return { ...despiece, filas: newRows.length ? newRows : [createNewRow()] };
      }
      // Si no, agregar normalmente
      return { ...despiece, filas: [...prevRows, ...newRows] };
    }));
  }, [activeDespieceId]);

  // Guardar: si es edición, actualizar, si no, crear
  const handleSaveToFirestore = useCallback(async (isAutoSave = false) => {
    const totalFilas = despieces.reduce((acc, current) => acc + (current.filas ? current.filas.length : 0), 0);
    if (totalFilas === 0) {
        if (!isAutoSave) alert('No hay datos para guardar. Por favor, agrega al menos una fila en algún despiece.');
        return;
    }
    if (!projectName || !clientName) {
        if (!isAutoSave) alert('Falta el nombre de proyecto o la identificación del cliente');
        return;
    }
    try {
        if (id) {
          // Actualizar existente
          const despieceRef = doc(db, 'despieces', id);
          await updateDoc(despieceRef, {
            proyecto: projectName, // Keep 'proyecto' as per original, not 'nombreProyecto' from partial edit
            cliente: clientName,
            // fechaCreacion: creationDate, // Removed as per partial edit, makes sense for update
            ultimaModificacion: new Date().toLocaleDateString(),
            despieces: despieces,
            serviciosGuardados: services
          });
          if (!isAutoSave) alert('Despiece actualizado exitosamente.');
        } else {
          // Crear nuevo
          const despiecesCollection = collection(db, 'despieces');
          const despieceData = {
            proyecto: projectName,
            cliente: clientName,
            fechaCreacion: creationDate,
            ultimaModificacion: lastModifiedDate,
            despieces: despieces,
            serviciosGuardados: services,
            userId: currentUser ? currentUser.uid : null // Asignar usuario dueño
          };
          await addDoc(despiecesCollection, despieceData); // Keep original addDoc call
          if (!isAutoSave) alert('Despiece guardado exitosamente en Firestore.');
        }
    } catch (error) {
        console.error('Error al guardar en Firestore:', error.message, error.stack);
        if (!isAutoSave) alert('Hubo un error al guardar el despiece. Revisa la consola para más detalles.');
    }
  }, [despieces, projectName, clientName, services, id, currentUser, creationDate, lastModifiedDate]); // Added missing dependencies

  // -------- SISTEMA DE AUTOGUARDADO ---------
  useEffect(() => {
    // Evitar guardar si no hay ID o datos vitales
    if (!id || !projectName || !clientName) return;

    // Retrasar el guardado por 10 segundos
    const timerId = setTimeout(() => {
        handleSaveToFirestore(true); // true = autoSave flag para no mostrar alertas
        console.log("Autoguardado completado");
    }, 10000); 

    return () => clearTimeout(timerId); // Limpiar timeout si vuelve a escribir rápido
  }, [despieces, projectName, clientName, handleSaveToFirestore, id]);
  // -------------------------------------------

  const handleProjectNameChange = (e) => {
    setProjectName(e.target.value);
    setLastModifiedDate(new Date().toLocaleDateString());
  };

  const handleClientNameChange = (e) => {
    setClientName(e.target.value);
    setLastModifiedDate(new Date().toLocaleDateString());
  };

  const handleArrowNavigation = useCallback((e, index, field) => {
    const focusField = (rowIndex, fieldName) => {
      const nextInput = document.getElementById(`${fieldName}-${rowIndex}`);
      if (nextInput) nextInput.focus();
    };

    const activeRows = (despieces.find(d => d.id === activeDespieceId) || despieces[0])?.filas || [];
    switch (e.key) {
      case 'ArrowUp':
        if (index > 0) focusField(index - 1, field);
        break;
      case 'ArrowDown':
        if (index < activeRows.length - 1) focusField(index + 1, field);
        break;
      case 'ArrowLeft':
        if (field !== 'cant') {
          const fields = ['cant', 'largo', 'ancho', 'detalle', 'rotar', 'l1', 'l2', 'a1', 'a2'];
          const currentIndex = fields.indexOf(field);
          focusField(index, fields[currentIndex - 1]);
        }
        break;
      case 'ArrowRight':
        if (field !== 'a2') {
          const fields = ['cant', 'largo', 'ancho', 'detalle', 'rotar', 'l1', 'l2', 'a1', 'a2'];
          const currentIndex = fields.indexOf(field);
          focusField(index, fields[currentIndex + 1]);
        }
        break;
      default:
        break;
    }
  }, [despieces, activeDespieceId]);

  // Mejorar navegación tipo Google Sheets
  const handleKeyDown = useCallback((e, index, field) => {
    const activeRows = (despieces.find(d => d.id === activeDespieceId) || despieces[0])?.filas || [];
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
    const fields = ['cant', 'largo', 'ancho', 'detalle', 'rotar', 'l1', 'l2', 'a1', 'a2'];
    const currentIndex = fields.indexOf(field);
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentIndex < fields.length - 1) {
        // Mover al siguiente campo en la misma fila
        const nextField = fields[currentIndex + 1];
        const nextInput = document.getElementById(`${nextField}-${index}`);
        if (nextInput) nextInput.focus();
      } else if (index < activeRows.length - 1) {
        // Mover al primer campo de la siguiente fila
        const nextInput = document.getElementById(`cant-${index + 1}`);
        if (nextInput) nextInput.focus();
      } else {
        // Agregar una nueva fila y mover al primer campo de esa fila
        setDespieces((prevDespieces) => prevDespieces.map(despiece => {
          if (despiece.id !== activeDespieceId) return despiece;
          return { ...despiece, filas: [...(despiece.filas || []), createNewRow()] };
        }));
        setTimeout(() => {
          const nextInput = document.getElementById(`cant-${activeRows.length}`);
          if (nextInput) nextInput.focus();
        }, 0);
      }
    } else if (e.key === 'Tab') {
      // Permitir tabulación normal
    } else if (e.key === 'ArrowLeft') {
      if (currentIndex > 0) {
        const prevField = fields[currentIndex - 1];
        const prevInput = document.getElementById(`${prevField}-${index}`);
        if (prevInput) prevInput.focus();
      }
    } else if (e.key === 'ArrowRight') {
      if (currentIndex < fields.length - 1) {
        const nextField = fields[currentIndex + 1];
        const nextInput = document.getElementById(`${nextField}-${index}`);
        if (nextInput) nextInput.focus();
      }
    } else {
      handleArrowNavigation(e, index, field);
    }
  }, [despieces, activeDespieceId, handleArrowNavigation]);

  const handleCopyDespiece = () => {
    const activeRows = (despieces.find(d => d.id === activeDespieceId) || despieces[0])?.filas || [];
    const rowsForExcel = activeRows.map(row => [
      row.cant,
      row.largo,
      row.ancho,
      row.detalle,
      row.rotar,
      row.l1,
      row.l2,
      row.a1,
      row.a2
    ]);

    let csvContent = '';
    rowsForExcel.forEach(row => {
      csvContent += row.join('\t') + '\n';
    });

    navigator.clipboard.writeText(csvContent)
      .then(() => alert('Despiece copiado al portapapeles.'))
      .catch(err => console.error('Error al copiar al portapapeles:', err));
  };

  return (
    <div className={`${estilos.modeloDespieceContainer} ${darkMode ? estilos.despiecesSectionDark : ''}`} style={{ marginTop: '50px' }}>
      <Menu />
      <h2>Crear Nuevo Despiece</h2>

      {/* MODAL DE NOMENCLATURAS */}
      {showNomenclaturesModal && (
        <div className={estilos.modalOverlay}>
            <div className={estilos.modalContent} style={{ maxWidth: '600px' }}>
                <button className={estilos.closeButton} onClick={() => setShowNomenclaturesModal(false)}>×</button>
                <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>Gestión de Nomenclaturas (Servicios)</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'flex-start' }}>
                    <input
                        type="text"
                        value={newServiceNombre}
                        onChange={(e) => setNewServiceNombre(e.target.value)}
                        placeholder="Nombre Original (ej: Calado)"
                        className={estilos.controls}
                        style={{ flex: 1, margin: 0, height: '40px' }}
                    />
                    <input
                        type="text"
                        value={newServiceNomenclatura}
                        onChange={(e) => setNewServiceNomenclatura(e.target.value)}
                        placeholder="Nomenclatura (ej: CAL)"
                        className={estilos.controls}
                        style={{ flex: 1, margin: 0, height: '40px' }}
                    />
                    <select
                        value={newServiceTipoCobro}
                        onChange={(e) => setNewServiceTipoCobro(e.target.value)}
                        className={estilos.controls}
                        style={{ flex: 1, margin: 0, height: '40px' }}
                    >
                        <option value="unidad">Por Unidad / Hueco</option>
                        <option value="ml_largo">Metro Lineal (Largo)</option>
                        <option value="ml_ancho">Metro Lineal (Ancho)</option>
                        <option value="ml_largo_ancho">Metro Lineal (Largo + Ancho)</option>
                        <option value="ml_perimetro">Metro Lineal (Perímetro)</option>
                        <option value="m2">Metro Cuadrado (m²)</option>
                        <option value="escala_60">Escala Tamaño (cada 60cm)</option>
                    </select>
                    <button
                        onClick={handleAddService}
                        className={estilos.botonAgregar}
                        type="button"
                        style={{ padding: '0 20px', margin: 0, height: '40px', lineHeight: '40px' }}
                    >
                        {editingService ? "Actualizar" : "Agregar"}
                    </button>
                    {editingService && (
                        <button
                            onClick={() => {
                                setNewServiceNombre('');
                                setNewServiceNomenclatura('');
                                setNewServiceTipoCobro('unidad');
                                setEditingService(null);
                            }}
                            className={estilos.botonEliminar}
                            type="button"
                            style={{ padding: '0 20px', margin: 0, height: '40px', lineHeight: '40px' }}
                        >
                            Cancelar
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                        type="text"
                        placeholder="Buscar servicio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={estilos.controls}
                        style={{ margin: 0, height: '30px', flex: '0 1 300px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={handleToggleAllServices}
                            style={{ background: 'transparent', color: '#28a745', border: '1px solid #28a745', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                            {services.every(s => s.activo !== false) ? 'Ocultar Todos' : 'Mostrar Todos'}
                        </button>
                        <button 
                            onClick={handleRestoreDefaultServices}
                            style={{ background: 'transparent', color: '#17a2b8', border: '1px solid #17a2b8', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                            ↻ Restaurar Servicios Excel
                        </button>
                    </div>
                </div>
                
                <div style={{ background: '#2c303a', padding: '10px', borderRadius: '5px', maxHeight: '300px', overflowY: 'auto' }}>
                    {services.length === 0 ? (
                        <p style={{ color: '#aaa', textAlign: 'center' }}>No hay nomenclaturas agregadas.</p>
                    ) : (
                        <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                                    <th style={{ padding: '8px', width: '30px', textAlign: 'center' }}>✓</th>
                                    <th style={{ padding: '8px' }}>Nombre</th>
                                    <th style={{ padding: '8px' }}>Nom</th>
                                    <th style={{ padding: '8px' }}>Cobro</th>
                                    <th style={{ padding: '8px', textAlign: 'center' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.filter(s => s.nombreOriginal.toLowerCase().includes(searchTerm.toLowerCase()) || s.nomenclatura.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                    <tr key={s.nomenclatura} style={{ borderBottom: '1px solid #444', opacity: s.activo === false ? 0.5 : 1 }}>
                                        <td style={{ padding: '8px', textAlign: 'center' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={s.activo !== false}
                                                onChange={() => handleToggleServiceActive(s.nomenclatura)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td style={{ padding: '8px' }}>{s.nombreOriginal}</td>
                                        <td style={{ padding: '8px' }}><strong>{s.nomenclatura}</strong></td>
                                        <td style={{ padding: '8px', color: '#888' }}>
                                            {s.tipoCobro === 'unidad' ? 'Unidad' : 
                                             s.tipoCobro === 'ml_largo' ? 'ML (Largo)' :
                                             s.tipoCobro === 'ml_ancho' ? 'ML (Ancho)' :
                                             s.tipoCobro === 'ml_largo_ancho' ? 'ML (L+A)' :
                                             s.tipoCobro === 'ml_perimetro' ? 'ML (Perím)' :
                                             s.tipoCobro === 'm2' ? 'Área (m²)' :
                                             s.tipoCobro === 'escala_60' ? 'Esc. 60cm' : s.tipoCobro}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleEditService(s)} 
                                                className={estilos.botonEliminar}
                                                style={{ margin: '0 5px 0 0', padding: '4px 8px', fontSize: '12px', background: '#e6a800', border: 'none' }}
                                                title="Editar"
                                            >
                                                ✎
                                            </button>
                                            <button 
                                                onClick={() => handleRemoveService(s.nomenclatura)} 
                                                className={estilos.botonEliminar}
                                                style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}
                                                title="Eliminar"
                                            >
                                                ✖
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* PARTE IZQUIERDA: FORMULARIO Y TABLA */}
        <div style={{ flex: '1 1 65%', minWidth: '300px' }}>
          <form onSubmit={handleSubmit} className={estilos.formularioDespiece} onPaste={handlePaste}>
            <div className={estilos.projectInfo} style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ flex: '1 1 300px', color: darkMode ? '#f1f1f1' : '#333' }}>
                Nombre del Cliente:
                <input
                  type="text"
                  value={clientName}
                  onChange={handleClientNameChange}
                  className={estilos.inputLargo}
                />
              </label>
              <label style={{ flex: '1 1 300px', color: darkMode ? '#f1f1f1' : '#333' }}>
                Nombre del Proyecto:
                <input
                  type="text"
                  value={projectName}
                  onChange={handleProjectNameChange}
                  className={estilos.inputLargo}
                />
              </label>
              <div style={{ flex: '1 1 100%' }}>
                <p style={{ color: darkMode ? '#ccc' : '#555', margin: '5px 0' }}>Fecha de Creación: {creationDate}</p>
                <p style={{ color: darkMode ? '#ccc' : '#555', margin: '5px 0' }}>Última Fecha de Modificación: {lastModifiedDate}</p>
              </div>
            </div>

            {/* SISTEMA DE PESTAÑAS (TABS) */}
            <TabsDespiece 
              despieces={despieces}
              setDespieces={setDespieces}
              activeDespieceId={activeDespieceId}
              setActiveDespieceId={setActiveDespieceId}
              darkMode={darkMode}
              createNewDespiece={createNewDespiece}
            />

            {/* TABLA DE PIEZAS */}
            <TablaPiezas 
              despieces={despieces}
              activeDespieceId={activeDespieceId}
              handleInputChange={handleInputChange}
              handleKeyDown={handleKeyDown}
              handleRemoveRow={handleRemoveRow}
            />

          </form>
          <footer className={estilos.footerDespiece} style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => handleSaveToFirestore(false)} className={estilos.botonSubmit}>
              Guardar Despiece
            </button>
            <button type="button" className={estilos.botonCopiar} onClick={handleCopyDespiece}>
              Copiar a Excel
            </button>
          </footer>
        </div>

        {/* PARTE DERECHA: RESUMEN Y CONTEO DE SERVICIOS */}
        <PanelResumen 
          darkMode={darkMode}
          totalPieces={totalPieces}
          services={services}
          serviceCounts={serviceCounts}
        />
      </div>
    </div>
  );
};

export default ModeloDespiece;
