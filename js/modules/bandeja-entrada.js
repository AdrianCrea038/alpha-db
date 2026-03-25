// js/modules/bandeja-entrada.js
const BandejaEntradaModule = {
    datos: [],
    
    init: function() {
        console.log('📥 Módulo de Bandeja de Entrada iniciado');
        this.cargarDatos();
        this.renderizar();
        this.configurarEventos();
    },
    
    cargarDatos: async function() {
        try {
            if (window.SupabaseClient && window.SupabaseClient.client) {
                const { data, error } = await window.SupabaseClient.client
                    .from('aprobaciones')
                    .select('*')
                    .order('fecha', { ascending: false });
                
                if (!error && data) {
                    this.datos = data;
                } else {
                    this.cargarLocalStorage();
                }
            } else {
                this.cargarLocalStorage();
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
            this.cargarLocalStorage();
        }
    },
    
    cargarLocalStorage: function() {
        const guardados = localStorage.getItem('alpha_db_aprobaciones');
        this.datos = guardados ? JSON.parse(guardados) : [];
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
                    <p>Consultas de aprobaciones de piso</p>
                </div>
                
                <div class="bandeja-filtros">
                    <input type="text" id="bandejaSearchInput" placeholder="Buscar por PO, estilo, aprobador..." class="input-bonito">
                    <select id="bandejaFiltroTolerancia" class="select-bonito">
                        <option value="">Todos los estados</option>
                        <option value="aprobado">✅ Aprobado</option>
                        <option value="aprobado_condicional">⚠️ Aprobado con condiciones</option>
                        <option value="rechazado">❌ Rechazado</option>
                        <option value="pendiente">⏳ Pendiente</option>
                    </select>
                    <button id="bandejaBuscarBtn" class="btn-filtrar">🔍 BUSCAR</button>
                    <button id="bandejaLimpiarBtn" class="btn-limpiar">✕ LIMPIAR</button>
                </div>
                
                <div id="bandejaLoader" class="tracking-loader" style="display: none;">
                    <div class="spinner"></div>
                    <p>Cargando datos...</p>
                </div>
                
                <div id="bandejaResultados" class="bandeja-resultados">
                    ${this.renderizarTabla(this.datos)}
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
    
    renderizarTabla: function(datos) {
        if (!datos || datos.length === 0) {
            return '<div class="bandeja-vacio">📭 No hay aprobaciones registradas</div>';
        }
        
        return `
            <div class="bandeja-tabla-container">
                <table class="bandeja-tabla">
                    <thead>
                        <tr>
                            <th>FECHA</th>
                            <th>PO</th>
                            <th>ESTILO</th>
                            <th>NK TELA</th>
                            <th>COLORES</th>
                            <th>APROBACIÓN</th>
                            <th>APROBADO POR</th>
                            <th>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${datos.map(item => `
                            <tr class="bandeja-fila estado-${item.tolerancia}">
                                <td>${this.formatearFecha(item.fecha)}</td>
                                <td><strong>${item.po || '-'}</strong></td>
                                <td>${item.estilo || '-'}</td>
                                <td>${item.nk_tela || '-'}</td>
                                <td class="bandeja-colores">${this.renderizarColores(item.colores)}</td>
                                <td>${this.renderizarEstado(item.tolerancia)}</td>
                                <td>${item.aprobado_por || '-'}</td>
                                <td>
                                    <div class="bandeja-acciones">
                                        <button class="btn-icon ver" onclick="BandejaEntradaModule.verDetalle('${item.id}')" title="Ver detalle">👁️</button>
                                        <button class="btn-icon editar" onclick="BandejaEntradaModule.editarAprobacion('${item.id}')" title="Editar">✏️</button>
                                        <button class="btn-icon eliminar" onclick="BandejaEntradaModule.eliminarAprobacion('${item.id}')" title="Eliminar">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    
    renderizarColores: function(colores) {
        if (!colores || colores.length === 0) return '-';
        return colores.map(c => `<span class="color-chip" title="${c.observacion || ''}">${c.nombre || '?'}</span>`).join(' ');
    },
    
    renderizarEstado: function(tolerancia) {
        const estados = {
            'aprobado': '✅ Aprobado',
            'aprobado_condicional': '⚠️ Aprobado c/condiciones',
            'rechazado': '❌ Rechazado',
            'pendiente': '⏳ Pendiente'
        };
        return `<span class="estado-badge estado-${tolerancia}">${estados[tolerancia] || tolerancia || '-'}</span>`;
    },
    
    formatearFecha: function(fechaStr) {
        if (!fechaStr) return '-';
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-ES');
    },
    
    configurarEventos: function() {
        const searchInput = document.getElementById('bandejaSearchInput');
        const filtroSelect = document.getElementById('bandejaFiltroTolerancia');
        const buscarBtn = document.getElementById('bandejaBuscarBtn');
        const limpiarBtn = document.getElementById('bandejaLimpiarBtn');
        
        if (buscarBtn) {
            buscarBtn.addEventListener('click', () => this.filtrar());
        }
        if (limpiarBtn) {
            limpiarBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                if (filtroSelect) filtroSelect.value = '';
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
        const searchTerm = document.getElementById('bandejaSearchInput')?.value.toLowerCase() || '';
        const filtroTolerancia = document.getElementById('bandejaFiltroTolerancia')?.value || '';
        
        let filtrados = [...this.datos];
        
        if (searchTerm) {
            filtrados = filtrados.filter(item => 
                (item.po && item.po.toLowerCase().includes(searchTerm)) ||
                (item.estilo && item.estilo.toLowerCase().includes(searchTerm)) ||
                (item.aprobado_por && item.aprobado_por.toLowerCase().includes(searchTerm))
            );
        }
        
        if (filtroTolerancia) {
            filtrados = filtrados.filter(item => item.tolerancia === filtroTolerancia);
        }
        
        const resultadosDiv = document.getElementById('bandejaResultados');
        if (resultadosDiv) {
            resultadosDiv.innerHTML = this.renderizarTabla(filtrados);
        }
    },
    
    verDetalle: function(id) {
        const item = this.datos.find(d => d.id === id);
        if (!item) return;
        
        // Crear modal con detalle completo
        const modal = document.createElement('div');
        modal.className = 'modal-detalle-aprobacion';
        modal.innerHTML = `
            <div class="modal-detalle-content">
                <div class="modal-detalle-header">
                    <h3>📋 DETALLE DE APROBACIÓN</h3>
                    <button class="modal-close-detalle" onclick="this.closest('.modal-detalle-aprobacion').remove()">✕</button>
                </div>
                <div class="modal-detalle-body">
                    <div class="detalle-grid">
                        <div><strong>PO:</strong> ${item.po || '-'}</div>
                        <div><strong>Fecha:</strong> ${this.formatearFecha(item.fecha)}</div>
                        <div><strong>Estilo:</strong> ${item.estilo || '-'}</div>
                        <div><strong>NK Tela:</strong> ${item.nk_tela || '-'}</div>
                    </div>
                    
                    <h4>🎨 Colores</h4>
                    <div class="detalle-colores">
                        ${item.colores && item.colores.length > 0 ? item.colores.map(c => `
                            <div class="detalle-color">
                                <strong>${c.nombre || 'Sin nombre'}</strong>
                                ${c.observacion ? `<p>📝 ${c.observacion}</p>` : ''}
                            </div>
                        `).join('') : '<p>No hay colores registrados</p>'}
                    </div>
                    
                    <h4>🖨️ Plotter</h4>
                    <div class="detalle-grid">
                        <div>N° Plotter: ${item.plotter_numero || '-'}</div>
                        <div>Temp: ${item.plotter_temp || '-'}°C</div>
                        <div>Humedad: ${item.plotter_humedad || '-'}%</div>
                        <div>Perfil: ${item.plotter_perfil || '-'}</div>
                    </div>
                    
                    <h4>🔥 Monti</h4>
                    <div class="detalle-grid">
                        <div>N° Monti: ${item.monti_numero || '-'}</div>
                        <div>Velocidad: ${item.monti_velocidad || '-'}</div>
                        <div>Temperatura: ${item.monti_temperatura || '-'}°C</div>
                        <div>Presión: ${item.monti_presion || '-'}</div>
                        <div>Bares: ${item.monti_bares || '-'}</div>
                        <div>Tissue: ${item.monti_tissue === 'sencillo' ? 'Sencillo' : item.monti_tissue === 'doble' ? 'Doble' : '-'}</div>
                    </div>
                    
                    <h4>✅ Aprobación</h4>
                    <div class="detalle-grid">
                        <div>Estado: ${this.renderizarEstado(item.tolerancia)}</div>
                        <div>Aprobado por: ${item.aprobado_por || '-'}</div>
                    </div>
                    
                    ${item.observaciones ? `
                        <h4>📝 Observaciones</h4>
                        <p>${item.observaciones}</p>
                    ` : ''}
                </div>
                <div class="modal-detalle-footer">
                    <button class="btn-cerrar-detalle" onclick="this.closest('.modal-detalle-aprobacion').remove()">CERRAR</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    editarAprobacion: function(id) {
        const item = this.datos.find(d => d.id === id);
        if (!item) return;
        
        // Cambiar a la vista de Aprobaciones Piso y cargar datos
        if (window.MenuLateral && window.MenuLateral.mostrarAprobaciones) {
            window.MenuLateral.mostrarAprobaciones();
            setTimeout(() => {
                if (window.AprobacionesModule && window.AprobacionesModule.cargarParaEdicion) {
                    window.AprobacionesModule.cargarParaEdicion(id, item);
                }
            }, 300);
        }
    },
    
    eliminarAprobacion: async function(id) {
        if (!confirm('¿Eliminar esta aprobación?')) return;
        
        try {
            if (window.SupabaseClient && window.SupabaseClient.client) {
                const { error } = await window.SupabaseClient.client
                    .from('aprobaciones')
                    .delete()
                    .eq('id', id);
                
                if (error) throw error;
            } else {
                const guardados = localStorage.getItem('alpha_db_aprobaciones');
                let aprobaciones = guardados ? JSON.parse(guardados) : [];
                aprobaciones = aprobaciones.filter(a => a.id !== id);
                localStorage.setItem('alpha_db_aprobaciones', JSON.stringify(aprobaciones));
            }
            
            await this.cargarDatos();
            this.filtrar();
            if (window.Notifications) Notifications.success('✅ Aprobación eliminada');
        } catch (error) {
            console.error('Error al eliminar:', error);
            if (window.Notifications) Notifications.error('❌ Error al eliminar');
        }
    },
    
    agregarEstilos: function() {
        if (document.getElementById('bandejaStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'bandejaStyles';
        styles.textContent = `
            .bandeja-entrada-panel {
                background: linear-gradient(160deg, rgba(45,35,85,0.85) 0%, rgba(90,40,80,0.8) 30%, rgba(60,50,100,0.85) 60%, rgba(30,40,80,0.9) 100%);
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                border: 1px solid rgba(255,75,125,0.3);
                backdrop-filter: blur(10px);
            }
            .bandeja-header h2 { font-size: 1.1rem; color: #ff4b7d; margin-bottom: 0.3rem; }
            .bandeja-header p { font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 1rem; }
            
            .bandeja-filtros {
                display: flex;
                gap: 0.8rem;
                flex-wrap: wrap;
                margin-bottom: 1.5rem;
            }
            .bandeja-filtros input { flex: 2; min-width: 200px; }
            .bandeja-filtros select { flex: 1; min-width: 180px; }
            
            .bandeja-tabla-container {
                overflow-x: auto;
            }
            .bandeja-tabla {
                width: 100%;
                border-collapse: collapse;
            }
            .bandeja-tabla th {
                background: rgba(42,42,42,0.6);
                padding: 0.8rem 0.5rem;
                text-align: left;
                color: #ff6b8a;
                font-size: 0.75rem;
            }
            .bandeja-tabla td {
                padding: 0.6rem 0.5rem;
                border-bottom: 1px solid rgba(255,75,125,0.2);
                font-size: 0.75rem;
            }
            .bandeja-fila:hover {
                background: rgba(255,75,125,0.1);
            }
            
            .color-chip {
                background: rgba(51,51,51,0.8);
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                font-size: 0.65rem;
                border-left: 2px solid #ff4b7d;
                display: inline-block;
                margin: 0.1rem;
            }
            
            .estado-badge {
                padding: 0.2rem 0.6rem;
                border-radius: 20px;
                font-size: 0.7rem;
            }
            .estado-badge.estado-aprobado { background: rgba(16,185,129,0.2); color: #10b981; }
            .estado-badge.estado-aprobado_condicional { background: rgba(245,158,11,0.2); color: #f59e0b; }
            .estado-badge.estado-rechazado { background: rgba(239,68,68,0.2); color: #ef4444; }
            .estado-badge.estado-pendiente { background: rgba(59,130,246,0.2); color: #3b82f6; }
            
            .bandeja-acciones {
                display: flex;
                gap: 0.3rem;
            }
            .bandeja-acciones .btn-icon {
                padding: 0.3rem 0.5rem;
                background: rgba(42,42,42,0.8);
                border: 1px solid #ff6b8a;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .bandeja-vacio {
                text-align: center;
                padding: 2rem;
                color: rgba(255,255,255,0.5);
            }
            
            .modal-detalle-aprobacion {
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
            .modal-detalle-content {
                background: linear-gradient(160deg, rgba(45,35,85,0.95) 0%, rgba(90,40,80,0.9) 100%);
                border: 2px solid #ff4b7d;
                border-radius: 12px;
                width: 90%;
                max-width: 700px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
            }
            .modal-detalle-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid rgba(255,75,125,0.3);
            }
            .modal-detalle-header h3 { color: #ff6b8a; margin: 0; }
            .modal-close-detalle {
                background: rgba(42,42,42,0.8);
                border: 2px solid #ff4b7d;
                color: #ff4b7d;
                width: 2rem;
                height: 2rem;
                border-radius: 6px;
                cursor: pointer;
            }
            .modal-detalle-body {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
            }
            .detalle-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 0.5rem;
                margin-bottom: 1rem;
            }
            .modal-detalle-body h4 {
                color: #ff6b8a;
                margin: 1rem 0 0.5rem;
                font-size: 0.85rem;
            }
            .detalle-colores {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }
            .detalle-color {
                background: rgba(42,42,42,0.6);
                padding: 0.5rem;
                border-radius: 6px;
                min-width: 150px;
            }
            .modal-detalle-footer {
                padding: 1rem;
                border-top: 1px solid rgba(255,75,125,0.3);
                text-align: right;
            }
            .btn-cerrar-detalle {
                background: rgba(42,42,42,0.8);
                border: 1px solid #ff4b7d;
                padding: 0.5rem 1.5rem;
                border-radius: 6px;
                color: #ff6b8a;
                cursor: pointer;
            }
            
            @media (max-width: 768px) {
                .bandeja-filtros { flex-direction: column; }
                .detalle-grid { grid-template-columns: 1fr; }
            }
        `;
        document.head.appendChild(styles);
    }
};

window.BandejaEntradaModule = BandejaEntradaModule;
