// CONTROL T - Sistema de Gestión Premium
// Versión 5.0 - Con CMYK, Calendario Mensual y Exportación Excel

// ==================== CONFIGURACIÓN ====================
const DB_VERSION = '5.0';
const DB_EXTENSION = '.t';
const SISTEMA_NOMBRE = 'CONTROL T';

// Estado de la aplicación
let registros = [];
let currentSearch = '';
let currentSemana = '';
let editandoId = null;
let historialEdiciones = {};

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = hoy;
    
    document.getElementById('fecha').addEventListener('change', verificarFechaObservacion);
    
    cargarRegistrosLocal();
    configurarEventos();
    actualizarUI();
    actualizarEstadisticas();
});

function verificarFechaObservacion() {
    const fechaSeleccionada = new Date(document.getElementById('fecha').value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const observacionContainer = document.getElementById('observacionContainer');
    
    if (fechaSeleccionada < hoy) {
        observacionContainer.style.display = 'block';
    } else {
        observacionContainer.style.display = 'none';
        document.getElementById('observacion').value = '';
    }
}

function configurarEventos() {
    document.getElementById('registroForm').addEventListener('submit', guardarRegistro);
    document.getElementById('cancelEditBtn').addEventListener('click', cancelarEdicion);
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        actualizarUI();
        actualizarEstadisticas();
    });
    
    document.getElementById('clearSearch').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        currentSearch = '';
        actualizarUI();
        actualizarEstadisticas();
    });
    
    document.getElementById('limpiarFiltroBtn').addEventListener('click', () => {
        currentSearch = '';
        currentSemana = '';
        document.getElementById('searchInput').value = '';
        actualizarUI();
        actualizarEstadisticas();
        mostrarNotificacion('🧹 Filtros eliminados', 'info');
    });
    
    document.getElementById('exportarDBBtn').addEventListener('click', exportarBaseDatos);
    document.getElementById('importarDB').addEventListener('change', importarBaseDatos);
    document.getElementById('imprimirReportesBtn').addEventListener('click', imprimirReportes);
    document.getElementById('exportarExcelBtn').addEventListener('click', exportarAExcel);
    document.getElementById('imprimirIndividualBtn').addEventListener('click', imprimirRegistroSeleccionado);
    
    const modals = document.querySelectorAll('.modal');
    document.querySelectorAll('.close-modal').forEach(btn => {
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
    const registrosFiltrados = filtrarRegistrosArray();
    
    if (registrosFiltrados.length === 0) {
        mostrarNotificacion('❌ No hay registros para exportar', 'error');
        return;
    }
    
    // Preparar datos para Excel
    const datosExcel = registrosFiltrados.map(reg => ({
        'Semana': reg.semana,
        'Fecha': reg.fecha,
        'Estilo/Deporte': reg.estilo,
        'Tela': reg.tela,
        'Color': reg.color,
        'Cian (C)': reg.cyan || 0,
        'Magenta (M)': reg.magenta || 0,
        'Yellow (Y)': reg.yellow || 0,
        'Black (K)': reg.black || 0,
        'Adhesivo': reg.adhesivo,
        'Temp Monti °C': reg.temperatura_monti,
        'Vel Monti m/min': reg.velocidad_monti,
        'Temp Flat °C': reg.temperatura_flat,
        'Tiempo Flat s': reg.tiempo_flat,
        'Observación': reg.observacion || '',
        'Versión': reg.version || 1,
        'Creado': new Date(reg.creado).toLocaleString(),
        'Actualizado': new Date(reg.actualizado).toLocaleString()
    }));
    
    // Crear libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    
    // Ajustar ancho de columnas
    const colWidths = [
        { wch: 8 },  // Semana
        { wch: 12 }, // Fecha
        { wch: 20 }, // Estilo
        { wch: 15 }, // Tela
        { wch: 15 }, // Color
        { wch: 8 },  // C
        { wch: 8 },  // M
        { wch: 8 },  // Y
        { wch: 8 },  // K
        { wch: 15 }, // Adhesivo
        { wch: 12 }, // Temp Monti
        { wch: 12 }, // Vel Monti
        { wch: 12 }, // Temp Flat
        { wch: 12 }, // Tiempo Flat
        { wch: 30 }, // Observación
        { wch: 10 }, // Versión
        { wch: 20 }, // Creado
        { wch: 20 }  // Actualizado
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Registros CONTROL T');
    
    // Descargar archivo
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `CONTROL_T_${fecha}.xlsx`);
    
    mostrarNotificacion('📊 Archivo Excel generado', 'success');
}

// ==================== MANEJO DE REGISTROS CON CMYK ====================

function guardarRegistro(e) {
    e.preventDefault();
    
    const fecha = new Date(document.getElementById('fecha').value);
    const semana = obtenerSemana(fecha);
    const fechaStr = document.getElementById('fecha').value;
    const editId = document.getElementById('editId').value;
    const ahora = new Date().toISOString();
    const observacion = document.getElementById('observacion').value;
    
    const registroData = {
        id: editId || generarIdUnico(),
        semana: semana,
        fecha: fechaStr,
        estilo: document.getElementById('estilo').value.toUpperCase(),
        tela: document.getElementById('tela').value.toUpperCase(),
        color: document.getElementById('color').value.toUpperCase(),
        cyan: parseInt(document.getElementById('cyan').value) || 0,
        magenta: parseInt(document.getElementById('magenta').value) || 0,
        yellow: parseInt(document.getElementById('yellow').value) || 0,
        black: parseInt(document.getElementById('black').value) || 0,
        adhesivo: document.getElementById('adhesivo').value.toUpperCase(),
        temperatura_monti: parseFloat(document.getElementById('temp_monti').value),
        velocidad_monti: parseFloat(document.getElementById('vel_monti').value),
        temperatura_flat: parseFloat(document.getElementById('temp_flat').value),
        tiempo_flat: parseFloat(document.getElementById('tiempo_flat').value),
        creado: ahora,
        actualizado: ahora,
        version: 1,
        observacion: observacion || null
    };
    
    if (editId) {
        const index = registros.findIndex(r => r.id === editId);
        if (index !== -1) {
            const original = registros[index];
            
            if (!historialEdiciones[editId]) {
                historialEdiciones[editId] = [];
            }
            
            historialEdiciones[editId].push({
                fecha: ahora,
                anterior: { ...original },
                nuevo: { ...registroData }
            });
            
            registroData.creado = original.creado;
            registroData.version = (original.version || 1) + 1;
            registroData.actualizado = ahora;
            registroData.historial = historialEdiciones[editId];
            
            registros[index] = registroData;
            mostrarNotificacion(`✅ Registro editado (versión ${registroData.version})`, 'success');
        }
    } else {
        if (observacion) {
            registroData.observacion = observacion;
            mostrarNotificacion('📝 Registro con observación guardado', 'info');
        }
        registros.unshift(registroData);
        mostrarNotificacion('✅ Registro guardado en CONTROL T', 'success');
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
    
    let html = '';
    
    if (historial.length === 0) {
        html = '<p class="no-data">No hay historial de ediciones</p>';
    } else {
        html = historial.map((entry, index) => `
            <div class="historial-item">
                <div class="historial-fecha">
                    📅 ${new Date(entry.fecha).toLocaleString()}
                </div>
                <div class="historial-cambios">
                    <strong>Versión ${index + 2}</strong><br>
                    <small>De: v${index + 1} → v${index + 2}</small>
                </div>
            </div>
        `).join('');
    }
    
    html += `
        <div class="historial-item" style="border-color: #ffd93d;">
            <div class="historial-fecha" style="color: #ffd93d;">
                ⚡ VERSIÓN ACTUAL ${registro.version}
            </div>
            <div class="historial-cambios">
                Última modificación: ${new Date(registro.actualizado).toLocaleString()}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    modal.classList.add('show');
}

function editarRegistro(id) {
    const registro = registros.find(r => r.id === id);
    if (!registro) return;
    
    editandoId = id;
    document.getElementById('editId').value = id;
    
    document.getElementById('fecha').value = registro.fecha;
    document.getElementById('estilo').value = registro.estilo;
    document.getElementById('tela').value = registro.tela;
    document.getElementById('color').value = registro.color;
    document.getElementById('cyan').value = registro.cyan || 0;
    document.getElementById('magenta').value = registro.magenta || 0;
    document.getElementById('yellow').value = registro.yellow || 0;
    document.getElementById('black').value = registro.black || 0;
    document.getElementById('adhesivo').value = registro.adhesivo;
    document.getElementById('temp_monti').value = registro.temperatura_monti;
    document.getElementById('vel_monti').value = registro.velocidad_monti;
    document.getElementById('temp_flat').value = registro.temperatura_flat;
    document.getElementById('tiempo_flat').value = registro.tiempo_flat;
    
    verificarFechaObservacion();
    if (registro.observacion) {
        document.getElementById('observacion').value = registro.observacion;
    }
    
    document.getElementById('formTitle').innerHTML = '✏️ EDITANDO REGISTRO';
    document.getElementById('submitBtn').innerHTML = '<span>✏️</span> ACTUALIZAR';
    document.getElementById('cancelEditBtn').style.display = 'block';
    document.querySelector('.form-section').classList.add('edit-mode');
    
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicion() {
    resetFormulario();
    mostrarNotificacion('✏️ Edición cancelada', 'info');
}

function resetFormulario() {
    editandoId = null;
    document.getElementById('editId').value = '';
    document.getElementById('registroForm').reset();
    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('observacionContainer').style.display = 'none';
    
    document.getElementById('formTitle').innerHTML = '➕ NUEVO REGISTRO';
    document.getElementById('submitBtn').innerHTML = '<span>💾</span> GUARDAR';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.querySelector('.form-section').classList.remove('edit-mode');
}

function eliminarRegistro(id) {
    if (confirm('¿Eliminar este registro de CONTROL T?')) {
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
    const datosGuardados = localStorage.getItem('control_t_registros_v5');
    if (datosGuardados) {
        try {
            const data = JSON.parse(datosGuardados);
            registros = data.registros || [];
            historialEdiciones = data.historial || {};
        } catch (e) {
            console.error('Error al cargar:', e);
            registros = [];
            historialEdiciones = {};
        }
    } else {
        registros = generarDatosEjemplo();
        guardarRegistrosLocal();
    }
}

function generarDatosEjemplo() {
    const ejemplos = [];
    const estilos = ['LIBRE', 'MARIPOSA', 'PECHO', 'ESPALDA', 'COMBINADO'];
    const telas = ['ALGODÓN', 'POLIÉSTER', 'NYLON', 'LANA', 'SEDA'];
    const colores = ['ROJO', 'AZUL', 'VERDE', 'NEGRO', 'BLANCO'];
    const adhesivos = ['TIPO A', 'TIPO B', 'TIPO C', 'TIPO D', 'TIPO E'];
    const ahora = new Date().toISOString();
    
    for (let i = 0; i < 20; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i * 2);
        
        ejemplos.push({
            id: generarIdUnico(),
            semana: obtenerSemana(fecha),
            fecha: fecha.toISOString().split('T')[0],
            estilo: estilos[Math.floor(Math.random() * estilos.length)],
            tela: telas[Math.floor(Math.random() * telas.length)],
            color: colores[Math.floor(Math.random() * colores.length)],
            cyan: Math.floor(Math.random() * 100),
            magenta: Math.floor(Math.random() * 100),
            yellow: Math.floor(Math.random() * 100),
            black: Math.floor(Math.random() * 100),
            adhesivo: adhesivos[Math.floor(Math.random() * adhesivos.length)],
            temperatura_monti: 170 + Math.random() * 30,
            velocidad_monti: 2 + Math.random() * 3,
            temperatura_flat: 150 + Math.random() * 30,
            tiempo_flat: 10 + Math.random() * 15,
            creado: ahora,
            actualizado: ahora,
            version: 1
        });
    }
    
    return ejemplos;
}

function guardarRegistrosLocal() {
    const dataToSave = {
        registros: registros,
        historial: historialEdiciones
    };
    localStorage.setItem('control_t_registros_v5', JSON.stringify(dataToSave));
}

// ==================== EXPORTAR/IMPORTAR DB ====================

function exportarBaseDatos() {
    try {
        const dataToExport = {
            sistema: SISTEMA_NOMBRE,
            version: DB_VERSION,
            fecha_exportacion: new Date().toISOString(),
            registros: registros,
            historial: historialEdiciones,
            total_registros: registros.length
        };
        
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `CONTROL_T_${new Date().toISOString().split('T')[0]}${DB_EXTENSION}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        mostrarNotificacion('💾 Base de datos CONTROL T guardada');
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('❌ Error al guardar', 'error');
    }
}

function importarBaseDatos(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith(DB_EXTENSION)) {
        mostrarNotificacion('❌ Debe ser archivo .t', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!importedData.registros || !Array.isArray(importedData.registros)) {
                throw new Error('Estructura inválida');
            }
            
            if (confirm(`¿Cargar ${importedData.registros.length} registros en CONTROL T?`)) {
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

// ==================== CALENDARIO MENSUAL COMPACTO ====================

function actualizarCalendarioMensual() {
    const container = document.getElementById('calendarioMensualContainer');
    
    if (registros.length === 0) {
        container.innerHTML = '<p class="no-data">📅 Sin semanas</p>';
        return;
    }
    
    // Agrupar por mes
    const mesesMap = new Map();
    
    registros.forEach(reg => {
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
    
    // Convertir a array y ordenar (más reciente primero)
    const mesesArray = Array.from(mesesMap.entries())
        .sort((a, b) => b[0].localeCompare(a[0]));
    
    // Agrupar de 3 en 3 meses
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

// ==================== FILTROS Y UI ====================

function filtrarRegistrosArray() {
    if (!currentSearch && !currentSemana) return registros;
    
    return registros.filter(reg => {
        const matchesSearch = !currentSearch || (
            reg.estilo.toLowerCase().includes(currentSearch) ||
            reg.tela.toLowerCase().includes(currentSearch) ||
            reg.color.toLowerCase().includes(currentSearch) ||
            reg.cyan.toString().includes(currentSearch) ||
            reg.magenta.toString().includes(currentSearch) ||
            reg.yellow.toString().includes(currentSearch) ||
            reg.black.toString().includes(currentSearch) ||
            reg.adhesivo.toLowerCase().includes(currentSearch) ||
            reg.semana.toString().includes(currentSearch) ||
            reg.temperatura_monti.toString().includes(currentSearch) ||
            reg.velocidad_monti.toString().includes(currentSearch) ||
            reg.temperatura_flat.toString().includes(currentSearch) ||
            reg.tiempo_flat.toString().includes(currentSearch) ||
            reg.fecha.includes(currentSearch) ||
            formatearFecha(reg.fecha).includes(currentSearch) ||
            reg.id.toLowerCase().includes(currentSearch)
        );
        
        const matchesSemana = !currentSemana || reg.semana == currentSemana;
        
        return matchesSearch && matchesSemana;
    });
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
    
    totalSpan.innerHTML = `${totalRegistros} registros`;
    
    if (currentSemana || currentSearch) {
        filtroBadge.style.display = 'inline';
        filtroBadge.innerHTML = `${registrosFiltrados.length} resultados`;
    } else {
        filtroBadge.style.display = 'none';
    }
}

function mostrarTabla(registrosMostrar) {
    const tbody = document.getElementById('tableBody');
    
    if (registrosMostrar.length === 0) {
        tbody.innerHTML = '<tr><td colspan="15" class="loading">📭 Sin resultados</td></tr>';
        return;
    }
    
    tbody.innerHTML = registrosMostrar.map(reg => {
        const tieneHistorial = historialEdiciones[reg.id] && historialEdiciones[reg.id].length > 0;
        const rowClass = tieneHistorial ? 'has-history' : '';
        
        return `
            <tr class="${rowClass}">
                <td><strong>${reg.semana}</strong></td>
                <td>${formatearFecha(reg.fecha)}</td>
                <td>${reg.estilo}</td>
                <td>${reg.tela}</td>
                <td>${reg.color}</td>
                <td style="color: #60a5fa; font-weight: 600;">${reg.cyan || 0}</td>
                <td style="color: #f472b6; font-weight: 600;">${reg.magenta || 0}</td>
                <td style="color: #fbbf24; font-weight: 600;">${reg.yellow || 0}</td>
                <td style="color: #9ca3af; font-weight: 600;">${reg.black || 0}</td>
                <td>${reg.adhesivo}</td>
                <td>${reg.temperatura_monti.toFixed(1)}°</td>
                <td>${reg.velocidad_monti.toFixed(1)}</td>
                <td>${reg.temperatura_flat.toFixed(1)}°</td>
                <td>${reg.tiempo_flat.toFixed(1)}s</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit" onclick="editarRegistro('${reg.id}')" title="Editar">✏️</button>
                        <button class="btn-icon history" onclick="verHistorial('${reg.id}')" title="Historial">📋</button>
                        <button class="btn-icon print" onclick="imprimirRegistroIndividual('${reg.id}')" title="Imprimir">🖨️</button>
                        <button class="btn-icon delete" onclick="eliminarRegistro('${reg.id}')" title="Eliminar">🗑️</button>
                    </div>
                    ${reg.observacion ? `<small style="color:#ffd93d; display:block; margin-top:0.3rem;">📝 ${reg.observacion}</small>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// ==================== FUNCIONES DE IMPRESIÓN ====================

function imprimirReportes() {
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
            <title>CONTROL T - Reporte</title>
            <style>
                body { font-family: Arial; margin: 0.5in; background: white; color: black; }
                h1 { color: #000; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th { background: #000; color: white; padding: 8px; text-align: left; }
                td { padding: 6px; border-bottom: 1px solid #000; }
                .total { margin-top: 20px; font-weight: bold; }
                .cmyk { font-family: monospace; }
            </style>
        </head>
        <body>
            <h1>⚡ CONTROL T - REPORTE COMPLETO</h1>
            <p>Fecha de impresión: ${new Date().toLocaleString()}</p>
            <p>Total de registros: ${registrosFiltrados.length}</p>
            <table>
                <thead>
                    <tr>
                        <th>Sem</th>
                        <th>Fecha</th>
                        <th>Estilo</th>
                        <th>Tela</th>
                        <th>Color</th>
                        <th>C</th>
                        <th>M</th>
                        <th>Y</th>
                        <th>K</th>
                        <th>Adhesivo</th>
                        <th>T°M</th>
                        <th>Vel</th>
                        <th>T°F</th>
                        <th>T/F</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    registrosFiltrados.forEach(reg => {
        htmlContenido += `
            <tr>
                <td>${reg.semana}</td>
                <td>${formatearFecha(reg.fecha)}</td>
                <td>${reg.estilo}</td>
                <td>${reg.tela}</td>
                <td>${reg.color}</td>
                <td class="cmyk">${reg.cyan || 0}</td>
                <td class="cmyk">${reg.magenta || 0}</td>
                <td class="cmyk">${reg.yellow || 0}</td>
                <td class="cmyk">${reg.black || 0}</td>
                <td>${reg.adhesivo}</td>
                <td>${reg.temperatura_monti.toFixed(1)}°</td>
                <td>${reg.velocidad_monti.toFixed(1)}</td>
                <td>${reg.temperatura_flat.toFixed(1)}°</td>
                <td>${reg.tiempo_flat.toFixed(1)}s</td>
            </tr>
        `;
        if (reg.observacion) {
            htmlContenido += `<tr><td colspan="14" style="color:#666; font-style:italic;">📝 Obs: ${reg.observacion}</td></tr>`;
        }
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
    if (!registro) return;
    
    const ventanaImpresion = window.open('', '_blank');
    
    const htmlContenido = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>CONTROL T - Comprobante</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <style>
                body { margin: 0; padding: 0.25in; font-family: Arial; background: white; }
                .comprobante { 
                    border: 2px solid #000; 
                    padding: 20px; 
                    border-radius: 10px;
                    max-width: 8.5in;
                    margin: 0 auto;
                }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
                .header h1 { color: #000; margin: 0; }
                .header h2 { color: #333; margin: 5px 0 0; font-size: 16px; }
                .barcode-container { text-align: center; margin: 20px 0; padding: 15px 0; border-top: 2px dashed #000; border-bottom: 2px dashed #000; }
                .barcode-container svg { max-width: 100%; height: auto; }
                .id-text { text-align: center; font-size: 14px; color: #333; margin-top: 5px; font-family: monospace; }
                .detalles { margin: 20px 0; }
                .fila { display: flex; margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 5px; }
                .etiqueta { font-weight: bold; width: 40%; color: #000; }
                .valor { width: 60%; color: #333; }
                .cmyk-row { display: flex; gap: 10px; margin: 8px 0; }
                .cmyk-item { flex: 1; text-align: center; padding: 5px; border-radius: 5px; font-weight: bold; }
                .footer { text-align: center; border-top: 2px solid #000; padding-top: 10px; font-size: 12px; color: #666; }
                .version-info { font-size: 10px; color: #999; text-align: right; margin-top: 5px; }
                .observacion { margin-top: 15px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffd93d; font-style: italic; }
            </style>
        </head>
        <body>
            <div class="comprobante">
                <div class="header">
                    <h1>⚡ CONTROL T</h1>
                    <h2>Comprobante de Registro</h2>
                </div>
                
                <div class="barcode-container">
                    <svg id="barcode"></svg>
                    <div class="id-text">ID: ${registro.id}</div>
                </div>
                
                <div class="detalles">
                    <div class="fila"><span class="etiqueta">Semana:</span> <span class="valor">${registro.semana}</span></div>
                    <div class="fila"><span class="etiqueta">Fecha:</span> <span class="valor">${formatearFecha(registro.fecha)}</span></div>
                    <div class="fila"><span class="etiqueta">Estilo/Deporte:</span> <span class="valor">${registro.estilo}</span></div>
                    <div class="fila"><span class="etiqueta">Tela:</span> <span class="valor">${registro.tela}</span></div>
                    <div class="fila"><span class="etiqueta">Color:</span> <span class="valor">${registro.color}</span></div>
                    
                    <div style="margin: 15px 0;">
                        <strong>CMYK:</strong>
                        <div class="cmyk-row">
                            <div class="cmyk-item" style="background: #60a5fa20; border:1px solid #60a5fa;">C: ${registro.cyan || 0}</div>
                            <div class="cmyk-item" style="background: #f472b620; border:1px solid #f472b6;">M: ${registro.magenta || 0}</div>
                            <div class="cmyk-item" style="background: #fbbf2420; border:1px solid #fbbf24;">Y: ${registro.yellow || 0}</div>
                            <div class="cmyk-item" style="background: #9ca3af20; border:1px solid #9ca3af;">K: ${registro.black || 0}</div>
                        </div>
                    </div>
                    
                    <div class="fila"><span class="etiqueta">Adhesivo:</span> <span class="valor">${registro.adhesivo}</span></div>
                    <div class="fila"><span class="etiqueta">Temperatura Monti:</span> <span class="valor">${registro.temperatura_monti.toFixed(1)} °C</span></div>
                    <div class="fila"><span class="etiqueta">Velocidad Monti:</span> <span class="valor">${registro.velocidad_monti.toFixed(1)} m/min</span></div>
                    <div class="fila"><span class="etiqueta">Temperatura Flat:</span> <span class="valor">${registro.temperatura_flat.toFixed(1)} °C</span></div>
                    <div class="fila"><span class="etiqueta">Tiempo Flat:</span> <span class="valor">${registro.tiempo_flat.toFixed(1)} seg</span></div>
                </div>
                
                ${registro.observacion ? `
                    <div class="observacion">
                        <strong>📝 Observación:</strong> ${registro.observacion}
                    </div>
                ` : ''}
                
                <div class="footer">
                    <p>CONTROL T - Sistema de Gestión de Parámetros</p>
                    <div>Impreso: ${new Date().toLocaleString()}</div>
                    <div class="version-info">
                        Creado: ${new Date(registro.creado).toLocaleString()} | 
                        Versión: ${registro.version || 1} | 
                        Última modificación: ${new Date(registro.actualizado).toLocaleString()}
                    </div>
                </div>
            </div>
            
            <script>
                JsBarcode("#barcode", "${registro.id}", {
                    format: "CODE128",
                    width: 2,
                    height: 50,
                    displayValue: true,
                    fontSize: 14,
                    margin: 10,
                    lineColor: "#000000"
                });
                
                window.onload = () => setTimeout(() => window.print(), 500);
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
    
    if (registros.length === 0) {
        select.innerHTML = '<option value="">No hay registros</option>';
    } else {
        select.innerHTML = registros.map(reg => `
            <option value="${reg.id}">Sem ${reg.semana} | ${reg.fecha} | ${reg.estilo} | ${reg.color}</option>
        `).join('');
    }
    
    modal.classList.add('show');
}

function imprimirRegistroSeleccionado() {
    const select = document.getElementById('selectRegistroImprimir');
    const id = select.value;
    
    if (id) {
        document.getElementById('modalImpresion').classList.remove('show');
        imprimirRegistroIndividual(id);
    } else {
        mostrarNotificacion('❌ Selecciona un registro', 'error');
    }
}

// ==================== FUNCIONES UTILITARIAS ====================

function generarIdUnico() {
    return 'CT-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function obtenerSemana(fecha) {
    const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function formatearFecha(fechaStr) {
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

// Hacer funciones globales
window.editarRegistro = editarRegistro;
window.verHistorial = verHistorial;
window.imprimirRegistroIndividual = imprimirRegistroIndividual;
window.eliminarRegistro = eliminarRegistro;
window.abrirModalSeleccionRegistro = abrirModalSeleccionRegistro;