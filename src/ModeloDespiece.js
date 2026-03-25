import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './credenciales';
import Menu from './menu';
import estilos from './App.module.css';
import { useAuth } from './authContext';
import TabsDespiece from './components/Despieces/TabsDespiece';
import PanelResumen from './components/Despieces/PanelResumen';
import TablaPiezas from './components/Despieces/TablaPiezas';
import { useTheme } from './ThemeContext';
import { calcularTotalesDespiece, aplicarDespieceAutomatico, getVistaPreviaDespieceAuto, MODOS_DESPECIE } from './utils/despieceCalculations';

// Generador de ID único estable
let rowIdCounter = Date.now(); // Iniciar con timestamp para evitar colisiones entre sesiones
const createNewRow = () => ({
  id: `row_${rowIdCounter++}`,
  cant: '', largo: '', ancho: '', detalle: '', rotar: '', l1: '', l2: '', a1: '', a2: '', narizCobro: '', enchapeCobro: ''
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
  { nomenclatura: 'CSPERALM', nombreOriginal: 'PEGADO MANIJA ALUMINIO', tipoCobro: 'ml_largo_ancho' }, // Usualmente L o A, asumo unidad o ML
  { nomenclatura: 'CSCANTOA', nombreOriginal: 'PEGADO CANTO ALUMINIO', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'SRRANUPE', nombreOriginal: 'RANURAPE', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'SERPERBIS', nombreOriginal: 'PERBIS', tipoCobro: 'unidad' },
  { nomenclatura: 'CSRANUFO', nombreOriginal: 'RANURAFO', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'RANULED', nombreOriginal: 'RANULED', tipoCobro: 'unidad' },
  { nomenclatura: 'CSCURVA1', nombreOriginal: 'CURVA', tipoCobro: 'unidad' },
  { nomenclatura: 'SRNAR000', nombreOriginal: 'NARIZ', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'SRREPEGA', nombreOriginal: 'SANDUCHE CLAVILLO', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'SERVREME', nombreOriginal: 'SANDUCHE PEGA', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'SERVIMARCO', nombreOriginal: 'MARCO, ENGRUESE EN MELAMINA', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'CSCIRCULO', nombreOriginal: 'CIRCULOS', tipoCobro: 'unidad' },
  { nomenclatura: 'SERANGUL', nombreOriginal: 'ANGULO', tipoCobro: 'escala_60' },
  { nomenclatura: 'CSCALADO', nombreOriginal: 'CALADO', tipoCobro: 'escala_60' },
  { nomenclatura: 'SRCALAEI', nombreOriginal: 'CALADO  INTERNO', tipoCobro: 'escala_60' },
  { nomenclatura: 'SERVIENL', nombreOriginal: 'EN L', tipoCobro: 'unidad' },
  { nomenclatura: 'CSCHAFLA', nombreOriginal: 'CHAFLAN', tipoCobro: 'unidad' },
  { nomenclatura: 'SENCHAMANUAL', nombreOriginal: 'ENCHAPE MANUAL', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'SENCHACURVA', nombreOriginal: 'ENCHAPE CURVO', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'CSCANTOC2', nombreOriginal: 'Enchape Canto Curvo 2mm. (Rígido)', tipoCobro: 'ml_largo_ancho' },
  { nomenclatura: 'CSINGLES', nombreOriginal: 'CAJA INGLESA', tipoCobro: 'unidad' },
  { nomenclatura: 'SERVICENEFA', nombreOriginal: 'CAJA', tipoCobro: 'unidad' },
  { nomenclatura: 'SERPASACABLE', nombreOriginal: 'PASACABLE', tipoCobro: 'unidad' },
  { nomenclatura: 'MANICHAFLAN', nombreOriginal: 'MANICHAFLAN', tipoCobro: 'unidad' },
  { nomenclatura: 'MANICRUS', nombreOriginal: 'MANIJA DE INCRUSTAR', tipoCobro: 'unidad' },
  { nomenclatura: 'MANIGAVETA', nombreOriginal: 'MANIGAVETA', tipoCobro: 'unidad' },
  { nomenclatura: 'SERCURML', nombreOriginal: 'CURVA MEDIA LUNA', tipoCobro: 'unidad' }
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
  const [userCargo, setUserCargo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar cargo del usuario
  useEffect(() => {
    const fetchUserCargo = async () => {
      if (!currentUser?.uid) {
        setUserCargo('');
        return;
      }
      try {
        const userDocRef = doc(db, 'usuarios', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserCargo(userDocSnap.data().Cargo || '');
        } else {
          setUserCargo('');
        }
      } catch (error) {
        console.error('Error al cargar cargo:', error);
        setUserCargo('');
      }
    };
    fetchUserCargo();
  }, [currentUser]);

  // Función para cargar servicios del usuario desde Firestore
  const loadUserServices = useCallback(async () => {
    if (!currentUser?.uid) return null;
    try {
      const userServicesRef = doc(db, 'userServices', currentUser.uid);
      const userServicesSnap = await getDoc(userServicesRef);
      if (userServicesSnap.exists() && userServicesSnap.data()?.servicios) {
        return userServicesSnap.data().servicios;
      }
    } catch (error) {
      console.error('Error al cargar servicios del usuario:', error);
    }
    return null;
  }, [currentUser]);

  // Función para guardar servicios como defaults del usuario
  const saveUserServicesAsDefault = useCallback(async () => {
    if (!currentUser?.uid) {
      alert('Debes estar autenticado para guardar tus servicios por defecto.');
      return;
    }
    try {
      const userServicesRef = doc(db, 'userServices', currentUser.uid);
      await setDoc(userServicesRef, {
        userId: currentUser.uid,
        servicios: services,
        fechaActualizacion: new Date().toLocaleDateString()
      });
      alert('Servicios guardados como tus valores por defecto.');
    } catch (error) {
      console.error('Error al guardar servicios del usuario:', error);
      alert('Error al guardar los servicios. Consulta la consola.');
    }
  }, [currentUser, services]);

  // Cargar servicios del usuario al iniciar (solo si no hay id - nuevo proyecto)
  useEffect(() => {
    if (!id) {
      const loadInitialServices = async () => {
        const userServices = await loadUserServices();
        if (userServices) {
          setServices(userServices);
        }
      };
      loadInitialServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loadUserServices]);
  const [pieceSearchTerm, setPieceSearchTerm] = useState('');
  const [pieceSearchLargo, setPieceSearchLargo] = useState('');
  const [pieceSearchAncho, setPieceSearchAncho] = useState('');
  const [pieceSearchType, setPieceSearchType] = useState('detalle'); // 'detalle' o 'medida'
  const [cobroExtraModal, setCobroExtraModal] = useState({ isOpen: false, rowIndex: null, value: '', label: '', targetField: '' });
  const [showModuleColors, setShowModuleColors] = useState(false);
  const editingValueRef = useRef({}); // Guarda el valor original cuando se entra en edición { "0_largo": "790", "1_cant": "2" }
  const { darkMode } = useTheme();

  // Cargar preferencia de colores de módulos
  useEffect(() => {
    const loadPreference = async () => {
      if (!currentUser?.uid) return;
      try {
        const userSettingsRef = doc(db, 'userSettings', currentUser.uid);
        const userSettingsSnap = await getDoc(userSettingsRef);
        if (userSettingsSnap.exists() && userSettingsSnap.data()?.showModuleColors !== undefined) {
          setShowModuleColors(userSettingsSnap.data().showModuleColors);
        }
      } catch (error) {
        console.error('Error al cargar preferencia de colores:', error);
      }
    };
    loadPreference();
  }, [currentUser]);

  // Guardar preferencia de colores de módulos
  const toggleModuleColors = async () => {
    const newValue = !showModuleColors;
    setShowModuleColors(newValue);
    if (currentUser?.uid) {
      try {
        const userSettingsRef = doc(db, 'userSettings', currentUser.uid);
        await setDoc(userSettingsRef, {
          userId: currentUser.uid,
          showModuleColors: newValue
        }, { merge: true });
      } catch (error) {
        console.error('Error al guardar preferencia de colores:', error);
      }
    }
  };

  // Excel-like table state
  const [activeCell, setActiveCell] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dragSelection, setDragSelection] = useState(null); // { startIndex, endIndex, startField, endField, value }
  // eslint-disable-next-line no-unused-vars
  const [history, setHistory] = useState([]);
  const [selection, setSelection] = useState(null); // { start: { index, field }, end: { index, field } }
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [historialVersiones, setHistorialVersiones] = useState([]);
  const [versionSeleccionada, setVersionSeleccionada] = useState(null);
  const [showMenuAcciones, setShowMenuAcciones] = useState(false);
  const [showDespieceAutoModal, setShowDespieceAutoModal] = useState(false);
  const [despieceAutoModo, setDespieceAutoModo] = useState('cocina');
  const [despieceAutoOpcion, setDespieceAutoOpcion] = useState(1);

  const saveToHistory = useCallback(() => {
    setHistory(prev => {
        const currentStateStr = JSON.stringify(despieces);
        if (prev.length > 0 && prev[prev.length - 1] === currentStateStr) {
            return prev;
        }
        const newHistory = [...prev, currentStateStr];
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
    });
  }, [despieces]);

  const undo = useCallback(() => {
    setHistory(prev => {
        if (prev.length === 0) return prev;
        const newHistory = [...prev];
        const lastState = newHistory.pop();
        setDespieces(JSON.parse(lastState));
        return newHistory;
    });
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            undo();
        }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [undo]);

  useEffect(() => {
    const handleOpenModal = () => setShowNomenclaturesModal(true);
    
    // Listen to our custom event for instant updates within the same window
    window.addEventListener("openNomenclaturesModal", handleOpenModal);
     
    return () => {
      window.removeEventListener("openNomenclaturesModal", handleOpenModal);
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
          } else {
            // Si no hay servicios en el proyecto, cargar servicios del usuario o defaults
            const userServices = await loadUserServices();
            if (userServices) {
              setServices(userServices);
            }
          }
        }
      } catch (err) {
        alert('Error al cargar el despiece para edición.');
      }
    };
    fetchDespiece();
    // eslint-disable-next-line
  }, [id]);

  // Calcular totales (piezas y servicios) sólo de la pestaña activa cada vez que cambien datos o de pestaña
  useEffect(() => {
    const activeDespiece = despieces.find(d => d.id === activeDespieceId) || despieces[0];
    if (!activeDespiece) return;
    const { totalPieces, serviceCounts } = calcularTotalesDespiece([activeDespiece], services);
    setTotalPieces(totalPieces);
    setServiceCounts(serviceCounts);
  }, [despieces, services, activeDespieceId]);

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
    // La validación de cant/largo/ancho se hace al confirmar con Enter (en handleKeyDown)
    
    setDespieces((prevDespieces) => prevDespieces.map(despiece => {
      if (despiece.id !== activeDespieceId) return despiece;
      const newRows = [...(despiece.filas || [])];
      
      // Aplicar a la celda actual
      if (newRows[index]) {
        newRows[index] = { ...newRows[index], [field]: value };
      }

      // Si hay seleccion múltiple y la celda actual está en ella, aplicar a todas las celdas seleccionadas del mismo campo
      if (selection) {
        const startIdx = Math.min(selection.start.index, selection.end.index);
        const endIdx = Math.max(selection.start.index, selection.end.index);
        const fields = ['cant', 'largo', 'ancho', 'detalle', 'rotar', 'l1', 'l2', 'a1', 'a2'];
        const startFldIdx = fields.indexOf(selection.start.field);
        const endFldIdx = fields.indexOf(selection.end.field);
        const minFldIdx = Math.min(startFldIdx, endFldIdx);
        const maxFldIdx = Math.max(startFldIdx, endFldIdx);
        const currFldIdx = fields.indexOf(field);

        if (index >= startIdx && index <= endIdx && currFldIdx >= minFldIdx && currFldIdx <= maxFldIdx) {
          for (let i = startIdx; i <= endIdx; i++) {
            for (let fIdx = minFldIdx; fIdx <= maxFldIdx; fIdx++) {
               const f = fields[fIdx];
               if (newRows[i]) {
                  newRows[i] = { ...newRows[i], [f]: value };
               }
            }
          }
        }
      }

      return { ...despiece, filas: newRows };
    }));
  }, [activeDespieceId, selection, despieces]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemoveRow = useCallback((indexToRemove) => {
    saveToHistory();
    setDespieces((prevDespieces) => prevDespieces.map(despiece => {
      if (despiece.id !== activeDespieceId) return despiece;
      return { ...despiece, filas: (despiece.filas || []).filter((_, index) => index !== indexToRemove) };
    }));
  }, [activeDespieceId, saveToHistory]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSaveToFirestore();
  };

  // Al pegar filas, asegurar IDs únicos y evitar fila vacía inicial
  const handlePaste = useCallback((e) => {
    // Si el pegado ocurre en los campos de búsqueda, permitir comportamiento por defecto
    const target = e.target;
    const inputId = target.id || target.name || '';
    const isSearchInput = inputId.includes('search-') || inputId === 'proyecto' || inputId === 'cliente';
    
    if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && isSearchInput) {
      return;
    }
    
    e.preventDefault();
    saveToHistory();
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
  }, [activeDespieceId, saveToHistory]);

  // ==================== HISTORIAL DE VERSIONES ====================
  const guardarVersion = async (despieceId, datos) => {
    if (!despieceId) return;
    
    const historialRef = collection(db, 'historialVersiones');
    
    // Obtener número de versión actual
    const q = query(historialRef, where('despieceId', '==', despieceId));
    const snapshot = await getDocs(q);
    const numVersion = snapshot.size + 1;
    
    // Crear nueva versión
    await addDoc(historialRef, {
      despieceId,
      version: numVersion,
      fecha: new Date().toLocaleString(),
      usuario: currentUser?.uid || 'anonimo',
      datos: datos.despieces,
      serviciosGuardados: datos.servicios,
      proyecto: datos.proyecto,
      cliente: datos.cliente
    });
    
    // Mantener solo últimas 5 versiones
    if (numVersion > 5) {
      const docsOrdenados = snapshot.docs.sort((a, b) => a.data().version - b.data().version);
      const docsAEliminar = docsOrdenados.slice(0, numVersion - 5);
      for (const docItem of docsAEliminar) {
        await deleteDoc(docItem.ref);
      }
    }
  };

  const cargarHistorialVersiones = async (despieceId) => {
    if (!despieceId) return;
    
    const q = query(collection(db, 'historialVersiones'), where('despieceId', '==', despieceId));
    const snapshot = await getDocs(q);
    const historial = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    historial.sort((a, b) => b.version - a.version);
    setHistorialVersiones(historial);
  };

  const restaurarVersion = (version) => {
    if (window.confirm(`¿Estás seguro que deseas restaurar la versión ${version.version} del ${version.fecha}? Los cambios actuales se perderán.`)) {
      setDespieces(version.datos);
      setServices(version.serviciosGuardados || DEFAULT_SERVICES);
      setShowHistorialModal(false);
      alert('Versión restaurada exitosamente. No olvides guardar los cambios.');
    }
  };

  // ==================== DESPiece AUTOMÁTICO ====================
  const aplicarDespieceAuto = () => {
    const activeDespiece = despieces.find(d => d.id === activeDespieceId) || despieces[0];
    if (!activeDespiece?.filas || activeDespiece.filas.length === 0) {
      alert('No hay piezas para aplicar despiece automático.');
      return;
    }

    const filasActualizadas = aplicarDespieceAutomatico(activeDespiece.filas, despieceAutoModo, despieceAutoOpcion);
    
    setDespieces(prev => prev.map(d => {
      if (d.id === activeDespieceId) {
        return { ...d, filas: filasActualizadas };
      }
      return d;
    }));
    
    setShowDespieceAutoModal(false);
    alert('Despiece automático aplicado exitosamente. No olvides guardar los cambios.');
  };

  const vistaPreviaDespieceAuto = () => {
    const activeDespiece = despieces.find(d => d.id === activeDespieceId) || despieces[0];
    if (!activeDespiece?.filas) return [];
    return getVistaPreviaDespieceAuto(activeDespiece.filas, despieceAutoModo, despieceAutoOpcion);
  };

  // ==================== GUARDAR EN FIRESTORE ====================
  // Guardar: si es edición, actualizar, si no, crear
  const handleSaveToFirestore = useCallback(async (isAutoSave = false) => {
    const totalFilas = despieces.reduce((acc, current) => acc + (current.filas ? current.filas.length : 0), 0);
    if (totalFilas === 0) {
        if (!isAutoSave) alert('No hay datos para guardar. Por favor, agrega al menos una fila en algún despiece.');
        return;
    }
    if (!projectName || !clientName) {
        if (!isAutoSave) {
            alert('No hay nombre de cliente y proyecto para guardar. Por favor, llena esos campos.');
        } 
        return; // No permitimos guardar si faltan estos datos
    }
    try {
        if (id) {
          // Actualizar existente
          const despieceRef = doc(db, 'despieces', id);
          await updateDoc(despieceRef, {
            proyecto: projectName, // Keep 'proyecto' as per original, not 'nombreProyecto' from partial edit
            cliente: clientName,
            // fechaCreacion: creationDate, // Removed as per partial edit, makes sense for update
            ultimaModificacion: Date.now(), // Timestamp numérico para ordenamiento correcto
            ultimaModificacionStr: new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }), // Para mostrar al usuario
            despieces: despieces,
            serviciosGuardados: services
          });
          if (!isAutoSave) {
            await guardarVersion(id, { despieces, servicios: services, proyecto: projectName, cliente: clientName });
            alert('Despiece actualizado exitosamente.');
          }
        } else {
          // Crear nuevo - verificar duplicados
          const q = query(
            collection(db, 'despieces'),
            where('cliente', '==', clientName.trim()),
            where('proyecto', '==', projectName.trim()),
            where('userId', '==', currentUser ? currentUser.uid : null)
          );
          const existingDocs = await getDocs(q);
          
          if (!existingDocs.empty) {
            const existingId = existingDocs.docs[0].id;
            if (!isAutoSave) {
              const sobrescribir = window.confirm(
                `Ya existe un proyecto con el mismo Cliente y Nombre de Proyecto.\n\n` +
                `Cliente: ${clientName}\n` +
                `Proyecto: ${projectName}\n\n` +
                `¿Deseas sobrescribir el proyecto existente?`
              );
              if (!sobrescribir) return;
              
              // Sobrescribir el proyecto existente
              const despieceRef = doc(db, 'despieces', existingId);
              await updateDoc(despieceRef, {
                proyecto: projectName,
                cliente: clientName,
                ultimaModificacion: Date.now(), // Timestamp numérico
                ultimaModificacionStr: new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                despieces: despieces,
                serviciosGuardados: services
              });
              if (!isAutoSave) {
                await guardarVersion(existingId, { despieces, servicios: services, proyecto: projectName, cliente: clientName });
                alert('Despiece actualizado exitosamente.');
              }
              return;
            }
          }
          
          // Crear nuevo
          const despiecesCollection = collection(db, 'despieces');
          const despieceData = {
            proyecto: projectName,
            cliente: clientName,
            fechaCreacion: creationDate,
            ultimaModificacion: Date.now(), // Timestamp numérico
            ultimaModificacionStr: new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }), // Para mostrar al usuario
            despieces: despieces,
            serviciosGuardados: services,
            userId: currentUser ? currentUser.uid : null // Asignar usuario dueño
          };
          await addDoc(despiecesCollection, despieceData);
          if (!isAutoSave) alert('Despiece guardado exitosamente en Firestore.');
        }
    } catch (error) {
        console.error('Error al guardar en Firestore:', error.message, error.stack);
        if (!isAutoSave) alert('Hubo un error al guardar el despiece. Revisa la consola para más detalles.');
    } finally {
        // Respaldo de servicios del usuario
        if (currentUser?.uid && !isAutoSave) {
            try {
                const userServicesRef = doc(db, 'userServices', currentUser.uid);
                await setDoc(userServicesRef, {
                    userId: currentUser.uid,
                    servicios: services,
                    fechaActualizacion: new Date().toLocaleDateString()
                });
            } catch (err) {
                console.error('Error al respaldar servicios del usuario:', err);
            }
        }
    }
  }, [despieces, projectName, clientName, services, id, currentUser, creationDate, lastModifiedDate]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Enfocar el elemento DOM cuando cambia la celda activa
  useEffect(() => {
    if (activeCell) {
        const inputId = `${activeCell.field}-${activeCell.index}`;
        const inputEl = document.getElementById(inputId);
        if (inputEl && document.activeElement !== inputEl) {
            inputEl.focus();
            if (isEditing) {
                // Si entra en edición, posicionar cursor al final del texto (opcional pero de buen uso)
                const valObj = inputEl.value;
                inputEl.setSelectionRange(valObj.length, valObj.length);
            }
        }
    }
  }, [activeCell, isEditing]);

  // Cerrar menú de acciones al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMenuAcciones && !e.target.closest('.menu-acciones')) {
        setShowMenuAcciones(false);
      }
    };
    if (showMenuAcciones) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenuAcciones]);

  // --- EXCEL-LIKE NAVIGATION & EVENT HANDLERS ---
  const handleKeyDown = useCallback((e, index, field) => {
    const activeRows = (despieces.find(d => d.id === activeDespieceId) || despieces[0])?.filas || [];
    const fields = ['cant', 'largo', 'ancho', 'detalle', 'rotar', 'l1', 'l2', 'a1', 'a2'];
    const currentIndex = fields.indexOf(field);

    if (e.key === 'Tab') {
      e.preventDefault();
      setIsEditing(false); // Cancel edit on tab
      if (e.shiftKey) { // Shift+Tab
          if (currentIndex > 0) setActiveCell({ index, field: fields[currentIndex - 1] });
          else if (index > 0) setActiveCell({ index: index - 1, field: fields[fields.length - 1] });
      } else { // Tab
          if (currentIndex < fields.length - 1) setActiveCell({ index, field: fields[currentIndex + 1] });
          else if (index < activeRows.length - 1) setActiveCell({ index: index + 1, field: fields[0] });
      }
      // Al tabular, colapsamos la selección a la nueva celda activa
      setTimeout(() => {
          setActiveCell(curr => {
              if (curr) setSelection({ start: { ...curr }, end: { ...curr } });
              return curr;
          });
      }, 0);
      return;
    }

    // --- SHORTCUTS GLOBALES ---
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        saveToHistory();
        setDespieces(prev => prev.map(d => {
            if (d.id !== activeDespieceId) return d;
            const newFilas = [...d.filas];
            const rowToDuplicate = { ...newFilas[index] };
            rowToDuplicate.id = `row_${rowIdCounter++}`;
            newFilas.splice(index + 1, 0, rowToDuplicate);
            return { ...d, filas: newFilas };
        }));
        return;
    }

    if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        // Regresar foco al contenedor principal de la tabla si se desea, por ahora mantenemos foco en celda como solo lectura
        return;
    }

    if (e.key === ' ' && !isEditing) {
        e.preventDefault();
        saveToHistory();
        const newValue = activeRows[index].rotar === 'X' ? '' : 'X';
        handleInputChange(index, 'rotar', newValue);
        return;
    }

    if (!isEditing) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (index > 0) {
            const newCell = { index: index - 1, field };
            setActiveCell(newCell);
            if (e.shiftKey) setSelection(prev => ({ ...prev, end: newCell }));
            else setSelection({ start: newCell, end: newCell });
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (index < activeRows.length - 1) {
            const newCell = { index: index + 1, field };
            setActiveCell(newCell);
            if (e.shiftKey) setSelection(prev => ({ ...prev, end: newCell }));
            else setSelection({ start: newCell, end: newCell });
        } else {
          setDespieces((prev) => prev.map(d => d.id === activeDespieceId ? { ...d, filas: [...(d.filas || []), createNewRow()] } : d));
          setTimeout(() => {
              const newCell = { index: activeRows.length, field };
              setActiveCell(newCell);
              setSelection({ start: newCell, end: newCell });
          }, 0);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
            const newCell = { index, field: fields[currentIndex - 1] };
            setActiveCell(newCell);
            if (e.shiftKey) setSelection(prev => ({ ...prev, end: newCell }));
            else setSelection({ start: newCell, end: newCell });
        } else if (index > 0 && !e.shiftKey) {
            // Saltar al final de la fila anterior si presiona izquierda en la primera columna
            const newCell = { index: index - 1, field: fields[fields.length - 1] };
            setActiveCell(newCell);
            setSelection({ start: newCell, end: newCell });
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < fields.length - 1) {
            const newCell = { index, field: fields[currentIndex + 1] };
            setActiveCell(newCell);
            if (e.shiftKey) setSelection(prev => ({ ...prev, end: newCell }));
            else setSelection({ start: newCell, end: newCell });
        } else if (!e.shiftKey) {
            // Saltar al inicio de la siguiente fila si presiona derecha en la ultima columna
            if (index < activeRows.length - 1) {
                const newCell = { index: index + 1, field: fields[0] };
                setActiveCell(newCell);
                setSelection({ start: newCell, end: newCell });
            } else {
                setDespieces((prev) => prev.map(d => d.id === activeDespieceId ? { ...d, filas: [...(d.filas || []), createNewRow()] } : d));
                setTimeout(() => {
                    const newCell = { index: activeRows.length, field: fields[0] };
                    setActiveCell(newCell);
                    setSelection({ start: newCell, end: newCell });
                }, 0);
            }
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        saveToHistory();
        saveOriginalValue(index, field);
        setIsEditing(true);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (index < activeRows.length - 1) {
            const newCell = { index: index + 1, field };
            setActiveCell(newCell);
            setSelection({ start: newCell, end: newCell });
        } else {
          setDespieces((prev) => prev.map(d => d.id === activeDespieceId ? { ...d, filas: [...(d.filas || []), createNewRow()] } : d));
          setTimeout(() => {
              const newCell = { index: activeRows.length, field };
              setActiveCell(newCell);
              setSelection({ start: newCell, end: newCell });
          }, 0);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        saveToHistory();
        
        if ((e.ctrlKey || e.metaKey) && selection) {
            // Borrar FILAS completas
            const startIdx = Math.min(selection.start.index, selection.end.index);
            const endIdx = Math.max(selection.start.index, selection.end.index);
            
            setDespieces(prev => prev.map(d => {
                if (d.id !== activeDespieceId) return d;
                const newFilas = d.filas.filter((_, i) => i < startIdx || i > endIdx);
                return { ...d, filas: newFilas.length ? newFilas : [createNewRow()] };
            }));
            setSelection(null);
            if (activeRows.length > 0) setActiveCell({ index: Math.max(0, startIdx - 1), field: selection.start.field });
        } else {
            // Borrar CONTENIDO de celdas seleccionadas
            handleInputChange(index, field, '');
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Start editing implicitly on typing and overwrite the cell natively
        e.preventDefault();
        saveToHistory();
        saveOriginalValue(index, field);
        setIsEditing(true);
        handleInputChange(index, field, e.key);
      }
    } else {
      // Edit Mode
      if (e.key === 'Enter') {
        e.preventDefault();
        
        // Validar cant/largo/ancho antes de confirmar
        if (['cant', 'largo', 'ancho'].includes(field)) {
          const inputEl = document.getElementById(`${field}-${index}`);
          const newValue = inputEl?.value || '';
          const originalValue = editingValueRef.current[`${index}_${field}`];
          
          if (originalValue !== undefined && 
              originalValue !== '' && 
              String(originalValue) !== String(newValue)) {
            const confirmar = window.confirm(
              `¿Estás seguro que deseas editar ${field}? Esto reemplazará el valor actual (${originalValue}) por "${newValue}".`
            );
            if (!confirmar) {
              // Cancelar - restaurar valor original y salir del modo edición
              setDespieces((prev) => prev.map(d => {
                if (d.id !== activeDespieceId) return d;
                const newFilas = [...d.filas];
                if (newFilas[index]) {
                  newFilas[index] = { ...newFilas[index], [field]: originalValue };
                }
                return { ...d, filas: newFilas };
              }));
              setIsEditing(false);
              return;
            }
          }
        }
        
        setIsEditing(false);
        if (index < activeRows.length - 1) {
            const newCell = { index: index + 1, field };
            setActiveCell(newCell);
            setSelection({ start: { ...newCell }, end: { ...newCell } });
        } else {
          setDespieces((prev) => prev.map(d => d.id === activeDespieceId ? { ...d, filas: [...(d.filas || []), createNewRow()] } : d));
          setTimeout(() => {
              const newCell = { index: activeRows.length, field };
              setActiveCell(newCell);
              setSelection({ start: { ...newCell }, end: { ...newCell } });
          }, 0);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        setIsEditing(false);
        if (e.key === 'ArrowUp' && index > 0) {
            const newCell = { index: index - 1, field };
            setActiveCell(newCell);
            setSelection({ start: newCell, end: newCell });
        }
        else if (e.key === 'ArrowDown' && index < activeRows.length - 1) {
            const newCell = { index: index + 1, field };
            setActiveCell(newCell);
            setSelection({ start: newCell, end: newCell });
        }
        else if (e.key === 'ArrowLeft' && currentIndex > 0) {
            const newCell = { index, field: fields[currentIndex - 1] };
            setActiveCell(newCell);
            setSelection({ start: newCell, end: newCell });
        }
        else if (e.key === 'ArrowRight' && currentIndex < fields.length - 1) {
            const newCell = { index, field: fields[currentIndex + 1] };
            setActiveCell(newCell);
            setSelection({ start: newCell, end: newCell });
        }
      }
    }
  }, [despieces, activeDespieceId, isEditing, handleInputChange, saveToHistory, selection]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCellClick = useCallback((index, field, e) => {
     // Si ya estamos editando esta misma celda, no cerramos la edición ni interferimos
     if (isEditing && activeCell?.index === index && activeCell?.field === field) {
         return;
     }

     setActiveCell({ index, field });
     setIsEditing(false);
     
     if (e?.shiftKey && selection) {
         setSelection(prev => ({ ...prev, end: { index, field } }));
     } else {
         setSelection({ start: { index, field }, end: { index, field } });
      }
   }, [selection, isEditing, activeCell]);

  // Función helper para guardar el valor original al entrar en modo edición
  const saveOriginalValue = useCallback((index, field) => {
    const activeDespiece = despieces.find(d => d.id === activeDespieceId) || despieces[0];
    const currentValue = activeDespiece?.filas?.[index]?.[field] || '';
    editingValueRef.current[`${index}_${field}`] = currentValue;
  }, [despieces, activeDespieceId]);

  const handleCellDoubleClick = useCallback((index, field) => {
     // Si ya estamos en edición en esta celda, permitimos el doble clic nativo (para seleccionar la palabra)
     if (isEditing && activeCell?.index === index && activeCell?.field === field) {
         return;
     }

     setActiveCell({ index, field });
     setSelection({ start: { index, field }, end: { index, field } });
     saveToHistory();
     
     // Guardar valor original para validar al confirmar con Enter
     saveOriginalValue(index, field);
     
     setIsEditing(true);

     // Evitar que el *primer* doble clic (el que entra a edición) seleccione el texto
     setTimeout(() => {
        const inputEl = document.getElementById(`${field}-${index}`);
        if (inputEl) {
            const valObj = inputEl.value;
            inputEl.setSelectionRange(valObj.length, valObj.length);
        }
      }, 10);
  }, [saveToHistory, isEditing, activeCell, saveOriginalValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragFill = useCallback((startIndex, endIndex, startField, endField, sourceValue) => {
    saveToHistory();
    
    // Determine valid columns to fill horizontally based on rules
    const columnGroups = {
        l1: 'edges', l2: 'edges', a1: 'edges', a2: 'edges',
        largo: 'dim', ancho: 'dim',
        cant: 'cant', detalle: 'detalle', rotar: 'rotar'
    };
    const fields = ['cant', 'largo', 'ancho', 'detalle', 'rotar', 'l1', 'l2', 'a1', 'a2'];
    
    let validFields = [startField];
    const group = columnGroups[startField];
    
    if (group !== 'cant' && group !== 'detalle' && group !== 'rotar') {
        const i1 = fields.indexOf(startField);
        const i2 = fields.indexOf(endField);
        if (i1 !== -1 && i2 !== -1) {
            const start = Math.min(i1, i2);
            const end = Math.max(i1, i2);
            validFields = [];
            for (let i = start; i <= end; i++) {
                if (columnGroups[fields[i]] === group) validFields.push(fields[i]);
            }
            if (validFields.length === 0) validFields = [startField];
        }
    }

    setDespieces((prevDespieces) => prevDespieces.map(despiece => {
      if (despiece.id !== activeDespieceId) return despiece;
      const newRows = [...(despiece.filas || [])];
      const startIdx = Math.min(startIndex, endIndex);
      const endIdx = Math.max(startIndex, endIndex);
      
      for (let i = startIdx; i <= endIdx; i++) {
        if (newRows[i]) {
            const updatedRow = { ...newRows[i] };
            validFields.forEach(f => {
                updatedRow[f] = sourceValue;
            });
            newRows[i] = updatedRow;
        }
      }
      return { ...despiece, filas: newRows };
    }));
  }, [activeDespieceId, saveToHistory]);
  // ----------------------------------------------

  const handleOpenCobroModal = useCallback((index, label, targetField) => {
    const activeRows = despieces.find(d => d.id === activeDespieceId)?.filas || [];
    const row = activeRows[index];
    if (!row) return;

    let prefill = row[targetField] !== undefined ? String(row[targetField]) : '';
    setCobroExtraModal({ isOpen: true, rowIndex: index, value: prefill, label: label, targetField: targetField });
  }, [despieces, activeDespieceId]);

  const handleCloseCobroModal = () => {
    setCobroExtraModal({ isOpen: false, rowIndex: null, value: '', label: '', targetField: '' });
  };

  const handleSaveCobroModal = () => {
    if (cobroExtraModal.rowIndex === null || !cobroExtraModal.targetField) return;
    saveToHistory();
    const value = cobroExtraModal.value.trim();
    
    setDespieces(prevDespieces => prevDespieces.map(desp => {
        if (desp.id !== activeDespieceId) return desp;
        const newFilas = [...desp.filas];
        const row = { ...newFilas[cobroExtraModal.rowIndex] };

        row[cobroExtraModal.targetField] = value; // Guardar en campo interno dinámico (narizCobro o enchapeCobro)
        
        newFilas[cobroExtraModal.rowIndex] = row;
        return { ...desp, filas: newFilas };
    }));
    handleCloseCobroModal();
  };

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
                            onClick={saveUserServicesAsDefault}
                            style={{ background: 'transparent', color: '#ffc107', border: '1px solid #ffc107', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                            ★ Guardar como Mis Defaults
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
        <div style={{ flex: '1 1 75%', minWidth: '300px' }}>
          <form onSubmit={handleSubmit} className={estilos.formularioDespiece} onPaste={handlePaste}>
            <div className={estilos.projectInfo} style={{ 
              display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap',
              background: darkMode ? '#1c1f26' : '#f8f9fa',
              borderRadius: '8px',
              border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
              padding: '12px',
              marginBottom: '12px',
              fontSize: '13px'
            }}>
              <label style={{ flex: '1 1 250px', color: darkMode ? '#f1f1f1' : '#333', fontSize: '13px' }}>
                Nombre del Cliente:
                <input
                  type="text"
                  value={clientName}
                  onChange={handleClientNameChange}
                  className={estilos.inputLargo}
                  style={{ marginTop: '4px', fontSize: '13px', padding: '6px 8px' }}
                />
              </label>
              <label style={{ flex: '1 1 250px', color: darkMode ? '#f1f1f1' : '#333', fontSize: '13px' }}>
                Nombre del Proyecto:
                <input
                  type="text"
                  value={projectName}
                  onChange={handleProjectNameChange}
                  className={estilos.inputLargo}
                  style={{ marginTop: '4px', fontSize: '13px', padding: '6px 8px' }}
                />
              </label>
              <div style={{ flex: '1 1 100%' }}>
                <p style={{ color: darkMode ? '#ccc' : '#555', margin: '3px 0', fontSize: '12px' }}>Fecha de Creación: {creationDate}</p>
                <p style={{ color: darkMode ? '#ccc' : '#555', margin: '3px 0', fontSize: '12px' }}>Última Fecha de Modificación: {lastModifiedDate}</p>
              </div>
            </div>

            {/* SISTEMA DE PESTAÑAS (TABS) Y BUSCADOR DE PIEZAS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <div style={{ flex: '1 1 auto' }}>
                <TabsDespiece 
                  despieces={despieces}
                  setDespieces={setDespieces}
                  activeDespieceId={activeDespieceId}
                  setActiveDespieceId={setActiveDespieceId}
                  darkMode={darkMode}
                  createNewDespiece={createNewDespiece}
                />
              </div>

              {/* BUSCADOR DE PIEZAS */}
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select 
                  className={estilos.controls}
                  style={{ width: 'auto', margin: 0, padding: '4px 8px', height: '28px', fontSize: '12px' }}
                  value={pieceSearchType}
                  onChange={(e) => {
                    setPieceSearchType(e.target.value);
                    setPieceSearchTerm('');
                    setPieceSearchLargo('');
                    setPieceSearchAncho('');
                  }}
                >
                  <option value="detalle">Detalle</option>
                  <option value="medida">Largo y Ancho</option>
                </select>

                {pieceSearchType === 'detalle' ? (
                  <>
                    <input 
                      id="search-detalle"
                      className={estilos.controls}
                      style={{ width: '150px', margin: 0, padding: '4px 8px', height: '28px', fontSize: '12px' }}
                      type="text"
                      placeholder="Buscar..."
                      value={pieceSearchTerm}
                      onChange={(e) => setPieceSearchTerm(e.target.value)}
                    />
                    {pieceSearchTerm && (
                      <button 
                        type="button"
                        onClick={() => setPieceSearchTerm('')}
                        style={{ background: 'transparent', border: 'none', color: darkMode ? '#ff6b6b' : '#dc3545', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                        title="Limpiar Búsqueda"
                      >
                        ×
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <input 
                      id="search-largo"
                      className={estilos.controls}
                      style={{ width: '70px', margin: 0, padding: '4px 6px', height: '28px', fontSize: '12px' }}
                      type="number"
                      placeholder="Largo"
                      value={pieceSearchLargo}
                      onChange={(e) => setPieceSearchLargo(e.target.value)}
                    />
                    <span style={{ color: darkMode ? '#ccc' : '#555', fontSize: '11px' }}>x</span>
                    <input 
                      id="search-ancho"
                      className={estilos.controls}
                      style={{ width: '70px', margin: 0, padding: '4px 6px', height: '28px', fontSize: '12px' }}
                      type="number"
                      placeholder="Ancho"
                      value={pieceSearchAncho}
                      onChange={(e) => setPieceSearchAncho(e.target.value)}
                    />
                    {(pieceSearchLargo || pieceSearchAncho) && (
                      <button 
                        type="button"
                        onClick={() => { setPieceSearchLargo(''); setPieceSearchAncho(''); }}
                        style={{ background: 'transparent', border: 'none', color: darkMode ? '#ff6b6b' : '#dc3545', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                        title="Limpiar Búsqueda"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
                
                {/* Toggle Colores de Módulos */}
                <button
                  type="button"
                  onClick={toggleModuleColors}
                  style={{
                    background: showModuleColors ? '#4caf50' : 'transparent',
                    border: `1px solid ${showModuleColors ? '#4caf50' : '#ccc'}`,
                    color: showModuleColors ? '#fff' : (darkMode ? '#ccc' : '#666'),
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginLeft: 'auto',
                    height: '28px'
                  }}
                  title={showModuleColors ? "Desactivar colores de módulos" : "Activar colores de módulos"}
                >
                  🎨 Módulos
                </button>
              </div>
            </div>

            <TablaPiezas
              despieces={despieces}
              activeDespieceId={activeDespieceId}
              pieceSearchTerm={pieceSearchTerm}
              pieceSearchLargo={pieceSearchLargo}
              pieceSearchAncho={pieceSearchAncho}
              pieceSearchType={pieceSearchType}
              showModuleColors={showModuleColors}
              handleInputChange={handleInputChange}
              handleKeyDown={handleKeyDown}
              handleRemoveRow={handleRemoveRow}
              handleOpenCobroModal={handleOpenCobroModal}
              darkMode={darkMode}
              activeCell={activeCell}
              setActiveCell={setActiveCell}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              dragSelection={dragSelection}
              setDragSelection={setDragSelection}
              handleCellClick={handleCellClick}
              handleCellDoubleClick={handleCellDoubleClick}
              handleDragFill={handleDragFill}
              selection={selection}
            />

          </form>
          <footer className={estilos.footerDespiece} style={{ marginTop: '40px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            <div style={{ position: 'relative' }} className="menu-acciones">
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); setShowMenuAcciones(!showMenuAcciones); }}
                style={{ margin: 0, padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                ▼ Mas opciones
              </button>
              
              {showMenuAcciones && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  marginBottom: '4px',
                  background: darkMode ? '#2c303a' : '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  zIndex: 1000,
                  minWidth: '150px',
                  overflow: 'hidden'
                }}>
                  <button 
                    type="button"
                    onClick={() => { handleSaveToFirestore(false); setShowMenuAcciones(false); }}
                    style={{ 
                      display: 'block', width: '100%', padding: '10px 14px', 
                      background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
                      color: darkMode ? '#fff' : '#333',
                      borderBottom: '1px solid #eee',
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => e.target.style.background = darkMode ? '#3a3f47' : '#f0f0f0'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                  >
                    💾 Guardar Despiece
                  </button>
                  <button 
                    type="button"
                    onClick={() => { handleCopyDespiece(); setShowMenuAcciones(false); }}
                    style={{ 
                      display: 'block', width: '100%', padding: '10px 14px', 
                      background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
                      color: darkMode ? '#fff' : '#333',
                      borderBottom: '1px solid #eee',
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => e.target.style.background = darkMode ? '#3a3f47' : '#f0f0f0'}
                    onMouseLeave={(e) => e.target.style.background = 'none'}
                  >
                    📊 Copiar a Excel
                  </button>
                  {id && (
                    <button 
                      type="button"
                      onClick={() => { cargarHistorialVersiones(id); setShowHistorialModal(true); setShowMenuAcciones(false); }}
                      style={{ 
                        display: 'block', width: '100%', padding: '10px 14px', 
                        background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
                        color: darkMode ? '#fff' : '#333',
                        fontSize: '13px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = darkMode ? '#3a3f47' : '#f0f0f0'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      📜 Historial
                    </button>
                  )}
                  {userCargo.toLowerCase().includes('admin') && (
                    <button 
                      type="button"
                      onClick={() => { setShowDespieceAutoModal(true); setShowMenuAcciones(false); }}
                      style={{ 
                        display: 'block', width: '100%', padding: '10px 14px', 
                        background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
                        color: darkMode ? '#fff' : '#333',
                        fontSize: '13px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = darkMode ? '#3a3f47' : '#f0f0f0'}
                      onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                      ⚡ Despiece Auto
                    </button>
                  )}
                </div>
              )}
            </div>
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

      {/* MODAL DE HISTORIAL DE VERSIONES */}
      {showHistorialModal && (
        <div className={estilos.modalOverlay}>
            <div className={estilos.modalContent} style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
                <button className={estilos.closeButton} onClick={() => setShowHistorialModal(false)}>×</button>
                <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>Historial de Versiones</h3>
                
                {historialVersiones.length === 0 ? (
                  <p style={{ color: '#ccc', textAlign: 'center' }}>No hay versiones guardadas.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {historialVersiones.map((v) => (
                      <div key={v.id} style={{ 
                        background: darkMode ? '#3a3f47' : '#f8f9fa', 
                        padding: '12px', 
                        borderRadius: '6px',
                        border: versionSeleccionada?.id === v.id ? '2px solid #1a73e8' : '1px solid #ddd'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <strong style={{ color: '#1a73e8' }}>Version {v.version}</strong>
                            <span style={{ color: '#888', marginLeft: '10px' }}>{v.fecha}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button 
                              onClick={() => setVersionSeleccionada(versionSeleccionada?.id === v.id ? null : v)}
                              style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                            >
                              {versionSeleccionada?.id === v.id ? 'Ocultar' : 'Ver'}
                            </button>
                            <button 
                              onClick={() => restaurarVersion(v)}
                              style={{ padding: '4px 8px', fontSize: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                            >
                              Restaurar
                            </button>
                          </div>
                        </div>
                        
                        {versionSeleccionada?.id === v.id && (
                          <div style={{ marginTop: '10px', padding: '10px', background: darkMode ? '#2a2e35' : '#fff', borderRadius: '4px', fontSize: '12px' }}>
                            <p><strong>Proyecto:</strong> {v.proyecto}</p>
                            <p><strong>Cliente:</strong> {v.cliente}</p>
                            <p><strong>Usuario:</strong> {v.usuario}</p>
                            <p><strong>Servicios:</strong> {v.serviciosGuardados?.length || 0}</p>
                            <p><strong>Despieces:</strong> {v.datos?.length || 0}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <p style={{ color: '#888', fontSize: '11px', marginTop: '15px', textAlign: 'center' }}>
                  Ultimas 5 versiones. Solo se crea version al guardar manualmente.
                </p>
            </div>
        </div>
      )}

      {/* MODAL DE DESPiece AUTOMÁTICO */}
      {showDespieceAutoModal && (
        <div className={estilos.modalOverlay}>
            <div className={estilos.modalContent} style={{ maxWidth: '500px' }}>
                <button className={estilos.closeButton} onClick={() => setShowDespieceAutoModal(false)}>×</button>
                <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>⚡ Despiece Automático</h3>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: darkMode ? '#ccc' : '#555' }}>
                    Seleccionar modo:
                  </label>
                  <select 
                    value={despieceAutoModo}
                    onChange={(e) => setDespieceAutoModo(e.target.value)}
                    className={estilos.controls}
                    style={{ width: '100%', height: '40px' }}
                  >
                    {Object.values(MODOS_DESPECIE).map(modo => (
                      <option key={modo.id} value={modo.id}>{modo.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: darkMode ? '#ccc' : '#555' }}>
                    Seleccionar canto:
                  </label>
                  <select 
                    value={despieceAutoOpcion}
                    onChange={(e) => setDespieceAutoOpcion(parseInt(e.target.value))}
                    className={estilos.controls}
                    style={{ width: '100%', height: '40px' }}
                  >
                    {MODOS_DESPECIE.COCINA.opciones.map(opcion => (
                      <option key={opcion.id} value={opcion.id}>{opcion.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', color: darkMode ? '#ccc' : '#555' }}>
                    Vista previa:
                  </label>
                  <div style={{ 
                    background: darkMode ? '#2a2e35' : '#f8f9fa', 
                    borderRadius: '4px', 
                    padding: '10px',
                    fontSize: '12px'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #ddd' }}>
                          <th style={{ textAlign: 'left', padding: '4px' }}>Tipo</th>
                          <th style={{ textAlign: 'center', padding: '4px' }}>L1</th>
                          <th style={{ textAlign: 'center', padding: '4px' }}>L2</th>
                          <th style={{ textAlign: 'center', padding: '4px' }}>A1</th>
                          <th style={{ textAlign: 'center', padding: '4px' }}>A2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vistaPreviaDespieceAuto().map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '4px' }}>{item.tipo}</td>
                            <td style={{ textAlign: 'center', padding: '4px' }}>{item.l1 || '-'}</td>
                            <td style={{ textAlign: 'center', padding: '4px' }}>{item.l2 || '-'}</td>
                            <td style={{ textAlign: 'center', padding: '4px' }}>{item.a1 || '-'}</td>
                            <td style={{ textAlign: 'center', padding: '4px' }}>{item.a2 || '-'}</td>
                          </tr>
                        ))}
                        {vistaPreviaDespieceAuto().length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '10px', color: '#888' }}>
                              No hay piezas para previsualizar
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => setShowDespieceAutoModal(false)}
                    style={{ 
                      padding: '10px 20px', 
                      background: '#6c757d', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={aplicarDespieceAuto}
                    style={{ 
                      padding: '10px 20px', 
                      background: '#28a745', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Aplicar
                  </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL DINAMICO PARA COBROS EXACTOS (NARIZ, ENCHAPE) */}
      {cobroExtraModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            background: darkMode ? '#2c303a' : '#fff',
            padding: '20px', borderRadius: '8px', minWidth: '300px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginTop: 0, color: darkMode ? '#fff' : '#333' }}>Cantidad para {cobroExtraModal.label}</h3>
            <p style={{ fontSize: '13px', color: darkMode ? '#aaa' : '#666', marginBottom: '15px' }}>
              {cobroExtraModal.targetField === 'narizCobro' 
                ? "Ingresa la cantidad exacta de unidades de Nariz a cobrar para esta pieza."
                : "Ingresa el valor total en MILÍMETROS de enchape manual para esta pieza."}
            </p>
            <input
              type="number"
              step="any"
              autoFocus
              className={estilos.controls}
              value={cobroExtraModal.value}
              onChange={(e) => setCobroExtraModal({ ...cobroExtraModal, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveCobroModal();
                } else if (e.key === 'Escape') {
                  handleCloseCobroModal();
                }
              }}
              placeholder={cobroExtraModal.targetField === 'narizCobro' ? "Ej: 2" : "Ej: 1350"}
              style={{ width: '100%', margin: '15px 0', padding: '10px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={handleCloseCobroModal} 
                className={estilos.botonEliminar}
                style={{ padding: '8px 15px', margin: 0 }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleSaveCobroModal} 
                className={estilos.botonGuardar}
                style={{ background: '#28a745', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Guardar Valor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ModeloDespiece;
