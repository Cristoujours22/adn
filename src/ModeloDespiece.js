import React, { useState, useCallback } from 'react';
import estilos from './App.module.css';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './credenciales';
import Menu from './menu';

const createNewRow = () => ({
  id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  cant: '', largo: '', ancho: '', detalle: '', rotar: '', l1: '', l2: '', a1: '', a2: ''
});

const ModeloDespiece = () => {
  const [rows, setRows] = useState([createNewRow()]);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [lastModifiedDate, setLastModifiedDate] = useState(new Date().toLocaleDateString());

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

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('text');
    const rowsFromClipboard = clipboardData.split('\n').filter(row => row.trim() !== '');

    const newRows = rowsFromClipboard.map((row) => {
      const columns = row.split('\t').map(col => col.trim());
      return {
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
    });

    setRows(() => {
      const uniqueRows = newRows.filter((row, index, self) =>
        index === self.findIndex((r) =>
          r.cant === row.cant &&
          r.largo === row.largo &&
          r.ancho === row.ancho &&
          r.detalle === row.detalle &&
          r.rotar === row.rotar &&
          r.l1 === row.l1 &&
          r.l2 === row.l2 &&
          r.a1 === row.a1 &&
          r.a2 === row.a2
        )
      );
      return uniqueRows;
    });
  }, []);

  const handleSaveToFirestore = async () => {
    try {
      const despiecesCollection = collection(db, 'despieces');
      for (const row of rows) {
        await addDoc(despiecesCollection, row);
      }
      alert('Despieces guardados exitosamente en Firestore.');
    } catch (error) {
      console.error('Error al guardar en Firestore:', error);
      alert('Hubo un error al guardar los despieces.');
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

  const handleKeyDown = useCallback((e, index, field) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Evita el comportamiento predeterminado del Enter
      const fields = ['cant', 'largo', 'ancho', 'detalle', 'rotar', 'l1', 'l2', 'a1', 'a2'];
      const currentIndex = fields.indexOf(field);

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
    } else {
      handleArrowNavigation(e, index, field);
    }
  }, [rows, handleArrowNavigation]);

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
        <button type="submit" className={estilos.botonSubmit}>
          Guardar Despiece
        </button>
      </form>
    </div>
  );
};

export default ModeloDespiece;
