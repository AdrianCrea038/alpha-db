// ALPHA DB - Sistema de Gestión Premium
// Versión 8.3 - CORREGIDO (Sin estructura circular)

// ==================== CONFIGURACIÓN ====================
const SISTEMA_NOMBRE = 'ALPHA DB';
const DB_VERSION = '8.3';
const DB_EXTENSION = '.adb';

// Estado de la aplicación
let registros = [];
let currentSearch = '';
let currentSemana = '';
let editandoId = null;
let historialEdiciones = {};

// ==================== FUNCIONES UTILITARIAS ====================

function generarIdUnico() {
    return 'ADB-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function obtenerSemana(fecha) {
    const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}-${mes}-${anio}`;
}

function mostrarNotificacion(mensaje, tipo = 'success') {
    const notificacion = document.createElement('div');
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 0.8rem 1.5rem;
        background: ${tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 0.5rem;
        z-index: 1000;
        animation: slideIn 0.3s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-weight: 500;
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s';
        setTimeout(() => document.body.removeChild(notificacion), 300);
    }, 2500);
}

// ==================== FILTROS Y UI ====================

function filtrarRegistrosArray() {
    if (!currentSearch && !currentSemana) return registros;
    
    const termino = currentSearch ? currentSearch.toLowerCase().trim() : '';
    
    const safeToString = (valor) => {
        if (valor === undefined || valor === null) return '';
        return valor.toString();
    };
    
    const resultados = registros.filter(reg => {
        if (currentSemana) {
            const semanaReg = parseInt(reg.semana);
            const semanaFiltro = parseInt(currentSemana);
            if (semanaReg !== semanaFiltro) return false;
        }
        
        if (!termino) return true;
        
        const datosCompletos = [
            safeToString(reg.po),
            safeToString(reg.proceso),
            safeToString(reg.esReemplazo ? 'reemplazo' : 'produccion'),
            safeToString(reg.estilo),
            safeToString(reg.tela),
            safeToString(reg.cyan),
            safeToString(reg.magenta),
            safeToString(reg.yellow),
            safeToString(reg.black),
            safeToString(reg.color1_nombre),
            safeToString(reg.color1_valor),
            safeToString(reg.color2_nombre),
            safeToString(reg.color2_valor),
            safeToString(reg.color3_nombre),
            safeToString(reg.color3_valor),
            safeToString(reg.color4_nombre),
            safeToString(reg.color4_valor),
            safeToString(reg.numero_plotter),
            safeToString(reg.plotter_temp),
            safeToString(reg.plotter_humedad),
            safeToString(reg.plotter_perfil),
            safeToString(reg.adhesivo),
            safeToString(reg.semana),
            safeToString(reg.temperatura_monti),
            safeToString(reg.velocidad_monti),
            safeToString(reg.temperatura_flat),
            safeToString(reg.tiempo_flat),
            safeToString(reg.fecha),
            safeToString(formatearFecha(reg.fecha)),
            safeToString(reg.id)
        ].join(' ').toLowerCase();
        
        return datosCompletos.includes(termino);
    });
    
    return resultados;
}

function actualizarUI() {
    const registrosFiltrados = filtrarRegistrosArray();
    mostrarTabla(registrosFiltrados);
    actualizarCalendarioMensual();
    actualizarEstadisticas();
}

function actualizarEstadisticas() {
    const totalRegistros = registros.length;
    const registrosFiltrados = filtrarRegistrosArray();
    const filtroBadge = document.getElementById('filtroActivo');
    const totalSpan = document.getElementById('totalRegistros');
    
    if (totalSpan) {
        totalSpan.innerHTML = `${totalRegistros} registros`;
    }
    
    if (filtroBadge) {
        if (currentSemana || currentSearch) {
            filtroBadge.style.display = 'inline';
            filtroBadge.innerHTML = `${registrosFiltrados.length} resultados`;
        } else {
            filtroBadge.style.display = 'none';
        }
    }
}

function mostrarTabla(registrosMostrar) {
    const tbody = document.getElementById('tableBody');
    
    if (!tbody) return;
    
    if (registrosMostrar.length === 0) {
        tbody.innerHTML = '<tr><td colspan="23" class="loading">📭 Sin resultados</td></tr>';
        return;
    }
    
    tbody.innerHTML = registrosMostrar.map(reg => {
        const tieneHistorial = historialEdiciones[reg.id] && historialEdiciones[reg.id].length > 0;
        const rowClass = tieneHistorial ? 'has-history' : '';
        
        const plotterText = reg.plotter_temp ? 
            `#${reg.numero_plotter || 0} ${reg.plotter_temp.toFixed(1)}°/${reg.plotter_humedad.toFixed(0)}%` : 
            '-';
        
        const reemplazoIcon = reg.esReemplazo ? '🔄 Sí' : '⚙️ No';
        const procesoBadge = reg.proceso ? 
            `<span style="background: ${getProcesoColor(reg.proceso)}; color:white; padding:0.2rem 0.5rem; border-radius:1rem;">${reg.proceso}</span>` : 
            '-';
        
        return `
            <tr class="${rowClass}">
                <td><span class="po-badge" style="font-size:0.9rem;">${reg.po || '-'}</span></td>
                <td><span style="background:#ff0000; color:white; padding:0.2rem 0.5rem; border-radius:1rem; font-weight:900;">v${reg.version || 1}</span></td>
                <td>${procesoBadge}</td>
                <td>${reemplazoIcon}</td>
                <td>${reg.semana}</td>
                <td>${formatearFecha(reg.fecha)}</td>
                <td>${reg.estilo}</td>
                <td>${reg.tela}</td>
                <td style="color: #60a5fa; font-weight: 600;">${(reg.cyan || 0).toFixed(1)}</td>
                <td style="color: #f472b6; font-weight: 600;">${(reg.magenta || 0).toFixed(1)}</td>
                <td style="color: #fbbf24; font-weight: 600;">${(reg.yellow || 0).toFixed(1)}</td>
                <td style="color: #9ca3af; font-weight: 600;">${(reg.black || 0).toFixed(1)}</td>
                <td style="color: #40e0d0; font-weight:600;">${reg.color1_nombre}:${(reg.color1_valor || 0).toFixed(1)}</td>
                <td style="color: #ffa500; font-weight:600;">${reg.color2_nombre}:${(reg.color2_valor || 0).toFixed(1)}</td>
                <td style="color: #ffff00; font-weight:600; background:rgba(0,0,0,0.2);">${reg.color3_nombre}:${(reg.color3_valor || 0).toFixed(1)}</td>
                <td style="color: #ff69b4; font-weight:600;">${reg.color4_nombre}:${(reg.color4_valor || 0).toFixed(1)}</td>
                <td><span style="background: #9c27b0; color:white; padding:0.2rem 0.5rem; border-radius:1rem; font-size:0.7rem;">${plotterText}</span></td>
                <td>${reg.adhesivo || '-'}</td>
                <td>${(reg.temperatura_monti || 0).toFixed(1)}°</td>
                <td>${(reg.velocidad_monti || 0).toFixed(1)}</td>
                <td>${(reg.temperatura_flat || 0).toFixed(1)}°</td>
                <td>${(reg.tiempo_flat || 0).toFixed(1)}s</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit" onclick="editarRegistro('${reg.id}')" title="Editar">✏️</button>
                        <button class="btn-icon history" onclick="verHistorial('${reg.id}')" title="Historial">📋</button>
                        <button class="btn-icon print" onclick="imprimirRegistroIndividual('${reg.id}')" title="Imprimir QR">📱</button>
                        <button class="btn-icon delete" onclick="eliminarRegistro('${reg.id}')" title="Eliminar">🗑️</button>
                    </div>
                    ${reg.observacion ? `<small style="color:#ffd93d; display:block; margin-top:0.3rem;">📝 ${reg.observacion}</small>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function getProcesoColor(proceso) {
    const colores = {
        'DISEÑO': '#9c27b0',
        'PLOTTER': '#2196f3',
        'SUBLIMADO': '#ff9800',
        'FLAT': '#4caf50',
        'LASER': '#f44336',
        'BORDADO': '#795548'
    };
    return colores[proceso] || '#6b5bff';
}

// ==================== CALENDARIO MENSUAL ====================

function actualizarCalendarioMensual() {
    const container = document.getElementById('calendarioMensualContainer');
    
    if (!container) return;
    
    if (registros.length === 0) {
        container.innerHTML = '<p class="no-data">📅 Sin semanas</p>';
        return;
    }
    
    const mesesMap = new Map();
    
    registros.forEach(reg => {
        if (!reg.fecha) return;
        const fecha = new Date(reg.fecha);
        const año = fecha.getFullYear();
        const mes = fecha.getMonth();
        const mesKey = `${año}-${mes}`;
        const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
        
        if (!mesesMap.has(mesKey)) {
            mesesMap.set(mesKey, {
                nombre: nombreMes,
                año: año,
                mes: mes,
                semanas: new Set()
            });
        }
        
        mesesMap.get(mesKey).semanas.add(reg.semana);
    });
    
    const mesesArray = Array.from(mesesMap.entries())
        .sort((a, b) => b[0].localeCompare(a[0]));
    
    let html = '';
    for (let i = 0; i < mesesArray.length; i += 3) {
        const grupoMeses = mesesArray.slice(i, i + 3);
        
        grupoMeses.forEach(([key, mes]) => {
            const semanasArray = Array.from(mes.semanas).sort((a, b) => a - b);
            
            html += `
                <div class="mes-bloque">
                    <div class="mes-titulo">
                        <span>${mes.nombre}</span>
                        <span>${semanasArray.length}</span>
                    </div>
                    <div class="semanas-mes">
                        ${semanasArray.map(semana => {
                            const isActive = currentSemana == semana;
                            return `
                                <span class="semana-mes-chip ${isActive ? 'active' : ''}" 
                                      onclick="filtrarPorSemana('${semana}')">
                                    ${semana}
                                </span>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
}

window.filtrarPorSemana = (semana) => {
    if (currentSemana == semana) {
        currentSemana = '';
        mostrarNotificacion('📅 Filtro de semana eliminado', 'info');
    } else {
        currentSemana = semana;
        mostrarNotificacion(`📅 Semana ${semana} seleccionada`, 'success');
    }
    actualizarUI();
    actualizarEstadisticas();
};

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.value = hoy;
        fechaInput.setAttribute('max', hoy);
        fechaInput.addEventListener('change', verificarFechaObservacion);
    }
    
    const toggleBtn = document.getElementById('toggleExtrasBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleExtras);
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            actualizarUI();
            actualizarEstadisticas();
        });
    }
    
    const clearSearch = document.getElementById('clearSearch');
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            currentSearch = '';
            actualizarUI();
            actualizarEstadisticas();
        });
    }
    
    const limpiarFiltro = document.getElementById('limpiarFiltroBtn');
    if (limpiarFiltro) {
        limpiarFiltro.addEventListener('click', () => {
            currentSearch = '';
            currentSemana = '';
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            actualizarUI();
            actualizarEstadisticas();
            mostrarNotificacion('🧹 Filtros eliminados', 'info');
        });
    }
    
    cargarRegistrosLocal();
    configurarEventos();
    actualizarUI();
    actualizarEstadisticas();
});

function toggleExtras() {
    const extrasContainer = document.getElementById('extrasContainer');
    const toggleBtn = document.getElementById('toggleExtrasBtn');
    
    if (!extrasContainer || !toggleBtn) return;
    
    if (extrasContainer.style.display === 'none') {
        extrasContainer.style.display = 'block';
        toggleBtn.innerHTML = '<span>🎨</span> OCULTAR COLORES EXTRAS';
    } else {
        extrasContainer.style.display = 'none';
        toggleBtn.innerHTML = '<span>🎨</span> MOSTRAR COLORES EXTRAS';
    }
}

function verificarFechaObservacion() {
    const fechaInput = document.getElementById('fecha');
    const observacionContainer = document.getElementById('observacionContainer');
    const observacionField = document.getElementById('observacion');
    
    if (!fechaInput || !observacionContainer || !observacionField) return;
    
    const fechaSeleccionada = fechaInput.value;
    const hoy = new Date().toISOString().split('T')[0];
    
    if (fechaSeleccionada < hoy) {
        observacionContainer.style.display = 'block';
        observacionField.required = true;
    } else {
        observacionContainer.style.display = 'none';
        observacionField.required = false;
        observacionField.value = '';
    }
}

function configurarEventos() {
    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', guardarRegistro);
    }
    
    const cancelEdit = document.getElementById('cancelEditBtn');
    if (cancelEdit) {
        cancelEdit.addEventListener('click', cancelarEdicion);
    }
    
    const exportarDB = document.getElementById('exportarDBBtn');
    if (exportarDB) {
        exportarDB.addEventListener('click', exportarBaseDatos);
    }
    
    const importarDB = document.getElementById('importarDB');
    if (importarDB) {
        importarDB.addEventListener('change', importarBaseDatos);
    }
    
    const imprimirReportes = document.getElementById('imprimirReportesBtn');
    if (imprimirReportes) {
        imprimirReportes.addEventListener('click', imprimirReportesHandler);
    }
    
    const exportarExcel = document.getElementById('exportarExcelBtn');
    if (exportarExcel) {
        exportarExcel.addEventListener('click', exportarAExcel);
    }
    
    const imprimirIndividual = document.getElementById('imprimirIndividualBtn');
    if (imprimirIndividual) {
        imprimirIndividual.addEventListener('click', () => {
            abrirModalSeleccionRegistro();
        });
    }
    
    const modals = document.querySelectorAll('.modal');
    document.querySelectorAll('.close-modal, .modal-close, .modal-btn, .cancel-btn, .close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(modal => modal.classList.remove('show'));
        });
    });
    
    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
}

// ==================== EXPORTAR A EXCEL ====================
function exportarAExcel() {
    if (typeof XLSX === 'undefined') {
        mostrarNotificacion('❌ Error: Librería XLSX no cargada', 'error');
        console.error('XLSX no está definido');
        return;
    }
    
    const registrosFiltrados = filtrarRegistrosArray();
    
    if (registrosFiltrados.length === 0) {
        mostrarNotificacion('❌ No hay registros para exportar', 'error');
        return;
    }
    
    try {
        const datosExcel = registrosFiltrados.map(reg => ({
            'PO': reg.po || '',
            'Versión': reg.version || 1,
            'Proceso': reg.proceso || '',
            'Reemplazo': reg.esReemplazo ? 'Sí' : 'No',
            'Semana': reg.semana,
            'Fecha': reg.fecha,
            'Estilo/Deporte': reg.estilo,
            'Tela': reg.tela,
            'Cian (C)': reg.cyan || 0,
            'Magenta (M)': reg.magenta || 0,
            'Yellow (Y)': reg.yellow || 0,
            'Black (K)': reg.black || 0,
            'Turquesa': reg.color1_valor || 0,
            'Naranja': reg.color2_valor || 0,
            'Fluor Yellow': reg.color3_valor || 0,
            'Fluor Pink': reg.color4_valor || 0,
            'N° Plotter': reg.numero_plotter || 0,
            'Plotter Temp': reg.plotter_temp || 0,
            'Plotter Humedad': reg.plotter_humedad || 0,
            'Plotter Perfil': reg.plotter_perfil || '',
            'Adhesivo': reg.adhesivo,
            'Temp Monti °C': reg.temperatura_monti,
            'Vel Monti m/min': reg.velocidad_monti,
            'Temp Flat °C': reg.temperatura_flat,
            'Tiempo Flat s': reg.tiempo_flat,
            'Observación': reg.observacion || ''
        }));
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosExcel);
        XLSX.utils.book_append_sheet(wb, ws, 'Registros ALPHA DB');
        
        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `ALPHA_DB_${fecha}.xlsx`);
        
        mostrarNotificacion('📊 Archivo Excel generado', 'success');
    } catch (error) {
        console.error('Error en exportarAExcel:', error);
        mostrarNotificacion('❌ Error al generar Excel', 'error');
    }
}

// ==================== MANEJO DE REGISTROS ====================

function guardarRegistro(e) {
    e.preventDefault();
    
    // Verificar que todos los elementos existen
    const fechaStr = document.getElementById('fecha')?.value;
    const po = document.getElementById('po')?.value;
    const proceso = document.getElementById('proceso')?.value;
    const estilo = document.getElementById('estilo')?.value;
    const tela = document.getElementById('tela')?.value;
    const observacion = document.getElementById('observacion')?.value;
    
    if (!fechaStr || !po || !proceso || !estilo || !tela) {
        mostrarNotificacion('❌ Faltan campos requeridos', 'error');
        return;
    }
    
    const fecha = new Date(fechaStr);
    const semana = obtenerSemana(fecha);
    const editId = document.getElementById('editId').value;
    const ahora = new Date().toISOString();
    
    const hoy = new Date().toISOString().split('T')[0];
    
    // Validar fecha anterior con observación
    if (fechaStr < hoy && !observacion) {
        mostrarNotificacion('❌ Debes agregar una observación para fechas anteriores', 'error');
        return;
    }
    
    let descripcionEdicion = '';
    if (editId) {
        descripcionEdicion = prompt('📝 Describe brevemente qué cambios realizaste en esta edición:', '');
    }
    
    const registroData = {
        id: editId || generarIdUnico(),
        po: po.toUpperCase(),
        proceso: proceso,
        esReemplazo: document.getElementById('esReemplazo')?.checked || false,
        semana: semana,
        fecha: fechaStr,
        estilo: estilo.toUpperCase(),
        tela: tela.toUpperCase(),
        
        cyan: parseFloat(document.getElementById('cyan')?.value) || 0,
        magenta: parseFloat(document.getElementById('magenta')?.value) || 0,
        yellow: parseFloat(document.getElementById('yellow')?.value) || 0,
        black: parseFloat(document.getElementById('black')?.value) || 0,
        
        color1_nombre: 'TURQUESA',
        color1_valor: parseFloat(document.getElementById('color1_valor')?.value) || 0,
        color2_nombre: 'NARANJA',
        color2_valor: parseFloat(document.getElementById('color2_valor')?.value) || 0,
        color3_nombre: 'FLUOR YELLOW',
        color3_valor: parseFloat(document.getElementById('color3_valor')?.value) || 0,
        color4_nombre: 'FLUOR PINK',
        color4_valor: parseFloat(document.getElementById('color4_valor')?.value) || 0,
        
        numero_plotter: parseInt(document.getElementById('numero_plotter')?.value) || 0,
        plotter_temp: parseFloat(document.getElementById('plotter_temp')?.value) || 0,
        plotter_humedad: parseFloat(document.getElementById('plotter_humedad')?.value) || 0,
        plotter_perfil: document.getElementById('plotter_perfil')?.value.toUpperCase() || '',
        
        adhesivo: document.getElementById('adhesivo')?.value.toUpperCase() || '',
        
        temperatura_monti: parseFloat(document.getElementById('temp_monti')?.value) || 0,
        velocidad_monti: parseFloat(document.getElementById('vel_monti')?.value) || 0,
        temperatura_flat: parseFloat(document.getElementById('temp_flat')?.value) || 0,
        tiempo_flat: parseFloat(document.getElementById('tiempo_flat')?.value) || 0,
        creado: ahora,
        actualizado: ahora,
        version: 1,
        observacion: observacion || null,
        descripcion_edicion: descripcionEdicion || null
    };
    
    if (editId) {
        const index = registros.findIndex(r => r.id === editId);
        if (index !== -1) {
            const original = registros[index];
            
            if (!historialEdiciones[editId]) {
                historialEdiciones[editId] = [];
            }
            
            // IMPORTANTE: NO guardamos el objeto historial dentro del registro
            // Solo guardamos la referencia en historialEdiciones aparte
            historialEdiciones[editId].push({
                fecha: ahora,
                descripcion: descripcionEdicion || 'Edición sin descripción',
                anterior: {
                    po: original.po,
                    proceso: original.proceso,
                    esReemplazo: original.esReemplazo,
                    version: original.version
                },
                nuevo: {
                    po: registroData.po,
                    proceso: registroData.proceso,
                    esReemplazo: registroData.esReemplazo,
                    version: registroData.version
                }
            });
            
            registroData.creado = original.creado;
            registroData.version = (original.version || 1) + 1;
            registroData.actualizado = ahora;
            // NO guardamos registroData.historial = historialEdiciones[editId] (esto causa el error circular)
            
            registros[index] = registroData;
            mostrarNotificacion(`✅ Registro editado (versión ${registroData.version})`, 'success');
        }
    } else {
        if (observacion) {
            registroData.observacion = observacion;
            mostrarNotificacion('📝 Registro con observación guardado', 'info');
        }
        registros.unshift(registroData);
        mostrarNotificacion('✅ Registro guardado en ALPHA DB', 'success');
    }
    
    guardarRegistrosLocal();
    resetFormulario();
    actualizarUI();
    actualizarEstadisticas();
}

function verHistorial(id) {
    const registro = registros.find(r => r.id === id);
    if (!registro) return;
    
    const historial = historialEdiciones[id] || [];
    const modal = document.getElementById('modalHistorial');
    const container = document.getElementById('historialContainer');
    
    if (!modal || !container) return;
    
    let html = '';
    
    if (historial.length === 0) {
        html = '<p class="no-data">No hay historial de ediciones</p>';
    } else {
        html = historial.map((entry, index) => {
            return `
                <div class="historial-item">
                    <div class="historial-fecha">
                        <span>📅 ${new Date(entry.fecha).toLocaleString()}</span>
                        <span class="historial-version">v${index + 2}</span>
                        ${entry.descripcion ? `<span class="historial-descripcion">📝 ${entry.descripcion}</span>` : ''}
                    </div>
                    <div style="margin-top:0.5rem; display: flex; gap: 1rem;">
                        <div style="flex:1; border-left: 2px solid #ff6b6b; padding-left: 0.5rem;">
                            <div style="font-size:0.7rem; color:#ff6b6b;">ANTERIOR</div>
                            <div>PO: ${entry.anterior.po || '-'}</div>
                            <div>Proceso: ${entry.anterior.proceso || '-'}</div>
                            <div>Versión: v${entry.anterior.version || 1}</div>
                        </div>
                        <div style="flex:1; border-left: 2px solid #4caf50; padding-left: 0.5rem;">
                            <div style="font-size:0.7rem; color:#4caf50;">NUEVO</div>
                            <div>PO: ${entry.nuevo.po || '-'}</div>
                            <div>Proceso: ${entry.nuevo.proceso || '-'}</div>
                            <div>Versión: v${entry.nuevo.version || 2}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    html += `
        <div class="historial-item" style="border-color: #ffd93d;">
            <div class="historial-fecha">
                <span style="color: #ffd93d;">⚡ VERSIÓN ACTUAL ${registro.version}</span>
                <span>${new Date(registro.actualizado).toLocaleString()}</span>
                ${registro.descripcion_edicion ? `<span>📝 ${registro.descripcion_edicion}</span>` : ''}
            </div>
            <div style="margin-top:0.5rem;">
                <div>PO: ${registro.po || '-'} | Proceso: ${registro.proceso || '-'}</div>
            </div>
            ${registro.observacion ? `<div style="margin-top:0.5rem; color:#ffd93d;">📝 ${registro.observacion}</div>` : ''}
        </div>
    `;
    
    container.innerHTML = html;
    modal.classList.add('show');
}

function editarRegistro(id) {
    const registro = registros.find(r => r.id === id);
    if (!registro) {
        mostrarNotificacion('❌ Registro no encontrado', 'error');
        return;
    }
    
    editandoId = id;
    document.getElementById('editId').value = id;
    
    const setValueIfExists = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value !== undefined && value !== null ? value : '';
    };
    
    setValueIfExists('po', registro.po || '');
    setValueIfExists('proceso', registro.proceso || '');
    const esReemplazo = document.getElementById('esReemplazo');
    if (esReemplazo) esReemplazo.checked = registro.esReemplazo || false;
    setValueIfExists('fecha', registro.fecha);
    setValueIfExists('estilo', registro.estilo);
    setValueIfExists('tela', registro.tela);
    
    setValueIfExists('cyan', registro.cyan);
    setValueIfExists('magenta', registro.magenta);
    setValueIfExists('yellow', registro.yellow);
    setValueIfExists('black', registro.black);
    
    setValueIfExists('color1_valor', registro.color1_valor);
    setValueIfExists('color2_valor', registro.color2_valor);
    setValueIfExists('color3_valor', registro.color3_valor);
    setValueIfExists('color4_valor', registro.color4_valor);
    
    setValueIfExists('numero_plotter', registro.numero_plotter);
    setValueIfExists('plotter_temp', registro.plotter_temp);
    setValueIfExists('plotter_humedad', registro.plotter_humedad);
    setValueIfExists('plotter_perfil', registro.plotter_perfil);
    
    setValueIfExists('adhesivo', registro.adhesivo);
    setValueIfExists('temp_monti', registro.temperatura_monti);
    setValueIfExists('vel_monti', registro.velocidad_monti);
    setValueIfExists('temp_flat', registro.temperatura_flat);
    setValueIfExists('tiempo_flat', registro.tiempo_flat);
    
    verificarFechaObservacion();
    if (registro.observacion) {
        setValueIfExists('observacion', registro.observacion);
    }
    
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.innerHTML = '✏️ EDITANDO REGISTRO';
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.innerHTML = '<span>✏️</span> ACTUALIZAR';
    
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) cancelEditBtn.style.display = 'block';
    
    const formSection = document.querySelector('.form-section');
    if (formSection) {
        formSection.classList.add('edit-mode');
        formSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function cancelarEdicion() {
    resetFormulario();
    mostrarNotificacion('✏️ Edición cancelada', 'info');
}

function resetFormulario() {
    editandoId = null;
    document.getElementById('editId').value = '';
    document.getElementById('registroForm').reset();
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) fechaInput.value = hoy;
    
    const observacionContainer = document.getElementById('observacionContainer');
    if (observacionContainer) observacionContainer.style.display = 'none';
    
    const observacionField = document.getElementById('observacion');
    if (observacionField) {
        observacionField.required = false;
        observacionField.value = '';
    }
    
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.innerHTML = '➕ NUEVO REGISTRO';
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.innerHTML = '<span>💾</span> GUARDAR';
    
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';
    
    const formSection = document.querySelector('.form-section');
    if (formSection) formSection.classList.remove('edit-mode');
}

function eliminarRegistro(id) {
    if (confirm('¿Eliminar este registro de ALPHA DB?')) {
        registros = registros.filter(r => r.id !== id);
        delete historialEdiciones[id];
        guardarRegistrosLocal();
        
        if (editandoId === id) {
            cancelarEdicion();
        }
        
        actualizarUI();
        actualizarEstadisticas();
        mostrarNotificacion('🗑️ Registro eliminado', 'success');
    }
}

// ==================== ALMACENAMIENTO ====================

function cargarRegistrosLocal() {
    const datosGuardados = localStorage.getItem('alpha_db_registros_v8');
    if (datosGuardados) {
        try {
            const data = JSON.parse(datosGuardados);
            registros = data.registros || [];
            historialEdiciones = data.historial || {};
        } catch (e) {
            console.error('Error al cargar:', e);
            registros = generarDatosEjemplo();
            historialEdiciones = {};
        }
    } else {
        registros = generarDatosEjemplo();
        guardarRegistrosLocal();
    }
}

function generarDatosEjemplo() {
    const ejemplos = [];
    
    const pos = ['PO-2401-001', 'PO-2401-002', 'PO-2402-015', 'PO-2402-023'];
    const procesos = ['DISEÑO', 'PLOTTER', 'SUBLIMADO', 'FLAT', 'LASER', 'BORDADO'];
    const estilos = ['LIBRE', 'MARIPOSA', 'PECHO', 'ESPALDA'];
    const telas = ['ALGODÓN', 'POLIÉSTER', 'NYLON'];
    const ahora = new Date().toISOString();
    const hoy = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < 15; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i * 2);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        ejemplos.push({
            id: generarIdUnico(),
            po: pos[Math.floor(Math.random() * pos.length)],
            proceso: procesos[Math.floor(Math.random() * procesos.length)],
            esReemplazo: Math.random() > 0.7,
            semana: obtenerSemana(fecha),
            fecha: fechaStr,
            estilo: estilos[Math.floor(Math.random() * estilos.length)],
            tela: telas[Math.floor(Math.random() * telas.length)],
            cyan: parseFloat((Math.random() * 100).toFixed(1)),
            magenta: parseFloat((Math.random() * 100).toFixed(1)),
            yellow: parseFloat((Math.random() * 100).toFixed(1)),
            black: parseFloat((Math.random() * 100).toFixed(1)),
            color1_nombre: 'TURQUESA',
            color1_valor: parseFloat((Math.random() * 100).toFixed(1)),
            color2_nombre: 'NARANJA',
            color2_valor: parseFloat((Math.random() * 100).toFixed(1)),
            color3_nombre: 'FLUOR YELLOW',
            color3_valor: parseFloat((Math.random() * 100).toFixed(1)),
            color4_nombre: 'FLUOR PINK',
            color4_valor: parseFloat((Math.random() * 100).toFixed(1)),
            numero_plotter: Math.floor(Math.random() * 5),
            plotter_temp: parseFloat((20 + Math.random() * 10).toFixed(1)),
            plotter_humedad: parseFloat((40 + Math.random() * 20).toFixed(0)),
            plotter_perfil: ['BAJO', 'MEDIO', 'ALTO'][Math.floor(Math.random() * 3)],
            adhesivo: 'TIPO A',
            temperatura_monti: parseFloat((170 + Math.random() * 20).toFixed(1)),
            velocidad_monti: parseFloat((2 + Math.random() * 2).toFixed(1)),
            temperatura_flat: parseFloat((150 + Math.random() * 20).toFixed(1)),
            tiempo_flat: parseFloat((10 + Math.random() * 10).toFixed(1)),
            creado: ahora,
            actualizado: ahora,
            version: 1,
            observacion: fechaStr < hoy ? 'Registro retroactivo' : null
        });
    }
    
    return ejemplos;
}

function guardarRegistrosLocal() {
    try {
        // IMPORTANTE: Guardamos registros e historial por separado
        // Los registros NO deben contener el historial para evitar círculos
        const registrosParaGuardar = registros.map(reg => {
            // Crear una copia sin la propiedad historial si existe
            const { historial, ...regSinHistorial } = reg;
            return regSinHistorial;
        });
        
        const dataToSave = {
            registros: registrosParaGuardar,
            historial: historialEdiciones
        };
        localStorage.setItem('alpha_db_registros_v8', JSON.stringify(dataToSave));
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
        mostrarNotificacion('❌ Error al guardar datos localmente', 'error');
    }
}

function exportarBaseDatos() {
    try {
        const registrosParaExportar = registros.map(reg => {
            const { historial, ...regSinHistorial } = reg;
            return regSinHistorial;
        });
        
        const dataToExport = {
            sistema: SISTEMA_NOMBRE,
            version: DB_VERSION,
            fecha_exportacion: new Date().toISOString(),
            registros: registrosParaExportar,
            historial: historialEdiciones,
            total_registros: registros.length
        };
        
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ALPHA_DB_${new Date().toISOString().split('T')[0]}${DB_EXTENSION}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        mostrarNotificacion('💾 Base de datos ALPHA DB guardada');
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('❌ Error al guardar', 'error');
    }
}

function importarBaseDatos(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith(DB_EXTENSION)) {
        mostrarNotificacion('❌ Debe ser archivo .adb', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!importedData.registros || !Array.isArray(importedData.registros)) {
                throw new Error('Estructura inválida');
            }
            
            if (confirm(`¿Cargar ${importedData.registros.length} registros en ALPHA DB?`)) {
                registros = importedData.registros;
                historialEdiciones = importedData.historial || {};
                guardarRegistrosLocal();
                cancelarEdicion();
                actualizarUI();
                actualizarEstadisticas();
                mostrarNotificacion(`📂 Cargados ${registros.length} registros`);
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('❌ Archivo inválido', 'error');
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

// ==================== FUNCIONES DE IMPRESIÓN ====================

function imprimirReportesHandler() {
    const registrosFiltrados = filtrarRegistrosArray();
    
    if (registrosFiltrados.length === 0) {
        mostrarNotificacion('❌ No hay registros', 'error');
        return;
    }
    
    const ventanaImpresion = window.open('', '_blank');
    
    let htmlContenido = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>ALPHA DB - Reporte</title>
            <style>
                body { font-family: Arial; margin: 0.5in; background: white; color: black; }
                h1 { color: #000; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
                th { background: #000; color: white; padding: 6px; text-align: left; }
                td { padding: 4px; border-bottom: 1px solid #000; }
                .total { margin-top: 20px; font-weight: bold; text-align: right; }
            </style>
        </head>
        <body>
            <h1>⚡ ALPHA DB - REPORTE COMPLETO</h1>
            <p>Fecha de impresión: ${new Date().toLocaleString()}</p>
            <p>Total de registros: ${registrosFiltrados.length}</p>
            <table>
                <thead>
                    <tr>
                        <th>PO</th>
                        <th>V</th>
                        <th>Proceso</th>
                        <th>Reemp</th>
                        <th>Sem</th>
                        <th>Fecha</th>
                        <th>Estilo</th>
                        <th>Tela</th>
                        <th>C</th>
                        <th>M</th>
                        <th>Y</th>
                        <th>K</th>
                        <th>Turq</th>
                        <th>Nar</th>
                        <th>F.Y</th>
                        <th>F.P</th>
                        <th>Plotter</th>
                        <th>Adh</th>
                        <th>T°M</th>
                        <th>Vel</th>
                        <th>T°F</th>
                        <th>T/F</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    registrosFiltrados.forEach(reg => {
        const plotterText = reg.plotter_temp ? 
            `${reg.plotter_temp.toFixed(1)}°/${reg.plotter_humedad.toFixed(0)}%` : 
            '-';
        
        htmlContenido += `
            <tr>
                <td>${reg.po || '-'}</td>
                <td>v${reg.version || 1}</td>
                <td>${reg.proceso || '-'}</td>
                <td>${reg.esReemplazo ? 'Sí' : 'No'}</td>
                <td>${reg.semana}</td>
                <td>${formatearFecha(reg.fecha)}</td>
                <td>${reg.estilo}</td>
                <td>${reg.tela}</td>
                <td>${(reg.cyan || 0).toFixed(1)}</td>
                <td>${(reg.magenta || 0).toFixed(1)}</td>
                <td>${(reg.yellow || 0).toFixed(1)}</td>
                <td>${(reg.black || 0).toFixed(1)}</td>
                <td>${(reg.color1_valor || 0).toFixed(1)}</td>
                <td>${(reg.color2_valor || 0).toFixed(1)}</td>
                <td>${(reg.color3_valor || 0).toFixed(1)}</td>
                <td>${(reg.color4_valor || 0).toFixed(1)}</td>
                <td>${plotterText}</td>
                <td>${reg.adhesivo || '-'}</td>
                <td>${(reg.temperatura_monti || 0).toFixed(1)}°</td>
                <td>${(reg.velocidad_monti || 0).toFixed(1)}</td>
                <td>${(reg.temperatura_flat || 0).toFixed(1)}°</td>
                <td>${(reg.tiempo_flat || 0).toFixed(1)}s</td>
            </tr>
        `;
    });
    
    htmlContenido += `
                </tbody>
            </table>
            <div class="total">Total: ${registrosFiltrados.length} registros</div>
            <script>window.onload = () => window.print();<\/script>
        </body>
        </html>
    `;
    
    ventanaImpresion.document.write(htmlContenido);
    ventanaImpresion.document.close();
}

function imprimirRegistroIndividual(id) {
    const registro = registros.find(r => r.id === id);
    if (!registro) {
        mostrarNotificacion('❌ Registro no encontrado', 'error');
        return;
    }
    
    if (typeof QRCode === 'undefined') {
        mostrarNotificacion('❌ Error: Librería QR no cargada', 'error');
        return;
    }
    
    const ventanaImpresion = window.open('', '_blank');
    
    // Datos para QR (resumidos para que no sea muy grande)
    const datosQR = {
        id: registro.id,
        po: registro.po,
        version: registro.version,
        proceso: registro.proceso,
        reemplazo: registro.esReemplazo,
        fecha: registro.fecha,
        estilo: registro.estilo,
        tela: registro.tela,
        colores: {
            cyan: registro.cyan,
            magenta: registro.magenta,
            yellow: registro.yellow,
            black: registro.black,
            turquesa: registro.color1_valor,
            naranja: registro.color2_valor,
            fluorYellow: registro.color3_valor,
            fluorPink: registro.color4_valor
        },
        plotter: {
            num: registro.numero_plotter,
            temp: registro.plotter_temp,
            hum: registro.plotter_humedad,
            perfil: registro.plotter_perfil
        },
        monti: {
            temp: registro.temperatura_monti,
            vel: registro.velocidad_monti,
            presion: registro.monti_presion
        },
        flat: {
            temp: registro.temperatura_flat,
            tiempo: registro.tiempo_flat
        },
        adhesivo: registro.adhesivo
    };
    
    const qrData = JSON.stringify(datosQR);
    
    const htmlContenido = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>ALPHA DB - Etiqueta Textil</title>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
            <style>
                body { 
                    margin: 0; 
                    padding: 0.25in; 
                    font-family: 'Arial', sans-serif; 
                    background: white; 
                }
                .etiqueta { 
                    border: 3px solid #000; 
                    padding: 20px; 
                    border-radius: 15px;
                    max-width: 8.5in;
                    margin: 0 auto;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                .header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                    border-bottom: 3px solid #000; 
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .header h1 { 
                    margin: 0;
                    font-size: 28px;
                    font-weight: 800;
                    color: #000;
                }
                .po-version {
                    text-align: right;
                }
                .po-destacado {
                    font-size: 32px;
                    font-weight: 900;
                    color: #000;
                    line-height: 1.2;
                    letter-spacing: 1px;
                }
                .version-destacado {
                    font-size: 24px;
                    font-weight: 900;
                    color: #ff0000;
                    line-height: 1.2;
                }
                .info-principal {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin: 20px 0;
                    padding: 15px;
                    background: #f5f5f5;
                    border-radius: 10px;
                }
                .info-item {
                    display: flex;
                    flex-direction: column;
                }
                .info-label {
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                    font-weight: 600;
                }
                .info-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: #000;
                }
                .seccion-titulo {
                    font-size: 16px;
                    font-weight: 800;
                    color: #000;
                    margin: 20px 0 10px 0;
                    padding-bottom: 5px;
                    border-bottom: 2px solid #000;
                    text-transform: uppercase;
                }
                .colores-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    margin: 15px 0;
                }
                .color-box {
                    background: #f0f0f0;
                    padding: 10px;
                    border-radius: 8px;
                    text-align: center;
                    border: 1px solid #ccc;
                }
                .color-nombre {
                    font-size: 12px;
                    font-weight: 600;
                    color: #333;
                }
                .color-valor {
                    font-size: 16px;
                    font-weight: 700;
                    color: #000;
                }
                .parametros-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 15px;
                    margin: 15px 0;
                }
                .param-box {
                    background: #f0f0f0;
                    padding: 12px;
                    border-radius: 8px;
                    border-left: 4px solid #000;
                }
                .param-titulo {
                    font-size: 12px;
                    font-weight: 600;
                    color: #666;
                    text-transform: uppercase;
                }
                .param-valor {
                    font-size: 18px;
                    font-weight: 700;
                    color: #000;
                    margin-top: 5px;
                }
                .param-sub {
                    font-size: 12px;
                    color: #333;
                }
                .footer {
                    text-align: center;
                    border-top: 2px solid #000;
                    padding-top: 15px;
                    margin-top: 20px;
                    font-size: 12px;
                    color: #666;
                }
                .qr-section {
                    display: flex;
                    justify-content: center;
                    margin: 20px 0;
                }
                #qrcode {
                    padding: 15px;
                    background: white;
                    border: 2px solid #000;
                    border-radius: 10px;
                }
                .proceso-badge {
                    display: inline-block;
                    padding: 5px 15px;
                    border-radius: 20px;
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                    margin-right: 10px;
                }
                .reemplazo-badge {
                    background: #ffd93d;
                    color: black;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 14px;
                }
                .observacion {
                    margin-top: 15px;
                    padding: 10px;
                    background: #fff3cd;
                    border-left: 4px solid #ffd93d;
                    font-style: italic;
                }
            </style>
        </head>
        <body>
            <div class="etiqueta">
                <!-- HEADER con PO y VERSIÓN destacados -->
                <div class="header">
                    <h1>⚡ ALPHA DB</h1>
                    <div class="po-version">
                        <div class="po-destacado">${registro.po || 'S/PO'}</div>
                        <div class="version-destacado">v${registro.version || 1}</div>
                    </div>
                </div>
                
                <!-- Proceso y Reemplazo -->
                <div style="display: flex; gap: 10px; margin: 10px 0;">
                    <span class="proceso-badge" style="background: ${getProcesoColor(registro.proceso)};">
                        ${registro.proceso || 'PROCESO'}
                    </span>
                    ${registro.esReemplazo ? '<span class="reemplazo-badge">🔄 REEMPLAZO</span>' : ''}
                </div>
                
                <!-- Información Principal -->
                <div class="info-principal">
                    <div class="info-item">
                        <span class="info-label">Fecha</span>
                        <span class="info-value">${formatearFecha(registro.fecha)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Semana</span>
                        <span class="info-value">${registro.semana}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Estilo/Deporte</span>
                        <span class="info-value">${registro.estilo}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Tela</span>
                        <span class="info-value">${registro.tela}</span>
                    </div>
                </div>
                
                <!-- SECCIÓN COLORES -->
                <div class="seccion-titulo">🎨 ESPECIFICACIÓN DE COLORES</div>
                <div class="colores-grid">
                    <div class="color-box">
                        <div class="color-nombre">CYAN</div>
                        <div class="color-valor">${(registro.cyan || 0).toFixed(1)}%</div>
                    </div>
                    <div class="color-box">
                        <div class="color-nombre">MAGENTA</div>
                        <div class="color-valor">${(registro.magenta || 0).toFixed(1)}%</div>
                    </div>
                    <div class="color-box">
                        <div class="color-nombre">YELLOW</div>
                        <div class="color-valor">${(registro.yellow || 0).toFixed(1)}%</div>
                    </div>
                    <div class="color-box">
                        <div class="color-nombre">BLACK</div>
                        <div class="color-valor">${(registro.black || 0).toFixed(1)}%</div>
                    </div>
                    <div class="color-box">
                        <div class="color-nombre">${registro.color1_nombre}</div>
                        <div class="color-valor">${(registro.color1_valor || 0).toFixed(1)}%</div>
                    </div>
                    <div class="color-box">
                        <div class="color-nombre">${registro.color2_nombre}</div>
                        <div class="color-valor">${(registro.color2_valor || 0).toFixed(1)}%</div>
                    </div>
                    <div class="color-box">
                        <div class="color-nombre">${registro.color3_nombre}</div>
                        <div class="color-valor">${(registro.color3_valor || 0).toFixed(1)}%</div>
                    </div>
                    <div class="color-box">
                        <div class="color-nombre">${registro.color4_nombre}</div>
                        <div class="color-valor">${(registro.color4_valor || 0).toFixed(1)}%</div>
                    </div>
                </div>
                
                <!-- SECCIÓN PARÁMETROS DE PRODUCCIÓN -->
                <div class="seccion-titulo">⚙️ PARÁMETROS DE PRODUCCIÓN</div>
                <div class="parametros-grid">
                    <!-- PLOTTER -->
                    <div class="param-box">
                        <div class="param-titulo">🖨️ PLOTTER</div>
                        <div class="param-valor">#${registro.numero_plotter || 0}</div>
                        <div class="param-sub">Temp: ${(registro.plotter_temp || 0).toFixed(1)}°C</div>
                        <div class="param-sub">Humedad: ${(registro.plotter_humedad || 0).toFixed(0)}%</div>
                        <div class="param-sub">Perfil: ${registro.plotter_perfil || '-'}</div>
                    </div>
                    
                    <!-- MONTI -->
                    <div class="param-box">
                        <div class="param-titulo">🔥 MONTI</div>
                        <div class="param-valor">#${registro.monti_numero || 0}</div>
                        <div class="param-sub">Temp: ${(registro.temperatura_monti || 0).toFixed(1)}°C</div>
                        <div class="param-sub">Vel: ${(registro.velocidad_monti || 0).toFixed(1)} m/min</div>
                        <div class="param-sub">Presión: ${(registro.monti_presion || 0).toFixed(1)} bar</div>
                    </div>
                    
                    <!-- FLAT -->
                    <div class="param-box">
                        <div class="param-titulo">📏 FLAT</div>
                        <div class="param-valor">Temp: ${(registro.temperatura_flat || 0).toFixed(1)}°C</div>
                        <div class="param-sub">Tiempo: ${(registro.tiempo_flat || 0).toFixed(1)} s</div>
                        <div class="param-sub">Adhesivo: ${registro.adhesivo || '-'}</div>
                    </div>
                </div>
                
                <!-- CÓDIGO QR -->
                <div class="qr-section">
                    <div id="qrcode"></div>
                </div>
                
                <!-- OBSERVACIÓN (si existe) -->
                ${registro.observacion ? `
                    <div class="observacion">
                        <strong>📝 Observación:</strong> ${registro.observacion}
                    </div>
                ` : ''}
                
                <!-- FOOTER -->
                <div class="footer">
                    <p><strong>ALPHA DB</strong> - Alpha Data Base | Trazabilidad Textil en Tiempo Real</p>
                    <div>ID: ${registro.id} | Impreso: ${new Date().toLocaleString()}</div>
                </div>
            </div>
            
            <script>
                new QRCode(document.getElementById("qrcode"), {
                    text: ${JSON.stringify(qrData)},
                    width: 150,
                    height: 150
                });
                window.onload = () => setTimeout(() => window.print(), 1000);
            <\/script>
        </body>
        </html>
    `;
    
    ventanaImpresion.document.write(htmlContenido);
    ventanaImpresion.document.close();
}

function abrirModalSeleccionRegistro() {
    const select = document.getElementById('selectRegistroImprimir');
    const modal = document.getElementById('modalImpresion');
    
    if (!select || !modal) return;
    
    if (registros.length === 0) {
        select.innerHTML = '<option value="">No hay registros</option>';
    } else {
        select.innerHTML = registros.map(reg => {
            return `<option value="${reg.id}">${reg.po || 'S/PO'} v${reg.version || 1} | ${reg.fecha} | ${reg.estilo}</option>`;
        }).join('');
    }
    
    modal.classList.add('show');
}

function imprimirRegistroSeleccionado() {
    const select = document.getElementById('selectRegistroImprimir');
    const id = select ? select.value : null;
    
    if (id) {
        document.getElementById('modalImpresion').classList.remove('show');
        imprimirRegistroIndividual(id);
    } else {
        mostrarNotificacion('❌ Selecciona un registro', 'error');
    }
}

// Hacer funciones globales
window.editarRegistro = editarRegistro;
window.verHistorial = verHistorial;
window.imprimirRegistroIndividual = imprimirRegistroIndividual;
window.eliminarRegistro = eliminarRegistro;
window.abrirModalSeleccionRegistro = abrirModalSeleccionRegistro;
window.getProcesoColor = getProcesoColor;