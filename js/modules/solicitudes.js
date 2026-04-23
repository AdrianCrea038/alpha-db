// ============================================================
// js/modules/solicitudes.js - Módulo de Reporte de Rechazos y Nuevas Órdenes
// ============================================================

const SolicitudesModule = {
    tipoSeleccionado: '',
    
    init: async function() {
        console.log('📋 Módulo de Solicitudes iniciado');
        this.renderizar();
        this.configurarEventos();
        this.cargarHistorial();
    },
    
    renderizar: function() {
        const container = document.querySelector('.container');
        if (!container) return;
        
        let solicitudesPanel = document.getElementById('solicitudesPanel');
        if (solicitudesPanel) solicitudesPanel.remove();
        
        // Ocultar otras secciones para limpieza visual
        const sectionsToHide = ['.form-section', '.filters-section', '.table-section'];
        sectionsToHide.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) el.style.display = 'none';
        });
        
        const panelHTML = `
            <div id="solicitudesPanel" class="solicitudes-panel" style="animation: fadeIn 0.3s ease-in-out;">
                <div class="solicitudes-header" style="margin-bottom: 1.5rem; border-bottom: 2px solid #00D4FF; padding-bottom: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="color: #00D4FF; font-size: 1.3rem; margin: 0; font-weight: 900; letter-spacing: 1px;">📋 PANEL DE SOLICITUDES</h2>
                </div>

                <div class="solicitudes-grid">
                    <!-- COLUMNA IZQUIERDA: REPORTE -->
                    <div class="col-reporte" style="display: flex; flex-direction: column; gap: 1rem;">
                        <div style="background: #161B22; padding: 1.2rem; border-radius: 12px; border: 1px solid rgba(0,212,255,0.2);">
                            <label style="color: #00D4FF; font-weight: 800; font-size: 0.8rem; display: block; margin-bottom: 0.8rem; text-transform: uppercase;">➕ Crear Nuevo Reporte:</label>
                            <select id="tipoSolicitudSelect" style="width: 100%; background: #0D1117; border: 1px solid #30363D; color: white; padding: 0.8rem; border-radius: 8px; font-size: 0.9rem; cursor: pointer;">
                                <option value="">-- Seleccionar Categoría --</option>
                                <option value="rh">🎨 Rechazo de Color (RH)</option>
                                <option value="orden_nueva">📦 Orden Nueva (Faltante)</option>
                                <option value="lote_ftt">🏭 Lote FTT (Muestra)</option>
                            </select>
                        </div>

                        <div id="formularioSolicitud" style="display: none; background: #161B22; padding: 1.5rem; border-radius: 12px; border: 2px solid #F59E0B; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
                            <h3 id="formularioTitulo" style="color: #F59E0B; font-size: 0.9rem; margin-top: 0; margin-bottom: 1.2rem; font-weight: 900; border-left: 3px solid #F59E0B; padding-left: 0.5rem;"></h3>
                            <form id="solicitudForm">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 1rem;">
                                    <div>
                                        <label style="color: #8B949E; font-size: 0.65rem; display:block; margin-bottom: 0.3rem; font-weight: 800;">N° PO</label>
                                        <input type="text" id="solicitudPo" required style="width:100%; background: #0D1117; border: 1px solid #30363D; color: white; padding: 0.6rem; border-radius: 6px; font-size: 0.85rem;">
                                    </div>
                                    <div>
                                        <label style="color: #8B949E; font-size: 0.65rem; display:block; margin-bottom: 0.3rem; font-weight: 800;">ESTILO</label>
                                        <input type="text" id="solicitudEstilo" required style="width:100%; background: #0D1117; border: 1px solid #30363D; color: white; padding: 0.6rem; border-radius: 6px; font-size: 0.85rem;">
                                    </div>
                                </div>
                                
                                <div id="multiItemFields" style="display: none; margin-bottom: 1rem; padding: 0.8rem; background: rgba(0,212,255,0.03); border-radius: 8px; border: 1px dashed rgba(0,212,255,0.2);">
                                    <div id="rowsContainer">
                                        <!-- Filas dinámicas -->
                                    </div>
                                    <button type="button" id="addBtn" onclick="SolicitudesModule.agregarFila()" style="width: 100%; background: rgba(0,212,255,0.1); border: 1px dashed #00D4FF; color: #00D4FF; padding: 0.4rem; border-radius: 6px; font-size: 0.7rem; cursor: pointer; margin-top: 0.5rem; font-weight: 800;"></button>
                                </div>
                                
                                <div style="margin-bottom: 1.2rem;">
                                    <label style="color: #8B949E; font-size: 0.65rem; display:block; margin-bottom: 0.3rem; font-weight: 800;">DETALLE DEL MOTIVO</label>
                                    <textarea id="solicitudDescripcion" rows="2" style="width:100%; background: #0D1117; border: 1px solid #30363D; color: white; padding: 0.6rem; border-radius: 6px; resize: none; font-size: 0.85rem; font-family: inherit;"></textarea>
                                </div>
                                
                                <div style="display: flex; gap: 0.6rem;">
                                    <button type="button" onclick="SolicitudesModule.cancelarFormulario()" style="flex: 1; background: #21262D; border: 1px solid #30363D; color: #8B949E; padding: 0.7rem; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 700;">Cancelar</button>
                                    <button type="submit" style="flex: 2; background: #F59E0B; border: none; color: #0D1117; font-weight: 900; padding: 0.7rem; border-radius: 8px; cursor: pointer; font-size: 0.8rem;">📤 ENVIAR REPORTE</button>
                                </div>
                            </form>
                        </div>
                        
                        <div id="solicitudMensaje" style="display: none; padding: 1rem; border-radius: 8px; font-size: 0.85rem; text-align: center; font-weight: 700;"></div>
                    </div>

                    <!-- COLUMNA DERECHA: SEGUIMIENTO -->
                    <div class="col-seguimiento" style="background: #161B22; padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(0,212,255,0.1); min-height: 500px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                            <h3 style="color: #00D4FF; margin: 0; font-size: 1rem; font-weight: 800;">🕒 SEGUIMIENTO DE ÓRDENES</h3>
                            
                            <div class="filtros-tabs" style="display: flex; background: #0D1117; padding: 0.3rem; border-radius: 8px; border: 1px solid #30363D;">
                                <button onclick="SolicitudesModule.filtrarTabla('todos')" class="tab-btn active" data-tipo="todos" style="padding: 0.4rem 0.8rem; font-size: 0.65rem; background: #00D4FF; color: #0D1117; border: none; border-radius: 6px; cursor: pointer; font-weight: 900; transition: all 0.2s;">TODOS</button>
                                <button onclick="SolicitudesModule.filtrarTabla('rh')" class="tab-btn" data-tipo="rh" style="padding: 0.4rem 0.8rem; font-size: 0.65rem; background: transparent; color: #8B949E; border: none; border-radius: 6px; cursor: pointer; font-weight: 700;">RH</button>
                                <button onclick="SolicitudesModule.filtrarTabla('lote_ftt')" class="tab-btn" data-tipo="lote_ftt" style="padding: 0.4rem 0.8rem; font-size: 0.65rem; background: transparent; color: #8B949E; border: none; border-radius: 6px; cursor: pointer; font-weight: 700;">FTT</button>
                                <button onclick="SolicitudesModule.filtrarTabla('orden_nueva')" class="tab-btn" data-tipo="orden_nueva" style="padding: 0.4rem 0.8rem; font-size: 0.65rem; background: transparent; color: #8B949E; border: none; border-radius: 6px; cursor: pointer; font-weight: 700;">NUEVAS</button>
                            </div>
                        </div>

                        <div id="tablaSolicitudesContainer" style="display: grid; grid-template-columns: 1fr; gap: 0.8rem;">
                            <div style="text-align: center; padding: 3rem; color: #8B949E;">Cargando...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('afterbegin', panelHTML);
    },

    configurarEventos: function() {
        const tipoSelect = document.getElementById('tipoSolicitudSelect');
        const formContainer = document.getElementById('formularioSolicitud');
        const solicitudForm = document.getElementById('solicitudForm');
        
        if (tipoSelect) {
            tipoSelect.onchange = (e) => {
                this.tipoSeleccionado = e.target.value;
                if (this.tipoSeleccionado) {
                    formContainer.style.display = 'block';
                    this.actualizarFormularioPorTipo();
                } else {
                    formContainer.style.display = 'none';
                }
            };
        }
        
        if (solicitudForm) {
            solicitudForm.onsubmit = (e) => this.guardarSolicitud(e);
        }
    },

    cancelarFormulario: function() {
        const formContainer = document.getElementById('formularioSolicitud');
        const tipoSelect = document.getElementById('tipoSolicitudSelect');
        if (formContainer) formContainer.style.display = 'none';
        if (tipoSelect) tipoSelect.value = '';
        this.tipoSeleccionado = '';
    },

    filtrarTabla: function(tipo) {
        this.filtroActual = tipo;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const isActive = btn.getAttribute('data-tipo') === tipo;
            btn.style.background = isActive ? '#00D4FF' : 'transparent';
            btn.style.color = isActive ? '#0D1117' : '#8B949E';
            btn.style.fontWeight = isActive ? '900' : '700';
        });
        this.cargarHistorial();
    },
    
    actualizarFormularioPorTipo: function() {
        const formularioTitulo = document.getElementById('formularioTitulo');
        const multiItemFields = document.getElementById('multiItemFields');
        const container = document.getElementById('rowsContainer');
        const addBtn = document.getElementById('addBtn');
        
        if (multiItemFields) multiItemFields.style.display = 'block';
        
        const titulos = {
            'orden_nueva': '📦 ORDEN FALTANTE',
            'rh': '🎨 RECHAZO DE COLOR (RH)',
            'lote_ftt': '🏭 SOLICITUD DE LOTE FTT'
        };
        
        const btnLabels = {
            'orden_nueva': '+ AGREGAR OTRO MODELO/TELA',
            'rh': '+ AGREGAR OTRO COLOR/NK',
            'lote_ftt': '+ AGREGAR OTRA MUESTRA (FTT)'
        };
        
        if (formularioTitulo) formularioTitulo.textContent = titulos[this.tipoSeleccionado] || 'REPORTE';
        if (addBtn) addBtn.textContent = btnLabels[this.tipoSeleccionado] || '+ AGREGAR FILA';

        // Resetear a una sola fila inicial
        if (container) {
            container.innerHTML = '';
            this.agregarFila();
        }
    },

    agregarFila: function() {
        const container = document.getElementById('rowsContainer');
        if (!container) return;

        const isFirst = container.children.length === 0;

        const rowHTML = `
            <div class="dynamic-row" style="display: grid; grid-template-columns: 1fr 1fr 30px; gap: 0.8rem; margin-bottom: 0.5rem; align-items: flex-end; animation: slideDown 0.2s ease;">
                <div>
                    ${isFirst ? `<label style="color: #8B949E; font-size: 0.6rem; display:block; margin-bottom: 0.2rem; font-weight: 800;">NK (TELA)</label>` : ''}
                    <input type="text" class="solicitudNk" placeholder="Ej: NK-001" style="width:100%; background: #0D1117; border: 1px solid #30363D; color: white; padding: 0.5rem; border-radius: 6px; font-size: 0.8rem;">
                </div>
                <div>
                    ${isFirst ? `<label style="color: #8B949E; font-size: 0.6rem; display:block; margin-bottom: 0.2rem; font-weight: 800;">COLOR</label>` : ''}
                    <input type="text" class="solicitudColor" placeholder="Ej: NAVY" style="width:100%; background: #0D1117; border: 1px solid #30363D; color: white; padding: 0.5rem; border-radius: 6px; font-size: 0.8rem;">
                </div>
                ${!isFirst ? 
                    `<button type="button" onclick="this.parentElement.remove()" style="background: rgba(255,68,68,0.1); border: 1px solid #FF4444; color: #FF4444; border-radius: 6px; padding: 0.4rem; cursor: pointer; font-weight: bold;">✕</button>` : 
                    `<div style="width: 30px;"></div>`
                }
            </div>
        `;
        container.insertAdjacentHTML('beforeend', rowHTML);
    },
    
    guardarSolicitud: async function(e) {
        e.preventDefault();
        const getValor = (id) => document.getElementById(id)?.value || '';
        
        // Recolectar datos dinámicos (múltiples filas)
        const items = [];
        const rows = document.querySelectorAll('.dynamic-row');
        rows.forEach(row => {
            const nk = row.querySelector('.solicitudNk').value.toUpperCase();
            const color = row.querySelector('.solicitudColor').value.toUpperCase();
            if (nk || color) items.push({ nk, color });
        });

        const datos = {
            id: 'SOL-' + Date.now().toString(36).toUpperCase(),
            tipo: this.tipoSeleccionado,
            po: getValor('solicitudPo').toUpperCase(),
            estilo: getValor('solicitudEstilo').toUpperCase(),
            descripcion: getValor('solicitudDescripcion'),
            fecha: new Date().toISOString(),
            estado: 'enviada',
            creado_por: window.getUsuarioActual ? window.getUsuarioActual().username : 'Desconocido',
            detalles: items // Guardamos el array de NKs y Colores
        };
        
        // Compatibilidad legacy
        if (items.length > 0) {
            datos.nk = items[0].nk;
            datos.colorModificar = items[0].color;
        }
        
        if (window.Notifications) Notifications.info('📤 Enviando...');
        
        if (window.SupabaseClient && window.SupabaseClient.guardarSolicitud) {
            const res = await window.SupabaseClient.guardarSolicitud(datos);
            if (res) {
                const item = {
                    id: 'BAN-' + Date.now().toString(36).toUpperCase(),
                    tipo: 'solicitud',
                    solicitudId: datos.id,
                    titulo: 'Nuevo Reporte: ' + datos.po,
                    po: datos.po,
                    estilo: datos.estilo,
                    descripcion: datos.descripcion,
                    fecha: new Date().toISOString(),
                    leido: false,
                    datosCompletos: datos
                };
                await window.SupabaseClient.guardarBandejaItem(item);
                this.mostrarMensaje('✅ Reporte enviado', 'success');
                document.getElementById('solicitudForm')?.reset();
                this.cancelarFormulario();
                this.cargarHistorial();
            } else {
                this.mostrarMensaje('❌ Error al enviar', 'error');
            }
        }
    },
    
    cargarHistorial: async function() {
        const container = document.getElementById('tablaSolicitudesContainer');
        if (!container) return;
        
        try {
            let solicitudes = [];
            if (window.SupabaseClient && window.SupabaseClient.getSolicitudes) {
                solicitudes = await window.SupabaseClient.getSolicitudes();
            }
            
            const tipoFiltro = this.filtroActual || 'todos';
            if (tipoFiltro !== 'todos') {
                solicitudes = solicitudes.filter(s => s.tipo === tipoFiltro);
            }
            this.renderizarTablaHistorial(solicitudes || []);
        } catch (error) {
            container.innerHTML = '<div style="color: #FF4444; text-align:center; padding:2rem;">Error de conexión</div>';
        }
    },
    
    renderizarTablaHistorial: function(solicitudes) {
        const container = document.getElementById('tablaSolicitudesContainer');
        if (!container) return;
        
        if (solicitudes.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 4rem; color: #8B949E; font-size: 0.8rem;">Sin registros en esta categoría</div>';
            return;
        }
        
        const getEstadoInfo = (estado) => {
            switch(estado) {
                case 'enviada': return { label: 'Enviada', progreso: 15, color: '#00D4FF', bg: 'rgba(0,212,255,0.1)' };
                case 'en_revision': return { label: 'Revisión', progreso: 45, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' };
                case 'en_proceso': return { label: 'Procesando', progreso: 75, color: '#FF8C00', bg: 'rgba(255,140,0,0.1)' };
                case 'completada': return { label: 'Listo', progreso: 100, color: '#00FF88', bg: 'rgba(0,255,136,0.1)' };
                default: return { label: 'Enviada', progreso: 15, color: '#00D4FF', bg: 'rgba(0,212,255,0.1)' };
            }
        };
        
        let html = '';
        solicitudes.forEach(sol => {
            const info = getEstadoInfo(sol.estado);
            const icon = sol.tipo === 'rh' ? '🎨' : (sol.tipo === 'lote_ftt' ? '🏭' : '📦');
            html += `
                <div style="background: #0D1117; border: 1px solid rgba(255,255,255,0.05); border-left: 4px solid ${info.color}; padding: 1rem; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem;">
                        <div>
                            <div style="font-weight: 900; color: white; font-size: 0.9rem;">${icon} ${sol.po}</div>
                            <div style="font-size: 0.65rem; color: #8B949E; font-weight: 600;">ESTILO: ${sol.estilo}</div>
                        </div>
                        <span style="font-size: 0.6rem; font-weight: 900; color: ${info.color}; background: ${info.bg}; padding: 0.2rem 0.5rem; border-radius: 4px;">${info.label.toUpperCase()}</span>
                    </div>
                    <div style="background: #21262D; height: 5px; border-radius: 10px; overflow: hidden; margin-bottom: 0.5rem;">
                        <div style="height: 100%; width: ${info.progreso}%; background: ${info.color}; box-shadow: 0 0 10px ${info.color}66; transition: width 1s ease-in-out;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 0.65rem; color: #444;">${new Date(sol.fecha).toLocaleDateString()}</div>
                        ${sol.estado === 'completada' ? 
                            `<button onclick="SolicitudesModule.cargarAFormulario('${sol.id}')" style="background: #00FF88; color: #0D1117; border:none; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 900; font-size: 0.6rem; cursor: pointer;">CARGAR ✅</button>` : 
                            ''
                        }
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    cargarAFormulario: async function(id) {
        if (window.Sidebar) Sidebar.mostrarBaseDatos();
        try {
            const solicitudes = await window.SupabaseClient.getSolicitudes();
            const sol = solicitudes.find(s => s.id === id);
            if (sol && window.RecordsModule && window.RecordsModule.cargarDatosPrellenados) {
                setTimeout(() => {
                    window.RecordsModule.cargarDatosPrellenados({ po: sol.po, estilo: sol.estilo, es_reemplazo: true });
                }, 500);
            }
        } catch (e) { console.error(e); }
    },
    
    mostrarMensaje: function(mensaje, tipo) {
        const msgDiv = document.getElementById('solicitudMensaje');
        if (msgDiv) {
            msgDiv.textContent = mensaje;
            msgDiv.style.background = tipo === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)';
            msgDiv.style.color = tipo === 'success' ? '#00FF88' : '#FF4444';
            msgDiv.style.display = 'block';
            setTimeout(() => msgDiv.style.display = 'none', 4000);
        }
    }
};

window.SolicitudesModule = SolicitudesModule;
