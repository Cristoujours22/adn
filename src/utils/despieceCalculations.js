import {
    findServiceMatches,
    getCanonicalServiceIdentity,
    getServiceMatchSpans
} from './serviceMatching';

/**
 * Utilidad pura para calcular los totales de piezas y ocurrencias de servicios.
 * La detección de nomenclaturas se resuelve una sola vez por fila para que
 * todos los servicios compartan la misma propiedad de spans.
 *
 * @param {Array} despieces Array con los objetos de despieces (pestañas y sus filas)
 * @param {Array} services Lista de servicios disponibles con sus reglas de tipoCobro
 * @returns {Object} { totalPieces: number, serviceCounts: Object }
 */

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const servicePattern = (service) => [service?.nombreOriginal, service?.nomenclatura, ...(service?.aliases || [])]
    .filter(Boolean)
    .map((value) => escapeRegExp(String(value).trim()))
    .sort((a, b) => b.length - a.length)
    .join('|');

const countServiceMatches = (detail, service) => {
    const pattern = servicePattern(service);
    if (!pattern) return 0;
    const matches = String(detail || '').match(new RegExp(`(?<![a-z0-9])(?:${pattern})(?![a-z0-9])`, 'gi')) || [];
    const quantities = String(detail || '').match(new RegExp(`(?:\\d+)\\s*(?:L)?\\s*(?:${pattern})`, 'gi')) || [];
    if (!quantities.length) return matches.length;
    return quantities.reduce((total, value) => total + (parseInt(value, 10) || 1), 0);
};

export const detectServiceOccurrences = (filas = [], services = [], selectedServiceId) => {
    if (!filas.length) return { status: 'empty', rowIds: [], count: 0 };
    if (!services.length) return { status: 'empty', rowIds: [], count: 0 };
    const matches = services.flatMap((service) => filas.flatMap((row) => {
        const count = countServiceMatches(row?.detalle, service);
        return count ? [{ service, rowId: row.id, count }] : [];
    }));
    if (!matches.length) {
        const hasRejectedSubstring = filas.some((row) => services.some((service) => {
            const terms = [service?.nombreOriginal, service?.nomenclatura, ...(service?.aliases || [])].filter(Boolean);
            return terms.some((term) => String(row?.detalle || '').toLowerCase().includes(String(term).toLowerCase()));
        }));
        return { status: hasRejectedSubstring ? 'empty' : 'unresolved', rowIds: [], count: 0 };
    }
    const serviceKey = (match) => match.service.serviceId || match.service.nomenclatura;
    const selectedMatches = selectedServiceId
        ? matches.filter((match) => serviceKey(match) === selectedServiceId && !matches.some((other) => other.rowId === match.rowId && serviceKey(other) !== selectedServiceId))
        : matches;
    const byService = new Map();
    selectedMatches.forEach((match) => byService.set(serviceKey(match), match));
    if (byService.size !== 1) return { status: 'unresolved', rowIds: [], count: 0 };
    const match = [...byService.values()][0];
    return {
        status: 'valid',
        serviceId: serviceKey(match),
        rowIds: selectedMatches.filter((item) => serviceKey(item) === serviceKey(match)).map((item) => item.rowId),
        count: selectedMatches.filter((item) => serviceKey(item) === serviceKey(match)).reduce((total, item) => total + item.count, 0)
    };
};

export const applyValidatedService = (filas = [], result = {}) => result.status !== 'valid'
    ? filas
    : filas.map((row) => result.rowIds.includes(row.id) ? { ...row, serviceId: result.serviceId } : row);

export const getServiceSelectionAlert = ({ label = 'selected service' } = {}) => `Service "${label}" could not be resolved. Review the wording or select a canonical service before accepting.`;

export const calculateCanonicalServiceTotals = (despieces = [], services = []) => {
    const legacyTotals = calcularTotalesDespiece(despieces, services);
    const serviceCounts = Object.fromEntries(services.map((service) => [service.serviceId || service.nomenclatura, legacyTotals.serviceCounts[service.nomenclatura] || 0]));
    return { totalPieces: legacyTotals.totalPieces, serviceCounts };
};

const normalizeCantoValue = (value) => {
    if (value === true) return '1';
    if (value === false || value == null || value === '') return '';
    const stringValue = String(value);
    return /^[1-8]$/.test(stringValue) ? stringValue : '';
};

const findBestMatchingRule = (detalle, reglasPersonalizadas) => {
    const detalleNormalizado = (detalle || '').trim().toUpperCase();
    if (!detalleNormalizado) return null;

    const reglasNormalizadas = reglasPersonalizadas
        .map((regla) => ({
            ...regla,
            tipoNormalizado: (regla.tipo || '').trim().toUpperCase()
        }))
        .filter((regla) => regla.tipoNormalizado);

    const exactMatch = reglasNormalizadas.find((regla) => detalleNormalizado === regla.tipoNormalizado);
    if (exactMatch) return exactMatch;

    const partialMatches = reglasNormalizadas
        .filter((regla) => detalleNormalizado.includes(regla.tipoNormalizado))
        .sort((a, b) => b.tipoNormalizado.length - a.tipoNormalizado.length);

    return partialMatches[0] || null;
};

const getOwnedMatches = (matchResult, service) => (
    getServiceMatchSpans(matchResult, getCanonicalServiceIdentity(service))
);

const getMentionQuantity = (matches) => matches.reduce(
    (total, match) => total + (match.quantity || 1),
    0
);

const hasExplicitQuantity = (matches) => matches.some((match) => match.hasExplicitQuantity);

const getAdjacentDecimalQuantity = (detail, match) => {
    const before = detail.slice(0, match.start);
    const after = detail.slice(match.end);
    const beforeMatch = before.match(/(?:^|[^0-9])(\d+(?:\.\d+)?)\s*[lL]?\s*$/);
    const afterMatch = after.match(/^\s*(?:x\s*)?(\d+(?:\.\d+)?)(?:\s*[lL])?(?:\b|$)/);
    const value = beforeMatch ? beforeMatch[1] : afterMatch ? afterMatch[1] : '';
    return value ? parseFloat(value) || 0 : 0;
};

const getServiceKind = (service) => {
    const identity = getCanonicalServiceIdentity(service).toUpperCase();
    const name = String(service?.nombreOriginal || '').toLowerCase();
    return {
        isCalado: identity === 'CALADO' || name.includes('calado'),
        isCurva: identity === 'CSCURVA1' || name === 'curva',
        isNariz: identity === 'SRNAR000'
            || (name.includes('nariz') && identity !== 'ENGNA' && !name.includes('engorde'))
            || (identity === 'NAR' && !name.includes('engorde')),
        isSenchaManual: identity === 'SENCHAMANUAL'
            || name.includes('enchape manual')
            || name.includes('enchape a pieza especial'),
        isPerbis: identity === 'PERBIS' || identity === 'SERPERBIS' || name.includes('perbis'),
        isSanduche: name.includes('sanduche') || name.includes('clavillo') || name.includes('sandu'),
        isRanuraFo: identity === 'CSRANUFO' || name.includes('ranurafo'),
        isEngna: identity === 'ENGNA' || name.includes('engorde')
    };
};

const getMetricForService = (service, row) => {
    const largo = parseFloat(row.largo) || 0;
    const ancho = parseFloat(row.ancho) || 0;
    switch (service.tipoCobro) {
        case 'ml_largo': return largo / 1000;
        case 'ml_ancho': return ancho / 1000;
        case 'ml_largo_ancho': return (largo + ancho) / 1000;
        case 'ml_perimetro': return ((largo * 2) + (ancho * 2)) / 1000;
        case 'm2': return (largo / 1000) * (ancho / 1000);
        case 'escala_60': return Math.ceil(Math.max(largo, ancho) / 600) || 1;
        case 'unidad':
        default: return 1;
    }
};

const calculateServiceRowTotal = (service, row, detail, matchResult) => {
    const matches = getOwnedMatches(matchResult, service);
    if (matches.length === 0) return 0;

    const kind = getServiceKind(service);
    const mentionQuantity = getMentionQuantity(matches);
    const count = service.tipoCobro === 'unidad' ? mentionQuantity : matches.length;
    const largo = parseFloat(row.largo) || 0;
    const ancho = parseFloat(row.ancho) || 0;

    if (kind.isCurva) {
        return Math.min(mentionQuantity, 4);
    }

    if (kind.isCalado) {
        return mentionQuantity;
    }

    if (kind.isNariz) {
        let totalNarizUnits = row.narizCobro !== undefined && row.narizCobro !== ''
            ? parseFloat(row.narizCobro) || 0
            : 0;
        const explicitMatches = matches.filter((match) => match.hasExplicitQuantity);
        totalNarizUnits += getMentionQuantity(explicitMatches);

        let cantosNarizMm = 0;
        const validCantosNariz = ['3', '4'];
        if (validCantosNariz.includes(String(row.l1))) cantosNarizMm += largo;
        if (validCantosNariz.includes(String(row.l2))) cantosNarizMm += largo;
        if (validCantosNariz.includes(String(row.a1))) cantosNarizMm += ancho;
        if (validCantosNariz.includes(String(row.a2))) cantosNarizMm += ancho;

        if (cantosNarizMm > 0 && !hasExplicitQuantity(matches)) {
            totalNarizUnits += Math.ceil(cantosNarizMm / 1000);
        }
        return totalNarizUnits;
    }

    if (kind.isSenchaManual) {
        let totalSenchaMm = 0;
        const validCantos = ['1', '2', '3', '4'];
        if (largo > 0 && largo <= 119) {
            if (validCantos.includes(String(row.l1))) totalSenchaMm += largo;
            if (validCantos.includes(String(row.l2))) totalSenchaMm += largo;
        }
        if (ancho > 0 && ancho <= 119) {
            if (validCantos.includes(String(row.a1))) totalSenchaMm += ancho;
            if (validCantos.includes(String(row.a2))) totalSenchaMm += ancho;
        }

        const validCantosNariz = ['3', '4'];
        let cantosSenchaMm = 0;
        if (validCantosNariz.includes(String(row.l1))) cantosSenchaMm += largo;
        if (validCantosNariz.includes(String(row.l2))) cantosSenchaMm += largo;
        if (validCantosNariz.includes(String(row.a1))) cantosSenchaMm += ancho;
        if (validCantosNariz.includes(String(row.a2))) cantosSenchaMm += ancho;
        totalSenchaMm += cantosSenchaMm;

        const circleMatches = (matchResult.matches || []).filter((match) => {
            const identity = match.serviceId.toUpperCase();
            const name = String(match.service?.nombreOriginal || '').toLowerCase();
            return identity === 'CSCIRCULO' || name.includes('circulo');
        });
        if (circleMatches.length > 0) {
            totalSenchaMm += (largo * 2) + (ancho * 2);
        }

        matches
            .filter((match) => ['manigaveta', 'manichaflan'].includes(match.normalizedAlias))
            .forEach((match) => {
                totalSenchaMm += getAdjacentDecimalQuantity(detail, match);
            });

        if (row.enchapeCobro !== undefined && row.enchapeCobro !== '' && circleMatches.length === 0) {
            totalSenchaMm += parseFloat(row.enchapeCobro) || 0;
        }
        return totalSenchaMm / 1000;
    }

    if (kind.isEngna) {
        let totalEngnaUnits = row.engnaCobro !== undefined && row.engnaCobro !== ''
            ? parseFloat(row.engnaCobro) || 0
            : 0;
        const explicitMatches = matches.filter((match) => match.hasExplicitQuantity);
        totalEngnaUnits += getMentionQuantity(explicitMatches);

        let cantosEngnaMm = 0;
        const validCantosEngna = ['3', '4'];
        if (validCantosEngna.includes(String(row.l1))) cantosEngnaMm += largo;
        if (validCantosEngna.includes(String(row.l2))) cantosEngnaMm += largo;
        if (validCantosEngna.includes(String(row.a1))) cantosEngnaMm += ancho;
        if (validCantosEngna.includes(String(row.a2))) cantosEngnaMm += ancho;

        if (cantosEngnaMm > 0 && !hasExplicitQuantity(matches)) {
            totalEngnaUnits += Math.ceil(cantosEngnaMm / 1000);
        }
        return totalEngnaUnits;
    }

    if (kind.isPerbis) {
        return getMetricForService(service, row);
    }

    if (kind.isSanduche || kind.isRanuraFo) {
        if (kind.isSanduche) {
            const validCantos = ['3', '4'];
            let cantosSanducheMm = 0;
            if (validCantos.includes(String(row.l1))) cantosSanducheMm += largo;
            if (validCantos.includes(String(row.l2))) cantosSanducheMm += largo;
            if (validCantos.includes(String(row.a1))) cantosSanducheMm += ancho;
            if (validCantos.includes(String(row.a2))) cantosSanducheMm += ancho;
            return cantosSanducheMm / 1000;
        }
        return count * getMetricForService(service, row);
    }

    return count * getMetricForService(service, row);
};

export const calcularTotalesDespiece = (despieces, services) => {
    let piecesCount = 0;
    const safeServices = Array.isArray(services) ? services : [];
    const sCounts = {};

    safeServices.forEach((service) => {
        sCounts[service.nomenclatura] = 0;
    });

    (Array.isArray(despieces) ? despieces : []).forEach((despiece) => {
        (despiece.filas || []).forEach((row) => {
            const cant = parseInt(row?.cant, 10);
            if (isNaN(cant) || cant <= 0) return;

            piecesCount += cant;
            const detail = row?.detalle ? String(row.detalle) : '';
            const matchResult = findServiceMatches(detail, safeServices);

            safeServices.forEach((service) => {
                const serviceTotalInRow = calculateServiceRowTotal(service, row || {}, detail, matchResult);
                if (serviceTotalInRow > 0) {
                    sCounts[service.nomenclatura] += serviceTotalInRow * cant;
                }
            });
        });
    });

    Object.keys(sCounts).forEach((key) => {
        if (key === 'SENCHAMANUAL') {
            sCounts[key] = Math.ceil(sCounts[key] || 0);
        }
    });

    return { totalPieces: piecesCount, serviceCounts: sCounts };
};

// ==================== DESPiece AUTOMÁTICO ====================

export const MODOS_DESPECIE = {
    COCINA: {
        id: 'cocina',
        nombre: 'Cocina Lineal',
        opciones: [
            { id: 1, nombre: 'Opción 1' },
            { id: 2, nombre: 'Opción 2' },
            { id: 3, nombre: 'Opción 3' }
        ]
    },
    CLOSET: {
        id: 'closet',
        nombre: 'Closet Lineal',
        opciones: [
            { id: 1, nombre: 'Opción 1' },
            { id: 2, nombre: 'Opción 2' },
            { id: 3, nombre: 'Opción 3' }
        ]
    },
    CENTRO_TV: {
        id: 'centro_tv',
        nombre: 'Centro de TV',
        opciones: [
            { id: 1, nombre: 'Opción 1' },
            { id: 2, nombre: 'Opción 2' },
            { id: 3, nombre: 'Opción 3' }
        ]
    },
    ESCRITORIO: {
        id: 'escritorio',
        nombre: 'Escritorio Lineal',
        opciones: [
            { id: 1, nombre: 'Opción 1' },
            { id: 2, nombre: 'Opción 2' },
            { id: 3, nombre: 'Opción 3' }
        ]
    }
};

// ==================== REGLAS POR MODO ====================
// EDITAR AQUÍ LAS REGLAS PARA CADA MODO Y OPCIÓN
// Formato: { l1: '1'/'2'/'', l2: '1'/'2'/'', a1: '1'/'2'/'', a2: '1'/'2'/'' }
// '' = sin canto, '1' = canto fino, '2' = canto grueso

const REGLAS_COCINA = {
    1: { // Opción 1: Canto en 1 lado (para muebles altos ancho <= 370)
        Lateral: { l1: '', l2: '1', a1: '', a2: '' },       // Laterales/Divisiones <= 370mm
        ItemPrincipal: { l1: '', l2: '1', a1: '', a2: '' },     // Laterales/Divisiones
        Refuerzo: { l1: '', l2: '1', a1: '', a2: '' },            // Refuerzos
        Base: { l1: '', l2: '1', a1: '1', a2: '1' },              // Base
        Entrepaño: { l1: '', l2: '1', a1: '', a2: '' },           // Entrepaño
        PanelPuerta: { l1: '2', l2: '2', a1: '2', a2: '2' }       // Puertas/Paneles
    },
    2: { // Opción 2: Canto en 1 lado para muebles altos, 2 lados para muebles bajos
        Lateral: { l1: '', l2: '1', a1: '', a2: '' },            // Laterales/Divisiones ancho <= 370mm
        LateralAncho: { l1: '', l2: '1', a1: '1', a2: '' },      // Laterales/Divisiones ancho >= 400mm
        ItemPrincipal: { l1: '', l2: '1', a1: '', a2: '' },     // Laterales/Divisiones
        Refuerzo: { l1: '', l2: '1', a1: '', a2: '' },            // Refuerzos
        Base: { l1: '', l2: '1', a1: '1', a2: '1' },              // Base
        Entrepaño: { l1: '', l2: '1', a1: '', a2: '' },           // Entrepaño
        PanelPuerta: { l1: '2', l2: '2', a1: '2', a2: '2' }       // Puertas/Paneles
    },
    3: { // Opción 3: Canto en todos lados
        ItemPrincipal: { l1: '1', l2: '1', a1: '1', a2: '1' },   // Laterales/Divisores
        Refuerzo: { l1: '1', l2: '1', a1: '1', a2: '1' },         // Refuerzos
        Base: { l1: '1', l2: '1', a1: '1', a2: '1' },             // Base
        Entrepaño: { l1: '1', l2: '1', a1: '1', a2: '1' },        // Entrepaño
        PanelPuerta: { l1: '2', l2: '2', a1: '2', a2: '2' }       // Puertas/Paneles
    }
};

const REGLAS_CLOSET = {
    1: { // Opción 1
        ItemPrincipal: { l1: '1', l2: '', a1: '', a2: '' },
        Refuerzo: { l1: '1', l2: '', a1: '', a2: '' },
        Base: { l1: '1', l2: '', a1: '', a2: '' },
        PanelPuerta: { l1: '1', l2: '', a1: '', a2: '' }
    },
    2: { // Opción 2
        ItemPrincipal: { l1: '1', l2: '1', a1: '', a2: '' },
        Refuerzo: { l1: '1', l2: '1', a1: '', a2: '' },
        Base: { l1: '1', l2: '1', a1: '', a2: '' },
        PanelPuerta: { l1: '1', l2: '1', a1: '', a2: '' }
    },
    3: { // Opción 3
        ItemPrincipal: { l1: '1', l2: '1', a1: '1', a2: '1' },
        Refuerzo: { l1: '1', l2: '1', a1: '1', a2: '1' },
        Base: { l1: '1', l2: '1', a1: '1', a2: '1' },
        PanelPuerta: { l1: '2', l2: '2', a1: '2', a2: '2' }
    }
};

const REGLAS_CENTRO_TV = {
    1: { // Opción 1
        ItemPrincipal: { l1: '1', l2: '', a1: '', a2: '' },
        Refuerzo: { l1: '1', l2: '', a1: '', a2: '' },
        Base: { l1: '1', l2: '', a1: '', a2: '' },
        PanelPuerta: { l1: '1', l2: '', a1: '', a2: '' }
    },
    2: { // Opción 2
        ItemPrincipal: { l1: '1', l2: '1', a1: '', a2: '' },
        Refuerzo: { l1: '1', l2: '1', a1: '', a2: '' },
        Base: { l1: '1', l2: '1', a1: '', a2: '' },
        PanelPuerta: { l1: '1', l2: '1', a1: '', a2: '' }
    },
    3: { // Opción 3
        ItemPrincipal: { l1: '1', l2: '1', a1: '1', a2: '1' },
        Refuerzo: { l1: '1', l2: '1', a1: '1', a2: '1' },
        Base: { l1: '1', l2: '1', a1: '1', a2: '1' },
        PanelPuerta: { l1: '2', l2: '2', a1: '2', a2: '2' }
    }
};

const REGLAS_ESCRITORIO = {
    1: { // Opción 1
        ItemPrincipal: { l1: '1', l2: '', a1: '', a2: '' },
        Refuerzo: { l1: '1', l2: '', a1: '', a2: '' },
        Base: { l1: '1', l2: '', a1: '', a2: '' },
        PanelPuerta: { l1: '1', l2: '', a1: '', a2: '' }
    },
    2: { // Opción 2
        ItemPrincipal: { l1: '1', l2: '1', a1: '', a2: '' },
        Refuerzo: { l1: '1', l2: '1', a1: '', a2: '' },
        Base: { l1: '1', l2: '1', a1: '', a2: '' },
        PanelPuerta: { l1: '1', l2: '1', a1: '', a2: '' }
    },
    3: { // Opción 3
        ItemPrincipal: { l1: '1', l2: '1', a1: '1', a2: '1' },
        Refuerzo: { l1: '1', l2: '1', a1: '1', a2: '1' },
        Base: { l1: '1', l2: '1', a1: '1', a2: '1' },
        PanelPuerta: { l1: '2', l2: '2', a1: '2', a2: '2' }
    }
};

const REGLAS_POR_MODO = {
    COCINA: REGLAS_COCINA,
    CLOSET: REGLAS_CLOSET,
    CENTRO_TV: REGLAS_CENTRO_TV,
    ESCRITORIO: REGLAS_ESCRITORIO
};

const ITEMS_ENTREPANO = ['ENTREPANO', 'ENTREP;A', 'REPISA'];
const ITEMS_REFUERZO = ['REFUERZO_SUPERIOR', 'REFUERZO_TRASERO', 'TRAVESSA_CONNARIZ_VERTICAL', 'TRAVESSA_CONNARIZ_HORIZONTAL', 'COMP REF', 'COMPREF'];
const ITEMS_BASE = ['BASE'];
const ITEMS_PANEL_PUERTA = ['PANELCAJON', 'PUERTA'];
const ITEMS_LATERAL_DIVISION = ['LATERAL', 'LAT_IZQ', 'LAT_DER', 'DIVISIÓN', 'DIVISION', 'DIV'];

export const aplicarDespieceAutomatico = (filas, modo, opcion, reglasPersonalizadas = null) => {
    if (!filas || !Array.isArray(filas) || !modo || opcion < 1 || opcion > 3) {
        return filas;
    }

    // Normalizar modo a mayúsculas para acceder a las reglas correctamente
    const modoMayus = modo.toUpperCase();
    
    // Si hay reglas personalizadas del usuario, usarlas en lugar de las predefinidas
    if (reglasPersonalizadas && Array.isArray(reglasPersonalizadas) && reglasPersonalizadas.length > 0) {
        return filas.map(fila => {
            const detalle = (fila.detalle || '').toUpperCase();
            const reglaEncontrada = findBestMatchingRule(detalle, reglasPersonalizadas);
            
            if (reglaEncontrada) {
                return {
                    ...fila,
                    l1: normalizeCantoValue(reglaEncontrada.l1),
                    l2: normalizeCantoValue(reglaEncontrada.l2),
                    a1: normalizeCantoValue(reglaEncontrada.a1),
                    a2: normalizeCantoValue(reglaEncontrada.a2),
                };
            }
            
            return fila;
        });
    }
    
    // Obtener las reglas para el modo seleccionado (lógica original)
    const reglasModo = REGLAS_POR_MODO[modoMayus];
    if (!reglasModo) {
        return filas;
    }

    const reglasOpcion = reglasModo[opcion];
    if (!reglasOpcion) {
        return filas;
    }

    return filas.map(fila => {
        const detalle = (fila.detalle || '').toUpperCase();
        const ancho = parseInt(fila.ancho, 10) || 0;
        
        const esEntrepaño = ITEMS_ENTREPANO.some(item => detalle.includes(item));
        const esRefuerzo = ITEMS_REFUERZO.some(item => detalle.includes(item));
        const esBase = ITEMS_BASE.some(item => detalle.includes(item));
        const esPanelPuerta = ITEMS_PANEL_PUERTA.some(item => detalle.includes(item));
        const esLateralDivision = ITEMS_LATERAL_DIVISION.some(item => detalle.includes(item));
        
        // Determinar qué tipo de regla aplicar
        // Laterales/Divisiones tienen lógica especial según ancho y opción
        let tipo = 'ItemPrincipal';
        
        if (esPanelPuerta) {
            tipo = 'PanelPuerta';
        } else if (esRefuerzo) {
            tipo = 'Refuerzo';
        } else if (esBase) {
            tipo = 'Base';
        } else if (esEntrepaño) {
            tipo = 'Entrepaño';
        } else if (esLateralDivision) {
            // Laterales/Divisiones: lógica especial según ancho
            // Si ancho >= 400mm, aplica regla de 2 lados (para opción 1, 2 y 3)
            // Si ancho < 400mm, aplica regla de 1 lado
            if (ancho >= 400) {
                tipo = 'LateralAncho';
            } else {
                tipo = 'Lateral';
            }
        }
        
        // Obtener la regla específica
        const regla = reglasOpcion[tipo] || reglasOpcion.ItemPrincipal || { l1: '', l2: '', a1: '', a2: '' };
        
        return { 
            ...fila, 
            l1: regla.l1 || '', 
            l2: regla.l2 || '', 
            a1: regla.a1 || '', 
            a2: regla.a2 || '' 
        };
    });
};

export const getVistaPreviaDespieceAuto = (filas, modo, opcion) => {
    if (!filas || !Array.isArray(filas)) return [];
    
    // Normalizar modo a mayúsculas para acceder a las reglas correctamente
    const modoMayus = modo ? modo.toUpperCase() : '';
    
    const reglasModo = REGLAS_POR_MODO[modoMayus];
    if (!reglasModo) return [];
    
    const reglasOpcion = reglasModo[opcion];
    if (!reglasOpcion) return [];
    
    const examples = [];
    
    // Tipos a mostrar en la vista previa
    const tiposMostrar = ['Lateral', 'LateralAncho', 'Refuerzo', 'Base', 'Entrepaño', 'PanelPuerta'];
    
    tiposMostrar.forEach(tipo => {
        const regla = reglasOpcion[tipo];
        if (regla) {
            // Mapear nombres para mostrar
            const nombreMostrar = tipo === 'Lateral' ? 'Lateral/División' 
                : tipo === 'LateralAncho' ? 'Lateral/División'
                : tipo === 'PanelPuerta' ? 'Panel/Puerta' 
                : tipo;
            
            examples.push({ 
                tipo: nombreMostrar, 
                l1: regla.l1 || '', 
                l2: regla.l2 || '', 
                a1: regla.a1 || '', 
                a2: regla.a2 || '' 
            });
        }
    });
    
    return examples;
};
