import React from 'react';
import estilos from '../../App.module.css';

const TablaPiezas = ({
    despieces,
    activeDespieceId,
    handleInputChange,
    handleKeyDown,
    handleRemoveRow,
    handleOpenNarizModal,
    darkMode,
    activeCell,
    setActiveCell,
    isEditing,
    setIsEditing,
    dragSelection,
    setDragSelection,
    handleCellClick,
    handleCellDoubleClick,
    handleDragFill
}) => {
    // End dragging when mouse is released anywhere on the table
    const handleMouseUp = () => {
        if (dragSelection && dragSelection.startIndex !== null) {
            handleDragFill(dragSelection.startIndex, dragSelection.endIndex, dragSelection.startField, dragSelection.endField, dragSelection.value);
            setDragSelection(null);
        }
    };

    return (
        <div className={estilos.tablaDespiece} style={{ marginTop: '0px' }} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className={estilos.filaDespiece} style={{
                position: 'sticky',
                top: '49px', // Ajustado a la altura de la topBar
                zIndex: 10,
                backgroundColor: darkMode ? '#222' : '#f4f6f8',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                paddingBottom: '5px'
            }}>
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
            {((despieces.find(d => d.id === activeDespieceId) || despieces[0])?.filas || []).map((row, index) => {
                const safeRow = row || {};

                // Helper to render individual cells with Excel-like behavior
                const renderCell = (field, classNameExtras = '') => {
                    const isActive = activeCell?.index === index && activeCell?.field === field;
                    
                    const columnGroups = {
                        l1: 'edges', l2: 'edges', a1: 'edges', a2: 'edges',
                        largo: 'dim', ancho: 'dim',
                        cant: 'cant', detalle: 'detalle', rotar: 'rotar'
                    };
                    
                    let isDragTarget = false;
                    if (dragSelection && dragSelection.startIndex !== null) {
                        const startGrp = columnGroups[dragSelection.startField];
                        if (startGrp === 'cant' || startGrp === 'detalle' || startGrp === 'rotar') {
                            isDragTarget = field === dragSelection.startField && 
                                           index >= Math.min(dragSelection.startIndex, dragSelection.endIndex) && 
                                           index <= Math.max(dragSelection.startIndex, dragSelection.endIndex);
                        } else {
                            const fields = ['cant', 'largo', 'ancho', 'detalle', 'rotar', 'l1', 'l2', 'a1', 'a2'];
                            const i1 = fields.indexOf(dragSelection.startField);
                            const i2 = fields.indexOf(dragSelection.endField);
                            if (i1 !== -1 && i2 !== -1) {
                                const startF = Math.min(i1, i2);
                                const endF = Math.max(i1, i2);
                                const currF = fields.indexOf(field);
                                
                                isDragTarget = columnGroups[field] === startGrp && 
                                            currF >= startF && currF <= endF &&
                                            index >= Math.min(dragSelection.startIndex, dragSelection.endIndex) && 
                                            index <= Math.max(dragSelection.startIndex, dragSelection.endIndex);
                            }
                        }
                    }
                    
                    const cellStyle = {
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        boxSizing: 'border-box',
                    };

                    const inputStyle = {
                        width: '100%',
                        height: '100%',
                        outline: isActive ? `2px solid #1a73e8` : 'none',
                        outlineOffset: '-2px',
                        cursor: isEditing && isActive ? 'text' : 'cell',
                        backgroundColor: isDragTarget ? (darkMode ? '#2c3e50' : '#d2e3fc') : 
                                         (isActive && !isEditing ? (darkMode ? '#3a404d' : '#e8f0fe') : undefined),
                        color: (isActive && !isEditing && darkMode) || isDragTarget ? '#fff' : undefined
                    };

                    return (
                        <div className={estilos.celdaDespiece} key={field}>
                             <div style={cellStyle}
                                 onMouseEnter={() => {
                                     if (dragSelection) setDragSelection(prev => ({ ...prev, endIndex: index, endField: field }));
                                 }}
                            >
                                <input
                                    type={field === 'cant' ? 'number' : 'text'}
                                    className={`${classNameExtras}`}
                                    name={`${field}-${index}`}
                                    id={`${field}-${index}`}
                                    value={safeRow[field] || ''}
                                    onChange={(e) => handleInputChange(index, field, e.target.value)}
                                    onClick={() => handleCellClick(index, field)}
                                    onDoubleClick={() => handleCellDoubleClick(index, field)}
                                    onKeyDown={(e) => handleKeyDown(e, index, field)}
                                    readOnly={isActive && !isEditing && document.activeElement !== document.getElementById(`${field}-${index}`)} // Prevent standard text selection when not editing, but keep focusability
                                    style={inputStyle}
                                    required={['cant', 'largo', 'ancho', 'detalle'].includes(field)}
                                />
                                {isActive && !isEditing && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            right: '-4px',
                                            bottom: '-4px',
                                            width: '8px',
                                            height: '8px',
                                            backgroundColor: '#1a73e8',
                                            cursor: 'crosshair',
                                            zIndex: 2,
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDragSelection({ startIndex: index, endIndex: index, startField: field, endField: field, value: safeRow[field] });
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    );
                };

                return (
                    <div key={safeRow.id || `row_${index}`} className={estilos.filaDespiece}>
                        {renderCell('cant', `${estilos.inputCorto} ${estilos.flexibleWidth}`)}
                        {renderCell('largo', estilos.inputCorto)}
                        {renderCell('ancho', estilos.inputCorto)}
                        {renderCell('detalle', estilos.inputLargo)}
                        {renderCell('rotar', estilos.inputCorto)}
                        {renderCell('l1', estilos.inputCorto)}
                        {renderCell('l2', estilos.inputCorto)}
                        {renderCell('a1', estilos.inputCorto)}
                        {renderCell('a2', estilos.inputCorto)}
                        <div className={estilos.celdaDespiece} style={{ display: 'flex', flexDirection: 'column', gap: '5px', justifyContent: 'center', alignItems: 'center', padding: '0 5px' }}>
                            {(() => {
                                const detLower = safeRow.detalle?.toLowerCase() || '';
                                let labelAction = '';
                                if ((detLower.includes('senchamanual') || detLower.includes('enchape manual')) && !detLower.includes('circulo')) labelAction = 'Enchape';
                                else if (detLower.includes('nar')) labelAction = 'Nariz';

                                if (!labelAction) return null;

                                return (
                                    <button
                                        onClick={() => handleOpenNarizModal && handleOpenNarizModal(index, labelAction)}
                                        className={estilos.botonSubmit}
                                        style={{ margin: 0, padding: '4px', fontSize: safeRow.narizCobro ? '10px' : '11px', background: safeRow.narizCobro ? '#28a745' : '#e6a800', color: safeRow.narizCobro ? '#fff' : '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', width: '100%', minWidth: '55px', maxWidth: '80px', boxSizing: 'border-box' }}
                                        type="button"
                                        title={`Cobrar ${labelAction}`}
                                    >
                                        {safeRow.narizCobro ? `${labelAction} (${safeRow.narizCobro})` : labelAction}
                                    </button>
                                );
                            })()}
                            {((despieces.find(d => d.id === activeDespieceId) || despieces[0])?.filas || []).length > 1 && (
                                <button
                                    onClick={() => handleRemoveRow(index)}
                                    className={estilos.botonEliminar}
                                    style={{ margin: 0, padding: '4px', width: '100%', minWidth: '55px', maxWidth: '80px', borderRadius: '4px', boxSizing: 'border-box' }}
                                    type="button"
                                >
                                    ✖
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TablaPiezas;
