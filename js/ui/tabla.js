// js/ui/tabla.js
const TablaUI = {
    // Variable para controlar qué botones mostrar
    modoActual: 'completo', // 'completo', 'solo-lectura', 'tracking'
    
    setModo: function(modo) {
        this.modoActual = modo;
        this.actualizar();
    },
    
    render: function(registrosMostrar) {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;
        
        if (!registrosMostrar || registrosMostrar.length === 0) {
            tbody.innerHTML = '<tr><td colspan="18" class="loading" style="text-align:center; padding:2rem;">📭 No hay registros para mostrar</td></tr>';
            return;
        }
        
        tbody.innerHTML = registrosMostrar.map(reg => {
            const tieneHistorial = AppState.historialEdiciones && AppState.historialEdiciones[reg.id] && AppState.historialEdiciones[reg.id].length > 0;
            const rowClass = tieneHistorial ? 'has-history' : '';
            
            const plotterText = reg.plotter_temp ? 
                '#' + (reg.numero_plotter || 0) + ' ' + reg.plotter_temp.toFixed(1) + '°/' + (reg.plotter_humedad || 0).toFixed(0) + '%' : '-';
            
            const reemplazoIcon = reg.es_reemplazo ? '🔄 Sí' : '⚙️ No';
            const procesoBadge = reg.proceso ? 
                '<span style="background: ' + Utils.getProcesoColor(reg.proceso) + '; color:white; padding:0.2rem 0.5rem; border-radius:1rem; font-size:0.7rem;">' + reg.proceso + '</span>' : '-';
            
            let coloresHtml = '-';
            if (reg.colores && reg.colores.length > 0) {
                coloresHtml = reg.colores.map(c => '<span class="color-tag" style="background:rgba(51,51,51,0.8); padding:0.15rem 0.4rem; border-radius:3px; font-size:0.65rem; border-left:2px solid #ff4b7d; display:inline-block; margin:0.1rem;">' + (c.nombre || '?') + '</span>').join(' ');
            }
            
            // Construir botones según el modo actual
            let botonesHtml = '';
            
            if (this.modoActual === 'completo') {
                botonesHtml = `
                    <div class="action-buttons" style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                        <button class="btn-icon edit" onclick="window.editarRegistro('${reg.id}')" title="Editar" style="padding:0.3rem 0.5rem; background:rgba(42,42,42,0.8); border:1px solid #ff6b8a; border-radius:4px; cursor:pointer;">✏️</button>
                        <button class="btn-icon history" onclick="window.verHistorial('${reg.id}')" title="Historial" style="padding:0.3rem 0.5rem; background:rgba(42,42,42,0.8); border:1px solid #ff6b8a; border-radius:4px; cursor:pointer;">📋</button>
                        <button class="btn-icon print" onclick="window.imprimirEtiqueta('${reg.id}')" title="Imprimir QR" style="padding:0.3rem 0.5rem; background:rgba(42,42,42,0.8); border:1px solid #ff6b8a; border-radius:4px; cursor:pointer;">📱</button>
                        <button class="btn-icon delete" onclick="window.eliminarRegistro('${reg.id}')" title="Eliminar" style="padding:0.3rem 0.5rem; background:rgba(42,42,42,0.8); border:1px solid #ff6b8a; border-radius:4px; cursor:pointer;">🗑️</button>
                    </div>
                `;
            } else if (this.modoActual === 'solo-lectura' || this.modoActual === 'tracking') {
                botonesHtml = `
                    <div class="action-buttons" style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                        <button class="btn-icon history" onclick="window.verHistorial('${reg.id}')" title="Historial" style="padding:0.3rem 0.5rem; background:rgba(42,42,42,0.8); border:1px solid #ff6b8a; border-radius:4px; cursor:pointer;">📋</button>
                    </div>
                `;
            }
            
            return `
                <tr class="${rowClass}" data-id="${reg.id}">
                    <td><span class="po-badge" style="background:#000; color:white; padding:0.2rem 0.5rem; border-radius:4px; font-size:0.7rem; display:inline-block;">${reg.po || '-'}</span></td>
                    <td><span style="background:#ff0000; color:white; padding:0.2rem 0.5rem; border-radius:1rem; font-size:0.7rem;">v${reg.version || 1}</span></td>
                    <td>${procesoBadge}</td>
                    <td>${reemplazoIcon}</td>
                    <td>${reg.semana || '-'}</td>
                    <td>${Utils.formatearFecha(reg.fecha)}</td>
                    <td>${reg.estilo || '-'}</td>
                    <td>${reg.tela || '-'}</td>
                    <td colspan="2">${coloresHtml}</td>
                    <td><span style="background:#9c27b0; color:white; padding:0.2rem 0.5rem; border-radius:1rem; font-size:0.7rem;">${plotterText}</span></td>
                    <td>${reg.adhesivo || '-'}</td>
                    <td>${(reg.temperatura_monti || 0).toFixed(1)}°</td>
                    <td>${(reg.velocidad_monti || 0).toFixed(1)}</td>
                    <td>${(reg.temperatura_flat || 0).toFixed(1)}°</td>
                    <td>${(reg.tiempo_flat || 0).toFixed(1)}s</td>
                    <td class="action-cell">
                        ${botonesHtml}
                        ${reg.observacion ? '<small style="color:#ffd93d; display:block; margin-top:5px; font-size:0.65rem;">📝 ' + reg.observacion + '</small>' : ''}
                    </td>
                </tr>
            `;
        }).join('');
    },
    
    actualizar: function() {
        if (!window.RegistrosModule) {
            console.warn('RegistrosModule no disponible');
            return;
        }
        const filtrados = RegistrosModule.filtrar();
        this.render(filtrados);
        this.actualizarEstadisticas();
        if (window.CalendarioUI && CalendarioUI.actualizar) {
            CalendarioUI.actualizar();
        }
    },
    
    actualizarEstadisticas: function() {
        const total = AppState.registros ? AppState.registros.length : 0;
        const filtrados = window.RegistrosModule ? RegistrosModule.filtrar() : [];
        const totalSpan = document.getElementById('totalRegistros');
        const filtroBadge = document.getElementById('filtroActivo');
        
        if (totalSpan) totalSpan.innerHTML = total + ' registros';
        
        if (filtroBadge) {
            if (AppState.currentSemana || AppState.currentSearch) {
                filtroBadge.style.display = 'inline';
                filtroBadge.innerHTML = filtrados.length + ' resultados';
            } else {
                filtroBadge.style.display = 'none';
            }
        }
    }
};

window.TablaUI = TablaUI;
console.log('✅ TablaUI cargado correctamente');
