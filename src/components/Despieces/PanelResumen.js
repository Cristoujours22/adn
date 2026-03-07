import React from 'react';

const PanelResumen = ({ 
    darkMode, 
    totalPieces, 
    services, 
    serviceCounts 
}) => {
    return (
        <div style={{ 
            flex: '1 1 30%', 
            minWidth: '250px',
            background: darkMode ? '#1c1f26' : '#f8f9fa',
            borderRadius: '8px',
            border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
            padding: '20px',
            position: 'sticky',
            top: '80px'
        }}>
            <h3 style={{ marginTop: 0, color: darkMode ? '#fff' : '#333', borderBottom: `2px solid ${darkMode ? '#444' : '#eee'}`, paddingBottom: '10px' }}>
                Resumen del Despiece
            </h3>
            
            <div style={{
                background: darkMode ? '#2d3342' : '#fff',
                padding: '15px',
                borderRadius: '8px',
                textAlign: 'center',
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: darkMode ? '#ccc' : '#666' }}>Piezas Totales</h4>
                <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#007bff' }}>{totalPieces}</p>
            </div>

            <h4 style={{ color: darkMode ? '#ccc' : '#666', marginBottom: '15px' }}>Conteo de Servicios</h4>
            {services.filter(s => s.activo !== false && serviceCounts[s.nomenclatura] > 0).length === 0 ? (
                <p style={{ color: darkMode ? '#888' : '#888', fontSize: '14px', fontStyle: 'italic' }}>
                    {services.length === 0 ? "No hay nomenclaturas configuradas. Abre el menú lateral para agregarlas." : "No hay servicios asociados detectados en el detalle de las piezas."}
                </p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {services.filter(s => s.activo !== false && serviceCounts[s.nomenclatura] > 0).map(s => {
                        const count = serviceCounts[s.nomenclatura] || 0;
                        
                        // Formatear display del contador dependiendo del tipo de cobro
                        let countDisplay = count;
                        if (s.tipoCobro && s.tipoCobro !== 'unidad' && s.tipoCobro !== 'escala_60') {
                            countDisplay = Number(count).toFixed(2);
                            if (s.tipoCobro.startsWith('ml')) countDisplay += ' ml';
                            else if (s.tipoCobro === 'm2') countDisplay += ' m²';
                        } else if (s.tipoCobro === 'escala_60') {
                            countDisplay += ' ser';
                        }

                        return (
                            <li key={s.nomenclatura} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px',
                                borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
                                background: darkMode ? '#1e2b22' : '#e8f5e9'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <strong style={{ color: darkMode ? '#fff' : '#333' }}>{s.nombreOriginal}</strong>
                                    <span style={{ fontSize: '12px', color: darkMode ? '#aaa' : '#666' }}>({s.nomenclatura})</span>
                                </div>
                                <span style={{
                                    background: '#28a745',
                                    color: '#fff',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {countDisplay}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default PanelResumen;
