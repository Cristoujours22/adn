import React, { useState } from 'react';
import estilos from '../../App.module.css';
import { FaTrash, FaTools, FaRulerCombined } from 'react-icons/fa';
import { getModuleKey } from '../../utils/moduleDetection';
import { getRowsForSuperGroup } from '../../utils/superGrouping';
import { findServiceMatches, getServiceMatchSpans } from '../../utils/serviceMatching';

const parseHexColor = (color) => {
    if (typeof color !== 'string') return null;

    const normalized = color.trim().replace(/^#/, '');
    const hex = normalized.length === 3
        ? normalized.split('').map((value) => value + value).join('')
        : normalized;

    if (!/^[\da-f]{6}$/i.test(hex)) return null;

    return {
        red: parseInt(hex.slice(0, 2), 16),
        green: parseInt(hex.slice(2, 4), 16),
        blue: parseInt(hex.slice(4, 6), 16)
    };
};

export const getContrastingTextColor = (backgroundColor, fallbackColor = '#666') => {
    const rgb = parseHexColor(backgroundColor);
    if (!rgb) return fallbackColor;

    const toLinearChannel = (channel) => {
        const value = channel / 255;
        return value <= 0.03928
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (0.2126 * toLinearChannel(rgb.red))
        + (0.7152 * toLinearChannel(rgb.green))
        + (0.0722 * toLinearChannel(rgb.blue));
    const blackContrast = (luminance + 0.05) / 0.05;
    const whiteContrast = 1.05 / (luminance + 0.05);

    return whiteContrast > blackContrast ? '#fff' : '#000';
};

const TablaPiezas = ({
    despieces,
    activeDespieceId,
    pieceSearchTerm,
    pieceSearchLargo,
    pieceSearchAncho,
    pieceSearchType,
    handleInputChange,
    handleKeyDown,
    handleRemoveRow,
    handleRowClick,
    rowSelection,
    handleOpenCobroModal,
    darkMode,
    activeCell,
    setActiveCell,
    isEditing,
    setIsEditing,
    dragSelection,
    setDragSelection,
    handleCellClick,
    handleCellDoubleClick,
    handleDragFill,
    selection,
    showModuleColors,
    services,
    modules = [],
    onRenameModule,
    moduleDetectionConfig,
    focusReturnRef,
    superGroups = [],
    onUngroupSuperGroup
}) => {
    // End dragging when mouse is released anywhere on the table
    const handleMouseUp = () => {
        if (dragSelection && dragSelection.startIndex !== null) {
            handleDragFill(dragSelection.startIndex, dragSelection.endIndex, dragSelection.startField, dragSelection.endField, dragSelection.value);
            setDragSelection(null);
        }
    };

    const [collapsedModules, setCollapsedModules] = useState({});
    const [collapsedSuperGroups, setCollapsedSuperGroups] = useState({});
    
    const moduleColors = [
        { bg: '#4285f4', border: '#3367d6' },   // Azul vivo
        { bg: '#ea4335', border: '#d33426' },   // Rojo vivo
        { bg: '#fbbc04', border: '#e5a703' },   // Amarillo vivo
        { bg: '#a020f0', border: '#8a1ce0' },   // Morado vivo
        { bg: '#00bcd4', border: '#00a5bb' },   // Cyan vivo
        { bg: '#ff7043', border: '#e55a2b' },   // Naranja vivo
        { bg: '#795548', border: '#5d4037' },   // Marrón vivo
        { bg: '#607d8b', border: '#4a5b63' },   // Gris azulado vivo
        { bg: '#e91e63', border: '#c2185b' },   // Rosa vivo
        { bg: '#9c27b0', border: '#7b1fa2' },  // Púrpura vivo
        { bg: '#009688', border: '#00796b' },   // Verde azulado vivo
        { bg: '#ff5722', border: '#e64a19' },  // Naranja intenso vivo
    ];
    
    // Color específico para puertas y paneles
    const doorPanelColor = { bg: '#4caf50', border: '#388e3c' }; // Verde vivo
    
    // Función para verificar si es puerta o panel
    const isDoorOrPanel = (detalle) => {
        if (!detalle) return false;
        const d = detalle.toUpperCase();
        return d.includes('PUERTA') || d.includes('PANEL') || d.includes('PTA');
    };
    
    const getModuleColorIndex = (moduleName) => {
        if (!moduleName) return -1;
        // Usar hash del nombre completo para que cada módulo único tenga su propio color
        // Ej: D1-0, D1-1512, D2-34 serán todos diferentes
        const hash = moduleName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return hash % moduleColors.length;
    };
    
    const toggleModule = (moduleName) => {
        setCollapsedModules(prev => ({ ...prev, [moduleName]: !prev[moduleName] }));
    };

    const getModuleName = (detalle) => getModuleKey(detalle, moduleDetectionConfig);
    const activeRows = (despieces.find(d => d.id === activeDespieceId) || despieces[0])?.filas || [];
    const isSuperGroupForModule = (group, moduleName) => (
        Boolean(group && moduleName && Array.isArray(group.moduleKeys) && group.moduleKeys.includes(moduleName))
    );
    const getSuperGroupLabel = (group) => group?.label || group?.moduleKeys?.join(' + ') || 'sin nombre';
    const getSuperGroupKey = (group) => group?.id || group?.groupId || group?.key || getSuperGroupLabel(group);
    const renderedSuperGroups = new Set();

    const getModule = (name) => modules.find((module) => String(module.legacyToken || '').toUpperCase() === String(name || '').toUpperCase());

    return (
        <div className={estilos.tablaDespieceViewport}>
            <div
                ref={focusReturnRef}
                className={estilos.tablaDespiece}
                style={{ marginTop: '0px' }}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                tabIndex="-1"
            >
            <div className={estilos.filaDespiece} style={{
                backgroundColor: darkMode ? '#222' : '#f4f6f8',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                paddingBottom: '5px'
            }}>
                <div className={estilos.celdaTitulo} style={{ padding: '0 4px', fontSize: '10px' }}>#</div>
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
            {((despieces.find(d => d.id === activeDespieceId) || despieces[0])?.filas || []).map((row, index, currentFilas) => {
                const safeRow = row || {};

                if (pieceSearchType === 'detalle') {
                    if (pieceSearchTerm) {
                        const term = pieceSearchTerm.toLowerCase();
                        if (!safeRow.detalle || !safeRow.detalle.toLowerCase().includes(term)) return null;
                    }
                } else if (pieceSearchType === 'medida') {
                    const largoStr = (safeRow.largo || '').toString();
                    const anchoStr = (safeRow.ancho || '').toString();
                    
                    if (pieceSearchLargo && !largoStr.includes(pieceSearchLargo)) return null;
                    if (pieceSearchAncho && !anchoStr.includes(pieceSearchAncho)) return null;
                }

                const currentModule = getModuleName(safeRow.detalle);
                let isFirstOfModule = false;
                
                // Deshabilitar agrupación visual si el usuario está filtrando piezas para evitar saltos o huecos raros
                const isSearching = (pieceSearchType === 'detalle' && pieceSearchTerm) || 
                                    (pieceSearchType === 'medida' && (pieceSearchLargo || pieceSearchAncho));

                if (!isSearching && currentModule) {
                    const prevRow = index > 0 ? currentFilas[index - 1] : null;
                    const prevModule = getModuleName(prevRow?.detalle);
                    isFirstOfModule = currentModule !== prevModule;
                }

                const currentSuperGroup = !isSearching
                    ? superGroups.find((group) => isSuperGroupForModule(group, currentModule))
                    : null;
                const superGroupKey = currentSuperGroup ? getSuperGroupKey(currentSuperGroup) : null;
                const isFirstOfSuperGroup = Boolean(
                    currentSuperGroup && !renderedSuperGroups.has(superGroupKey)
                );
                if (isFirstOfSuperGroup) renderedSuperGroups.add(superGroupKey);
                const superGroupLabel = currentSuperGroup ? getSuperGroupLabel(currentSuperGroup) : '';
                const superGroupModuleCount = currentSuperGroup?.moduleKeys?.length || 0;
                const superGroupRowCount = currentSuperGroup
                    ? getRowsForSuperGroup(activeRows, currentSuperGroup, moduleDetectionConfig).length
                    : 0;
                const isSuperGroupCollapsed = Boolean(
                    currentSuperGroup && collapsedSuperGroups[superGroupKey]
                );
                const isCollapsed = !isSearching && currentModule && collapsedModules[currentModule];
                const superGroupHeader = isFirstOfSuperGroup ? (
                    <div
                        className={estilos.superGroupHeader}
                        role="row"
                        aria-label={`Supergrupo ${superGroupLabel}`}
                    >
                        <div className={estilos.superGroupHeaderCell} role="gridcell" aria-colspan="11">
                            <div>
                                <h4>{superGroupLabel}</h4>
                                <span>
                                    {superGroupModuleCount} {superGroupModuleCount === 1 ? 'módulo' : 'módulos'}
                                    {' · '}
                                    {superGroupRowCount} {superGroupRowCount === 1 ? 'fila' : 'filas'}
                                </span>
                            </div>
                            <div className={estilos.superGroupHeaderActions}>
                                <button
                                    type="button"
                                    aria-expanded={!isSuperGroupCollapsed}
                                    aria-label={`${isSuperGroupCollapsed ? 'Expandir' : 'Colapsar'} supergrupo ${superGroupLabel}`}
                                    onClick={() => setCollapsedSuperGroups((previous) => ({
                                        ...previous,
                                        [superGroupKey]: !previous[superGroupKey]
                                    }))}
                                >
                                    {isSuperGroupCollapsed ? '+' : '−'}
                                </button>
                                {onUngroupSuperGroup && (
                                    <button
                                        type="button"
                                        aria-label={`Desagrupar supergrupo ${superGroupLabel}`}
                                        onClick={() => onUngroupSuperGroup(superGroupKey)}
                                    >
                                        Desagrupar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null;

                // La contracción de un supergrupo sólo oculta su presentación; las filas siguen en el modelo.
                if (isSuperGroupCollapsed) {
                    return <React.Fragment key={safeRow.id || `row_${index}`}>{superGroupHeader}</React.Fragment>;
                }

                // Si la fila pertenece a un módulo que está colapsado y NO es la primera fila de ese módulo, se oculta
                if (isCollapsed && !isFirstOfModule) {
                    return null;
                }
                
                // Obtener color del módulo para esta fila (solo si showModuleColors está activado)
                let moduleColor = null;
                if (showModuleColors) {
                    const moduleColorIndex = getModuleColorIndex(currentModule);
                    moduleColor = moduleColorIndex >= 0 ? moduleColors[moduleColorIndex] : null;
                    
                    // Si es puerta o panel, usar color verde específico
                    if (isDoorOrPanel(safeRow.detalle)) {
                        moduleColor = doorPanelColor;
                    }
                }

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
                    
                    let isSelected = false;
                    if (selection) {
                        const startIdx = Math.min(selection.start.index, selection.end.index);
                        const endIdx = Math.max(selection.start.index, selection.end.index);
                        const fields = ['cant', 'largo', 'ancho', 'detalle', 'rotar', 'l1', 'l2', 'a1', 'a2'];
                        const startFldIdx = fields.indexOf(selection.start.field);
                        const endFldIdx = fields.indexOf(selection.end.field);
                        const minFldIdx = Math.min(startFldIdx, endFldIdx);
                        const maxFldIdx = Math.max(startFldIdx, endFldIdx);
                        const currFldIdx = fields.indexOf(field);

                        isSelected = index >= startIdx && index <= endIdx && currFldIdx >= minFldIdx && currFldIdx <= maxFldIdx;
                    }

                    // Validación básica
                    const value = safeRow[field] || '';
                    const isRequired = ['cant', 'largo', 'ancho', 'detalle'].includes(field);
                    const isNumeric = ['cant', 'largo', 'ancho'].includes(field);
                    const isInvalid = (isRequired && value === '') || (isNumeric && value !== '' && isNaN(value));
                    
                    const cellStyle = {
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        boxSizing: 'border-box',
                    };

                    const dataFields = ['cant', 'largo', 'ancho', 'detalle', 'rotar', 'l1', 'l2', 'a1', 'a2'];
                    const isDataCell = dataFields.includes(field);
                    const moduleBgColor = (isDataCell && moduleColor) ? moduleColor.bg : undefined;

                    const inputStyle = {
                        width: '100%',
                        height: '100%',
                        outline: isActive ? `2px solid #1a73e8` : (isSelected ? `1px solid rgba(26, 115, 232, 0.5)` : 'none'),
                        outlineOffset: '-2px',
                        cursor: isEditing && isActive ? 'text' : 'cell',
                        caretColor: (isActive && isEditing) ? 'auto' : 'transparent',
                        backgroundColor: moduleBgColor || (isDragTarget ? (darkMode ? '#2c3e50' : '#d2e3fc') : 
                                         (isSelected && !isActive ? (darkMode ? '#2c313a' : '#e8f0fe') : 
                                         (isActive && !isEditing ? (darkMode ? '#3a404d' : '#e8f0fe') : 
                                         (isInvalid ? (darkMode ? '#4d2a2a' : '#fff0f0') : undefined)))),
                        color: (isActive && !isEditing && darkMode) || isDragTarget || (isSelected && darkMode) ? '#fff' : undefined,
                        border: isInvalid ? `1px solid ${darkMode ? '#ff6b6b' : '#dc3545'}` : undefined
                    };

                    return (
                        <div className={estilos.celdaDespiece} key={field}>
                             <div style={cellStyle}
                                 onMouseEnter={() => {
                                     if (dragSelection) setDragSelection(prev => ({ ...prev, endIndex: index, endField: field }));
                                 }}
                            >
                                {field === 'cant' && isFirstOfModule && (
                                    <button
                                        type="button"
                                        tabIndex="-1"
                                        onClick={(e) => { e.stopPropagation(); toggleModule(currentModule); }}
                                        style={{
                                            position: 'absolute',
                                            left: '-18px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: darkMode ? '#4a4a4a' : '#ddd',
                                            color: darkMode ? '#fff' : '#000',
                                            border: `1px solid ${darkMode ? '#666' : '#ccc'}`,
                                            borderRadius: '4px',
                                            width: '16px',
                                            height: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            lineHeight: '1',
                                            zIndex: 5
                                        }}
                                        title={isCollapsed ? "Expandir Módulo" : "Colapsar Módulo"}
                                    >
                                        {isCollapsed ? '+' : '-'}
                                    </button>
                                )}
                                <input
                                    type={field === 'cant' ? 'number' : 'text'}
                                    className={`${classNameExtras}`}
                                    name={`${field}-${index}`}
                                    id={`${field}-${index}`}
                                    value={safeRow[field] || ''}
                                    onChange={(e) => handleInputChange(index, field, e.target.value)}
                                    onClick={(e) => handleCellClick(index, field, e)}
                                    onDoubleClick={() => handleCellDoubleClick(index, field)}
                                    onKeyDown={(e) => handleKeyDown(e, index, field)}
                                    readOnly={!isActive || !isEditing} // Strict readOnly when not editing prevents caret showing
                                    style={inputStyle}
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
                    <React.Fragment key={safeRow.id || `row_${index}`}>
                        {superGroupHeader}
                        {showModuleColors && currentModule && isFirstOfModule && !currentSuperGroup && (
                            <div className={`${estilos.filaDespiece} ${estilos.moduleLabelRow}`}>
                                <div className={estilos.moduleLabelCell}>
                                    <div
                                        style={{
                                            minWidth: '120px',
                                            maxWidth: '220px',
                                            padding: '8px 18px',
                                            borderRadius: '999px',
                                            background: moduleColor ? moduleColor.bg : (darkMode ? '#2c3e50' : '#e9ecef'),
                                            border: `1px solid ${moduleColor ? moduleColor.border : (darkMode ? '#4a5568' : '#ced4da')}`,
                                            color: darkMode ? '#fff' : '#212529',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            letterSpacing: '0.8px',
                                            textTransform: 'uppercase',
                                            textAlign: 'center',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onDoubleClick={(event) => onRenameModule?.(getModule(currentModule), event)}
                                            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onRenameModule?.(getModule(currentModule), event); }}
                                            style={{
                                                all: 'unset',
                                                display: 'block',
                                                width: '100%',
                                                cursor: 'pointer'
                                            }}
                                            aria-label={`Rename module ${getModule(currentModule)?.displayName || currentModule}`}
                                            title="Double-click to rename module"
                                        >
                                            {getModule(currentModule)?.displayName || currentModule}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
<div 
                            className={`${estilos.filaDespiece} ${estilos.moduleRow}`}
                            style={{ 
                                position: 'relative',
                                '--module-color': moduleColor ? moduleColor.bg : 'transparent'
                            }}
                        >
                        {/* Row number column - clickable for Excel-style row selection */}
                        <div 
                            className={estilos.celdaDespiece}
                            onClick={(e) => handleRowClick?.(index, e)}
                            style={{ 
                                padding: '0 4px',
                                cursor: 'pointer',
                                backgroundColor: rowSelection?.has(index) ? '#1a73e8' : undefined,
                                color: rowSelection?.has(index)
                                    ? '#fff'
                                    : getContrastingTextColor(moduleColor?.bg, darkMode ? '#888' : '#666'),
                                fontSize: '11px',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                userSelect: 'none',
                                verticalAlign: 'middle',
                                borderRight: `1px solid ${darkMode ? '#444' : '#ddd'}`
                            }}
                            title="Click para seleccionar fila"
                        >
                            {index + 1}
                        </div>
                        {renderCell('cant', `${estilos.inputCorto} ${estilos.flexibleWidth}`)}
                        {renderCell('largo', estilos.inputCorto)}
                        {renderCell('ancho', estilos.inputCorto)}
                        {renderCell('detalle', estilos.inputLargo)}
                        {renderCell('rotar', estilos.inputCorto)}
                        {renderCell('l1', estilos.inputCorto)}
                        {renderCell('l2', estilos.inputCorto)}
                        {renderCell('a1', estilos.inputCorto)}
                        {renderCell('a2', estilos.inputCorto)}
                        <div className={`${estilos.celdaDespiece} ${estilos.moduleActionsCell}`}>
                            <div style={{ width: '100%', height: '100%', position: 'relative', boxSizing: 'border-box', display: 'flex', flexDirection: 'row', gap: '8px', justifyContent: 'center', alignItems: 'center', padding: '0 5px' }}>
                                {(() => {
                                const actions = [];
                                const matchResult = findServiceMatches(safeRow.detalle || '', services || []);
                                const hasOwnedSpan = (service) => Boolean(
                                    service && getServiceMatchSpans(matchResult, service).length > 0
                                );
                                const isEnchapeService = (service) => {
                                    const nomenclatura = service?.nomenclatura?.toUpperCase() || '';
                                    const nombre = service?.nombreOriginal?.toLowerCase() || '';
                                    return nomenclatura === 'SENCHAMANUAL'
                                        || nombre.includes('enchape manual')
                                        || nombre.includes('enchape a pieza especial');
                                };
                                const isNarizService = (service) => {
                                    const nomenclatura = service?.nomenclatura?.toUpperCase() || '';
                                    const nombre = service?.nombreOriginal?.toLowerCase() || '';
                                    return nomenclatura === 'SRNAR000'
                                        || (nombre.includes('nariz') && nomenclatura !== 'ENGNA');
                                };
                                const isEngnaService = (service) => {
                                    const nomenclatura = service?.nomenclatura?.toUpperCase() || '';
                                    const nombre = service?.nombreOriginal?.toLowerCase() || '';
                                    return nomenclatura === 'ENGNA' || nombre.includes('engorde');
                                };

                                const enchapeService = services?.find(isEnchapeService);
                                const narizService = services?.find(isNarizService);
                                const engnaService = services?.find(isEngnaService);
                                const circuloService = services?.find((service) => {
                                    const nomenclatura = service?.nomenclatura?.toUpperCase() || '';
                                    const nombre = service?.nombreOriginal?.toLowerCase() || '';
                                    return nomenclatura === 'CSCIRCULO' || nombre.includes('circulo');
                                });

                                if (hasOwnedSpan(enchapeService) && !hasOwnedSpan(circuloService)) {
                                    actions.push('Enchape');
                                }
                                if (hasOwnedSpan(narizService)) {
                                    actions.push('Nariz');
                                }
                                if (hasOwnedSpan(engnaService)) {
                                    actions.push('EngNA');
                                }

                                return actions.map((labelAction) => {
                                    const isEnchape = labelAction === 'Enchape';
                                    const isEngna = labelAction === 'EngNA';
                                    const targetField = isEnchape ? 'enchapeCobro' : (isEngna ? 'engnaCobro' : 'narizCobro');
                                    const cobroValue = safeRow[targetField];
                                    
                                    const IconToUse = isEnchape ? FaTools : FaRulerCombined;
                                    // EngNA usa color turquesa distintivo
                                    const defaultBg = isEnchape ? '#e6a800' : (isEngna ? '#20c997' : '#17a2b8');
                                    const bgHover = isEnchape ? '#d39e00' : (isEngna ? '#1baa80' : '#138496');
                                    const txtColor = cobroValue ? '#fff' : (isEnchape ? '#212529' : '#fff');

                                    return (
                                        <button
                                            key={labelAction}
                                            onClick={() => handleOpenCobroModal && handleOpenCobroModal(index, labelAction, targetField)}
                                            className={estilos.botonSubmit}
                                            style={{ width: 'auto', minWidth: 'unset', margin: 0, padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '4px', background: cobroValue ? '#28a745' : defaultBg, color: txtColor, border: 'none', borderRadius: '4px', cursor: 'pointer', boxSizing: 'border-box', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', transition: 'all 0.1s' }}
                                            type="button"
                                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; if(!cobroValue){ e.currentTarget.style.background = bgHover; } }}
                                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; if(!cobroValue){ e.currentTarget.style.background = defaultBg; } }}
                                            title={cobroValue ? `Cobrar ${labelAction} (${cobroValue})` : `Cobrar ${labelAction}`}
                                        >
                                            <IconToUse size={12} />
                                            {cobroValue && <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{cobroValue}</span>}
                                        </button>
                                    );
                                });
                            })()}
                            {currentFilas.length > 1 && (
                                <button
                                    onClick={() => handleRemoveRow(index)}
                                    className={estilos.botonEliminar}
                                    style={{ width: 'auto', minWidth: 'unset', margin: 0, padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '4px', cursor: 'pointer', boxSizing: 'border-box', transition: 'all 0.2s' }}
                                    type="button"
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#dc3545'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#dc3545'; }}
                                    title="Eliminar fila"
                                >
                                    <FaTrash size={12} />
                                </button>
                            )}
                            </div>
                        </div>
                    </div>
                    </React.Fragment>
                );
            })}
            </div>
        </div>
    );
};

export default TablaPiezas;
