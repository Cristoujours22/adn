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

  const handleAddRow = useCallback(() => {
    setRows((prevRows) => {
      const newRow = createNewRow();
      return [...prevRows, newRow];
    });
  }, []);

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

  const handleKeyDown = useCallback((e, index, field) => {
    if (e.key === 'Enter') {
      const isLastField = field === 'a2';
      const isLastRow = index === rows.length - 1;

      if (isLastField && isLastRow) {
        e.preventDefault(); // Prevent default form submission behavior
        handleAddRow();
      }
    }
  }, [rows, handleAddRow]);

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

    setRows((prevRows) => {
      if (prevRows.length === 1 && !prevRows[0].cant && !prevRows[0].largo) {
        return newRows;
      }
      return [...prevRows, ...newRows];
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
