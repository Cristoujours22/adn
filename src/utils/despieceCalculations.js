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
                    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const isCalado = service.nomenclatura.toLowerCase() === 'calado' || service.nombreOriginal.toLowerCase().includes('calado');
                    const isCurva = service.nomenclatura.toLowerCase() === 'cscurva1' || service.nombreOriginal.toLowerCase() === 'curva';
                    
                    let serviceTotalInRow = 0;

                    if (isCalado) {
                        const baseName = escapeRegExp(service.nombreOriginal.toLowerCase());
                        const baseNom = escapeRegExp(service.nomenclatura.toLowerCase());
                        const baseRegexStr = baseName === baseNom ? `\\b${baseName}\\b` : `\\b${baseName}\\b|\\b${baseNom}\\b`;
                        
                        // Captura la palabra base, seguida opcionalmente por " 1L...4L", seguido opcionalmente por "/medida*medida"
                        const regex = new RegExp(`(${baseRegexStr})(?:\\s*([1-4])L)?(?:\\/(\\d+(?:\\.\\d+)?)\\*(\\d+(?:\\.\\d+)?))?`, 'gi');
                        
                        let match;
                        while ((match = regex.exec(detalle)) !== null) {
                            let localMultiplier = 1;
                            if (match[2]) {
                                localMultiplier = parseInt(match[2], 10);
                            }
                            
                            let customL = null;
                            let customA = null;
                            if (match[3] && match[4]) {
                                customL = parseFloat(match[3]);
                                customA = parseFloat(match[4]);
                            }
                            
                            let m = 1;
                            if (customL !== null && customA !== null) {
                                // Regla especial exclusiva para calado sobreescrito: se suman las dimensiones
                                // y se aplica la regla de 1 unidad cada 600mm.
                                m = Math.ceil((customL + customA) / 600) || 1;
                            }
                            // Si el operario solo escribió "calado", customL/A son nulos y m se mantiene en 1.
                            // Si el operario escribió "calado 2L", localMultiplier es 2 y m es 1.
                            
                            serviceTotalInRow += (localMultiplier * m);
                        }
                    } else if (isCurva) {
                        const baseName = escapeRegExp(service.nombreOriginal.toLowerCase());
                        const baseNom = escapeRegExp(service.nomenclatura.toLowerCase());
                        const baseRegexStr = baseName === baseNom ? `\\b${baseName}\\b` : `\\b${baseName}\\b|\\b${baseNom}\\b`;
                        
                        const regex = new RegExp(`(${baseRegexStr})(?:\\s*([1-4])(?:L|l)?)?`, 'gi');
                        
                        let match;
                        while ((match = regex.exec(detalle)) !== null) {
                            let localMultiplier = 1;
                            if (match[2]) {
                                localMultiplier = parseInt(match[2], 10);
                            }
                            serviceTotalInRow += localMultiplier;
                        }
                    } else {
                        // Lógica estándar para el resto de los servicios
                        const isNariz = service.nomenclatura.toLowerCase() === 'nar' || service.nombreOriginal.toLowerCase().includes('nariz') || service.nombreOriginal.toLowerCase().includes('narices') || service.nombreOriginal.toLowerCase().includes('nar');
                        const isSenchaManual = service.nomenclatura.toUpperCase() === 'SENCHAMANUAL' || service.nombreOriginal.toLowerCase().includes('enchape a pieza especial');
                        const isPerbis = service.nomenclatura.toUpperCase() === 'PERBIS' || service.nombreOriginal.toLowerCase().includes('perbis');

                        const regexNombre = new RegExp(`\\b${escapeRegExp(service.nombreOriginal.toLowerCase())}\\b`, 'gi');
                        const regexNom = new RegExp(`\\b${escapeRegExp(service.nomenclatura.toLowerCase())}\\b`, 'gi');

                        const matchesNombre = detalle.match(regexNombre);
                        const matchesNom = detalle.match(regexNom);
                        
                        let count = 0;
                        // Flexibilizamos la búsqueda para que baste con "nar" o "nariz"
                        // ya que la nomenclatura "NARIZ, ENGRUESE" casi nunca se escribe textualmente.
                        if (isNariz) {
                            const basicNarRegex = /\bnar(?:iz(?:es)?)?\b/gi;
                            count = (detalle.match(basicNarRegex) || []).length;
                        } else if (isSenchaManual) {
                            const basicSenchaRegex = /\b(?:senchamanual|enchape manual|manigaveta|manichaflan)\b/gi;
                            count = (detalle.match(basicSenchaRegex) || []).length;
                            
                            // Revisión automática si no hay texto relevante, pero cumple la regla <= 119
                            if (count === 0) {
                                const localL = parseFloat(row.largo) || 0;
                                const localA = parseFloat(row.ancho) || 0;
                                if ((localL > 0 && localL <= 119) || (localA > 0 && localA <= 119)) {
                                    const vc = ['1', '2', '3', '4'];
                                    if (vc.includes(String(row.l1)) || vc.includes(String(row.l2)) || vc.includes(String(row.a1)) || vc.includes(String(row.a2))) {
                                        count = 1;
                                    }
                                }
                            }
                        } else if (isPerbis) {
                            const perbisRegex = /(\d+)\s*perbis/gi;
                            let matchResult;
                            let foundAny = false;
                            while ((matchResult = perbisRegex.exec(detalle)) !== null) {
                                count += parseInt(matchResult[1], 10);
                                foundAny = true;
                            }
                            if (!foundAny) {
                                // Fallback a búsqueda normal de palabra
                                const basicPerbisRegex = /\bperbis\b/gi;
                                count = (detalle.match(basicPerbisRegex) || []).length;
                            }
                        } else if (service.nombreOriginal.toLowerCase() === service.nomenclatura.toLowerCase()) {
                            count = matchesNombre ? matchesNombre.length : 0;
                        } else {
                            count = (matchesNombre ? matchesNombre.length : 0) + (matchesNom ? matchesNom.length : 0);
                        }

                        const detLower = detalle.toLowerCase();
                        const isEnchapeButtonActive = detLower.includes('senchamanual') || detLower.includes('enchape manual');
                        const isNarizButtonActive = !isEnchapeButtonActive && detLower.includes('nar');

                        let forceNariz = isNariz && count === 0 && row.narizCobro !== undefined && row.narizCobro !== '' && isNarizButtonActive;
                        let forceSencha = isSenchaManual && count === 0 && row.narizCobro !== undefined && row.narizCobro !== '' && isEnchapeButtonActive;

                        if (count > 0 || forceNariz || forceSencha) {
                            if (forceNariz || forceSencha) count = 1;
                            const l = parseFloat(row.largo) || 0;
                            const a = parseFloat(row.ancho) || 0;
                            let m = 1;

                            if (isNariz) {
                                // Regex estandarizada para Narices (independiente de nomenclatura de Admin)
                                const baseName = escapeRegExp(service.nombreOriginal.toLowerCase());
                                const baseNom = escapeRegExp(service.nomenclatura.toLowerCase());
                                const baseRegexStr = baseName === baseNom ? `\\b${baseName}\\b` : `\\b${baseName}\\b|\\b${baseNom}\\b`;
                                const regexNarizOld = new RegExp(`(${baseRegexStr})(?:\\s*(\\d+)(?:L)?)?`, 'gi');
                                
                                let totalNarizUnits = 0;
                                let foundExplicitAmount = false;
                                
                                // Prioridad 1: Sintaxis explícita inyectada por el Modal internamente (Solo si le corresponde a Nariz)
                                if (row.narizCobro !== undefined && row.narizCobro !== '' && isNarizButtonActive) {
                                    totalNarizUnits += parseFloat(row.narizCobro) || 0;
                                    foundExplicitAmount = true;
                                }

                                // Prioridad 2: Si no hay monto explícito en la celda oculta, sumar lo que digan las literales (Ej: nariz 3L)
                                if (!foundExplicitAmount) {
                                    let matchOld;
                                    while ((matchOld = regexNarizOld.exec(detalle)) !== null) {
                                        let localUnits = 1; // 1 unidad por defecto al mencionar "nariz"
                                        if (matchOld[2]) {
                                            localUnits = parseInt(matchOld[2], 10);
                                        }
                                        totalNarizUnits += localUnits;
                                    }
                                }
                                
                                serviceTotalInRow += (totalNarizUnits * 1); // 1 = tipo unidad

                            } else if (isSenchaManual) {
                                let totalSenchaMm = 0;
                                
                                // Auto-sum para partes pequeñas <= 119 con cantos '1', '2', '3', '4'
                                const validCantos = ['1', '2', '3', '4'];
                                if (l > 0 && l <= 119) {
                                    if (validCantos.includes(String(row.l1))) totalSenchaMm += l;
                                    if (validCantos.includes(String(row.l2))) totalSenchaMm += l;
                                }
                                if (a > 0 && a <= 119) {
                                    if (validCantos.includes(String(row.a1))) totalSenchaMm += a;
                                    if (validCantos.includes(String(row.a2))) totalSenchaMm += a;
                                }

                                // Suma adicional por Circulo (Perimetro completo en mm)
                                const hasCirculo = detalle.toLowerCase().includes('circulo');
                                if (hasCirculo) {
                                    totalSenchaMm += (l * 2) + (a * 2);
                                }

                                // Suma exacta extraida de manigavetas/manichaflan
                                const regexMani = /(?:manigaveta|manichaflan)[\s/xX]*(\d+(?:\.\d+)?)/gi;
                                let matchMani;
                                while ((matchMani = regexMani.exec(detalle)) !== null) {
                                    totalSenchaMm += parseFloat(matchMani[1]) || 0;
                                }

                                // Si el operario usó el botón de Enchape Manual oculto (Solo si le corresponde a Enchape y NO es círculo)
                                if (row.narizCobro !== undefined && row.narizCobro !== '' && isEnchapeButtonActive && !hasCirculo) {
                                    totalSenchaMm += parseFloat(row.narizCobro) || 0;
                                }

                                // Sumamos los milimetros totales convertidos a Metros Lineales.
                                serviceTotalInRow += (totalSenchaMm / 1000); 

                            } else {
                                switch (service.tipoCobro) {
                                    case 'ml_largo': m = l / 1000; break;
                                    case 'ml_ancho': m = a / 1000; break;
                                    case 'ml_largo_ancho': m = (l + a) / 1000; break;
                                    case 'ml_perimetro': m = ((l * 2) + (a * 2)) / 1000; break;
                                    case 'm2': m = (l / 1000) * (a / 1000); break;
                                    case 'escala_60': m = Math.ceil(Math.max(l, a) / 600) || 1; break;
                                    case 'unidad':
                                    default: m = 1; break;
                                }
                                serviceTotalInRow += (count * m);
                            }
                        }
                    }

                    if (serviceTotalInRow > 0) {
                        sCounts[service.nomenclatura] += (serviceTotalInRow * cant);
                    }
                });
            }
        });
    });

    // Redondear SENCHAMANUAL a unidades al final del despiece
    Object.keys(sCounts).forEach(key => {
        if (key === 'SENCHAMANUAL') {
            sCounts[key] = Math.ceil(sCounts[key] || 0);
        }
    });

    return { totalPieces: piecesCount, serviceCounts: sCounts };
};
