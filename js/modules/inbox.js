// ============================================================
// js/modules/inbox.js - Bandeja de entrada
// Versión: Con historial de reemplazos y botones de acción
// ============================================================

const InboxModule = {
    datos: [],
    usuarios: [],
    
    init: function() {
        console.log('📥 Módulo de Bandeja de Entrada iniciado');
        this.cargarUsuarios();
        this.cargarDatos();
        this.renderizar();
        this.configurarEventos();
    },
    
    cargarUsuarios: function() {
        const usuariosGuardados = localStorage.getItem('alpha_db_usuarios');
        if (usuariosGuardados) {
            this.usuarios = JSON.parse(usuariosGuardados);
        } else {
            this.usuarios = [];
        }
    },
    
    cargarDatos: async function() {
        try {
            const bandejaGuardada = localStorage.getItem('alpha_db_bandeja_entrada');
            if (bandejaGuardada) {
                this.datos = JSON.parse(bandejaGuardada);
            } else {
                this.datos = [];
            }
            
            if (window.SupabaseClient && window.SupabaseClient.client) {
                const { data, error } = await window.SupabaseClient.client
                    .from('aprobaciones')
                    .select('*')
                    .eq('estado', 'pendiente')
                    .order('fecha', { ascending: false });
                
                if (!error && data) {
                    const aprobacionesComoItems = data.map(ap => ({
                        id: 'APR-' + ap.id,
                        tipo: 'aprobacion',
                        solicitudId: ap.id,
                        titulo: 'Aprobación de Piso',
                        po: ap.po,
                        estilo: ap.estilo,
                        fecha: ap.fecha,
                        leido: false,
                        asignadoA: null,
                        estadoAsignacion: 'pendiente',
                        datosCompletos: ap
                    }));
                    this.datos = [...aprobacionesComoItems, ...this.datos];
                }
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.cargarLocalStorage();
        }
    },
    
    cargarLocalStorage: function() {
        const bandejaGuardada = localStorage.getItem('alpha_db_bandeja_entrada');
        this.datos = bandejaGuardada ? JSON.parse(bandejaGuardada) : [];
    },
    
    guardarBandeja: function() {
        localStorage.setItem('alpha_db_bandeja_entrada', JSON.stringify(this.datos));
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
                    <p>Solicitudes asignadas - Historial de reemplazos</p>
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
    
    // ============================================================
    // OBTENER HISTORIAL DE REEMPLAZOS PARA NK + COLOR
    // ============================================================
    
    obtenerHistorialReemplazos: function(nk, color) {
        const registros = AppState.registros || [];
        const historial = [];
        
        for (const reg of registros) {
            if (reg.nks && reg.nks.length > 0) {
                for (const nkItem of reg.nks) {
                    if (nkItem.nk === nk && nkItem.colores) {
                        for (const colorItem of nkItem.colores) {
                            if (colorItem.nombre === color) {
                                historial.push({
                                    fecha: reg.actualizado || reg.creado,
                                    usuario: reg.usuarioModifico || 'Sistema',
                                    cambios: `Color ${color} en NK ${nk}`,
                                    valores: {
                                        cyan: colorItem.cyan,
                                        magenta: colorItem.magenta,
                                        yellow: colorItem.yellow,
                                        black: colorItem.black
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
        
        // Ordenar por fecha más reciente
        historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        return historial;
    },
    
    // ============================================================
    // CONSULTAR DATOS ACTUALES DE NK + COLOR
    // ============================================================
    
    consultarDatosActuales: function(nk, color) {
        const registros = AppState.registros || [];
        let datosActuales = null;
        
        for (const reg of registros) {
            if (reg.nks && reg.nks.length > 0) {
                for (const nkItem of reg.nks) {
                    if (nkItem.nk === nk && nkItem.colores) {
                        for (const colorItem of nkItem.colores) {
                            if (colorItem.nombre === color) {
                                datosActuales = {
                                    nk: nk,
                                    color: color,
                                    cyan: colorItem.cyan,
                                    magenta: colorItem.magenta,
                                    yellow: colorItem.yellow,
                                    black: colorItem.black,
                                    turquesa: colorItem.turquesa || 0,
                                    naranja: colorItem.naranja || 0,
                                    fluorYellow: colorItem.fluorYellow || 0,
                                    fluorPink: colorItem.fluorPink || 0,
                                    ultimaModificacion: reg.actualizado || reg.creado,
                                    usuario: reg.usuarioModifico || 'Sistema'
                                };
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        return datosActuales;
    },
    
    // ============================================================
    // PREPARAR DATOS PARA REEMPLAZO
    // ============================================================
    
    prepararReemplazo: function(solicitud) {
        // Buscar si ya existe un registro con este NK
        const registros = AppState.registros || [];
        let registroExistente = null;
        let nkExistente = null;
        
        for (const reg of registros) {
            if (reg.nks && reg.nks.length > 0) {
                for (const nkItem of reg.nks) {
                    if (nkItem.nk === solicitud.nk) {
                        registroExistente = reg;
                        nkExistente = nkItem;
                        break;
                    }
                }
            }
            if (registroExistente) break;
        }
        
        // Datos para pre-llenar el formulario
        const datosPrellenados = {
            po: solicitud.po,
            estilo: solicitud.estilo,
            nks: []
        };
        
        if (registroExistente) {
            // Si existe el NK, copiar todos los datos del registro existente
            datosPrellenados.po = registroExistente.po;
            datosPrellenados.estilo = registroExistente.estilo;
            datosPrellenados.proceso = registroExistente.proceso;
            datosPrellenados.numero_plotter = registroExistente.numero_plotter;
            datosPrellenados.plotter_temp = registroExistente.plotter_temp;
            datosPrellenados.plotter_humedad = registroExistente.plotter_humedad;
            datosPrellenados.plotter_perfil = registroExistente.plotter_perfil;
            datosPrellenados.monti_numero = registroExistente.monti_numero;
            datosPrellenados.temperatura_monti = registroExistente.temperatura_monti;
            datosPrellenados.velocidad_monti = registroExistente.velocidad_monti;
            datosPrellenados.monti_presion = registroExistente.monti_presion;
            datosPrellenados.temperatura_flat = registroExistente.temperatura_flat;
            datosPrellenados.tiempo_flat = registroExistente.tiempo_flat;
            datosPrellenados.adhesivo = registroExistente.adhesivo;
            datosPrellenados.nks = registroExistente.nks || [];
            datosPrellenados.id = registroExistente.id;
            datosPrellenados.editando = true;
        } else {
            // Si no existe, crear un nuevo NK con el color solicitado
            datosPrellenados.nks = [{
                nk: solicitud.nk,
                colores: [{
                    nombre: solicitud.colorModificar,
                    cyan: 0,
                    magenta: 0,
                    yellow: 0,
                    black: 0,
                    turquesa: 0,
                    naranja: 0,
                    fluorYellow: 0,
                    fluorPink: 0
                }]
            }];
            datosPrellenados.editando = false;
        }
        
        // Guardar en sessionStorage para pasar a main.js
        sessionStorage.setItem('reemplazoPendiente', JSON.stringify(datosPrellenados));
        sessionStorage.setItem('solicitudId', solicitud.id);
        
        // Redirigir a Base de Datos
        window.location.href = 'index.html#reemplazo';
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
            
            // Solo mostrar asignados a mí o sin asignar (para admin)
            if (item.asignadoA && !esAsignadoAMI && usuarioActual.rol !== 'admin') continue;
            
            let estadoClass = '';
            let estadoTexto = '';
            if (estadoAsignacion === 'completado') {
                estadoClass = 'estado-completado';
                estadoTexto = '✅ Completado';
                if (item.fechaResolucion) {
                    const tiempo = this.calcularTiempoTranscurrido(item.fechaResolucion);
                    estadoTexto += ` (${tiempo})`;
                }
            } else if (item.asignadoA) {
                estadoClass = 'estado-asignado';
                estadoTexto = `👤 Asignado a: ${item.asignadoA}`;
                if (item.fechaAsignacion) {
                    const tiempo = this.calcularTiempoTranscurrido(item.fechaAsignacion);
                    estadoTexto += ` - Asignado ${tiempo}`;
                }
            } else {
                estadoClass = 'estado-pendiente';
                estadoTexto = '⏳ Sin asignar';
                if (item.fecha) {
                    const tiempo = this.calcularTiempoTranscurrido(item.fecha);
                    estadoTexto += ` - Creada ${tiempo}`;
                }
            }
            
            // Obtener historial de reemplazos para solicitudes RH
            let historialHtml = '';
            let datosActualesHtml = '';
            let botonesAccionHtml = '';
            
            if (esRH && estadoAsignacion !== 'completado') {
                const nk = item.datosCompletos.nk;
                const color = item.datosCompletos.colorModificar;
                
                if (nk && color) {
                    const historial = this.obtenerHistorialReemplazos(nk, color);
                    const datosActuales = this.consultarDatosActuales(nk, color);
                    
                    if (historial.length > 0) {
                        historialHtml = `
                            <div class="historial-reemplazos">
                                <details>
                                    <summary>📜 HISTORIAL DE REEMPLAZOS ANTERIORES (${historial.length})</summary>
                                    <div class="historial-lista">
                                        ${historial.map(h => `
                                            <div class="historial-item">
                                                <div class="historial-fecha">📅 ${new Date(h.fecha).toLocaleString()}</div>
                                                <div class="historial-usuario">👤 ${h.usuario}</div>
                                                <div class="historial-cambio">🔄 ${h.cambios}</div>
                                                <div class="historial-valores">CMYK: ${h.valores.cyan}/${h.valores.magenta}/${h.valores.yellow}/${h.valores.black}</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </details>
                            </div>
                        `;
                    } else {
                        historialHtml = `
                            <div class="historial-reemplazos">
                                <div class="sin-historial">📭 No hay reemplazos previos para ${nk} - ${color}</div>
                            </div>
                        `;
                    }
                    
                    if (datosActuales) {
                        datosActualesHtml = `
                            <div class="datos-actuales">
                                <details>
                                    <summary>📊 DATOS ACTUALES DE ${nk} - ${color}</summary>
                                    <div class="datos-contenido">
                                        <div class="datos-valores">
                                            <span>C: ${datosActuales.cyan}%</span>
                                            <span>M: ${datosActuales.magenta}%</span>
                                            <span>Y: ${datosActuales.yellow}%</span>
                                            <span>K: ${datosActuales.black}%</span>
                                        </div>
                                        <div class="datos-extra">
                                            <div>🟦 Turquesa: ${datosActuales.turquesa}%</div>
                                            <div>🟧 Naranja: ${datosActuales.naranja}%</div>
                                            <div>🟡 Fluor Yellow: ${datosActuales.fluorYellow}%</div>
                                            <div>🩷 Fluor Pink: ${datosActuales.fluorPink}%</div>
                                        </div>
                                        <div class="datos-metadata">
                                            <div>📅 Última modificación: ${new Date(datosActuales.ultimaModificacion).toLocaleString()}</div>
                                            <div>👤 Por: ${datosActuales.usuario}</div>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        `;
                    } else {
                        datosActualesHtml = `
                            <div class="datos-actuales">
                                <div class="sin-datos">⚠️ No hay datos registrados para ${nk} - ${color}</div>
                            </div>
                        `;
                    }
                    
                    botonesAccionHtml = `
                        <div class="botones-accion-solicitud">
                            <button class="btn-consultar" onclick="InboxModule.verDatosCompletos('${nk}', '${color}')">🔍 CONSULTAR DATOS ACTUALES</button>
                            <button class="btn-reemplazar" onclick="InboxModule.prepararReemplazoDesdeSolicitud('${item.id}')">✏️ HACER REEMPLAZO</button>
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
                            ${item.datosCompletos && item.datosCompletos.nk ? `<span class="bandeja-item-nk">🧵 NK: ${item.datosCompletos.nk}</span>` : ''}
                            ${item.datosCompletos && item.datosCompletos.colorModificar ? `<span class="bandeja-item-color">🎨 Color: ${item.datosCompletos.colorModificar}</span>` : ''}
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
    
    verDatosCompletos: function(nk, color) {
        const datosActuales = this.consultarDatosActuales(nk, color);
        
        let modalHtml = `
            <div style="background:#0D1117; border-radius:12px; padding:1.5rem; max-width:500px; margin:0 auto;">
                <h3 style="color:#00D4FF; margin-bottom:1rem;">📊 DATOS COMPLETOS</h3>
                <p><strong>🧵 NK:</strong> ${nk}</p>
                <p><strong>🎨 Color:</strong> ${color}</p>
        `;
        
        if (datosActuales) {
            modalHtml += `
                <div style="background:#161B22; border-radius:8px; padding:1rem; margin:1rem 0;">
                    <h4 style="color:#00FF88;">Valores CMYK actuales:</h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; margin-top:0.5rem;">
                        <div>C: ${datosActuales.cyan}%</div>
                        <div>M: ${datosActuales.magenta}%</div>
                        <div>Y: ${datosActuales.yellow}%</div>
                        <div>K: ${datosActuales.black}%</div>
                    </div>
                    <h4 style="color:#A855F7; margin-top:1rem;">Colores extra:</h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
                        <div>Turquesa: ${datosActuales.turquesa}%</div>
                        <div>Naranja: ${datosActuales.naranja}%</div>
                        <div>Fluor Yellow: ${datosActuales.fluorYellow}%</div>
                        <div>Fluor Pink: ${datosActuales.fluorPink}%</div>
                    </div>
                    <div style="margin-top:1rem; padding-top:0.5rem; border-top:1px solid #333;">
                        <div>📅 Última modificación: ${new Date(datosActuales.ultimaModificacion).toLocaleString()}</div>
                        <div>👤 Por: ${datosActuales.usuario}</div>
                    </div>
                </div>
            `;
        } else {
            modalHtml += `<div style="background:#161B22; border-radius:8px; padding:1rem; margin:1rem 0; text-align:center; color:#F59E0B;">⚠️ No hay datos registrados para ${nk} - ${color}</div>`;
        }
        
        modalHtml += `
                <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                    <button onclick="this.closest('.modal-datos').remove()" class="btn-secondary" style="flex:1;">CERRAR</button>
                </div>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.className = 'modal-datos';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); backdrop-filter:blur(8px); z-index:2000; display:flex; justify-content:center; align-items:center;';
        modal.innerHTML = modalHtml;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },
    
    prepararReemplazoDesdeSolicitud: function(itemId) {
        const item = this.datos.find(d => d.id === itemId);
        if (!item || !item.datosCompletos) {
            Notifications.error('❌ No se pudo preparar el reemplazo');
            return;
        }
        
        this.prepararReemplazo(item.datosCompletos);
    },
    
    calcularTiempoTranscurrido: function(fechaStr) {
        const fecha = new Date(fechaStr);
        const ahora = new Date();
        const diffMs = ahora - fecha;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHoras = Math.floor(diffMs / 3600000);
        const diffDias = Math.floor(diffMs / 86400000);
        
        if (diffMin < 60) {
            return `hace ${diffMin} min`;
        } else if (diffHoras < 24) {
            return `hace ${diffHoras} h`;
        } else {
            return `hace ${diffDias} d`;
        }
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
                (item.datosCompletos && item.datosCompletos.nk && item.datosCompletos.nk.toLowerCase().includes(searchTerm)) ||
                (item.datosCompletos && item.datosCompletos.colorModificar && item.datosCompletos.colorModificar.toLowerCase().includes(searchTerm)) ||
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
    
    asignarUsuario: function(itemId, username) {
        if (!username) {
            if (confirm('¿Desea desasignar esta solicitud?')) {
                this.actualizarAsignacion(itemId, null);
            }
            return;
        }
        
        this.actualizarAsignacion(itemId, username);
    },
    
    actualizarAsignacion: function(itemId, username) {
        const item = this.datos.find(d => d.id === itemId);
        if (!item) return;
        
        item.asignadoA = username;
        item.estadoAsignacion = username ? 'asignado' : 'pendiente';
        item.fechaAsignacion = username ? new Date().toISOString() : null;
        
        const comentarioAsignacion = `📌 Asignado a: ${username || 'Sin asignar'} el ${new Date().toLocaleString()}`;
        item.descripcion = item.descripcion ? comentarioAsignacion + '\n' + item.descripcion : comentarioAsignacion;
        
        this.guardarBandeja();
        this.filtrar();
        
        if (username) {
            if (window.Notifications) Notifications.success(`✅ Solicitud asignada a ${username}`);
        } else {
            if (window.Notifications) Notifications.info(`📌 Solicitud desasignada`);
        }
    },
    
    marcarCompletado: function(itemId) {
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
        
        this.guardarBandeja();
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
                ${item.datosCompletos && item.datosCompletos.nk ? `<p><strong>🧵 NK:</strong> ${item.datosCompletos.nk}</p>` : ''}
                ${item.datosCompletos && item.datosCompletos.colorModificar ? `<p><strong>🎨 Color:</strong> ${item.datosCompletos.colorModificar}</p>` : ''}
                <p><strong>👤 Asignado a:</strong> ${item.asignadoA || 'Sin asignar'}</p>
                <p><strong>📊 Estado:</strong> ${item.estadoAsignacion === 'completado' ? '✅ Completado' : (item.asignadoA ? '👤 Asignado' : '⏳ Pendiente')}</p>
        `;
        
        if (item.fechaAsignacion) {
            detalleHtml += `<p><strong>📅 Fecha asignación:</strong> ${this.formatearFecha(item.fechaAsignacion)}</p>`;
        }
        
        if (item.fechaResolucion) {
            detalleHtml += `<p><strong>📅 Fecha completado:</strong> ${this.formatearFecha(item.fechaResolucion)}</p>`;
            detalleHtml += `<p><strong>📝 Comentario solución:</strong> ${item.comentarioCompletado || '-'}</p>`;
        }
        
        if (item.datosCompletos && item.datosCompletos.tipo === 'rh') {
            const historial = this.obtenerHistorialReemplazos(item.datosCompletos.nk, item.datosCompletos.colorModificar);
            if (historial.length > 0) {
                detalleHtml += `<p><strong>📜 Historial de reemplazos:</strong> ${historial.length} registro(s)</p>`;
            }
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
                <div class="modal-detalle-bandeja-body">
                    ${detalleHtml}
                </div>
                <div class="modal-detalle-bandeja-footer">
                    <button class="btn-cerrar-bandeja" onclick="this.closest('.modal-detalle-bandeja').remove()">CERRAR</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    eliminarItem: function(id) {
        if (!confirm('¿Eliminar este elemento de la bandeja?')) return;
        
        this.datos = this.datos.filter(d => d.id !== id);
        this.guardarBandeja();
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
            
            /* Historial de reemplazos */
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
            .historial-lista {
                max-height: 200px;
                overflow-y: auto;
                margin-top: 0.5rem;
            }
            .historial-item {
                background: #161B22;
                border-radius: 6px;
                padding: 0.5rem;
                margin-bottom: 0.3rem;
                font-size: 0.65rem;
            }
            .historial-fecha {
                color: #8B949E;
            }
            .historial-usuario {
                color: #00FF88;
            }
            .historial-cambio {
                color: #F59E0B;
            }
            .historial-valores {
                color: #A855F7;
            }
            .sin-historial, .sin-datos {
                text-align: center;
                padding: 0.5rem;
                color: #8B949E;
                font-size: 0.65rem;
            }
            .datos-contenido {
                margin-top: 0.5rem;
            }
            .datos-valores {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
                margin-bottom: 0.5rem;
            }
            .datos-valores span {
                background: #21262D;
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                font-size: 0.65rem;
            }
            .datos-extra {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.3rem;
                font-size: 0.65rem;
                margin-bottom: 0.5rem;
            }
            .datos-metadata {
                font-size: 0.6rem;
                color: #8B949E;
                border-top: 1px solid #333;
                padding-top: 0.3rem;
            }
            
            .botones-accion-solicitud {
                display: flex;
                gap: 0.5rem;
                margin: 0.5rem 0;
            }
            .btn-consultar {
                background: #21262D;
                border: 1px solid #00D4FF;
                padding: 0.3rem 0.8rem;
                border-radius: 6px;
                color: #00D4FF;
                cursor: pointer;
                font-size: 0.7rem;
                flex: 1;
            }
            .btn-reemplazar {
                background: linear-gradient(90deg, #00D4FF, #0099CC);
                border: none;
                padding: 0.3rem 0.8rem;
                border-radius: 6px;
                color: #0D1117;
                font-weight: 700;
                cursor: pointer;
                font-size: 0.7rem;
                flex: 1;
            }
            .btn-consultar:hover, .btn-reemplazar:hover {
                transform: translateY(-1px);
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
            .btn-marcar-completado:hover {
                transform: translateY(-1px);
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
console.log('✅ InboxModule actualizado - Con historial de reemplazos y botones de acción');