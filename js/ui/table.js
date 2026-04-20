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
            tbody.innerHTML = '<tr><td colspan="18" style="text-align:center; padding:2rem; color:#8B949E;">📭 No hay registros para mostrar</td></tr>';
            return;
        }
        
        const puedeEditar = window.puedeEditar && window.puedeEditar();
        const puedeEliminar = window.puedeEliminar && window.puedeEliminar();
        
        let html = '';
        
        registrosMostrar.forEach(reg => {
            try {
                // Formateo seguro de números
                const getFixed = (val, dec = 1) => {
                    const num = parseFloat(val);
                    return isNaN(num) ? '0' : num.toFixed(dec);
                };

                const plotterText = reg.plotter_temp ? 
                    `#${reg.numero_plotter || 0} ${getFixed(reg.plotter_temp)}°/${getFixed(reg.plotter_humedad, 0)}%` : '-';
                
                const reemplazoIcon = reg.es_reemplazo ? '🔄 Sí' : '⚙️ No';
                const procesoBadge = reg.proceso ? 
                    `<span style="background: ${window.Utils ? Utils.getProcesoColor(reg.proceso) : '#444'}; color:white; padding:0.2rem 0.5rem; border-radius:1rem; font-size:0.7rem;">${reg.proceso}</span>` : '-';
                
                let nksHtml = '';
                if (reg.nks && Array.isArray(reg.nks)) {
                    nksHtml = '<div style="display:flex; flex-direction:column; gap:4px;">';
                    reg.nks.forEach(nk => {
                        if (!nk) return;
                        const coloresHtml = (nk.colores || []).map(c => 
                            `<span style="background:#21262D; padding:0.1rem 0.3rem; border-radius:3px; font-size:0.6rem; border-left:2px solid #00D4FF; margin:0.1rem; display:inline-block;">${c.nombre || '?'}</span>`
                        ).join(' ');
                        nksHtml += `
                            <div style="border-left:2px solid #00D4FF; padding-left:6px; margin-bottom:4px;">
                                <strong style="color:#00D4FF; font-size:0.7rem;">🧵 NK: ${nk.nk || 'N/A'}</strong>
                                <div>${coloresHtml || '-'}</div>
                            </div>
                        `;
                    });
                    nksHtml += '</div>';
                } else if (reg.nk || reg.colorModificar) {
                    // Soporte legacy por si acaso
                    nksHtml = `<div style="border-left:2px solid #8B949E; padding-left:6px;">
                                <strong style="font-size:0.7rem;">🧵 NK: ${reg.nk || '-'}</strong>
                                <div style="font-size:0.6rem;">${reg.colorModificar || '-'}</div>
                               </div>`;
                } else {
                    nksHtml = '-';
                }
                
                html += `<tr>
                    <td><span style="background:#21262D; color:#00D4FF; padding:0.2rem 0.5rem; border-radius:4px; font-size:0.7rem; font-weight:700;">${reg.po || '-'}</span></td>
                    <td><span style="background:#00D4FF; color:#0D1117; padding:0.2rem 0.5rem; border-radius:1rem; font-size:0.7rem; font-weight:700;">v${reg.version || 1}</span></td>
                    <td>${procesoBadge}</td>
                    <td>${reemplazoIcon}</td>
                    <td>${reg.semana || '-'}</td>
                    <td>${window.Utils ? Utils.formatearFecha(reg.fecha) : reg.fecha}</td>
                    <td>${reg.estilo || '-'}</td>
                    <td colspan="2">${nksHtml}</td>
                    <td><span style="background:#A855F7; color:white; padding:0.2rem 0.5rem; border-radius:1rem; font-size:0.7rem;">${plotterText}</span></td>
                    <td>${reg.adhesivo || '-'}</td>
                    <td>${getFixed(reg.temperatura_monti)}°</td>
                    <td>${getFixed(reg.velocidad_monti)}</td>
                    <td>${getFixed(reg.temperatura_flat)}°</td>
                    <td>${getFixed(reg.tiempo_flat)}s</td>
                    <td>
                        ${reg.reformulacion_estado === 'reformulado' ? 
                            `<span style="color:#00FF88; font-weight:bold; font-size:0.7rem;">✅ ${reg.reformulacion_tiempo || 0} min</span>` : 
                            reg.reformulacion_estado === 'pendiente' ? 
                            `<span style="color:#F59E0B; font-weight:bold; font-size:0.7rem;">🧪 PEND.</span>` : 
                            `<span style="color:#8B949E; font-size:0.7rem;">-</span>`
                        }
                    </td>
                    <td>
                        ${reg.en_produccion ? 
                            `<span style="background:rgba(0,255,136,0.1); color:#00FF88; padding:0.2rem 0.5rem; border-radius:1rem; font-size:0.65rem; border:1px solid rgba(0,255,136,0.3); font-weight:700;">🏭 EN PRODUCCIÓN</span>` : 
                            `<span style="background:rgba(245,158,11,0.1); color:#F59E0B; padding:0.2rem 0.5rem; border-radius:1rem; font-size:0.65rem; border:1px solid rgba(245,158,11,0.3); font-weight:700;">⏳ PENDIENTE</span>`
                        }
                    </td>
                    <td class="action-cell">
                        <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                            ${this.modoActual === 'completo' ? `
                                ${puedeEditar ? `<button class="btn-icon edit" onclick="window.editarRegistro('${reg.id}')" style="padding:0.3rem 0.5rem; background:#21262D; border:1px solid #00D4FF; border-radius:4px; cursor:pointer;" title="Editar">✏️</button>` : ''}
                                ${reg.en_produccion ? 
                                    `<button class="btn-icon prod" disabled style="padding:0.3rem 0.5rem; background:#161B22; border:1px solid #484F58; border-radius:4px; color:#484F58; cursor:not-allowed;" title="Ya está en Producción">✅</button>` :
                                    `<button class="btn-icon prod" onclick="window.mandarAProduccion(event, '${reg.id}')" style="padding:0.3rem 0.5rem; background:#00D4FF; border:none; border-radius:4px; color:#0D1117; cursor:pointer; font-weight:bold;" title="Mandar a Producción">🚀</button>`
                                }
                                <button class="btn-icon print" onclick="window.imprimirEtiqueta('${reg.id}')" style="padding:0.3rem 0.5rem; background:#21262D; border:1px solid #00D4FF; border-radius:4px; cursor:pointer;" title="Imprimir QR">🖨️</button>
                                ${puedeEliminar ? `<button class="btn-icon delete" onclick="window.eliminarRegistro('${reg.id}')" style="padding:0.3rem 0.5rem; background:#21262D; border:1px solid #FF4444; border-radius:4px; cursor:pointer;" title="Eliminar">🗑️</button>` : ''}
                            ` : ''}
                            <button class="btn-icon history" onclick="window.verHistorial('${reg.id}')" style="padding:0.3rem 0.5rem; background:#21262D; border:1px solid #00D4FF; border-radius:4px; cursor:pointer;" title="Historial">📋</button>
                        </div>
                    </td>
                 </tr>`;
            } catch (err) {
                console.error('Error renderizando registro:', reg, err);
            }
        });
        
        tbody.innerHTML = html;
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