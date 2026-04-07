// ============================================================
// js/modules/inbox.js - Bandeja de entrada
// Versión: Guarda en Supabase
// ============================================================

const InboxModule = {
    datos: [],
    usuarios: [],
    
    init: async function() {
        console.log('📥 Módulo de Bandeja de Entrada iniciado');
        await this.cargarUsuarios();
        await this.cargarDatos();
        this.renderizar();
        this.configurarEventos();
    },
    
    cargarUsuarios: async function() {
        if (window.SupabaseClient && window.SupabaseClient.client) {
            try {
                const usuariosDB = await window.SupabaseClient.getUsuarios();
                if (usuariosDB) {
                    this.usuarios = usuariosDB;
                    return;
                }
            } catch (error) {
                console.error('Error cargando usuarios:', error);
            }
        }
        
        const usuariosGuardados = localStorage.getItem('alpha_db_usuarios');
        if (usuariosGuardados) {
            this.usuarios = JSON.parse(usuariosGuardados);
        } else {
            this.usuarios = [];
        }
    },
    
    cargarDatos: async function() {
        try {
            // Intentar cargar desde Supabase
            if (window.SupabaseClient && window.SupabaseClient.client) {
                const bandejaDB = await window.SupabaseClient.getBandejaItems();
                if (bandejaDB && bandejaDB.length > 0) {
                    this.datos = bandejaDB;
                    localStorage.setItem('alpha_db_bandeja_entrada', JSON.stringify(bandejaDB));
                    console.log('📥 Bandeja cargada desde Supabase:', this.datos.length);
                    return;
                }
            }
        } catch (error) {
            console.error('Error cargando bandeja desde Supabase:', error);
        }
        
        // Fallback a localStorage
        const bandejaGuardada = localStorage.getItem('alpha_db_bandeja_entrada');
        if (bandejaGuardada) {
            this.datos = JSON.parse(bandejaGuardada);
        } else {
            this.datos = [];
        }
    },
    
    guardarBandeja: async function() {
        // Guardar en localStorage
        localStorage.setItem('alpha_db_bandeja_entrada', JSON.stringify(this.datos));
        
        // Guardar en Supabase
        if (window.SupabaseClient && window.SupabaseClient.client) {
            try {
                for (const item of this.datos) {
                    await window.SupabaseClient.guardarBandejaItem(item);
                }
                console.log('📥 Bandeja sincronizada con Supabase');
            } catch (error) {
                console.error('Error guardando bandeja en Supabase:', error);
            }
        }
    },
    
    renderizar: function() {
        const existingPanel = document.getElementById('bandejaEntradaPanel');
        if (existingPanel) existingPanel.remove();
        
        const container = document.querySelector('.container');
        if (!container) return;
        
        const panelHTML = `
            <div id="bandejaEntradaPanel" class="bandeja-entrada-panel">
                <div class="bandeja-header">
                    <h2>📥 BANDEJA DE ENTRADA</h2>
                    <p>Solicitudes y notificaciones - Asignar y dar seguimiento</p>
                </div>
                
                <div class="bandeja-filtros">
                    <input type="text" id="bandejaSearchInput" placeholder="Buscar por PO, estilo, NK, color..." class="input-bonito">
                    <select id="bandejaFiltroEstado" class="select-bonito">
                        <option value="">Todos los estados</option>
                        <option value="no_leido">📬 No leídos</option>
                        <option value="leido">📖 Leídos</option>
                        <option value="asignado">👤 Asignados a mí</option>
                        <option value="no_asignado">⏳ Sin asignar</option>
                        <option value="completado">✅ Completados</option>
                    </select>
                    <button id="bandejaBuscarBtn" class="btn-filtrar">🔍 BUSCAR</button>
                    <button id="bandejaLimpiarBtn" class="btn-limpiar">✕ LIMPIAR</button>
                </div>
                
                <div id="bandejaLoader" class="tracking-loader" style="display: none;">
                    <div class="spinner"></div>
                    <p>Cargando datos...</p>
                </div>
                
                <div id="bandejaResultados" class="bandeja-resultados">
                    ${this.renderizarLista(this.datos)}
                </div>
            </div>
        `;
        
        const filtersSection = document.querySelector('.filters-section');
        if (filtersSection) {
            filtersSection.insertAdjacentHTML('beforebegin', panelHTML);
        } else {
            container.insertAdjacentHTML('afterbegin', panelHTML);
        }
        
        this.agregarEstilos();
    },
    
    renderizarOpcionesUsuarios: function() {
        if (!this.usuarios || this.usuarios.length === 0) {
            return '<option value="">No hay usuarios</option>';
        }
        
        let options = '';
        for (let i = 0; i < this.usuarios.length; i++) {
            const user = this.usuarios[i];
            let rolIcon = '';
            if (user.rol === 'admin') rolIcon = '👑 ';
            else if (user.rol === 'operador') rolIcon = '👤 ';
            else if (user.rol === 'usuario_tracking') rolIcon = '📍 ';
            else if (user.rol === 'consultor') rolIcon = '👁️ ';
            options += `<option value="${user.username}">${rolIcon}${user.username} (${user.rol})</option>`;
        }
        return options;
    },
    
    renderizarOpcionesUsuariosSeleccion: function(asignadoActual) {
        if (!this.usuarios || this.usuarios.length === 0) {
            return '<option value="">No hay usuarios</option>';
        }
        
        let options = '<option value="">-- Sin asignar --</option>';
        for (let i = 0; i < this.usuarios.length; i++) {
            const user = this.usuarios[i];
            const selected = (asignadoActual === user.username) ? 'selected' : '';
            let rolIcon = '';
            if (user.rol === 'admin') rolIcon = '👑 ';
            else if (user.rol === 'operador') rolIcon = '👤 ';
            else if (user.rol === 'usuario_tracking') rolIcon = '📍 ';
            else if (user.rol === 'consultor') rolIcon = '👁️ ';
            options += `<option value="${user.username}" ${selected}>${rolIcon}${user.username} (${user.rol})</option>`;
        }
        return options;
    },
    
    formatearFecha: function(fechaStr) {
        if (!fechaStr) return '-';
        const fecha = new Date(fechaStr);
        const hoy = new Date();
        const ayer = new Date(hoy);
        ayer.setDate(hoy.getDate() - 1);
        
        if (fecha.toDateString() === hoy.toDateString()) {
            return `Hoy ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (fecha.toDateString() === ayer.toDateString()) {
            return `Ayer ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        }
        return fecha.toLocaleDateString('es-ES');
    },
    
    calcularTiempoTranscurrido: function(fechaStr) {
        const fecha = new Date(fechaStr);
        const ahora = new Date();
        const diffMs = ahora - fecha;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHoras = Math.floor(diffMs / 3600000);
        const diffDias = Math.floor(diffMs / 86400000);
        
        if (diffMin < 60) return `hace ${diffMin} min`;
        if (diffHoras < 24) return `hace ${diffHoras} h`;
        return `hace ${diffDias} d`;
    },
    
    renderizarLista: function(datos) {
        const usuarioActual = window.getUsuarioActual();
        const nombreUsuarioActual = usuarioActual ? usuarioActual.username : '';
        
        if (!datos || datos.length === 0) {
            return '<div class="bandeja-vacio">📭 No hay elementos en la bandeja de entrada</div>';
        }
        
        let html = '<div class="bandeja-items-container">';
        
        for (let i = 0; i < datos.length; i++) {
            const item = datos[i];
            const estadoAsignacion = item.estadoAsignacion || 'pendiente';
            const esAsignadoAMI = (item.asignadoA === nombreUsuarioActual);
            const esRH = (item.tipo === 'solicitud' && item.datosCompletos && item.datosCompletos.tipo === 'rh');
            
            if (item.asignadoA && !esAsignadoAMI && usuarioActual.rol !== 'admin') continue;
            
            let estadoClass = '';
            let estadoTexto = '';
            if (estadoAsignacion === 'completado') {
                estadoClass = 'estado-completado';
                estadoTexto = '✅ Completado';
                if (item.fechaResolucion) estadoTexto += ` (${this.calcularTiempoTranscurrido(item.fechaResolucion)})`;
            } else if (item.asignadoA) {
                estadoClass = 'estado-asignado';
                estadoTexto = `👤 Asignado a: ${item.asignadoA}`;
                if (item.fechaAsignacion) estadoTexto += ` - Asignado ${this.calcularTiempoTranscurrido(item.fechaAsignacion)}`;
            } else {
                estadoClass = 'estado-pendiente';
                estadoTexto = '⏳ Sin asignar';
                if (item.fecha) estadoTexto += ` - Creada ${this.calcularTiempoTranscurrido(item.fecha)}`;
            }
            
            // Historial de reemplazos para solicitudes RH
            let historialHtml = '';
            let datosActualesHtml = '';
            let botonesAccionHtml = '';
            
            if (esRH && estadoAsignacion !== 'completado') {
                const nk = item.datosCompletos.nk;
                const color = item.datosCompletos.colorModificar;
                
                if (nk && color) {
                    historialHtml = `
                        <div class="historial-reemplazos">
                            <details>
                                <summary>📜 HISTORIAL DE REEMPLAZOS ANTERIORES</summary>
                                <div class="historial-lista">
                                    <div class="historial-item">
                                        <div class="historial-fecha">📅 No hay reemplazos previos</div>
                                    </div>
                                </div>
                            </details>
                        </div>
                    `;
                    
                    datosActualesHtml = `
                        <div class="datos-actuales">
                            <details>
                                <summary>📊 DATOS ACTUALES DE ${nk} - ${color}</summary>
                                <div class="datos-contenido">
                                    <div class="sin-datos">⚠️ Consulte en Base de Datos</div>
                                </div>
                            </details>
                        </div>
                    `;
                    
                    botonesAccionHtml = `
                        <div class="botones-accion-solicitud">
                            <button class="btn-consultar" onclick="InboxModule.verDatosCompletos('${item.id}')">🔍 CONSULTAR DATOS ACTUALES</button>
                            <button class="btn-reemplazar" onclick="InboxModule.prepararReemplazo('${item.id}')">✏️ HACER REEMPLAZO</button>
                        </div>
                    `;
                }
            }
            
            html += `
                <div class="bandeja-item ${item.leido ? 'leido' : 'no-leido'} ${estadoClass}" data-id="${item.id}">
                    <div class="bandeja-item-icon">
                        ${item.tipo === 'solicitud' ? (esRH ? '🎨' : '📋') : '✅'}
                    </div>
                    <div class="bandeja-item-contenido">
                        <div class="bandeja-item-header">
                            <span class="bandeja-item-titulo">${this.escapeHtml(item.titulo || 'Sin título')}</span>
                            <span class="bandeja-item-fecha">${this.formatearFecha(item.fecha)}</span>
                        </div>
                        <div class="bandeja-item-info">
                            <span class="bandeja-item-po">📦 PO: ${item.po || '-'}</span>
                            <span class="bandeja-item-estilo">🎯 Estilo: ${item.estilo || '-'}</span>
                            ${item.nk ? `<span class="bandeja-item-nk">🧵 NK: ${item.nk}</span>` : ''}
                            ${item.colorModificar ? `<span class="bandeja-item-color">🎨 Color: ${item.colorModificar}</span>` : ''}
                            <span class="bandeja-item-estado ${estadoClass}">${estadoTexto}</span>
                        </div>
                        <div class="bandeja-item-descripcion">
                            ${item.descripcion ? (item.descripcion.length > 100 ? item.descripcion.substring(0, 100) + '...' : item.descripcion) : 'Sin descripción'}
                        </div>
                        ${historialHtml}
                        ${datosActualesHtml}
                        ${botonesAccionHtml}
                        
                        <div class="bandeja-item-asignacion">
                            <label>👥 Asignar a:</label>
                            <select class="asignar-usuario-select" data-id="${item.id}" onchange="InboxModule.asignarUsuario('${item.id}', this.value)">
                                <option value="">-- Seleccionar usuario --</option>
                                ${this.renderizarOpcionesUsuariosSeleccion(item.asignadoA)}
                            </select>
                            ${item.asignadoA && estadoAsignacion !== 'completado' && esAsignadoAMI ? `
                                <button class="btn-marcar-completado" onclick="InboxModule.marcarCompletado('${item.id}')">✅ Completar</button>
                            ` : ''}
                            ${estadoAsignacion === 'completado' ? '<span class="completado-badge">✅ Tarea completada</span>' : ''}
                        </div>
                    </div>
                    <div class="bandeja-item-acciones">
                        <button class="btn-icon ver" onclick="InboxModule.verDetalle('${item.id}')" title="Ver detalle">👁️</button>
                        <button class="btn-icon eliminar" onclick="InboxModule.eliminarItem('${item.id}')" title="Eliminar">🗑️</button>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    },
    
    verDatosCompletos: function(itemId) {
        const item = this.datos.find(d => d.id === itemId);
        if (!item) return;
        
        alert(`🔍 Consultar datos actuales de:\nPO: ${item.po}\nNK: ${item.nk || 'N/A'}\nColor: ${item.colorModificar || 'N/A'}\n\nVaya a BASE DE DATOS y busque este NK.`);
    },
    
    prepararReemplazo: function(itemId) {
        const item = this.datos.find(d => d.id === itemId);
        if (!item) return;
        
        // Guardar en sessionStorage para pasar a main.js
        const datosPrellenados = {
            po: item.po,
            estilo: item.estilo,
            nks: item.nk ? [{ nk: item.nk, colores: [{ nombre: item.colorModificar, cyan: 0, magenta: 0, yellow: 0, black: 0, turquesa: 0, naranja: 0, fluorYellow: 0, fluorPink: 0 }] }] : [],
            editando: false
        };
        
        sessionStorage.setItem('reemplazoPendiente', JSON.stringify(datosPrellenados));
        sessionStorage.setItem('solicitudId', item.id);
        
        window.location.href = 'index.html#reemplazo';
    },
    
    configurarEventos: function() {
        const searchInput = document.getElementById('bandejaSearchInput');
        const filtroEstado = document.getElementById('bandejaFiltroEstado');
        const buscarBtn = document.getElementById('bandejaBuscarBtn');
        const limpiarBtn = document.getElementById('bandejaLimpiarBtn');
        
        if (buscarBtn) {
            buscarBtn.addEventListener('click', () => this.filtrar());
        }
        if (limpiarBtn) {
            limpiarBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                if (filtroEstado) filtroEstado.value = '';
                this.filtrar();
            });
        }
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.filtrar();
            });
        }
    },
    
    filtrar: function() {
        const usuarioActual = window.getUsuarioActual();
        const nombreUsuarioActual = usuarioActual ? usuarioActual.username : '';
        const searchTerm = document.getElementById('bandejaSearchInput')?.value.toLowerCase() || '';
        const filtroEstado = document.getElementById('bandejaFiltroEstado')?.value || '';
        
        let filtrados = [...this.datos];
        
        if (searchTerm) {
            filtrados = filtrados.filter(item => 
                (item.po && item.po.toLowerCase().includes(searchTerm)) ||
                (item.estilo && item.estilo.toLowerCase().includes(searchTerm)) ||
                (item.nk && item.nk.toLowerCase().includes(searchTerm)) ||
                (item.titulo && item.titulo.toLowerCase().includes(searchTerm)) ||
                (item.descripcion && item.descripcion.toLowerCase().includes(searchTerm))
            );
        }
        
        if (filtroEstado === 'no_leido') {
            filtrados = filtrados.filter(item => !item.leido);
        } else if (filtroEstado === 'leido') {
            filtrados = filtrados.filter(item => item.leido);
        } else if (filtroEstado === 'asignado') {
            filtrados = filtrados.filter(item => item.asignadoA === nombreUsuarioActual && item.estadoAsignacion !== 'completado');
        } else if (filtroEstado === 'no_asignado') {
            filtrados = filtrados.filter(item => !item.asignadoA);
        } else if (filtroEstado === 'completado') {
            filtrados = filtrados.filter(item => item.estadoAsignacion === 'completado');
        }
        
        const resultadosDiv = document.getElementById('bandejaResultados');
        if (resultadosDiv) {
            resultadosDiv.innerHTML = this.renderizarLista(filtrados);
        }
    },
    
    asignarUsuario: async function(itemId, username) {
        const item = this.datos.find(d => d.id === itemId);
        if (!item) return;
        
        item.asignadoA = username || null;
        item.estadoAsignacion = username ? 'asignado' : 'pendiente';
        item.fechaAsignacion = username ? new Date().toISOString() : null;
        
        const comentarioAsignacion = `📌 Asignado a: ${username || 'Sin asignar'} el ${new Date().toLocaleString()}`;
        item.descripcion = item.descripcion ? comentarioAsignacion + '\n' + item.descripcion : comentarioAsignacion;
        
        await this.guardarBandeja();
        this.filtrar();
        
        if (username) {
            if (window.Notifications) Notifications.success(`✅ Solicitud asignada a ${username}`);
        } else {
            if (window.Notifications) Notifications.info(`📌 Solicitud desasignada`);
        }
    },
    
    marcarCompletado: async function(itemId) {
        const item = this.datos.find(d => d.id === itemId);
        if (!item) return;
        
        if (!item.asignadoA) {
            if (window.Notifications) Notifications.warning('⚠️ Primero debe asignar esta solicitud a un usuario');
            return;
        }
        
        const comentario = prompt('📝 Ingrese comentario sobre la solución/reemplazo realizado:', '');
        if (comentario === null) return;
        
        item.estadoAsignacion = 'completado';
        item.fechaResolucion = new Date().toISOString();
        item.comentarioCompletado = comentario;
        
        const comentarioCompleto = `✅ Completado por ${item.asignadoA} el ${new Date().toLocaleString()}. Comentario: ${comentario}`;
        item.descripcion = item.descripcion ? comentarioCompleto + '\n' + item.descripcion : comentarioCompleto;
        
        await this.guardarBandeja();
        this.filtrar();
        
        if (window.Notifications) Notifications.success('✅ Solicitud marcada como completada');
    },
    
    verDetalle: function(id) {
        const item = this.datos.find(d => d.id === id);
        if (!item) return;
        
        if (!item.leido) {
            item.leido = true;
            this.guardarBandeja();
            this.filtrar();
        }
        
        let detalleHtml = `
            <div style="background:#0D1117; border-radius:8px; padding:1rem;">
                <p><strong>📅 Fecha:</strong> ${this.formatearFecha(item.fecha)}</p>
                <p><strong>📦 PO:</strong> ${item.po || '-'}</p>
                <p><strong>🎯 Estilo:</strong> ${item.estilo || '-'}</p>
                <p><strong>📌 Título:</strong> ${item.titulo || '-'}</p>
                ${item.nk ? `<p><strong>🧵 NK:</strong> ${item.nk}</p>` : ''}
                ${item.colorModificar ? `<p><strong>🎨 Color:</strong> ${item.colorModificar}</p>` : ''}
                <p><strong>👤 Asignado a:</strong> ${item.asignadoA || 'Sin asignar'}</p>
                <p><strong>📊 Estado:</strong> ${item.estadoAsignacion === 'completado' ? '✅ Completado' : (item.asignadoA ? '👤 Asignado' : '⏳ Pendiente')}</p>
        `;
        
        if (item.fechaAsignacion) {
            detalleHtml += `<p><strong>📅 Fecha asignación:</strong> ${this.formatearFecha(item.fechaAsignacion)} (${this.calcularTiempoTranscurrido(item.fechaAsignacion)})</p>`;
        }
        
        if (item.fechaResolucion) {
            detalleHtml += `<p><strong>📅 Fecha completado:</strong> ${this.formatearFecha(item.fechaResolucion)} (${this.calcularTiempoTranscurrido(item.fechaResolucion)})</p>`;
            detalleHtml += `<p><strong>📝 Comentario solución:</strong> ${item.comentarioCompletado || '-'}</p>`;
        }
        
        if (item.datosCompletos && item.datosCompletos.tipo === 'rh') {
            detalleHtml += `<p><strong>🧵 Tela producción:</strong> ${item.datosCompletos.telaProduccion || '-'}</p>`;
        }
        
        detalleHtml += `<p><strong>📝 Descripción:</strong> ${item.descripcion || '-'}</p></div>`;
        
        const modal = document.createElement('div');
        modal.className = 'modal-detalle-bandeja';
        modal.innerHTML = `
            <div class="modal-detalle-bandeja-content">
                <div class="modal-detalle-bandeja-header">
                    <h3>📋 DETALLE DE SOLICITUD</h3>
                    <button class="modal-close-bandeja" onclick="this.closest('.modal-detalle-bandeja').remove()">✕</button>
                </div>
                <div class="modal-detalle-bandeja-body">${detalleHtml}</div>
                <div class="modal-detalle-bandeja-footer">
                    <button class="btn-cerrar-bandeja" onclick="this.closest('.modal-detalle-bandeja').remove()">CERRAR</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    eliminarItem: async function(id) {
        if (!confirm('¿Eliminar este elemento de la bandeja?')) return;
        
        this.datos = this.datos.filter(d => d.id !== id);
        await this.guardarBandeja();
        this.filtrar();
        if (window.Notifications) Notifications.success('🗑️ Elemento eliminado');
    },
    
    escapeHtml: function(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    },
    
    agregarEstilos: function() {
        if (document.getElementById('bandejaStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'bandejaStyles';
        styles.textContent = `
            .bandeja-entrada-panel {
                background: #161B22;
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                border: 1px solid rgba(0,212,255,0.25);
            }
            .bandeja-header h2 {
                font-size: 1.1rem;
                color: #00D4FF;
                margin-bottom: 0.3rem;
            }
            .bandeja-header p {
                font-size: 0.8rem;
                color: #8B949E;
                margin-bottom: 1rem;
            }
            .bandeja-filtros {
                display: flex;
                gap: 0.8rem;
                flex-wrap: wrap;
                margin-bottom: 1.5rem;
            }
            .bandeja-filtros input {
                flex: 2;
                min-width: 200px;
            }
            .bandeja-filtros select {
                flex: 1;
                min-width: 150px;
            }
            
            .bandeja-items-container {
                display: flex;
                flex-direction: column;
                gap: 0.8rem;
            }
            .bandeja-item {
                background: #0D1117;
                border-radius: 8px;
                padding: 1rem;
                display: flex;
                gap: 1rem;
                transition: all 0.2s;
                border-left: 3px solid #00D4FF;
            }
            .bandeja-item.no-leido {
                background: #1a1a2e;
                border-left-color: #00FF88;
            }
            .bandeja-item.estado-completado {
                border-left-color: #00FF88;
                opacity: 0.8;
            }
            .bandeja-item:hover {
                transform: translateX(4px);
            }
            .bandeja-item-icon {
                font-size: 2rem;
                min-width: 50px;
                text-align: center;
            }
            .bandeja-item-contenido {
                flex: 1;
            }
            .bandeja-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
                flex-wrap: wrap;
                gap: 0.5rem;
            }
            .bandeja-item-titulo {
                font-weight: 700;
                color: #00D4FF;
                font-size: 0.9rem;
            }
            .bandeja-item-fecha {
                font-size: 0.65rem;
                color: #8B949E;
            }
            .bandeja-item-info {
                display: flex;
                gap: 1rem;
                margin-bottom: 0.5rem;
                font-size: 0.7rem;
                flex-wrap: wrap;
                align-items: center;
            }
            .bandeja-item-nk {
                background: rgba(168,85,247,0.2);
                color: #A855F7;
                padding: 0.1rem 0.4rem;
                border-radius: 4px;
            }
            .bandeja-item-color {
                background: rgba(0,212,255,0.2);
                color: #00D4FF;
                padding: 0.1rem 0.4rem;
                border-radius: 4px;
            }
            .bandeja-item-estado {
                padding: 0.2rem 0.5rem;
                border-radius: 20px;
                font-size: 0.65rem;
            }
            .bandeja-item-estado.estado-pendiente {
                background: rgba(245,158,11,0.2);
                color: #F59E0B;
            }
            .bandeja-item-estado.estado-asignado {
                background: rgba(0,212,255,0.2);
                color: #00D4FF;
            }
            .bandeja-item-estado.estado-completado {
                background: rgba(0,255,136,0.2);
                color: #00FF88;
            }
            .bandeja-item-descripcion {
                font-size: 0.75rem;
                color: #FFFFFF;
                opacity: 0.8;
                margin-bottom: 0.5rem;
            }
            
            .historial-reemplazos, .datos-actuales {
                margin: 0.5rem 0;
                background: #0a0a0a;
                border-radius: 8px;
                padding: 0.5rem;
            }
            .historial-reemplazos summary, .datos-actuales summary {
                cursor: pointer;
                color: #00D4FF;
                font-size: 0.7rem;
                font-weight: 600;
                padding: 0.3rem;
            }
            .botones-accion-solicitud {
                display: flex;
                gap: 0.5rem;
                margin: 0.5rem 0;
            }
            .btn-consultar, .btn-reemplazar {
                flex: 1;
                padding: 0.3rem 0.8rem;
                border-radius: 6px;
                font-size: 0.7rem;
                cursor: pointer;
            }
            .btn-consultar {
                background: #21262D;
                border: 1px solid #00D4FF;
                color: #00D4FF;
            }
            .btn-reemplazar {
                background: linear-gradient(90deg, #00D4FF, #0099CC);
                border: none;
                color: #0D1117;
                font-weight: 700;
            }
            .bandeja-item-asignacion {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                flex-wrap: wrap;
                margin-top: 0.5rem;
                padding-top: 0.5rem;
                border-top: 1px solid rgba(0,212,255,0.2);
            }
            .bandeja-item-asignacion label {
                font-size: 0.7rem;
                color: #8B949E;
            }
            .asignar-usuario-select {
                background: #21262D;
                border: 1px solid #00D4FF;
                border-radius: 6px;
                padding: 0.3rem 0.5rem;
                color: white;
                font-size: 0.7rem;
                cursor: pointer;
            }
            .btn-marcar-completado {
                background: linear-gradient(90deg, #00FF88, #00CC66);
                border: none;
                padding: 0.3rem 0.8rem;
                border-radius: 6px;
                color: #0D1117;
                font-weight: 700;
                cursor: pointer;
                font-size: 0.7rem;
            }
            .completado-badge {
                background: rgba(0,255,136,0.2);
                color: #00FF88;
                padding: 0.2rem 0.6rem;
                border-radius: 20px;
                font-size: 0.65rem;
            }
            .bandeja-item-acciones {
                display: flex;
                gap: 0.3rem;
                align-items: flex-start;
            }
            .bandeja-item-acciones .btn-icon {
                padding: 0.3rem 0.5rem;
                background: #21262D;
                border: 1px solid #00D4FF;
                border-radius: 4px;
                cursor: pointer;
            }
            .bandeja-vacio {
                text-align: center;
                padding: 2rem;
                color: #8B949E;
            }
            
            .modal-detalle-bandeja {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                backdrop-filter: blur(8px);
                z-index: 2000;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .modal-detalle-bandeja-content {
                background: #161B22;
                border: 2px solid #00D4FF;
                border-radius: 12px;
                width: 90%;
                max-width: 500px;
                display: flex;
                flex-direction: column;
            }
            .modal-detalle-bandeja-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid rgba(0,212,255,0.3);
            }
            .modal-detalle-bandeja-header h3 {
                color: #00D4FF;
                margin: 0;
            }
            .modal-close-bandeja {
                background: #21262D;
                border: 2px solid #00D4FF;
                color: #00D4FF;
                width: 2rem;
                height: 2rem;
                border-radius: 6px;
                cursor: pointer;
            }
            .modal-detalle-bandeja-body {
                padding: 1rem;
                max-height: 60vh;
                overflow-y: auto;
            }
            .modal-detalle-bandeja-footer {
                padding: 1rem;
                border-top: 1px solid rgba(0,212,255,0.3);
                text-align: right;
            }
            .btn-cerrar-bandeja {
                background: #21262D;
                border: 1px solid #00D4FF;
                padding: 0.5rem 1.5rem;
                border-radius: 8px;
                color: #00D4FF;
                cursor: pointer;
            }
            
            @media (max-width: 768px) {
                .bandeja-filtros {
                    flex-direction: column;
                }
                .bandeja-item {
                    flex-direction: column;
                }
                .bandeja-item-icon {
                    text-align: left;
                }
                .bandeja-item-asignacion {
                    flex-direction: column;
                    align-items: stretch;
                }
                .botones-accion-solicitud {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(styles);
    }
};

window.InboxModule = InboxModule;
console.log('✅ InboxModule cargado - Guarda en Supabase');
