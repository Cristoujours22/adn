import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './credenciales';
import Menu from './menu';
import estilos from './App.module.css';
import { useAuth } from './authContext';

// Generador de ID único estable
let rowIdCounter = Date.now(); // Iniciar con timestamp para evitar colisiones entre sesiones
const createNewRow = () => ({
  id: `row_${rowIdCounter++}`,
  cant: '', largo: '', ancho: '', detalle: '', rotar: '', l1: '', l2: '', a1: '', a2: ''
});

const ModeloDespiece = () => {
  const { id } = useParams();
  const [rows, setRows] = useState([createNewRow()]);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [creationDate, setCreationDate] = useState(new Date().toLocaleDateString());
  const [lastModifiedDate, setLastModifiedDate] = useState(new Date().toLocaleDateString());
  const { currentUser } = useAuth();

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
          const loadedRows = (data.filas || []).map((row, idx) => {
            let rowId = row.id && /^row_\d+$/.test(row.id) ? parseInt(row.id.split('_')[1], 10) : null;
            if (rowId === null || usedIds.has(row.id)) {
              rowId = maxRowId++;
            }
            usedIds.add(`row_${rowId}`);
            return { ...row, id: `row_${rowId}` };
          });
          rowIdCounter = maxRowId;
          setRows(loadedRows.length ? loadedRows : [createNewRow()]);
        }
      } catch (err) {
        alert('Error al cargar el despiece para edición.');
      }
    };
    fetchDespiece();
    // eslint-disable-next-line
  }, [id]);

  const handleInputChange = useCallback((index, field, value) => {
    setRows((prevRows) => {
      const newRows = [...prevRows];
      newRows[index][field] = value;
      return newRows;
    });
  }, []);

  const handleRemoveRow = useCallback((indexToRemove) => {
    setRows((prevRows) => prevRows.filter((_, index) => index !== indexToRemove));
  }, []);

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
    setRows((prevRows) => {
      // Si la primera fila está vacía, reemplazarla
      if (prevRows.length === 1 && Object.values(prevRows[0]).every((v, i) => v === '' || (i === 0 && /^row_/.test(v)))) {
        return newRows.length ? newRows : [createNewRow()];
      }
      // Si no, agregar normalmente
      return [...prevRows, ...newRows];
    });
  }, []);

  // Guardar: si es edición, actualizar, si no, crear
  const handleSaveToFirestore = async () => {
    if (rows.length === 0) {
        alert('No hay datos para guardar. Por favor, agrega al menos una fila.');
        return;
    }
    if (!projectName || !clientName) {
        alert('Por favor, completa el nombre del proyecto y del cliente.');
        return;
    }
    try {
        if (id) {
          // Actualizar existente
          const despieceRef = doc(db, 'despieces', id);
          await updateDoc(despieceRef, {
            proyecto: projectName,
            cliente: clientName,
            fechaCreacion: creationDate,
            ultimaModificacion: new Date().toLocaleDateString(),
            filas: rows
          });
          alert('Despiece actualizado exitosamente.');
        } else {
          // Crear nuevo
          const despiecesCollection = collection(db, 'despieces');
          const despieceData = {
            proyecto: projectName,
            cliente: clientName,
            fechaCreacion: creationDate,
            ultimaModificacion: lastModifiedDate,
            filas: rows,
            userId: currentUser ? currentUser.uid : null // Asignar usuario dueño
          };
          await addDoc(despiecesCollection, despieceData);
          alert('Despiece guardado exitosamente en Firestore.');
        }
    } catch (error) {
        console.error('Error al guardar en Firestore:', error.message, error.stack);
        alert('Hubo un error al guardar el despiece. Revisa la consola para más detalles.');
    }
  };

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

    switch (e.key) {
      case 'ArrowUp':
        if (index > 0) focusField(index - 1, field);
        break;
      case 'ArrowDown':
        if (index < rows.length - 1) focusField(index + 1, field);
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
  }, [rows]);

  // Mejorar navegación tipo Google Sheets
  const handleKeyDown = useCallback((e, index, field) => {
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
      } else if (index < rows.length - 1) {
        // Mover al primer campo de la siguiente fila
        const nextInput = document.getElementById(`cant-${index + 1}`);
        if (nextInput) nextInput.focus();
      } else {
        // Agregar una nueva fila y mover al primer campo de esa fila
        setRows((prevRows) => [...prevRows, createNewRow()]);
        setTimeout(() => {
          const nextInput = document.getElementById(`cant-${rows.length}`);
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
  }, [rows, handleArrowNavigation]);

  const handleCopyDespiece = () => {
    const rowsForExcel = rows.map(row => [
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
    <div className={estilos.modeloDespieceContainer} style={{ marginTop: '50px' }}>
      <Menu />
      <h2>Crear Nuevo Despiece</h2>
      <form onSubmit={handleSubmit} className={estilos.formularioDespiece} onPaste={handlePaste}>
        <div className={estilos.projectInfo} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <label style={{ flex: 1 }}>
            Nombre del Cliente:
            <input
              type="text"
              value={clientName}
              onChange={handleClientNameChange}
              className={estilos.inputLargo}
            />
          </label>
          <label style={{ flex: 1 }}>
            Nombre del Proyecto:
            <input
              type="text"
              value={projectName}
              onChange={handleProjectNameChange}
              className={estilos.inputLargo}
            />
          </label>
          <p>Fecha de Creación: {creationDate}</p>
          <p>Última Fecha de Modificación: {lastModifiedDate}</p>
        </div>
        <div className={estilos.tablaDespiece}>
          <div className={estilos.filaDespiece}>
            <div className={estilos.celdaTitulo}>CANT</div>
            <div className={estilos.celdaTitulo}>LARGO</div>
            <div className={estilos.celdaTitulo}>ANCHO</div>
            <div className={estilos.celdaTitulo}>DETALLE</div>
            <div className={estilos.celdaTitulo}>ROTAR</div>
            <div className={estilos.celdaTitulo}>L1</div>
            <div className={estilos.celdaTitulo}>L2</div>
            <div className={estilos.celdaTitulo}>A1</div>
            <div className={estilos.celdaTitulo}>A2</div>
            <div className={estilos.celdaTitulo}>ACCIONES</div>
          </div>
          {rows.map((row, index) => (
            <div key={row.id} className={estilos.filaDespiece}>
              <div className={estilos.celdaDespiece}>
                <input
                  type="number"
                  className={`${estilos.inputCorto} ${estilos.flexibleWidth}`}
                  name={`cant-${index}`}
                  id={`cant-${index}`}
                  value={row.cant}
                  onChange={(e) => handleInputChange(index, 'cant', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index, 'cant')}
                  required
                />
              </div>
              <div className={estilos.celdaDespiece}>
                <input
                  type="text"
                  className={estilos.inputCorto}
                  name={`largo-${index}`}
                  id={`largo-${index}`}
                  value={row.largo}
                  onChange={(e) => handleInputChange(index, 'largo', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index, 'largo')}
                  required
                />
              </div>
              <div className={estilos.celdaDespiece}>
                <input
                  type="text"
                  className={estilos.inputCorto}
                  name={`ancho-${index}`}
                  id={`ancho-${index}`}
                  value={row.ancho}
                  onChange={(e) => handleInputChange(index, 'ancho', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index, 'ancho')}
                  required
                />
              </div>
              <div className={estilos.celdaDespiece}>
                <input
                  type="text"
                  className={estilos.inputLargo}
                  name={`detalle-${index}`}
                  id={`detalle-${index}`}
                  value={row.detalle}
                  onChange={(e) => handleInputChange(index, 'detalle', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index, 'detalle')}
                  required
                />
              </div>
              <div className={estilos.celdaDespiece}>
                <input
                  type="text"
                  className={estilos.inputCorto}
                  name={`rotar-${index}`}
                  id={`rotar-${index}`}
                  value={row.rotar}
                  onChange={(e) => handleInputChange(index, 'rotar', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index, 'rotar')}
                />
              </div>
              <div className={estilos.celdaDespiece}>
                <input
                  type="text"
                  className={estilos.inputCorto}
                  name={`l1-${index}`}
                  id={`l1-${index}`}
                  value={row.l1}
                  onChange={(e) => handleInputChange(index, 'l1', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index, 'l1')}
                />
              </div>
              <div className={estilos.celdaDespiece}>
                <input
                  type="text"
                  className={estilos.inputCorto}
                  name={`l2-${index}`}
                  id={`l2-${index}`}
                  value={row.l2}
                  onChange={(e) => handleInputChange(index, 'l2', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index, 'l2')}
                />
              </div>
              <div className={estilos.celdaDespiece}>
                <input
                  type="text"
                  className={estilos.inputCorto}
                  name={`a1-${index}`}
                  id={`a1-${index}`}
                  value={row.a1}
                  onChange={(e) => handleInputChange(index, 'a1', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index, 'a1')}
                />
              </div>
              <div className={estilos.celdaDespiece}>
                <input
                  type="text"
                  className={estilos.inputCorto}
                  name={`a2-${index}`}
                  id={`a2-${index}`}
                  value={row.a2}
                  onChange={(e) => handleInputChange(index, 'a2', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index, 'a2')}
                />
              </div>
              <div className={estilos.celdaDespiece}>
                {rows.length > 1 && (
                  <button
                    onClick={() => handleRemoveRow(index)}
                    className={estilos.botonEliminar}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </form>
      <footer className={estilos.footerDespiece}>
        <button onClick={handleSaveToFirestore} className={estilos.botonSubmit}>
          Guardar Despiece
        </button>
        <button className={estilos.botonCopiar} onClick={handleCopyDespiece}>Copiar Despiece</button>
      </footer>
    </div>
  );
};

export default ModeloDespiece;
