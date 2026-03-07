/**
 * Utilidad pura para calcular los totales de piezas y ocurrencias de servicios
 * extrayendo la engorrosa lógica de búsqueda de strings y fórmulas matemáticas.
 * 
 * @param {Array} despieces Array con los objetos de despieces (pestañas y sus filas)
 * @param {Array} services Lista de servicios disponibles con sus reglas de tipoCobro
 * @returns {Object} { totalPieces: number, serviceCounts: Object }
 */
export const calcularTotalesDespiece = (despieces, services) => {
    let piecesCount = 0;
    const sCounts = {};

    // Inicializar contadores de servicios a 0
    services.forEach(service => {
        sCounts[service.nomenclatura] = 0;
    });

    // Sumar filas de TODOS los despieces de forma segura
    despieces.forEach(despiece => {
        (despiece.filas || []).forEach(row => {
            const cant = parseInt(row?.cant, 10);
            if (!isNaN(cant) && cant > 0) {
                piecesCount += cant;

                // Contar servicios en el detalle usando nombre original o nomenclatura
                const detalle = row?.detalle ? row.detalle.toLowerCase() : '';
                services.forEach(service => {
                    // Escapar caracteres especiales y asegurar límite de palabra (\b)
                    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regexNombre = new RegExp(`\\b${escapeRegExp(service.nombreOriginal.toLowerCase())}\\b`, 'gi');
                    const regexNom = new RegExp(`\\b${escapeRegExp(service.nomenclatura.toLowerCase())}\\b`, 'gi');

                    const matchesNombre = detalle.match(regexNombre);
                    const matchesNom = detalle.match(regexNom);
                    
                    // Combine matches correctly.
                    let count = 0;
                    if (service.nombreOriginal.toLowerCase() === service.nomenclatura.toLowerCase()) {
                        count = matchesNombre ? matchesNombre.length : 0;
                    } else {
                        count = (matchesNombre ? matchesNombre.length : 0) + (matchesNom ? matchesNom.length : 0);
                    }

                    if (count > 0) {
                        // Aplicar regla de cobro
                        const l = parseFloat(row.largo) || 0;
                        const a = parseFloat(row.ancho) || 0;
                        let multiplier = 1;

                        switch (service.tipoCobro) {
                            case 'ml_largo':
                                multiplier = l / 1000;
                                break;
                            case 'ml_ancho':
                                multiplier = a / 1000;
                                break;
                            case 'ml_largo_ancho':
                                multiplier = (l + a) / 1000;
                                break;
                            case 'ml_perimetro':
                                multiplier = ((l * 2) + (a * 2)) / 1000;
                                break;
                            case 'm2':
                                multiplier = (l / 1000) * (a / 1000);
                                break;
                            case 'escala_60':
                                // Escala: 0-600mm = 1, 601-1200mm = 2, etc. (Usando el lado más largo)
                                multiplier = Math.ceil(Math.max(l, a) / 600) || 1;
                                break;
                            case 'unidad':
                            default:
                                multiplier = 1;
                                break;
                        }

                        sCounts[service.nomenclatura] += (count * cant * multiplier);
                    }
                });
            }
        });
    });

    return { totalPieces: piecesCount, serviceCounts: sCounts };
};
