// ============================================================
// js/ui/table.js - Tabla de registros con NK y colores
// ============================================================

const TableUI = {
    modoActual: 'completo',
    
    setModo: function(modo) {
        this.modoActual = modo;
        this.actualizar();
    },
    
    render: function(registrosMostrar) {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;
        
        if (!registrosMostrar || registrosMostrar.length === 0) {
            tbody.innerHTML = '<td><td colspan="18" style="text-align:center; padding:2rem; color:#8B949E;">📭 No hay registros para mostrar</td></tr>';
            return;
        }
        
        const puedeEditar = window.puedeEditar && window.puedeEditar();
        const puedeEliminar = window.puedeEliminar && window.puedeEliminar();
        
        tbody.innerHTML = registrosMostrar.map(reg => {
            const plotterText = reg.plotter_temp ? 
                '#' + (reg.numero_plotter || 0) + ' ' + reg.plotter_temp.toFixed(1) + '°/' + (reg.plotter_humedad || 0).toFixed(0) + '%' : '-';
            
            const reemplazoIcon = reg.es_reemplazo ? '🔄 Sí' : '⚙️ No';
            const procesoBadge = reg.proceso ? 
                '<span style="background: ' + Utils.getProcesoColor(reg.proceso) + '; color:white; padding:0.2rem 0.5rem; border-radius:1rem; font-size:0.7rem;">' + reg.proceso + '</span>' : '-';
            
            let nksHtml = '';
            if (reg.nks && reg.nks.length > 0) {
                nksHtml = '<div style="display:flex; flex-direction:column; gap:4px;">';
                reg.nks.forEach(nk => {
                    const coloresHtml = (nk.colores || []).map(c => 
                        `<span style="background:#21262D; padding:0.1rem 0.3rem; border-radius:3px; font-size:0.6rem; border-left:2px solid #00D4FF; margin:0.1rem; display:inline-block;">${c.nombre || '?'}</span>`
                    ).join(' ');
                    nksHtml += `
                        <div style="border-left:2px solid #00D4FF; padding-left:6px; margin-bottom:4px;">
                            <strong style="color:#00D4FF; font-size:0.7rem;">🧵 NK: ${nk.nk || 'Sin código'}</strong>
                            <div>${coloresHtml || '-'}</div>
                        </div>
                    `;
                });
                nksHtml += '</div>';
            } else {
                nksHtml = '-';
            }
            
            let botonesHtml = '';
            if (this.modoActual === 'completo') {
                let btns = '';
                if (puedeEditar) {
                    btns += '<button class="btn-icon edit" onclick="window.editarRegistro(\'' + reg.id + '\')" style="padding:0.3rem 0.5rem; background:#21262D; border:1px solid #00D4FF; border-radius:4px; cursor:pointer;" title="Editar">✏️</button>';
                }
                btns += '<button class="btn-icon history" onclick="window.verHistorial(\'' + reg.id + '\')" style="padding:0.3rem 0.5rem; background:#21262D; border:1px solid #00D4FF; border-radius:4px; cursor:pointer;" title="Historial">📋</button>';
                btns += '<button class="btn-icon print" onclick="window.imprimirEtiqueta(\'' + reg.id + '\')" style="padding:0.3rem 0.5rem; background:#21262D; border:1px solid #00D4FF; border-radius:4px; cursor:pointer;" title="Imprimir QR">📱</button>';
                if (puedeEliminar) {
                    btns += '<button class="btn-icon delete" onclick="window.eliminarRegistro(\'' + reg.id + '\')" style="padding:0.3rem 0.5rem; background:#21262D; border:1px solid #FF4444; border-radius:4px; cursor:pointer;" title="Eliminar">🗑️</button>';
                }
                botonesHtml = '<div style="display:flex; gap:0.3rem; flex-wrap:wrap;">' + btns + '</div>';
            } else {
                botonesHtml = '<div style="display:flex; gap:0.3rem;"><button class="btn-icon history" onclick="window.verHistorial(\'' + reg.id + '\')" style="padding:0.3rem 0.5rem; background:#21262D; border:1px solid #00D4FF; border-radius:4px; cursor:pointer;" title="Historial">📋</button></div>';
            }
            
            return `<tr>
                <td><span style="background:#21262D; color:#00D4FF; padding:0.2rem 0.5rem; border-radius:4px; font-size:0.7rem; font-weight:700;">${reg.po || '-'}</span></td>
                <td><span style="background:#00D4FF; color:#0D1117; padding:0.2rem 0.5rem; border-radius:1rem; font-size:0.7rem; font-weight:700;">v${reg.version || 1}</span></td>
                <td>${procesoBadge}</td>
                <td>${reemplazoIcon}</td>
                <td>${reg.semana || '-'}</td>
                <td>${Utils.formatearFecha(reg.fecha)}</td>
                <td>${reg.estilo || '-'}</td>
                <td colspan="2">${nksHtml}</td>
                <td><span style="background:#A855F7; color:white; padding:0.2rem 0.5rem; border-radius:1rem; font-size:0.7rem;">${plotterText}</span></td>
                <td>${reg.adhesivo || '-'}</td>
                <td>${(reg.temperatura_monti || 0).toFixed(1)}°</td>
                <td>${(reg.velocidad_monti || 0).toFixed(1)}</td>
                <td>${(reg.temperatura_flat || 0).toFixed(1)}°</td>
                <td>${(reg.tiempo_flat || 0).toFixed(1)}s</td>
                <td class="action-cell">${botonesHtml}${reg.observacion ? '<small style="color:#00D4FF; display:block; margin-top:5px; font-size:0.65rem;">📝 ' + reg.observacion + '</small>' : ''}</td>
             </tr>`;
        }).join('');
    },
    
    actualizar: function() {
        if (!window.RecordsModule) return;
        const filtrados = RecordsModule.filtrar();
        this.render(filtrados);
        this.actualizarEstadisticas();
        if (window.Sidebar && Sidebar.actualizarCalendario) {
            Sidebar.actualizarCalendario();
        }
    },
    
    actualizarEstadisticas: function() {
        const total = AppState.registros ? AppState.registros.length : 0;
        const filtrados = window.RecordsModule ? RecordsModule.filtrar() : [];
        const totalSpan = document.getElementById('totalRegistros');
        if (totalSpan) {
            if (AppState.currentSemana || AppState.currentSearch) {
                totalSpan.innerHTML = `${filtrados.length} / ${total} registros`;
            } else {
                totalSpan.innerHTML = `${total} registros`;
            }
        }
    }
};

window.TableUI = TableUI;
console.log('✅ TableUI actualizado - Muestra NK (código alfanumérico) y colores anidados');