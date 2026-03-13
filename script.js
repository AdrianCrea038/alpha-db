// CONTROL T - Sistema de Gestión Premium
// Versión 7.5 - Con validación de fechas corregida y número de plotter

// ==================== CONFIGURACIÓN ====================
const DB_VERSION = '7.5';
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
    document.getElementById('fecha').setAttribute('max', hoy); // No permitir fechas futuras
    
    document.getElementById('fecha').addEventListener('change', verificarFechaObservacion);
    
    // Toggle para colores extras
    document.getElementById('toggleExtrasBtn').addEventListener('click', toggleExtras);
    
    cargarRegistrosLocal();
    configurarEventos();
    actualizarUI();
    actualizarEstadisticas();
});

function toggleExtras() {
    const extrasContainer = document.getElementById('extrasContainer');
    const toggleBtn = document.getElementById('toggleExtrasBtn');
    
    if (extrasContainer.style.display === 'none') {
        extrasContainer.style.display = 'block';
        toggleBtn.innerHTML = '<span>🎨</span> OCULTAR COLORES EXTRAS';
    } else {
        extrasContainer.style.display = 'none';
        toggleBtn.innerHTML = '<span>🎨</span> MOSTRAR COLORES EXTRAS';
    }
}

function verificarFechaObservacion() {
    const fechaSeleccionada = document.getElementById('fecha').value;
    const hoy = new Date().toISOString().split('T')[0];
    
    const observacionContainer = document.getElementById('observacionContainer');
    const observacionField = document.getElementById('observacion');
    
    if (fechaSeleccionada < hoy) {
        // Fecha anterior: mostrar observación obligatoria
        observacionContainer.style.display = 'block';
        observacionField.required = true;
        observacionField.setAttribute('required', 'required');
    } else {
        // Fecha actual o futura (pero no permitimos futuras por el max)
        observacionContainer.style.display = 'none';
        observacionField.required = false;
        observacionField.removeAttribute('required');
        observacionField.value = '';
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
        'PO': reg.po || '',
        'Semana': reg.semana,
        'Fecha': reg.fecha,
        'Estilo/Deporte': reg.estilo,
        'Tela': reg.tela,
        'Cian (C)': reg.cyan || 0,
        'Magenta (M)': reg.magenta || 0,
        'Yellow (Y)': reg.yellow || 0,
        'Black (K)': reg.black || 0,
        'Color 1': reg.color1_nombre ? `${reg.color1_nombre}: ${reg.color1_valor}` : '',
        'Color 2': reg.color2_nombre ? `${reg.color2_nombre}: ${reg.color2_valor}` : '',
        'Color 3': reg.color3_nombre ? `${reg.color3_nombre}: ${reg.color3_valor}` : '',
        'Color 4': reg.color4_nombre ? `${reg.color4_nombre}: ${reg.color4_valor}` : '',
        'N° Plotter': reg.numero_plotter || 0,
        'Plotter Temp': reg.plotter_temp || 0,
        'Plotter Humedad': reg.plotter_humedad || 0,
        'Plotter Perfil': reg.plotter_perfil || '',
        'Adhesivo': reg.adhesivo,
        'Temp Monti °C': reg.temperatura_monti,
        'Vel Monti m/min': reg.velocidad_monti,
        'Temp Flat °C': reg.temperatura_flat,
        'Tiempo Flat s': reg.tiempo_flat,
        'Observación': reg.observacion || '',
        'Versión': reg.version || 1,
        'Descripción Edición': reg.descripcion_edicion || '',
        'Creado': new Date(reg.creado).toLocaleString(),
        'Actualizado': new Date(reg.actualizado).toLocaleString()
    }));
    
    // Crear libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    XLSX.utils.book_append_sheet(wb, ws, 'Registros CONTROL T');
    
    // Descargar archivo
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `CONTROL_T_${fecha}.xlsx`);
    
    mostrarNotificacion('📊 Archivo Excel generado', 'success');
}

// ==================== MANEJO DE REGISTROS CON PO Y COLORES EXTRAS ====================

function guardarRegistro(e) {
    e.preventDefault();
    
    const fechaStr = document.getElementById('fecha').value;
    const fecha = new Date(fechaStr);
    const semana = obtenerSemana(fecha);
    const editId = document.getElementById('editId').value;
    const ahora = new Date().toISOString();
    const observacion = document.getElementById('observacion').value;
    
    // Validar fechas (comparando strings YYYY-MM-DD)
    const hoy = new Date().toISOString().split('T')[0];
    
    // Validar que si es fecha anterior, tenga observación
    if (fechaStr < hoy && !observacion) {
        mostrarNotificacion('❌ Debes agregar una observación para fechas anteriores', 'error');
        return;
    }
    
    // Obtener descripción de edición si existe
    let descripcionEdicion = '';
    if (editId) {
        descripcionEdicion = prompt('📝 Describe brevemente qué cambios realizaste en esta edición:', '');
    }
    
    const registroData = {
        id: editId || generarIdUnico(),
        po: document.getElementById('po').value.toUpperCase() || '',
        semana: semana,
        fecha: fechaStr,
        estilo: document.getElementById('estilo').value.toUpperCase(),
        tela: document.getElementById('tela').value.toUpperCase(),
        
        // CMYK con decimales
        cyan: parseFloat(document.getElementById('cyan').value) || 0,
        magenta: parseFloat(document.getElementById('magenta').value) || 0,
        yellow: parseFloat(document.getElementById('yellow').value) || 0,
        black: parseFloat(document.getElementById('black').value) || 0,
        
        // 4 Colores extras
        color1_nombre: document.getElementById('color1_nombre').value.toUpperCase() || '',
        color1_valor: parseFloat(document.getElementById('color1_valor').value) || 0,
        color2_nombre: document.getElementById('color2_nombre').value.toUpperCase() || '',
        color2_valor: parseFloat(document.getElementById('color2_valor').value) || 0,
        color3_nombre: document.getElementById('color3_nombre').value.toUpperCase() || '',
        color3_valor: parseFloat(document.getElementById('color3_valor').value) || 0,
        color4_nombre: document.getElementById('color4_nombre').value.toUpperCase() || '',
        color4_valor: parseFloat(document.getElementById('color4_valor').value) || 0,
        
        // PLOTTER datos (con nuevo campo número)
        numero_plotter: parseInt(document.getElementById('numero_plotter').value) || 0,
        plotter_temp: parseFloat(document.getElementById('plotter_temp').value) || 0,
        plotter_humedad: parseFloat(document.getElementById('plotter_humedad').value) || 0,
        plotter_perfil: document.getElementById('plotter_perfil').value.toUpperCase() || '',
        
        adhesivo: document.getElementById('adhesivo').value.toUpperCase(),
        
        temperatura_monti: parseFloat(document.getElementById('temp_monti').value),
        velocidad_monti: parseFloat(document.getElementById('vel_monti').value),
        temperatura_flat: parseFloat(document.getElementById('temp_flat').value),
        tiempo_flat: parseFloat(document.getElementById('tiempo_flat').value),
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
            
            historialEdiciones[editId].push({
                fecha: ahora,
                descripcion: descripcionEdicion || 'Edición sin descripción',
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
        html = historial.map((entry, index) => {
            return `
                <div class="historial-item">
                    <div class="historial-fecha">
                        <span>📅 ${new Date(entry.fecha).toLocaleString()}</span>
                        <span class="historial-version">v${index + 2}</span>
                        ${entry.descripcion ? `<span class="historial-descripcion">📝 ${entry.descripcion}</span>` : ''}
                    </div>
                    <div class="historial-cambios">
                        <div class="historial-columna anterior">
                            <div class="historial-columna-titulo">ANTERIOR</div>
                            <div class="historial-badges">
                                <span class="historial-badge po">📦 ${entry.anterior.po || 'N/A'}</span>
                                <span class="historial-badge cmyk-c">C:${entry.anterior.cyan.toFixed(1)}</span>
                                <span class="historial-badge cmyk-m">M:${entry.anterior.magenta.toFixed(1)}</span>
                                <span class="historial-badge cmyk-y">Y:${entry.anterior.yellow.toFixed(1)}</span>
                                <span class="historial-badge cmyk-k">K:${entry.anterior.black.toFixed(1)}</span>
                                ${entry.anterior.color1_nombre ? `<span class="historial-badge color1">${entry.anterior.color1_nombre}:${entry.anterior.color1_valor.toFixed(1)}</span>` : ''}
                                ${entry.anterior.color2_nombre ? `<span class="historial-badge color2">${entry.anterior.color2_nombre}:${entry.anterior.color2_valor.toFixed(1)}</span>` : ''}
                                ${entry.anterior.color3_nombre ? `<span class="historial-badge color3">${entry.anterior.color3_nombre}:${entry.anterior.color3_valor.toFixed(1)}</span>` : ''}
                                ${entry.anterior.color4_nombre ? `<span class="historial-badge color4">${entry.anterior.color4_nombre}:${entry.anterior.color4_valor.toFixed(1)}</span>` : ''}
                                <span class="historial-badge plotter">#${entry.anterior.numero_plotter || 0} ${entry.anterior.plotter_temp.toFixed(1)}°/${entry.anterior.plotter_humedad.toFixed(0)}%</span>
                            </div>
                        </div>
                        <div class="historial-columna nuevo">
                            <div class="historial-columna-titulo">NUEVO</div>
                            <div class="historial-badges">
                                <span class="historial-badge po">📦 ${entry.nuevo.po || 'N/A'}</span>
                                <span class="historial-badge cmyk-c">C:${entry.nuevo.cyan.toFixed(1)}</span>
                                <span class="historial-badge cmyk-m">M:${entry.nuevo.magenta.toFixed(1)}</span>
                                <span class="historial-badge cmyk-y">Y:${entry.nuevo.yellow.toFixed(1)}</span>
                                <span class="historial-badge cmyk-k">K:${entry.nuevo.black.toFixed(1)}</span>
                                ${entry.nuevo.color1_nombre ? `<span class="historial-badge color1">${entry.nuevo.color1_nombre}:${entry.nuevo.color1_valor.toFixed(1)}</span>` : ''}
                                ${entry.nuevo.color2_nombre ? `<span class="historial-badge color2">${entry.nuevo.color2_nombre}:${entry.nuevo.color2_valor.toFixed(1)}</span>` : ''}
                                ${entry.nuevo.color3_nombre ? `<span class="historial-badge color3">${entry.nuevo.color3_nombre}:${entry.nuevo.color3_valor.toFixed(1)}</span>` : ''}
                                ${entry.nuevo.color4_nombre ? `<span class="historial-badge color4">${entry.nuevo.color4_nombre}:${entry.nuevo.color4_valor.toFixed(1)}</span>` : ''}
                                <span class="historial-badge plotter">#${entry.nuevo.numero_plotter || 0} ${entry.nuevo.plotter_temp.toFixed(1)}°/${entry.nuevo.plotter_humedad.toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Versión actual
    html += `
        <div class="historial-item" style="border-color: #ffd93d;">
            <div class="historial-fecha">
                <span style="color: #ffd93d;">⚡ VERSIÓN ACTUAL ${registro.version}</span>
                <span>${new Date(registro.actualizado).toLocaleString()}</span>
                ${registro.descripcion_edicion ? `<span class="historial-descripcion">📝 ${registro.descripcion_edicion}</span>` : ''}
            </div>
            <div class="historial-badges">
                <span class="historial-badge po">📦 ${registro.po || 'N/A'}</span>
                <span class="historial-badge cmyk-c">C:${registro.cyan.toFixed(1)}</span>
                <span class="historial-badge cmyk-m">M:${registro.magenta.toFixed(1)}</span>
                <span class="historial-badge cmyk-y">Y:${registro.yellow.toFixed(1)}</span>
                <span class="historial-badge cmyk-k">K:${registro.black.toFixed(1)}</span>
                ${registro.color1_nombre ? `<span class="historial-badge color1">${registro.color1_nombre}:${registro.color1_valor.toFixed(1)}</span>` : ''}
                ${registro.color2_nombre ? `<span class="historial-badge color2">${registro.color2_nombre}:${registro.color2_valor.toFixed(1)}</span>` : ''}
                ${registro.color3_nombre ? `<span class="historial-badge color3">${registro.color3_nombre}:${registro.color3_valor.toFixed(1)}</span>` : ''}
                ${registro.color4_nombre ? `<span class="historial-badge color4">${registro.color4_nombre}:${registro.color4_valor.toFixed(1)}</span>` : ''}
                <span class="historial-badge plotter">#${registro.numero_plotter || 0} ${registro.plotter_temp.toFixed(1)}°/${registro.plotter_humedad.toFixed(0)}%</span>
            </div>
            ${registro.observacion ? `<div style="margin-top:0.5rem; color:#ffd93d; font-size:0.8rem;">📝 ${registro.observacion}</div>` : ''}
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
    
    document.getElementById('po').value = registro.po || '';
    document.getElementById('fecha').value = registro.fecha;
    document.getElementById('estilo').value = registro.estilo;
    document.getElementById('tela').value = registro.tela;
    
    // CMYK
    document.getElementById('cyan').value = registro.cyan || 0;
    document.getElementById('magenta').value = registro.magenta || 0;
    document.getElementById('yellow').value = registro.yellow || 0;
    document.getElementById('black').value = registro.black || 0;
    
    // Colores extras
    document.getElementById('color1_nombre').value = registro.color1_nombre || '';
    document.getElementById('color1_valor').value = registro.color1_valor || 0;
    document.getElementById('color2_nombre').value = registro.color2_nombre || '';
    document.getElementById('color2_valor').value = registro.color2_valor || 0;
    document.getElementById('color3_nombre').value = registro.color3_nombre || '';
    document.getElementById('color3_valor').value = registro.color3_valor || 0;
    document.getElementById('color4_nombre').value = registro.color4_nombre || '';
    document.getElementById('color4_valor').value = registro.color4_valor || 0;
    
    // PLOTTER datos (incluyendo número)
    document.getElementById('numero_plotter').value = registro.numero_plotter || 0;
    document.getElementById('plotter_temp').value = registro.plotter_temp || 0;
    document.getElementById('plotter_humedad').value = registro.plotter_humedad || 0;
    document.getElementById('plotter_perfil').value = registro.plotter_perfil || '';
    
    document.getElementById('adhesivo').value = registro.adhesivo;
    document.getElementById('temp_monti').value = registro.temperatura_monti;
    document.getElementById('vel_monti').value = registro.velocidad_monti;
    document.getElementById('temp_flat').value = registro.temperatura_flat;
    document.getElementById('tiempo_flat').value = registro.tiempo_flat;
    
    verificarFechaObservacion();
    if (registro.observacion) {
        document.getElementById('observacion').value = registro.observacion;
    }
    
    // Si tiene colores extras, mostrar el contenedor
    if (registro.color1_nombre || registro.color2_nombre || registro.color3_nombre || registro.color4_nombre) {
        document.getElementById('extrasContainer').style.display = 'block';
        document.getElementById('toggleExtrasBtn').innerHTML = '<span>🎨</span> OCULTAR COLORES EXTRAS';
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
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = hoy;
    document.getElementById('observacionContainer').style.display = 'none';
    document.getElementById('observacion').removeAttribute('required');
    document.getElementById('extrasContainer').style.display = 'none';
    document.getElementById('toggleExtrasBtn').innerHTML = '<span>🎨</span> MOSTRAR COLORES EXTRAS';
    
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
    const datosGuardados = localStorage.getItem('control_t_registros_v7');
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
    
    // Datos realistas para demostración
    const pos = [
        'PO-2401-001', 'PO-2401-002', 'PO-2402-015', 'PO-2402-023', 'PO-2403-008',
        'PO-2403-012', 'PO-2404-031', 'PO-2404-045', 'PO-2405-017', 'PO-2405-022',
        'PO-2406-003', 'PO-2406-018', 'PO-2407-009', 'PO-2407-034', 'PO-2408-011'
    ];
    
    const estilos = [
        'LIBRE', 'MARIPOSA', 'PECHO', 'ESPALDA', 'COMBINADO',
        'MEDLEY 200M', 'RELEVO 4X100', 'LIBRE JUVENIL', 'MARIPOSA INFANTIL', 'PECHO MASTER',
        'ESPALDA JUVENIL', 'COMBINADO MASTER', 'LIBRE MASTER', 'MARIPOSA JUVENIL', 'RELEVO MIXTO'
    ];
    
    const telas = [
        'ALGODÓN 100%', 'POLIÉSTER RECICLADO', 'NYLON TECNICO', 'LYCRA POWER', 'SPANDEX PRO',
        'ALGODÓN/POLIÉSTER 60/40', 'NYLON/SPANDEX 80/20', 'MICROFIBRA', 'PIQUE', 'JERSEY',
        'SUPLEX', 'COOLMAX', 'THERMAL', 'WINDPROOF', 'AQUABLOCK'
    ];
    
    const adhesivos = [
        'ST-100', 'ST-200', 'HT-45', 'HT-60', 'LT-30',
        'LT-50', 'XTREME 100', 'XTREME 200', 'PRO 300', 'PRO 400',
        'FLEX 50', 'FLEX 75', 'SOFT 30', 'SOFT 50', 'HARD 80'
    ];
    
    const perfiles = [
        'BAJO CONSUMO', 'MEDIO ESTÁNDAR', 'ALTO RENDIMIENTO', 'CRÍTICO', 'PREMIUM',
        'PROFESIONAL', 'COMPETICIÓN', 'ENTRENAMIENTO', 'RECREATIVO', 'ÉLITE'
    ];
    
    const coloresExtras = [
        ['DORADO METÁLICO', 'PLATEADO BRILLO', 'BRONCE ANTIGUO', 'COBRE MODERNO'],
        ['AZUL ELÉCTRICO', 'VERDE NEÓN', 'ROJO FUEGO', 'AMARILLO SOL'],
        ['MORADO REAL', 'TURQUESA MARINA', 'CORAL VIBRANTE', 'ESMERALDA'],
        ['NEGRO MATE', 'BLANCO PERLA', 'GRIS CARBÓN', 'BEIGE CLARO'],
        ['ROSA CHICLE', 'LILA SUAVE', 'MELOCOTÓN', 'MENTA']
    ];
    
    const ahora = new Date().toISOString();
    const hoy = new Date().toISOString().split('T')[0];
    
    // Generar 30 registros de ejemplo (todos con fecha <= hoy)
    for (let i = 0; i < 30; i++) {
        const fecha = new Date();
        // Fechas distribuidas en los últimos 60 días (siempre <= hoy)
        fecha.setDate(fecha.getDate() - (i * 2) - Math.floor(Math.random() * 5));
        const fechaStr = fecha.toISOString().split('T')[0];
        
        // Algunos registros con fechas anteriores para mostrar observaciones
        const esFechaAnterior = fechaStr < hoy;
        let observacion = null;
        if (esFechaAnterior) {
            const razones = [
                'Ajuste por producción retrasada',
                'Registro retroactivo por control de calidad',
                'Corrección de fecha por error administrativo',
                'Registro de muestra de laboratorio',
                'Prueba de prototipo'
            ];
            observacion = razones[Math.floor(Math.random() * razones.length)];
        }
        
        // Seleccionar colores extras aleatorios (algunos registros tienen, otros no)
        const extraIndex = Math.floor(Math.random() * coloresExtras.length);
        const tieneExtras = i % 3 === 0; // 1 de cada 3 tiene colores extras
        
        // Valores CMYK con decimales
        const cyan = Math.random() * 100;
        const magenta = Math.random() * 100;
        const yellow = Math.random() * 100;
        const black = Math.random() * 100;
        
        // Valores de plotter
        const plotterTemp = 18 + Math.random() * 15;
        const plotterHum = 35 + Math.random() * 25;
        const numeroPlotter = Math.floor(Math.random() * 10) + 1;
        
        ejemplos.push({
            id: generarIdUnico(),
            po: i % 2 === 0 ? pos[Math.floor(Math.random() * pos.length)] : '', // La mitad tienen PO
            semana: obtenerSemana(fecha),
            fecha: fechaStr,
            estilo: estilos[Math.floor(Math.random() * estilos.length)],
            tela: telas[Math.floor(Math.random() * telas.length)],
            
            // CMYK con decimales
            cyan: parseFloat(cyan.toFixed(1)),
            magenta: parseFloat(magenta.toFixed(1)),
            yellow: parseFloat(yellow.toFixed(1)),
            black: parseFloat(black.toFixed(1)),
            
            // Colores extras (solo algunos registros)
            color1_nombre: tieneExtras ? coloresExtras[extraIndex][0] : '',
            color1_valor: tieneExtras ? parseFloat((Math.random() * 100).toFixed(1)) : 0,
            color2_nombre: tieneExtras ? coloresExtras[extraIndex][1] : '',
            color2_valor: tieneExtras ? parseFloat((Math.random() * 100).toFixed(1)) : 0,
            color3_nombre: tieneExtras ? coloresExtras[extraIndex][2] : '',
            color3_valor: tieneExtras ? parseFloat((Math.random() * 100).toFixed(1)) : 0,
            color4_nombre: tieneExtras ? coloresExtras[extraIndex][3] : '',
            color4_valor: tieneExtras ? parseFloat((Math.random() * 100).toFixed(1)) : 0,
            
            // PLOTTER datos
            numero_plotter: numeroPlotter,
            plotter_temp: parseFloat(plotterTemp.toFixed(1)),
            plotter_humedad: parseFloat(plotterHum.toFixed(0)),
            plotter_perfil: perfiles[Math.floor(Math.random() * perfiles.length)],
            
            adhesivo: adhesivos[Math.floor(Math.random() * adhesivos.length)],
            temperatura_monti: parseFloat((170 + Math.random() * 30).toFixed(1)),
            velocidad_monti: parseFloat((2 + Math.random() * 3).toFixed(1)),
            temperatura_flat: parseFloat((150 + Math.random() * 30).toFixed(1)),
            tiempo_flat: parseFloat((10 + Math.random() * 15).toFixed(1)),
            creado: ahora,
            actualizado: ahora,
            version: 1,
            observacion: observacion
        });
    }
    
    // Ordenar por fecha (más reciente primero)
    ejemplos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    // Crear historial para algunos registros
    for (let i = 0; i < 5; i++) {
        const id = ejemplos[i].id;
        const fechaEdit = new Date();
        fechaEdit.setDate(fechaEdit.getDate() - Math.floor(Math.random() * 10));
        
        const descripciones = [
            'Corrección de temperatura',
            'Ajuste de CMYK por muestrario',
            'Actualización de PO',
            'Cambio en perfil de plotter',
            'Revisión de adhesivo'
        ];
        
        historialEdiciones[id] = [
            {
                fecha: fechaEdit.toISOString(),
                descripcion: descripciones[Math.floor(Math.random() * descripciones.length)],
                anterior: { ...ejemplos[i] },
                nuevo: { 
                    ...ejemplos[i], 
                    version: 2,
                    temperatura_monti: ejemplos[i].temperatura_monti + 2.5,
                    cyan: ejemplos[i].cyan + 5.2,
                    magenta: ejemplos[i].magenta - 3.8,
                    descripcion_edicion: descripciones[Math.floor(Math.random() * descripciones.length)]
                }
            }
        ];
        
        ejemplos[i].version = 2;
        ejemplos[i].actualizado = fechaEdit.toISOString();
        ejemplos[i].descripcion_edicion = descripciones[Math.floor(Math.random() * descripciones.length)];
        ejemplos[i].cyan = ejemplos[i].cyan + 5.2;
        ejemplos[i].magenta = ejemplos[i].magenta - 3.8;
    }
    
    return ejemplos;
}

function guardarRegistrosLocal() {
    const dataToSave = {
        registros: registros,
        historial: historialEdiciones
    };
    localStorage.setItem('control_t_registros_v7', JSON.stringify(dataToSave));
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
            (reg.po && reg.po.toLowerCase().includes(currentSearch)) ||
            reg.estilo.toLowerCase().includes(currentSearch) ||
            reg.tela.toLowerCase().includes(currentSearch) ||
            reg.cyan.toString().includes(currentSearch) ||
            reg.magenta.toString().includes(currentSearch) ||
            reg.yellow.toString().includes(currentSearch) ||
            reg.black.toString().includes(currentSearch) ||
            (reg.color1_nombre && reg.color1_nombre.toLowerCase().includes(currentSearch)) ||
            reg.color1_valor.toString().includes(currentSearch) ||
            (reg.color2_nombre && reg.color2_nombre.toLowerCase().includes(currentSearch)) ||
            reg.color2_valor.toString().includes(currentSearch) ||
            (reg.color3_nombre && reg.color3_nombre.toLowerCase().includes(currentSearch)) ||
            reg.color3_valor.toString().includes(currentSearch) ||
            (reg.color4_nombre && reg.color4_nombre.toLowerCase().includes(currentSearch)) ||
            reg.color4_valor.toString().includes(currentSearch) ||
            reg.numero_plotter.toString().includes(currentSearch) ||
            reg.plotter_temp.toString().includes(currentSearch) ||
            reg.plotter_humedad.toString().includes(currentSearch) ||
            (reg.plotter_perfil && reg.plotter_perfil.toLowerCase().includes(currentSearch)) ||
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
        tbody.innerHTML = '<tr><td colspan="21" class="loading">📭 Sin resultados</td></tr>';
        return;
    }
    
    tbody.innerHTML = registrosMostrar.map(reg => {
        const tieneHistorial = historialEdiciones[reg.id] && historialEdiciones[reg.id].length > 0;
        const rowClass = tieneHistorial ? 'has-history' : '';
        
        // Formatear datos de plotter
        const plotterText = reg.plotter_temp ? 
            `#${reg.numero_plotter || 0} ${reg.plotter_temp.toFixed(1)}°/${reg.plotter_humedad.toFixed(0)}%` : 
            '-';
        
        return `
            <tr class="${rowClass}">
                <td><span class="po-badge">${reg.po || '-'}</span></td>
                <td>${reg.semana}</td>
                <td>${formatearFecha(reg.fecha)}</td>
                <td>${reg.estilo}</td>
                <td>${reg.tela}</td>
                <td style="color: #60a5fa; font-weight: 600;">${reg.cyan.toFixed(1)}</td>
                <td style="color: #f472b6; font-weight: 600;">${reg.magenta.toFixed(1)}</td>
                <td style="color: #fbbf24; font-weight: 600;">${reg.yellow.toFixed(1)}</td>
                <td style="color: #9ca3af; font-weight: 600;">${reg.black.toFixed(1)}</td>
                <td style="color: #9c27b0;">${reg.color1_nombre ? `${reg.color1_nombre}:${reg.color1_valor.toFixed(1)}` : '-'}</td>
                <td style="color: #ff9800;">${reg.color2_nombre ? `${reg.color2_nombre}:${reg.color2_valor.toFixed(1)}` : '-'}</td>
                <td style="color: #4caf50;">${reg.color3_nombre ? `${reg.color3_nombre}:${reg.color3_valor.toFixed(1)}` : '-'}</td>
                <td style="color: #f44336;">${reg.color4_nombre ? `${reg.color4_nombre}:${reg.color4_valor.toFixed(1)}` : '-'}</td>
                <td><span style="background: #9c27b0; color:white; padding:0.2rem 0.5rem; border-radius:1rem; font-size:0.7rem;">${plotterText}</span></td>
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
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 9px; }
                th { background: #000; color: white; padding: 4px; text-align: left; }
                td { padding: 3px; border-bottom: 1px solid #000; }
                .total { margin-top: 20px; font-weight: bold; }
                .po { font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>⚡ CONTROL T - REPORTE COMPLETO</h1>
            <p>Fecha de impresión: ${new Date().toLocaleString()}</p>
            <p>Total de registros: ${registrosFiltrados.length}</p>
            <table>
                <thead>
                    <tr>
                        <th>PO</th>
                        <th>Sem</th>
                        <th>Fecha</th>
                        <th>Estilo</th>
                        <th>Tela</th>
                        <th>C</th>
                        <th>M</th>
                        <th>Y</th>
                        <th>K</th>
                        <th>C1</th>
                        <th>C2</th>
                        <th>C3</th>
                        <th>C4</th>
                        <th>N°Plot</th>
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
        
        const color1 = reg.color1_nombre ? `${reg.color1_nombre}:${reg.color1_valor.toFixed(1)}` : '-';
        const color2 = reg.color2_nombre ? `${reg.color2_nombre}:${reg.color2_valor.toFixed(1)}` : '-';
        const color3 = reg.color3_nombre ? `${reg.color3_nombre}:${reg.color3_valor.toFixed(1)}` : '-';
        const color4 = reg.color4_nombre ? `${reg.color4_nombre}:${reg.color4_valor.toFixed(1)}` : '-';
        
        htmlContenido += `
            <tr>
                <td class="po">${reg.po || '-'}</td>
                <td>${reg.semana}</td>
                <td>${formatearFecha(reg.fecha)}</td>
                <td>${reg.estilo}</td>
                <td>${reg.tela}</td>
                <td>${reg.cyan.toFixed(1)}</td>
                <td>${reg.magenta.toFixed(1)}</td>
                <td>${reg.yellow.toFixed(1)}</td>
                <td>${reg.black.toFixed(1)}</td>
                <td>${color1}</td>
                <td>${color2}</td>
                <td>${color3}</td>
                <td>${color4}</td>
                <td>${reg.numero_plotter || 0}</td>
                <td>${plotterText}</td>
                <td>${reg.adhesivo}</td>
                <td>${reg.temperatura_monti.toFixed(1)}°</td>
                <td>${reg.velocidad_monti.toFixed(1)}</td>
                <td>${reg.temperatura_flat.toFixed(1)}°</td>
                <td>${reg.tiempo_flat.toFixed(1)}s</td>
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
    if (!registro) return;
    
    const ventanaImpresion = window.open('', '_blank');
    
    const plotterText = registro.plotter_temp ? 
        `N° ${registro.numero_plotter || 0} - ${registro.plotter_temp.toFixed(1)}°C / ${registro.plotter_humedad.toFixed(0)}%` : 
        'No registrado';
    
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
                .po-destacado { background: #000; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold; display: inline-block; margin: 10px 0; }
                .detalles { margin: 20px 0; }
                .fila { display: flex; margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 5px; }
                .etiqueta { font-weight: bold; width: 40%; color: #000; }
                .valor { width: 60%; color: #333; }
                .colores-extras { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 15px 0; }
                .color-box { padding: 10px; border-radius: 5px; color: white; text-align: center; font-weight: bold; }
                .footer { text-align: center; border-top: 2px solid #000; padding-top: 10px; font-size: 12px; color: #666; }
                .version-info { font-size: 10px; color: #999; text-align: right; margin-top: 5px; }
            </style>
        </head>
        <body>
            <div class="comprobante">
                <div class="header">
                    <h1>⚡ CONTROL T</h1>
                    <h2>Comprobante de Registro</h2>
                </div>
                
                ${registro.po ? `<div class="po-destacado">📦 PO: ${registro.po}</div>` : ''}
                
                <div class="barcode-container">
                    <svg id="barcode"></svg>
                    <div class="id-text">ID: ${registro.id}</div>
                </div>
                
                <div class="detalles">
                    <div class="fila"><span class="etiqueta">Semana:</span> <span class="valor">${registro.semana}</span></div>
                    <div class="fila"><span class="etiqueta">Fecha:</span> <span class="valor">${formatearFecha(registro.fecha)}</span></div>
                    <div class="fila"><span class="etiqueta">Estilo/Deporte:</span> <span class="valor">${registro.estilo}</span></div>
                    <div class="fila"><span class="etiqueta">Tela:</span> <span class="valor">${registro.tela}</span></div>
                    
                    <div class="fila"><span class="etiqueta">CMYK:</span> 
                        <span class="valor">
                            C:${registro.cyan.toFixed(1)} M:${registro.magenta.toFixed(1)} Y:${registro.yellow.toFixed(1)} K:${registro.black.toFixed(1)}
                        </span>
                    </div>
                    
                    ${(registro.color1_nombre || registro.color2_nombre || registro.color3_nombre || registro.color4_nombre) ? `
                        <div class="colores-extras">
                            ${registro.color1_nombre ? `<div class="color-box" style="background: #9c27b0;">${registro.color1_nombre}: ${registro.color1_valor.toFixed(1)}</div>` : ''}
                            ${registro.color2_nombre ? `<div class="color-box" style="background: #ff9800; color: black;">${registro.color2_nombre}: ${registro.color2_valor.toFixed(1)}</div>` : ''}
                            ${registro.color3_nombre ? `<div class="color-box" style="background: #4caf50;">${registro.color3_nombre}: ${registro.color3_valor.toFixed(1)}</div>` : ''}
                            ${registro.color4_nombre ? `<div class="color-box" style="background: #f44336;">${registro.color4_nombre}: ${registro.color4_valor.toFixed(1)}</div>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="fila"><span class="etiqueta">Plotter:</span> <span class="valor">${plotterText}</span></div>
                    <div class="fila"><span class="etiqueta">Adhesivo:</span> <span class="valor">${registro.adhesivo}</span></div>
                    <div class="fila"><span class="etiqueta">Monti:</span> <span class="valor">${registro.temperatura_monti.toFixed(1)}°C / ${registro.velocidad_monti.toFixed(1)} m/min</span></div>
                    <div class="fila"><span class="etiqueta">Flat:</span> <span class="valor">${registro.temperatura_flat.toFixed(1)}°C / ${registro.tiempo_flat.toFixed(1)}s</span></div>
                </div>
                
                ${registro.observacion ? `
                    <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffd93d;">
                        <strong>📝 Observación:</strong> ${registro.observacion}
                    </div>
                ` : ''}
                
                <div class="footer">
                    <p>CONTROL T - Sistema de Gestión de Parámetros</p>
                    <div>Impreso: ${new Date().toLocaleString()}</div>
                    <div class="version-info">
                        Versión: ${registro.version || 1}
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
        select.innerHTML = registros.map(reg => {
            const poText = reg.po ? ` [${reg.po}]` : '';
            return `<option value="${reg.id}">Sem ${reg.semana} | ${reg.fecha} | ${reg.estilo}${poText}</option>`;
        }).join('');
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