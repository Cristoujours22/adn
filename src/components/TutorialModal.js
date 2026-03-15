import React, { useState } from 'react';

const TutorialModal = ({ isOpen, onClose, darkMode }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Bienvenido al Sistema de Despiece",
      content: "Este módulo está diseñado para que trabajes a la velocidad de la luz. Su comportamiento es similar al de Excel, lo que significa que puedes desplazarte por las celdas rápidamente, copiar y pegar datos, y aprovechar atajos de teclado para no depender del ratón.",
      icon: "⚡"
    },
    {
      title: "Navegación Ágil (Estilo Excel)",
      content: "• Mueve el foco entre celdas usando las flechas direccionales (Arriba, Abajo, Izq, Der。\n• Presiona 'Enter' o la inicial de una letra para empezar a escribir sobre una celda al instante.\n• Presiona 'F2' si solo quieres modificar parte del texto existente sin borrar lo anterior.\n• Usa 'Tab' para saltar a la celda de la derecha.",
      icon: "⌨️"
    },
    {
      title: "Múltiples Pestañas",
      content: "Puedes organizar proyectos grandes dividiéndolos en varias pestañas simultáneas (ej. 'Cocina', 'Habitación'). Toca el botón verde '+' junto a las pestañas para crear una nueva pestaña de despiece vacía, manteniendo todo el proyecto en un solo archivo.",
      icon: "📑"
    },
    {
      title: "Agrupación de Módulos",
      content: "Si en la columna 'DETALLE' escribes algo como 'D1-COCINA' o 'D2-34', el sistema detectará que esas piezas pertenecen al mismo módulo. Aparecerá un botón '+' / '-' en el extremo izquierdo de la fila que te permite colapsar todo el grupo para mantener limpia tu pantalla.",
      icon: "📦"
    },
    {
      title: "El Truco Secreto: Renombrado Masivo",
      content: "¿Te equivocaste en el nombre del módulo 'D1-COCINA' y debió ser 'D1-GAVETERO'? ¡No borres todo!\nSolo mantén presionada la tecla 'Ctrl' en tu teclado y haz clic en el botón '+' o '-' de ese módulo. Ingresa el nombre correcto y todas las piezas que lo integraban cambiarán su nombre mágicamente.",
      icon: "🪄"
    },
    {
      title: "Cobros Especiales Automáticos",
      content: "Si agregas palabras clave a tu detalle (ej: 'Servicio de Nariz' o 'SenchaManual'), el sistema automáticamente abrirá una ventana para que coloques la cantidad o la medida exacta y así calcular cobros precisos para tus clientes. Lo verás reflejado en el panel verde derecho.",
      icon: "💰"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        background: darkMode ? '#1e2128' : '#fff',
        color: darkMode ? '#e0e0e0' : '#333',
        width: '500px',
        maxWidth: '90%',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`, paddingBottom: '15px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>{steps[currentStep].icon}</span>
            {steps[currentStep].title}
          </h2>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'none', border: 'none', color: '#888', 
              fontSize: '24px', cursor: 'pointer', padding: 0, lineHeight: 1 
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ minHeight: '130px', fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
          {steps[currentStep].content}
        </div>

        {/* Footer & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
          
          <div style={{ display: 'flex', gap: '5px' }}>
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                style={{ 
                  width: '8px', height: '8px', borderRadius: '50%', 
                  backgroundColor: idx === currentStep ? (darkMode ? '#4CAF50' : '#2196F3') : (darkMode ? '#444' : '#ccc') 
                }} 
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep > 0 && (
              <button 
                onClick={handlePrev}
                style={{
                  padding: '8px 16px', borderRadius: '6px', border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                  background: darkMode ? '#333' : '#f5f5f5', color: darkMode ? '#fff' : '#333', cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                Atrás
              </button>
            )}
            <button 
              onClick={handleNext}
              style={{
                padding: '8px 16px', borderRadius: '6px', border: 'none',
                background: currentStep === steps.length - 1 ? '#4CAF50' : '#2196F3', color: '#fff', cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              {currentStep === steps.length - 1 ? '¡Entendido!' : 'Siguiente'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TutorialModal;
