// ============================================================
// js/modules/inbox.js - Bandeja de entrada estilo Correo
// ============================================================

const InboxModule = {
    itemsActuales: [],
    tipoFiltro: 'todos',
    idSeleccionado: null,
    
    init: async function() {
        console.log('📥 Módulo de Bandeja (Email Center) iniciado');
        this.renderizar();
    },
    
    renderizar: function() {
        const container = document.querySelector('.container');
        if (!container) return;

        // 1. Ocultar secciones base en lugar de borrarlas
        const baseSections = ['.form-section', '.filters-section', '.table-section'];
        baseSections.forEach(sel => {
            const el = document.querySelector(sel);
            if (el) el.style.display = 'none';
        });

        // 2. Crear o recuperar el panel de Inbox sin destruir el contenedor
        let inboxPanel = document.getElementById('inboxPanel');
        if (!inboxPanel) {
            inboxPanel = document.createElement('div');
            inboxPanel.id = 'inboxPanel';
            container.appendChild(inboxPanel);
        }
        
        // 3. Inyectar el diseño dentro de su propio panel
        inboxPanel.style.display = 'grid';
        inboxPanel.style.gridTemplateColumns = '220px 380px 1fr';
        inboxPanel.style.height = 'calc(100vh - 140px)';
        inboxPanel.style.background = '#0D1117';
        inboxPanel.style.borderRadius = '12px';
        inboxPanel.style.border = '1px solid #30363D';
        inboxPanel.style.overflow = 'hidden';
        inboxPanel.style.animation = 'fadeIn 0.3s ease';

        inboxPanel.innerHTML = `
                <!-- PANEL 1: CARPETAS -->
                <div style="background: #161B22; border-right: 1px solid #30363D; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    <h3 style="color: #00D4FF; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem;">BANDEJA DE ENTRADA</h3>
                    
                    <div onclick="InboxModule.filtrarPorTipo('todos')" class="inbox-folder-btn active" data-type="todos" style="padding: 0.8rem; border-radius: 8px; cursor: pointer; color: #00D4FF; font-weight: 700; font-size: 0.85rem; background: rgba(0,212,255,0.1); display: flex; align-items: center; gap: 10px; transition: all 0.2s;">
                        <span>📥</span> Todos
                    </div>
                    <div onclick="InboxModule.filtrarPorTipo('produccion')" class="inbox-folder-btn" data-type="produccion" style="padding: 0.8rem; border-radius: 8px; cursor: pointer; color: #8B949E; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; transition: all 0.2s;">
                        <span>🚀</span> Producción
                    </div>
                    <div onclick="InboxModule.filtrarPorTipo('solicitud')" class="inbox-folder-btn" data-type="solicitud" style="padding: 0.8rem; border-radius: 8px; cursor: pointer; color: #8B949E; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; transition: all 0.2s;">
                        <span>📋</span> Solicitudes
                    </div>
                    <div onclick="InboxModule.filtrarPorTipo('importacion')" class="inbox-folder-btn" data-type="importacion" style="padding: 0.8rem; border-radius: 8px; cursor: pointer; color: #8B949E; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; transition: all 0.2s;">
                        <span>📦</span> Importación
                    </div>

                    <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid #30363D;">
                        <button onclick="InboxModule.cargarBandeja()" style="width: 100%; background: #21262D; border: 1px solid #30363D; color: #00D4FF; padding: 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 800;">🔄 Sincronizar</button>
                    </div>
                </div>

                <!-- PANEL 2: LISTA DE MENSAJES -->
                <div style="background: #0D1117; border-right: 1px solid #30363D; overflow-y: auto; display: flex; flex-direction: column;">
                    <div style="padding: 1rem; border-bottom: 1px solid #161B22; background: #0D1117; position: sticky; top: 0; z-index: 10;">
                        <input type="text" id="inboxSearch" placeholder="Buscar en mensajes..." oninput="InboxModule.buscarLocal(this.value)" style="width: 100%; background: #161B22; border: 1px solid #30363D; color: white; padding: 0.6rem; border-radius: 8px; font-size: 0.8rem;">
                    </div>
                    <div id="messageListContainer">
                        <div style="padding: 2rem; text-align: center; color: #8B949E; font-size: 0.8rem;">Cargando mensajes...</div>
                    </div>
                </div>

                <!-- PANEL 3: VISTA DE DETALLE -->
                <div id="inboxDetailView" style="background: #0D1117; overflow-y: auto; display: flex; flex-direction: column; position: relative;">
                    <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #30363D;">
                        <span style="font-size: 5rem; opacity: 0.3;">✉️</span>
                        <p style="font-weight: 700; margin-top: 1rem; color: #484F58;">Seleccione un mensaje para leer</p>
                    </div>
                </div>
        `;

        this.cargarBandeja();
    },

    filtrarPorTipo: function(tipo) {
        this.tipoFiltro = tipo;
        document.querySelectorAll('.inbox-folder-btn').forEach(el => {
            const isActive = el.getAttribute('data-type') === tipo;
            el.style.background = isActive ? 'rgba(0,212,255,0.1)' : 'transparent';
            el.style.color = isActive ? '#00D4FF' : '#8B949E';
            el.style.fontWeight = isActive ? '700' : '400';
            el.classList.toggle('active', isActive);
        });
        this.cargarBandeja();
    },

    cargarBandeja: async function() {
        const listContainer = document.getElementById('messageListContainer');
        if (!listContainer) return;

        try {
            if (window.SupabaseClient && window.SupabaseClient.getBandejaItems) {
                let items = await window.SupabaseClient.getBandejaItems();
                
                if (this.tipoFiltro && this.tipoFiltro !== 'todos') {
                    items = items.filter(i => i.tipo === this.tipoFiltro);
                }

                this.itemsActuales = items || [];
                this.renderizarLista(this.itemsActuales);
            }
        } catch (e) {
            console.error('Error Inbox:', e);
            listContainer.innerHTML = '<div style="padding: 2rem; color: #FF4444; text-align:center;">Error al cargar datos</div>';
        }
    },

    buscarLocal: function(val) {
        const term = val.toLowerCase();
        const filtrados = this.itemsActuales.filter(i => 
            (i.titulo && i.titulo.toLowerCase().includes(term)) || 
            (i.po && i.po.toLowerCase().includes(term)) ||
            (i.descripcion && i.descripcion.toLowerCase().includes(term))
        );
        this.renderizarLista(filtrados);
    },

    renderizarLista: function(items) {
        const container = document.getElementById('messageListContainer');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = '<div style="padding: 4rem; text-align: center; color: #444; font-size: 0.8rem;">Bandeja vacía</div>';
            return;
        }

        let html = '';
        items.forEach(item => {
            const isUnread = !item.leido;
            const isSelected = item.id === this.idSeleccionado;
            const fecha = new Date(item.fecha).toLocaleDateString([], { day: '2-digit', month: 'short' });
            const icon = this.getIcono(item.tipo);

            html += `
                <div onclick="InboxModule.verDetalle('${item.id}')" class="inbox-item-row ${isSelected ? 'selected' : ''}" 
                     style="padding: 1.2rem; border-bottom: 1px solid #161B22; cursor: pointer; position: relative; transition: all 0.2s; 
                     background: ${isSelected ? 'rgba(0,212,255,0.1)' : (isUnread ? 'rgba(0,212,255,0.03)' : 'transparent')};
                     border-left: 4px solid ${isSelected ? '#00D4FF' : (isUnread ? '#00D4FF66' : 'transparent')};">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem; margin-left: 5px;">
                        <span style="font-size: 0.65rem; font-weight: 800; color: ${isSelected ? '#00D4FF' : '#8B949E'};">${icon} ${item.tipo.toUpperCase()}</span>
                        <span style="font-size: 0.65rem; color: #444;">${fecha}</span>
                    </div>
                    <div style="font-weight: ${isUnread || isSelected ? '800' : '500'}; color: ${isSelected ? '#FFFFFF' : (isUnread ? '#FFFFFF' : '#8B949E')}; font-size: 0.85rem; margin-left: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${item.titulo}
                    </div>
                    <div style="font-size: 0.75rem; color: #555; margin-left: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;">
                        ${item.descripcion || 'Sin descripción'}
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    getIcono: function(tipo) {
        switch(tipo) {
            case 'produccion': return '🚀';
            case 'solicitud': return '📋';
            case 'importacion': return '📦';
            default: return '✉️';
        }
    },

    verDetalle: async function(id) {
        const detailView = document.getElementById('inboxDetailView');
        if (!detailView) return;

        this.idSeleccionado = id;
        const item = this.itemsActuales.find(i => i.id === id);
        if (!item) return;

        // Re-renderizar lista para mostrar el seleccionado
        this.renderizarLista(this.itemsActuales);

        // Marcar como leído
        if (!item.leido) {
            item.leido = true;
            if (window.SupabaseClient && window.SupabaseClient.marcarLeidoBandeja) {
                await window.SupabaseClient.marcarLeidoBandeja(id);
            }
            this.renderizarLista(this.itemsActuales);
        }

        const fechaFull = new Date(item.fecha).toLocaleString();
        const icon = this.getIcono(item.tipo);
        
        detailView.innerHTML = `
            <div style="padding: 2.5rem; animation: slideInRight 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; border-bottom: 1px solid #161B22; padding-bottom: 1.5rem;">
                    <div>
                        <h2 style="color: #FFFFFF; font-size: 1.6rem; margin: 0; font-weight: 900;">${icon} ${item.titulo}</h2>
                        <div style="display: flex; gap: 15px; margin-top: 10px; font-size: 0.8rem; color: #8B949E;">
                            <span>Remitente: <b>Sistema Alpha DB</b></span>
                            <span>• ${fechaFull}</span>
                        </div>
                    </div>
                    <button onclick="InboxModule.eliminarItem('${item.id}')" style="background: rgba(255,68,68,0.1); border: 1px solid #FF4444; color: #FF4444; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 700;">Eliminar</button>
                </div>

                <div style="background: #161B22; border: 1px solid rgba(0,212,255,0.1); padding: 2rem; border-radius: 12px; line-height: 1.8; color: #D1D5DB; font-size: 1rem; white-space: pre-wrap; margin-bottom: 2rem;">
                    ${item.descripcion}
                </div>

                ${item.po ? `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1.5rem; background: #0D1117; border: 1px solid #30363D; padding: 1.5rem; border-radius: 12px;">
                    <div>
                        <label style="display: block; font-size: 0.65rem; color: #8B949E; text-transform: uppercase; margin-bottom: 5px;">Orden PO</label>
                        <span style="color: #00D4FF; font-weight: 900; font-size: 1.2rem;">${item.po}</span>
                    </div>
                    <div>
                        <label style="display: block; font-size: 0.65rem; color: #8B949E; text-transform: uppercase; margin-bottom: 5px;">Estilo</label>
                        <span style="color: #FFFFFF; font-weight: 700;">${item.estilo || '---'}</span>
                    </div>
                </div>` : ''}

                <div style="margin-top: 3rem; display: flex; gap: 1rem;">
                    ${item.tipo === 'produccion' ? 
                        `<button onclick="Sidebar.mostrarProduccion()" style="background: #00D4FF; color: #0D1117; border: none; padding: 1rem 2rem; border-radius: 8px; font-weight: 900; cursor: pointer; box-shadow: 0 4px 15px rgba(0,212,255,0.3);">IR AL TABLERO DE PRODUCCIÓN</button>` : ''}
                    
                    ${item.tipo === 'solicitud' ? 
                        `<button onclick="Sidebar.mostrarSolicitudes()" style="background: #F59E0B; color: #0D1117; border: none; padding: 1rem 2rem; border-radius: 8px; font-weight: 900; cursor: pointer;">VER SOLICITUD EN PLANTA</button>` : ''}
                </div>
            </div>
        `;
    },

    eliminarItem: async function(id) {
        if (confirm('¿Desea eliminar esta notificación?')) {
            if (window.SupabaseClient && window.SupabaseClient.eliminarBandejaItem) {
                await window.SupabaseClient.eliminarBandejaItem(id);
                this.cargarBandeja();
                document.getElementById('inboxDetailView').innerHTML = `
                    <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #30363D;">
                        <span style="font-size: 5rem; opacity: 0.1;">✉️</span>
                        <p style="font-weight: 700; margin-top: 1rem; color: #484F58;">Mensaje eliminado</p>
                    </div>
                `;
            }
        }
    }
};

window.InboxModule = InboxModule;
