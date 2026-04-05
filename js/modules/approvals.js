// ============================================================
// js/modules/approvals.js - Aprobaciones de piso
// ============================================================

const ApprovalsModule = {
    editandoId: null,
    
    init: function() {
        console.log('✅ Módulo de Aprobaciones Piso iniciado');
        this.renderizar();
        this.configurarEventos();
    },
    
    renderizar: function() {
        const existingPanel = document.getElementById('aprobacionesPanel');
        if (existingPanel) existingPanel.remove();
        
        const container = document.querySelector('.container');
        if (!container) return;
        
        const panelHTML = `
            <div id="aprobacionesPanel" class="aprobaciones-panel">
                <div class="aprobaciones-header"><h2>✅ APROBACIONES DE PISO</h2><p>Registro de aprobaciones de producción</p></div>
                <form id="aprobacionForm" class="aprobacion-form">
                    <input type="hidden" id="aprobacionEditId" value="">
                    <div class="form-row-dos"><div class="form-group-card"><label>📅 FECHA</label><input type="date" id="aprobacionFecha" required class="input-bonito"></div>
                    <div class="form-group-card"><label>📦 PO</label><input type="text" id="aprobacionPo" placeholder="Número de PO" required class="input-bonito"></div></div>
                    <div class="form-row-dos"><div class="form-group-card"><label>🎯 ESTILO</label><input type="text" id="aprobacionEstilo" placeholder="Estilo / Deporte" required class="input-bonito"></div>
                    <div class="form-group-card"><label>🧵 NK TELA</label><input type="text" id="aprobacionNkTela" placeholder="NK Tela" required class="input-bonito"></div></div>
                    <div class="section-title-aprobacion"><span class="title-icon">🎨</span><h3>ESPECIFICACIÓN DE COLORES</h3></div>
                    <div id="aprobacionColoresContainer"></div>
                    <div class="add-color-container"><button type="button" id="aprobacionAgregarColorBtn" class="btn-add-color-small">➕ AGREGAR COLOR</button></div>
                    <div class="section-title-aprobacion"><span class="title-icon">🖨️</span><h3>PLOTTER</h3></div>
                    <div class="form-row-cuatro"><div class="form-group-card"><label>🔢 N° PLOTTER</label><input type="number" id="aprobacionNumeroPlotter" class="input-bonito"></div>
                    <div class="form-group-card"><label>🌡️ TEMP. AMBIENTE</label><input type="number" id="aprobacionPlotterTemp" step="0.1" class="input-bonito"></div>
                    <div class="form-group-card"><label>💧 HUMEDAD</label><input type="number" id="aprobacionPlotterHumedad" step="0.1" class="input-bonito"></div>
                    <div class="form-group-card"><label>📋 PERFIL</label><input type="text" id="aprobacionPlotterPerfil" class="input-bonito"></div></div>
                    <div class="section-title-aprobacion"><span class="title-icon">🔥</span><h3>MONTI</h3></div>
                    <div class="form-row-cuatro"><div class="form-group-card"><label>🔢 N° MONTI</label><input type="number" id="aprobacionMontiNumero" class="input-bonito"></div>
                    <div class="form-group-card"><label>⚡ VELOCIDAD</label><input type="number" id="aprobacionMontiVelocidad" step="0.1" class="input-bonito"></div>
                    <div class="form-group-card"><label>🌡️ TEMPERATURA</label><input type="number" id="aprobacionMontiTemperatura" step="0.1" class="input-bonito"></div>
                    <div class="form-group-card"><label>🔄 RODO PRESIÓN</label><input type="number" id="aprobacionMontiPresion" step="0.1" class="input-bonito"></div></div>
                    <div class="form-row-dos"><div class="form-group-card"><label>⚖️ BARES</label><input type="number" id="aprobacionMontiBares" step="0.1" class="input-bonito"></div>
                    <div class="form-group-card"><label>📄 TISSUE PAPER</label><select id="aprobacionMontiTissue" class="select-bonito"><option value="">Seleccionar...</option><option value="sencillo">Sencillo</option><option value="doble">Doble</option></select></div></div>
                    <div class="section-title-aprobacion"><span class="title-icon">✅</span><h3>APROBACIÓN</h3></div>
                    <div class="form-row-dos"><div class="form-group-card"><label>📊 APROBACIÓN CON TOLERANCIA</label><select id="aprobacionTolerancia" class="select-bonito" required><option value="">Seleccionar...</option><option value="aprobado">✅ Aprobado</option><option value="aprobado_condicional">⚠️ Aprobado con condiciones</option><option value="rechazado">❌ Rechazado</option><option value="pendiente">⏳ Pendiente</option></select></div>
                    <div class="form-group-card"><label>👤 APROBADO POR</label><input type="text" id="aprobacionAprobadoPor" placeholder="Nombre del aprobador" required class="input-bonito"></div></div>
                    <div class="form-group-card full-width"><label>📝 OBSERVACIONES</label><textarea id="aprobacionObservaciones" rows="3" placeholder="Observaciones adicionales..." class="input-bonito"></textarea></div>
                    <div class="form-row-botones"><button type="submit" id="aprobacionSubmitBtn" class="btn-guardar-aprobacion">💾 GUARDAR APROBACIÓN</button><button type="button" id="aprobacionCancelEditBtn" class="btn-secondary" style="display: none;">✕ CANCELAR EDICIÓN</button></div>
                </form>
                <div id="aprobacionMensaje" class="aprobacion-mensaje" style="display: none;"></div>
            </div>
        `;
        
        const filtersSection = document.querySelector('.filters-section');
        if (filtersSection) filtersSection.insertAdjacentHTML('beforebegin', panelHTML);
        else container.insertAdjacentHTML('afterbegin', panelHTML);
        
        this.agregarEstilos();
        this.inicializarColores();
        this.establecerFechaActual();
    },
    
    inicializarColores: function() {
        const container = document.getElementById('aprobacionColoresContainer');
        if (container && container.children.length === 0) this.agregarGrupoColor();
    },
    
    agregarGrupoColor: function(nombreColor = '', observacion = '') {
        const container = document.getElementById('aprobacionColoresContainer');
        const nuevoId = Date.now() + Math.random().toString(36).substr(2, 4);
        const colorGroup = document.createElement('div');
        colorGroup.className = 'aprobacion-color-grupo';
        colorGroup.dataset.id = nuevoId;
        colorGroup.innerHTML = `<div class="aprobacion-color-header"><span class="color-titulo">🎨 COLOR</span><button type="button" class="btn-eliminar-color-aprobacion" onclick="ApprovalsModule.eliminarGrupoColor(this)">✕</button></div>
        <div class="aprobacion-color-nombre"><input type="text" id="aprobacionColorNombre_${nuevoId}" placeholder="NOMBRE DEL COLOR" value="${escapeHtml(nombreColor)}" class="input-bonito"></div>
        <div class="aprobacion-color-observacion"><textarea id="aprobacionColorObservacion_${nuevoId}" rows="2" placeholder="Observación del color (opcional)" class="input-bonito">${escapeHtml(observacion)}</textarea></div>`;
        container.appendChild(colorGroup);
    },
    
    eliminarGrupoColor: function(btn) {
        const grupo = btn.closest('.aprobacion-color-grupo');
        if (grupo && confirm('¿Eliminar este color?')) grupo.remove();
    },
    
    obtenerColoresFormulario: function() {
        const grupos = document.querySelectorAll('#aprobacionColoresContainer .aprobacion-color-grupo');
        const colores = [];
        grupos.forEach(grupo => {
            const id = grupo.dataset.id;
            colores.push({ nombre: document.getElementById(`aprobacionColorNombre_${id}`)?.value || '', observacion: document.getElementById(`aprobacionColorObservacion_${id}`)?.value || '' });
        });
        return colores;
    },
    
    establecerFechaActual: function() {
        const fechaInput = document.getElementById('aprobacionFecha');
        if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
    },
    
    configurarEventos: function() {
        document.getElementById('aprobacionForm')?.addEventListener('submit', (e) => this.guardar(e));
        document.getElementById('aprobacionAgregarColorBtn')?.addEventListener('click', () => this.agregarGrupoColor());
        document.getElementById('aprobacionCancelEditBtn')?.addEventListener('click', () => this.resetFormulario());
    },
    
    obtenerDatosFormulario: function() {
        const getValor = (id, defaultValue = '') => document.getElementById(id)?.value || defaultValue;
        const getNumero = (id, defaultValue = 0) => { const val = parseFloat(document.getElementById(id)?.value); return isNaN(val) ? defaultValue : val; };
        return {
            fecha: getValor('aprobacionFecha'), po: getValor('aprobacionPo').toUpperCase(), estilo: getValor('aprobacionEstilo').toUpperCase(),
            nk_tela: getValor('aprobacionNkTela').toUpperCase(), colores: this.obtenerColoresFormulario(),
            plotter_numero: getNumero('aprobacionNumeroPlotter'), plotter_temp: getNumero('aprobacionPlotterTemp'),
            plotter_humedad: getNumero('aprobacionPlotterHumedad'), plotter_perfil: getValor('aprobacionPlotterPerfil').toUpperCase(),
            monti_numero: getNumero('aprobacionMontiNumero'), monti_velocidad: getNumero('aprobacionMontiVelocidad'),
            monti_temperatura: getNumero('aprobacionMontiTemperatura'), monti_presion: getNumero('aprobacionMontiPresion'),
            monti_bares: getNumero('aprobacionMontiBares'), monti_tissue: getValor('aprobacionMontiTissue'),
            tolerancia: getValor('aprobacionTolerancia'), aprobado_por: getValor('aprobacionAprobadoPor').toUpperCase(),
            observaciones: getValor('aprobacionObservaciones')
        };
    },
    
    guardar: async function(e) {
        e.preventDefault();
        const datos = this.obtenerDatosFormulario();
        const editId = document.getElementById('aprobacionEditId').value;
        const ahora = new Date().toISOString();
        const aprobacionData = { ...datos, actualizado: ahora, version: 1 };
        
        try {
            if (editId) {
                aprobacionData.id = editId;
                await (window.SupabaseClient?.guardarAprobacion ? window.SupabaseClient.guardarAprobacion(aprobacionData) : this.guardarEnLocal(aprobacionData, true));
                this.mostrarMensaje('✅ Aprobación actualizada', 'success');
            } else {
                aprobacionData.id = 'APR-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4).toUpperCase();
                aprobacionData.creado = ahora;
                await (window.SupabaseClient?.guardarAprobacion ? window.SupabaseClient.guardarAprobacion(aprobacionData) : this.guardarEnLocal(aprobacionData, false));
                this.mostrarMensaje('✅ Aprobación guardada', 'success');
            }
            this.resetFormulario();
        } catch (error) { console.error(error); this.mostrarMensaje('❌ Error al guardar', 'error'); }
    },
    
    guardarEnLocal: function(data, isUpdate) {
        const existentes = localStorage.getItem('alpha_db_aprobaciones');
        let aprobaciones = existentes ? JSON.parse(existentes) : [];
        if (isUpdate) {
            const index = aprobaciones.findIndex(a => a.id === data.id);
            if (index !== -1) aprobaciones[index] = data;
        } else aprobaciones.push(data);
        localStorage.setItem('alpha_db_aprobaciones', JSON.stringify(aprobaciones));
    },
    
    resetFormulario: function() {
        document.getElementById('aprobacionForm')?.reset();
        document.getElementById('aprobacionEditId').value = '';
        document.getElementById('aprobacionCancelEditBtn').style.display = 'none';
        const container = document.getElementById('aprobacionColoresContainer');
        if (container) { container.innerHTML = ''; this.agregarGrupoColor(); }
        this.establecerFechaActual();
        document.getElementById('aprobacionSubmitBtn').innerHTML = '💾 GUARDAR APROBACIÓN';
    },
    
    cargarParaEdicion: function(id, data) {
        document.getElementById('aprobacionEditId').value = id;
        document.getElementById('aprobacionFecha').value = data.fecha || '';
        document.getElementById('aprobacionPo').value = data.po || '';
        document.getElementById('aprobacionEstilo').value = data.estilo || '';
        document.getElementById('aprobacionNkTela').value = data.nk_tela || '';
        document.getElementById('aprobacionNumeroPlotter').value = data.plotter_numero || '';
        document.getElementById('aprobacionPlotterTemp').value = data.plotter_temp || '';
        document.getElementById('aprobacionPlotterHumedad').value = data.plotter_humedad || '';
        document.getElementById('aprobacionPlotterPerfil').value = data.plotter_perfil || '';
        document.getElementById('aprobacionMontiNumero').value = data.monti_numero || '';
        document.getElementById('aprobacionMontiVelocidad').value = data.monti_velocidad || '';
        document.getElementById('aprobacionMontiTemperatura').value = data.monti_temperatura || '';
        document.getElementById('aprobacionMontiPresion').value = data.monti_presion || '';
        document.getElementById('aprobacionMontiBares').value = data.monti_bares || '';
        document.getElementById('aprobacionMontiTissue').value = data.monti_tissue || '';
        document.getElementById('aprobacionTolerancia').value = data.tolerancia || '';
        document.getElementById('aprobacionAprobadoPor').value = data.aprobado_por || '';
        document.getElementById('aprobacionObservaciones').value = data.observaciones || '';
        
        const container = document.getElementById('aprobacionColoresContainer');
        if (container && data.colores && data.colores.length > 0) {
            container.innerHTML = '';
            data.colores.forEach(color => this.agregarGrupoColor(color.nombre, color.observacion));
        }
        document.getElementById('aprobacionCancelEditBtn').style.display = 'block';
        document.getElementById('aprobacionSubmitBtn').innerHTML = '✏️ ACTUALIZAR APROBACIÓN';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    mostrarMensaje: function(mensaje, tipo) {
        const msgDiv = document.getElementById('aprobacionMensaje');
        if (msgDiv) {
            msgDiv.textContent = mensaje;
            msgDiv.className = `aprobacion-mensaje ${tipo}`;
            msgDiv.style.display = 'block';
            setTimeout(() => msgDiv.style.display = 'none', 3000);
        }
        if (window.Notifications) Notifications[tipo === 'success' ? 'success' : 'error'](mensaje);
    },
    
    agregarEstilos: function() {
        if (document.getElementById('aprobacionStyles')) return;
        const styles = document.createElement('style');
        styles.id = 'aprobacionStyles';
        styles.textContent = `
            .aprobaciones-panel { background: #161B22; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid rgba(0,212,255,0.25); }
            .aprobaciones-header h2 { font-size: 1.1rem; color: #00D4FF; margin-bottom: 0.3rem; }
            .aprobaciones-header p { font-size: 0.8rem; color: #8B949E; margin-bottom: 1.5rem; }
            .aprobacion-form { display: flex; flex-direction: column; gap: 1rem; }
            .form-row-dos { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
            .form-row-cuatro { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
            .form-row-botones { display: grid; grid-template-columns: 1fr auto; gap: 1rem; }
            .full-width { grid-column: 1 / -1; }
            .section-title-aprobacion { display: flex; align-items: center; gap: 0.6rem; margin: 0.8rem 0 0.6rem; }
            .section-title-aprobacion .title-icon { background: #0D1117; width: 1.8rem; height: 1.8rem; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid #00D4FF; }
            .section-title-aprobacion h3 { font-size: 0.85rem; font-weight: 700; color: #00D4FF; text-transform: uppercase; }
            .aprobacion-color-grupo { background: #0D1117; border-radius: 8px; padding: 0.8rem; margin-bottom: 0.8rem; border: 2px solid #00D4FF; }
            .aprobacion-color-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
            .btn-eliminar-color-aprobacion { background: #21262D; border: 2px solid #00D4FF; color: #FF4444; width: 1.8rem; height: 1.8rem; border-radius: 50%; cursor: pointer; }
            .btn-eliminar-color-aprobacion:hover { background: #FF4444; color: white; }
            .aprobacion-color-nombre input, .aprobacion-color-observacion textarea { width: 100%; padding: 0.4rem; background: #0D1117; border: 1px solid #00D4FF; border-radius: 6px; color: white; }
            .aprobacion-color-observacion textarea { margin-top: 0.5rem; resize: vertical; }
            .btn-add-color-small { background: linear-gradient(90deg, #00D4FF, #0099CC); border-radius: 20px; padding: 0.4rem 1rem; font-size: 0.75rem; border: none; color: white; cursor: pointer; }
            .btn-guardar-aprobacion { background: linear-gradient(90deg, #00D4FF, #0099CC); padding: 0.8rem 1.5rem; border: none; border-radius: 8px; color: white; font-weight: 700; cursor: pointer; }
            .btn-guardar-aprobacion:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,212,255,0.3); }
            .aprobacion-mensaje { margin-top: 1rem; padding: 0.8rem; border-radius: 8px; text-align: center; }
            .aprobacion-mensaje.success { background: rgba(0,255,136,0.1); border: 1px solid #00FF88; color: #00FF88; }
            .aprobacion-mensaje.error { background: rgba(255,68,68,0.1); border: 1px solid #FF4444; color: #FF4444; }
            .add-color-container { text-align: center; margin: 0.5rem 0; }
            @media (max-width: 768px) { .form-row-dos, .form-row-cuatro { grid-template-columns: 1fr; } .form-row-botones { grid-template-columns: 1fr; } }
        `;
        document.head.appendChild(styles);
    }
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.ApprovalsModule = ApprovalsModule;
console.log('✅ ApprovalsModule cargado');