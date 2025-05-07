import React, { useState, useEffect } from 'react';
import styles from './App.module.css';
import Menu from './menu';

function App() {
  const [modoOscuro, setModoOscuro] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (modoOscuro) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [modoOscuro]);

  return (
    <div className={`${styles.App} ${modoOscuro ? styles['modo-oscuro'] : ''}`}>
      <Menu setModoOscuro={setModoOscuro} modoOscuro={modoOscuro} />
      <h1>¡Hola, mundo!</h1>
    </div>
  );
}

export default App;