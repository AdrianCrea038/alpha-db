// ============================================================
// js/modules/solicitudes.js - Módulo de Solicitudes
// Tipos: Orden Nueva, Lote FTT, RH
// Versión: Con NK (código alfanumérico de tela)
// ============================================================

const SolicitudesModule = {
    tipoSeleccionado: '',
    
    init: function() {
        console.log('📋 Módulo de Solicitudes iniciado');
        this.renderizar();
        this.configurarEventos();
    },
    
    renderizar: function() {
        const container = document.querySelector('.container');
        if (!container) return;
        
        let solicitudesPanel = document.getElementById('solicitudesPanel');
        if (solicitudesPanel) solicitudesPanel.remove();
        
        const panelHTML = `
            <div id="solicitudesPanel" class="solicitudes-panel">
                <div class="solicitudes-header">
                    <h2>📋 CREAR SOLICITUD</h2>
                    <p>Complete el formulario para enviar su solicitud a la Bandeja de Entrada</p>
                </div>
                
                <div class="solicitud-tipo-selector">
                    <label>📌 TIPO DE SOLICITUD:</label>
                    <select id="tipoSolicitudSelect" class="select-bonito">
                        <option value="">-- Seleccione un tipo --</option>
                        <option value="orden_nueva">📦 Orden Nueva</option>
                        <option value="lote_ftt">🏭 Lote FTT</option>
                        <option value="rh">👥 RH</option>
                    </select>
                </div>
                
                <div id="formularioSolicitud" class="formulario-solicitud" style="display: none;">
                    <h3 id="formularioTitulo"></h3>
                    <form id="solicitudForm" class="solicitud-form">
                        <div class="form-row-dos">
                            <div class="form-group-card">
                                <label>📦 PO</label>
                                <input type="text" id="solicitudPo" placeholder="Número de PO" required class="input-bonito">
                            </div>
                            <div class="form-group-card">
                                <label>🎯 ESTILO</label>
                                <input type="text" id="solicitudEstilo" placeholder="Estilo / Deporte" required class="input-bonito">
                            </div>
                        </div>
                        
                        <!-- Campos específicos de RH -->
                        <div id="rhFields" style="display: none;">
                            <div class="form-row-dos">
                                <div class="form-group-card">
                                    <label>🧵 NK (CÓDIGO DE TELA)</label>
                                    <input type="text" id="solicitudNk" placeholder="Ej: NK-ALG-001" class="input-bonito">
                                </div>
                                <div class="form-group-card">
                                    <label>🎨 COLOR A MODIFICAR</label>
                                    <input type="text" id="solicitudColorModificar" placeholder="Nombre del color" class="input-bonito">
                                </div>
                            </div>
                            <div class="form-group-card full-width">
                                <label>🧵 TELA PRODUCCIÓN (para validar color)</label>
                                <input type="text" id="solicitudTelaProduccion" placeholder="Tela de producción" class="input-bonito">
                            </div>
                        </div>
                        
                        <div class="form-group-card full-width">
                            <label>📝 DESCRIPCIÓN / OBSERVACIONES</label>
                            <textarea id="solicitudDescripcion" rows="3" placeholder="Detalle adicional de la solicitud..." class="input-bonito"></textarea>
                        </div>
                        
                        <div class="form-row-botones">
                            <button type="submit" id="solicitudSubmitBtn" class="btn-guardar-solicitud">📤 ENVIAR SOLICITUD A BANDEJA</button>
                        </div>
                    </form>
                </div>
                
                <div id="solicitudMensaje" class="solicitud-mensaje" style="display: none;"></div>
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
    
    configurarEventos: function() {
        const tipoSelect = document.getElementById('tipoSolicitudSelect');
        const formContainer = document.getElementById('formularioSolicitud');
        const solicitudForm = document.getElementById('solicitudForm');
        
        if (tipoSelect) {
            tipoSelect.addEventListener('change', (e) => {
                this.tipoSeleccionado = e.target.value;
                if (this.tipoSeleccionado) {
                    formContainer.style.display = 'block';
                    this.actualizarFormularioPorTipo();
                } else {
                    formContainer.style.display = 'none';
                }
            });
        }
        
        if (solicitudForm) {
            solicitudForm.addEventListener('submit', (e) => this.guardarSolicitud(e));
        }
    },
    
    actualizarFormularioPorTipo: function() {
        const formularioTitulo = document.getElementById('formularioTitulo');
        const rhFields = document.getElementById('rhFields');
        const poField = document.getElementById('solicitudPo');
        const estiloField = document.getElementById('solicitudEstilo');
        
        if (rhFields) rhFields.style.display = 'none';
        
        if (poField) poField.required = true;
        if (estiloField) estiloField.required = true;
        
        switch(this.tipoSeleccionado) {
            case 'orden_nueva':
                formularioTitulo.textContent = '📦 NUEVA ORDEN DE PRODUCCIÓN';
                break;
            case 'lote_ftt':
                formularioTitulo.textContent = '🏭 SOLICITUD DE LOTE FTT';
                break;
            case 'rh':
                formularioTitulo.textContent = '👥 SOLICITUD RH';
                if (rhFields) rhFields.style.display = 'block';
                break;
        }
    },
    
    obtenerDatosFormulario: function() {
        const getValor = (id) => document.getElementById(id)?.value || '';
        
        const datos = {
            tipo: this.tipoSeleccionado,
            po: getValor('solicitudPo').toUpperCase(),
            estilo: getValor('solicitudEstilo').toUpperCase(),
            descripcion: getValor('solicitudDescripcion'),
            fecha: new Date().toISOString(),
            estado: 'enviada'
        };
        
        if (this.tipoSeleccionado === 'rh') {
            datos.nk = getValor('solicitudNk').toUpperCase();
            datos.colorModificar = getValor('solicitudColorModificar').toUpperCase();
            datos.telaProduccion = getValor('solicitudTelaProduccion').toUpperCase();
        }
        
        return datos;
    },
    
    guardarSolicitud: function(e) {
        e.preventDefault();
        
        if (!this.tipoSeleccionado) {
            this.mostrarMensaje('❌ Seleccione un tipo de solicitud', 'error');
            return;
        }
        
        const datos = this.obtenerDatosFormulario();
        
        if (!datos.po) {
            this.mostrarMensaje('❌ El PO es obligatorio', 'error');
            return;
        }
        
        if (!datos.estilo) {
            this.mostrarMensaje('❌ El Estilo es obligatorio', 'error');
            return;
        }
        
        if (this.tipoSeleccionado === 'rh' && !datos.nk) {
            this.mostrarMensaje('❌ El NK es obligatorio para solicitudes RH', 'error');
            return;
        }
        
        datos.id = 'SOL-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4).toUpperCase();
        datos.creado = new Date().toISOString();
        
        this.enviarABandejaEntrada(datos);
        
        document.getElementById('solicitudForm')?.reset();
        document.getElementById('tipoSolicitudSelect').value = '';
        document.getElementById('formularioSolicitud').style.display = 'none';
        this.tipoSeleccionado = '';
        
        this.mostrarMensaje('✅ Solicitud enviada a la Bandeja de Entrada', 'success');
    },
    
    enviarABandejaEntrada: function(solicitud) {
        const getTipoTexto = (tipo) => {
            const tipos = {
                'orden_nueva': '📦 Orden Nueva',
                'lote_ftt': '🏭 Lote FTT',
                'rh': '👥 RH'
            };
            return tipos[tipo] || tipo;
        };
        
        const bandejaItem = {
            id: 'BAN-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4).toUpperCase(),
            tipo: 'solicitud',
            solicitudId: solicitud.id,
            titulo: getTipoTexto(solicitud.tipo),
            po: solicitud.po,
            estilo: solicitud.estilo,
            descripcion: solicitud.descripcion,
            fecha: new Date().toISOString(),
            leido: false,
            estadoAsignacion: 'pendiente',
            asignadoA: null,
            datosCompletos: solicitud
        };
        
        if (solicitud.tipo === 'rh') {
            bandejaItem.nk = solicitud.nk;
            bandejaItem.colorModificar = solicitud.colorModificar;
            bandejaItem.telaProduccion = solicitud.telaProduccion;
        }
        
        let bandejaItems = localStorage.getItem('alpha_db_bandeja_entrada');
        if (bandejaItems) {
            bandejaItems = JSON.parse(bandejaItems);
        } else {
            bandejaItems = [];
        }
        
        bandejaItems.unshift(bandejaItem);
        localStorage.setItem('alpha_db_bandeja_entrada', JSON.stringify(bandejaItems));
        
        console.log('📥 Solicitud enviada a Bandeja de Entrada:', bandejaItem);
    },
    
    mostrarMensaje: function(mensaje, tipo) {
        const msgDiv = document.getElementById('solicitudMensaje');
        if (msgDiv) {
            msgDiv.textContent = mensaje;
            msgDiv.className = `solicitud-mensaje ${tipo}`;
            msgDiv.style.display = 'block';
            setTimeout(() => {
                msgDiv.style.display = 'none';
            }, 3000);
        }
        if (window.Notifications) {
            if (tipo === 'success') Notifications.success(mensaje);
            else if (tipo === 'error') Notifications.error(mensaje);
            else Notifications.info(mensaje);
        }
    },
    
    agregarEstilos: function() {
        if (document.getElementById('solicitudesStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'solicitudesStyles';
        styles.textContent = `
            .solicitudes-panel {
                background: #161B22;
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                border: 1px solid rgba(0,212,255,0.25);
            }
            .solicitudes-header h2 {
                font-size: 1.1rem;
                color: #00D4FF;
                margin-bottom: 0.3rem;
            }
            .solicitudes-header p {
                font-size: 0.8rem;
                color: #8B949E;
                margin-bottom: 1.5rem;
            }
            .solicitud-tipo-selector {
                margin-bottom: 1.5rem;
            }
            .solicitud-tipo-selector label {
                display: block;
                margin-bottom: 0.5rem;
                color: #00D4FF;
                font-weight: 600;
            }
            .formulario-solicitud {
                background: #0D1117;
                border-radius: 12px;
                padding: 1.2rem;
                margin-bottom: 1.5rem;
                border: 1px solid rgba(0,212,255,0.3);
            }
            .formulario-solicitud h3 {
                color: #00D4FF;
                margin-bottom: 1rem;
                font-size: 0.9rem;
            }
            .form-row-dos {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
                margin-bottom: 1rem;
            }
            .form-group-card {
                background: #0D1117;
                border-radius: 8px;
                padding: 0.6rem;
                border: 1px solid rgba(0,212,255,0.2);
            }
            .form-group-card label {
                display: flex;
                align-items: center;
                gap: 0.3rem;
                margin-bottom: 0.4rem;
                font-size: 0.7rem;
                font-weight: 700;
                color: #00D4FF;
            }
            .full-width {
                grid-column: 1 / -1;
            }
            .form-row-botones {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }
            .btn-guardar-solicitud {
                background: linear-gradient(90deg, #00D4FF, #0099CC);
                padding: 0.7rem 1.5rem;
                border: none;
                border-radius: 8px;
                color: #0D1117;
                font-weight: 700;
                cursor: pointer;
                width: 100%;
            }
            .btn-guardar-solicitud:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,212,255,0.3);
            }
            .solicitud-mensaje {
                margin-top: 1rem;
                padding: 0.8rem;
                border-radius: 8px;
                text-align: center;
            }
            .solicitud-mensaje.success {
                background: rgba(0,255,136,0.1);
                border: 1px solid #00FF88;
                color: #00FF88;
            }
            .solicitud-mensaje.error {
                background: rgba(255,68,68,0.1);
                border: 1px solid #FF4444;
                color: #FF4444;
            }
            
            @media (max-width: 768px) {
                .form-row-dos {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(styles);
    }
};

window.SolicitudesModule = SolicitudesModule;
console.log('✅ SolicitudesModule cargado - Con NK (código alfanumérico de tela)');