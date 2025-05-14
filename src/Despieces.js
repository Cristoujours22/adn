import React, { useState, useEffect } from 'react';
import estilos from './App.module.css';

const Despieces = () => {
  const [despieces, setDespieces] = useState([]);

  useEffect(() => {
    // Simulación de datos de despieces guardados
    const despiecesGuardados = [
      { id: 1, nombre: 'Despiece 1', descripcion: 'Descripción del despiece 1' },
      { id: 2, nombre: 'Despiece 2', descripcion: 'Descripción del despiece 2' },
      { id: 3, nombre: 'Despiece 3', descripcion: 'Descripción del despiece 3' },
    ];
    setDespieces(despiecesGuardados);
  }, []);

  const agregarDespiece = () => {
    const nuevoDespiece = {
      id: despieces.length + 1,
      nombre: `Despiece ${despieces.length + 1}`,
      descripcion: `Descripción del despiece ${despieces.length + 1}`,
    };
    setDespieces([...despieces, nuevoDespiece]);
  };

  return (
    <div className={estilos.despiecesContainer}>
      <h2>Despieces Guardados</h2>
      <button className={estilos.botonAgregar} onClick={agregarDespiece}>
        Agregar Nuevo Despiece
      </button>
      <ul className={estilos.despiecesList}>
        {despieces.map((despiece) => (
          <li key={despiece.id} className={estilos.despieceItem}>
            <h3>{despiece.nombre}</h3>
            <p>{despiece.descripcion}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Despieces;