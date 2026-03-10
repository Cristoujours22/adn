import React from 'react';
import estilos from '../../App.module.css';

const TablaPiezas = ({
    despieces,
    activeDespieceId,
    handleInputChange,
    handleKeyDown,
    handleRemoveRow,
    handleOpenNarizModal,
    darkMode
}) => {
    return (
        <div className={estilos.tablaDespiece} style={{ marginTop: '0px' }}>
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
                return (
                    <div key={safeRow.id || `row_${index}`} className={estilos.filaDespiece}>
                        <div className={estilos.celdaDespiece}>
                            <input
                                type="number"
                                className={`${estilos.inputCorto} ${estilos.flexibleWidth}`}
                                name={`cant-${index}`}
                                id={`cant-${index}`}
                                value={safeRow.cant || ''}
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
                                value={safeRow.largo || ''}
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
                                value={safeRow.ancho || ''}
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
                                value={safeRow.detalle || ''}
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
                                value={safeRow.rotar || ''}
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
                                value={safeRow.l1 || ''}
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
                                value={safeRow.l2 || ''}
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
                                value={safeRow.a1 || ''}
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
                                value={safeRow.a2 || ''}
                                onChange={(e) => handleInputChange(index, 'a2', e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, index, 'a2')}
                            />
                        </div>
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
