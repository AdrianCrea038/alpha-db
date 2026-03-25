// js/modules/excel.js
const ExcelModule = {
    exportar: function() {
        if (typeof XLSX === 'undefined') {
            Notifications.error('❌ Librería XLSX no cargada');
            return;
        }
        
        const registros = RegistrosModule.filtrar();
        if (registros.length === 0) {
            Notifications.error('❌ No hay registros para exportar');
            return;
        }
        
        try {
            const datosExcel = registros.map(reg => {
                const fila = {
                    'PO': reg.po || '',
                    'Versión': reg.version || 1,
                    'Proceso': reg.proceso || '',
                    'Reemplazo': reg.es_reemplazo ? 'Sí' : 'No',
                    'Semana': reg.semana,
                    'Fecha': reg.fecha,
                    'Estilo/Deporte': reg.estilo || '',
                    'Tela Principal': reg.tela || '',
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
                };
                
                if (reg.colores && reg.colores.length > 0) {
                    reg.colores.forEach((color, idx) => {
                        fila[`Color ${idx+1} Nombre`] = color.nombre || '';
                        fila[`Color ${idx+1} Cyan %`] = color.cyan || 0;
                        fila[`Color ${idx+1} Magenta %`] = color.magenta || 0;
                        fila[`Color ${idx+1} Yellow %`] = color.yellow || 0;
                        fila[`Color ${idx+1} Black %`] = color.black || 0;
                        fila[`Color ${idx+1} Turquesa %`] = color.turquesa || 0;
                        fila[`Color ${idx+1} Naranja %`] = color.naranja || 0;
                        fila[`Color ${idx+1} Fluor Yellow %`] = color.fluorYellow || 0;
                        fila[`Color ${idx+1} Fluor Pink %`] = color.fluorPink || 0;
                    });
                }
                return fila;
            });
            
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(datosExcel);
            ws['!cols'] = [{wch:15},{wch:8},{wch:12},{wch:10},{wch:8},{wch:12},{wch:20},{wch:15},{wch:10},{wch:12},{wch:12},{wch:12},{wch:10},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:20}];
            XLSX.utils.book_append_sheet(wb, ws, 'Registros ALPHA DB');
            XLSX.writeFile(wb, `ALPHA_DB_${new Date().toISOString().split('T')[0]}.xlsx`);
            Notifications.success('📊 Archivo Excel generado con todos los datos');
        } catch (error) {
            console.error('Error en exportarExcel:', error);
            Notifications.error('❌ Error al generar Excel');
        }
    }
};

window.ExcelModule = ExcelModule;
console.log('✅ ExcelModule cargado');