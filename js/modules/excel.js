// ============================================================
// js/modules/excel.js - Exportación a Excel con estructura NK → COLORES
// ============================================================

const ExcelModule = {
    exportar: function() {
        if (typeof XLSX === 'undefined') {
            Notifications.error('❌ Librería XLSX no cargada');
            return;
        }
        
        const registros = RecordsModule.filtrar();
        if (registros.length === 0) {
            Notifications.error('❌ No hay registros para exportar');
            return;
        }
        
        try {
            const datosExcel = [];
            
            registros.forEach(reg => {
                if (reg.nks && reg.nks.length > 0) {
                    reg.nks.forEach(nk => {
                        if (nk.colores && nk.colores.length > 0) {
                            nk.colores.forEach(color => {
                                datosExcel.push({
                                    'PO': reg.po || '',
                                    'Versión': reg.version || 1,
                                    'Proceso': reg.proceso || '',
                                    'Reemplazo': reg.es_reemplazo ? 'Sí' : 'No',
                                    'Semana': reg.semana,
                                    'Fecha': reg.fecha,
                                    'Estilo/Deporte': reg.estilo || '',
                                    'NK (Código Tela)': nk.nk || '',
                                    'COLOR': color.nombre || '',
                                    'Cyan %': color.cyan || 0,
                                    'Magenta %': color.magenta || 0,
                                    'Yellow %': color.yellow || 0,
                                    'Black %': color.black || 0,
                                    'Turquesa %': color.turquesa || 0,
                                    'Naranja %': color.naranja || 0,
                                    'Fluor Yellow %': color.fluorYellow || 0,
                                    'Fluor Pink %': color.fluorPink || 0,
                                    'N° Plotter': reg.numero_plotter || 0,
                                    'Plotter Temp °C': reg.plotter_temp || 0,
                                    'Plotter Humedad %': reg.plotter_humedad || 0,
                                    'Plotter Perfil': reg.plotter_perfil || '',
                                    'N° Monti': reg.monti_numero || 0,
                                    'Temp Monti °C': reg.temperatura_monti || 0,
                                    'Vel Monti m/min': reg.velocidad_monti || 0,
                                    'Monti Presión bar': reg.monti_presion || 0,
                                    'Temp Flat °C': reg.temperatura_flat || 0,
                                    'Tiempo Flat seg': reg.tiempo_flat || 0,
                                    'Adhesivo': reg.adhesivo || '',
                                    'Observación': reg.observacion || ''
                                });
                            });
                        } else {
                            datosExcel.push({
                                'PO': reg.po || '',
                                'Versión': reg.version || 1,
                                'Proceso': reg.proceso || '',
                                'Reemplazo': reg.es_reemplazo ? 'Sí' : 'No',
                                'Semana': reg.semana,
                                'Fecha': reg.fecha,
                                'Estilo/Deporte': reg.estilo || '',
                                'NK (Código Tela)': nk.nk || '',
                                'COLOR': '',
                                'Cyan %': 0, 'Magenta %': 0, 'Yellow %': 0, 'Black %': 0,
                                'Turquesa %': 0, 'Naranja %': 0, 'Fluor Yellow %': 0, 'Fluor Pink %': 0,
                                'N° Plotter': reg.numero_plotter || 0,
                                'Plotter Temp °C': reg.plotter_temp || 0,
                                'Plotter Humedad %': reg.plotter_humedad || 0,
                                'Plotter Perfil': reg.plotter_perfil || '',
                                'N° Monti': reg.monti_numero || 0,
                                'Temp Monti °C': reg.temperatura_monti || 0,
                                'Vel Monti m/min': reg.velocidad_monti || 0,
                                'Monti Presión bar': reg.monti_presion || 0,
                                'Temp Flat °C': reg.temperatura_flat || 0,
                                'Tiempo Flat seg': reg.tiempo_flat || 0,
                                'Adhesivo': reg.adhesivo || '',
                                'Observación': reg.observacion || ''
                            });
                        }
                    });
                } else {
                    datosExcel.push({
                        'PO': reg.po || '',
                        'Versión': reg.version || 1,
                        'Proceso': reg.proceso || '',
                        'Reemplazo': reg.es_reemplazo ? 'Sí' : 'No',
                        'Semana': reg.semana,
                        'Fecha': reg.fecha,
                        'Estilo/Deporte': reg.estilo || '',
                        'NK (Código Tela)': '',
                        'COLOR': '',
                        'Cyan %': 0, 'Magenta %': 0, 'Yellow %': 0, 'Black %': 0,
                        'Turquesa %': 0, 'Naranja %': 0, 'Fluor Yellow %': 0, 'Fluor Pink %': 0,
                        'N° Plotter': reg.numero_plotter || 0,
                        'Plotter Temp °C': reg.plotter_temp || 0,
                        'Plotter Humedad %': reg.plotter_humedad || 0,
                        'Plotter Perfil': reg.plotter_perfil || '',
                        'N° Monti': reg.monti_numero || 0,
                        'Temp Monti °C': reg.temperatura_monti || 0,
                        'Vel Monti m/min': reg.velocidad_monti || 0,
                        'Monti Presión bar': reg.monti_presion || 0,
                        'Temp Flat °C': reg.temperatura_flat || 0,
                        'Tiempo Flat seg': reg.tiempo_flat || 0,
                        'Adhesivo': reg.adhesivo || '',
                        'Observación': reg.observacion || ''
                    });
                }
            });
            
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(datosExcel);
            XLSX.utils.book_append_sheet(wb, ws, 'Registros ALPHA DB');
            XLSX.writeFile(wb, `ALPHA_DB_${new Date().toISOString().split('T')[0]}.xlsx`);
            Notifications.success('📊 Archivo Excel generado');
        } catch (error) {
            console.error(error);
            Notifications.error('❌ Error al generar Excel');
        }
    }
};

window.ExcelModule = ExcelModule;
console.log('✅ ExcelModule actualizado - Exporta NK (código alfanumérico)');