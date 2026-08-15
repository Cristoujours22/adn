import React from 'react';

const TabsDespiece = ({ 
    despieces, 
    setDespieces, 
    activeDespieceId, 
    setActiveDespieceId, 
    darkMode, 
    createNewDespiece 
}) => {
    return (
        <div style={{ display: 'flex', gap: '5px', marginTop: '20px', overflowX: 'auto', borderBottom: `2px solid ${darkMode ? '#444' : '#ddd'}`, paddingBottom: '5px' }}>
            {(despieces || []).map((desp, idx) => (
                <div 
                    key={desp?.id || `tab_${idx}`}
                    style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        background: activeDespieceId === desp?.id ? (darkMode ? '#3a3f4b' : '#007bff') : (darkMode ? '#2c303a' : '#e9ecef'),
                        color: activeDespieceId === desp?.id ? '#fff' : (darkMode ? '#aaa' : '#333'),
                        borderRadius: '8px 8px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: activeDespieceId === desp?.id ? 'bold' : 'normal',
                        boxShadow: activeDespieceId === desp?.id ? '0 -2px 5px rgba(0,0,0,0.1)' : 'none',
                        border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                        borderBottom: 'none'
                    }}
                    onClick={() => setActiveDespieceId(desp?.id)}
                >
                    <input 
                        type="text" 
                        value={desp?.nombre || `Despiece ${idx + 1}`}
                        onChange={(e) => {
                            const newName = e.target.value;
                            setDespieces(prev => prev.map(d => d.id === desp.id ? { ...d, nombre: newName } : d));
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'inherit',
                            outline: 'none',
                            fontWeight: 'inherit',
                            width: '100px',
                            cursor: activeDespieceId === desp?.id ? 'text' : 'pointer'
                        }}
                        onClick={(e) => { if(activeDespieceId !== desp?.id) e.preventDefault(); }}
                    />
                    {(despieces || []).length > 1 && (
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                const idToRemove = desp?.id;
                                if (window.confirm(`¿Seguro que deseas eliminar la pestaña "${desp?.nombre}"?`)) {
                                    let nextActiveId = activeDespieceId;
                                    
                                    if (activeDespieceId === idToRemove) {
                                        const targetIndex = despieces.findIndex(d => d.id === idToRemove);
                                        const newDespieces = despieces.filter(d => d.id !== idToRemove);
                                        const newActiveIndex = Math.max(0, targetIndex - 1);
                                        nextActiveId = newDespieces[newActiveIndex]?.id || newDespieces[0]?.id;
                                    }
                                    
                                    setDespieces(prev => prev.filter(d => d.id !== idToRemove));
                                    if (nextActiveId !== activeDespieceId) {
                                        setActiveDespieceId(nextActiveId);
                                    }
                                }
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: activeDespieceId === desp?.id ? '#ffcccc' : '#dc3545',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                padding: '0 5px'
                            }}
                            title="Eliminar pestaña"
                        >
                            ×
                        </button>
                    )}
                </div>
            ))}
            <button
                type="button"
                onClick={() => {
                    const newTab = createNewDespiece(`Despiece ${despieces.length + 1}`);
                    setDespieces([...despieces, newTab]);
                    setActiveDespieceId(newTab.id);
                }}
                style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    background: darkMode ? '#28a745' : '#1e7e34',
                    color: '#fff',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    fontWeight: 'bold'
                }}
                title="Agregar nuevo despiece"
            >
                +
            </button>
        </div>
    );
};

export default TabsDespiece;
