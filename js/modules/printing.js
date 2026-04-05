// ============================================================
// js/modules/printing.js - Impresión QR y reportes con estructura NK → COLORES
// ============================================================

const PrintingModule = {
    imprimirEtiqueta: function(id) {
        const registro = AppState.getRegistroById(id);
        if (!registro) {
            Notifications.error('❌ Registro no encontrado');
            return;
        }
        
        const ventana = window.open('', '_blank');
        
        let nksHtml = '';
        if (registro.nks && registro.nks.length > 0) {
            nksHtml = registro.nks.map(nk => {
                const coloresHtml = (nk.colores || []).map(c => `
                    <div style="margin-bottom: 15px; border-left: 4px solid #00D4FF; padding-left: 12px;">
                        <div style="font-weight: 700; font-size: 13px; margin-bottom: 6px;">🎨 ${c.nombre}</div>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; font-size: 10px;">
                            <div>C: ${c.cyan}%</div><div>M: ${c.magenta}%</div><div>Y: ${c.yellow}%</div><div>K: ${c.black}%</div>
                            <div>T: ${c.turquesa}%</div><div>N: ${c.naranja}%</div><div>FY: ${c.fluorYellow}%</div><div>FP: ${c.fluorPink}%</div>
                        </div>
                    </div>
                `).join('');
                return `
                    <div style="margin-bottom: 20px; border: 1px solid #333; border-radius: 8px; padding: 12px; background: #1a1a1a;">
                        <div style="font-weight: 800; font-size: 14px; color: #00D4FF; margin-bottom: 10px;">🧵 NK: ${nk.nk || 'Sin código'}</div>
                        ${coloresHtml || '<div style="color: #8B949E;">Sin colores</div>'}
                    </div>
                `;
            }).join('');
        } else {
            nksHtml = '<div style="color: #8B949E;">Sin NK especificadas</div>';
        }
        
        let historialHtml = '';
        const historial = AppState.getHistorial(registro.id);
        if (historial.length > 0) {
            historialHtml = `<div class="seccion-titulo">📜 HISTORIAL DE EDICIONES</div><div style="margin:10px 0; font-size:10px;">${historial.map((h, idx) => `<div style="border-left:3px solid #00D4FF; padding-left:10px; margin-bottom:12px; background:#F5F5F5; padding:8px; border-radius:6px;"><div style="display:flex; justify-content:space-between;"><strong style="color:#00D4FF;">v${idx+2}</strong><span style="font-size:9px;">${new Date(h.fecha).toLocaleString()}</span></div><div>📝 ${h.descripcion}</div><div style="font-size:9px;">⬅️ ${h.anterior.po} v${h.anterior.version} → ➡️ ${h.nuevo.po} v${h.nuevo.version}</div></div>`).join('')}</div>`;
        } else {
            historialHtml = `<div class="seccion-titulo">📜 HISTORIAL</div><div style="margin:10px 0; font-size:10px; color:#8B949E;">Sin ediciones previas</div>`;
        }
        
        const qrData = 'PO:' + (registro.po || 'S/PO') + '|V:' + registro.version + '|F:' + registro.fecha + '|ID:' + registro.id;
        
        const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Etiqueta ${registro.po}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Rubik',sans-serif; background:white; padding:0.25in; }
    .etiqueta { max-width:8.5in; margin:0 auto; border:2px solid #000; padding:20px; background:white; }
    .header { display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:15px; }
    .header h1 { font-size:28px; font-weight:800; }
    .po-destacado { font-size:22px; font-weight:900; text-align:right; }
    .version-destacado { font-size:18px; font-weight:900; color:#00D4FF; text-align:right; }
    .info-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; background:#F5F5F5; padding:12px; margin:15px 0; border-radius:8px; font-size:12px; }
    .seccion-titulo { font-size:14px; font-weight:700; margin:20px 0 10px; border-bottom:2px solid #000; text-transform:uppercase; }
    .param-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:15px; margin:15px 0; }
    .param-box { background:#F9F9F9; padding:12px; border-left:3px solid #000; font-size:11px; border-radius:4px; }
    .qr-container { text-align:center; margin:20px 0; padding:15px; background:#FAFAFA; border:1px solid #DDD; border-radius:8px; }
    .footer { text-align:center; border-top:1px solid #CCC; padding-top:12px; margin-top:15px; font-size:9px; color:#666; }
    @media print { body { margin:0; padding:0; } .etiqueta { border:1px solid #000; } }
</style>
</head>
<body>
<div class="etiqueta">
    <div class="header"><h1>ALPHA DB</h1><div><div class="po-destacado">${registro.po || 'S/PO'}</div><div class="version-destacado">v${registro.version || 1}</div></div></div>
    <div class="info-grid"><div><strong>FECHA:</strong> ${Utils.formatearFecha(registro.fecha)}</div><div><strong>Semana:</strong> ${registro.semana}</div><div><strong>Estilo:</strong> ${registro.estilo || '-'}</div><div><strong>Proceso:</strong> ${registro.proceso || '-'}</div><div><strong>Reemplazo:</strong> ${registro.es_reemplazo ? 'SÍ' : 'NO'}</div></div>
    <div class="seccion-titulo">🧵 NK Y COLORES</div>
    ${nksHtml}
    <div class="seccion-titulo">⚙️ PARÁMETROS</div>
    <div class="param-grid">
        <div class="param-box"><strong>🖨️ PLOTTER</strong><br>N° ${registro.numero_plotter || 0}<br>Temp: ${(registro.plotter_temp || 0).toFixed(1)}°C<br>Hum: ${(registro.plotter_humedad || 0).toFixed(0)}%<br>Perfil: ${registro.plotter_perfil || '-'}</div>
        <div class="param-box"><strong>🔥 MONTI</strong><br>N° ${registro.monti_numero || 0}<br>Temp: ${(registro.temperatura_monti || 0).toFixed(1)}°C<br>Vel: ${(registro.velocidad_monti || 0).toFixed(1)} m/min<br>Presión: ${(registro.monti_presion || 0).toFixed(1)} bar</div>
        <div class="param-box"><strong>📏 FLAT</strong><br>Temp: ${(registro.temperatura_flat || 0).toFixed(1)}°C<br>Tiempo: ${(registro.tiempo_flat || 0).toFixed(1)} s<br>Adhesivo: ${registro.adhesivo || '-'}</div>
    </div>
    ${historialHtml}
    <div class="qr-container"><div id="qrcode"></div><div style="font-size:9px; margin-top:8px;">ID: ${registro.id}</div></div>
    ${registro.observacion ? '<div style="margin-top:12px; padding:8px; background:#FFF3CD; border-left:3px solid #F59E0B;">📝 ' + registro.observacion + '</div>' : ''}
    <div class="footer"><strong>ALPHA DB</strong> | Impreso: ${new Date().toLocaleString()}</div>
</div>
<script>new QRCode(document.getElementById("qrcode"),{text:${JSON.stringify(qrData)},width:150,height:150});setTimeout(function(){window.print();},500);<\/script>
</body>
</html>`;
        
        ventana.document.write(html);
        ventana.document.close();
    },
    
    imprimirReporte: function() {
        const registrosFiltrados = RecordsModule.filtrar();
        if (registrosFiltrados.length === 0) {
            Notifications.error('❌ No hay registros');
            return;
        }
        
        const ventana = window.open('', '_blank');
        let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte ALPHA DB</title><style>body{font-family:'Rubik',sans-serif;margin:0.5in;}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:10px;}th{background:#000;color:white;padding:6px;}td{padding:4px;border-bottom:1px solid #ccc;}</style></head><body>
        <h1>ALPHA DB - REPORTE</h1><p>Fecha: ${new Date().toLocaleString()}</p><p>Total: ${registrosFiltrados.length} registros</p>
        <table><thead><tr><th>PO</th><th>V</th><th>Proceso</th><th>Reemp</th><th>Sem</th><th>Fecha</th><th>Estilo</th><th>NK/Colores</th><th>N°Monti</th><th>T°M</th><th>Vel</th><th>T°F</th><th>T/F</th></tr></thead><tbody>`;
        
        for (const reg of registrosFiltrados) {
            let nksResumen = '';
            if (reg.nks && reg.nks.length) {
                nksResumen = reg.nks.map(nk => `${nk.nk}: ${(nk.colores || []).map(c => c.nombre).join(', ')}`).join('; ');
            } else {
                nksResumen = '-';
            }
            html += `<tr><td>${reg.po}</td><td>v${reg.version}</td><td>${reg.proceso}</td><td>${reg.es_reemplazo ? 'Sí' : 'No'}</td><td>${reg.semana}</td><td>${Utils.formatearFecha(reg.fecha)}</td><td>${reg.estilo}</td><td>${nksResumen}</td><td>${reg.monti_numero || 0}</td><td>${(reg.temperatura_monti || 0).toFixed(1)}°</td><td>${(reg.velocidad_monti || 0).toFixed(1)}</td><td>${(reg.temperatura_flat || 0).toFixed(1)}°</td><td>${(reg.tiempo_flat || 0).toFixed(1)}s</td></tr>`;
        }
        
        html += `</tbody></table><script>window.onload=function(){window.print();};<\/script></body></html>`;
        ventana.document.write(html);
        ventana.document.close();
    }
};

window.PrintingModule = PrintingModule;
console.log('✅ PrintingModule actualizado - Soporte NK (código alfanumérico)');