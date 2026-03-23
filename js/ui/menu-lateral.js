// js/ui/menu-lateral.js
const MenuLateral = {
    init: function() {
        this.crearMenu();
        this.configurarEventos();
        this.aplicarVistaInicial();
    },
    
    crearMenu: function() {
        if (document.getElementById('menuLateral')) return;
        
        const menuHTML = `
            <div id="menuLateral" class="menu-lateral">
                <button class="menu-toggle" id="menuToggleBtn">☰</button>
                <div class="menu-header">
                    <h3>📋 MENÚ</h3>
                </div>
                <div class="menu-botones">
                    <button id="btnBaseDatos" class="menu-btn active">
                        <span class="menu-icon">🗄️</span>
                        <span class="menu-text">Base de Datos</span>
                    </button>
                    <button id="btnConsultas" class="menu-btn">
                        <span class="menu-icon">🔍</span>
                        <span class="menu-text">Consultas</span>
                    </button>
                    <button id="btnTracking" class="menu-btn">
                        <span class="menu-icon">📍</span>
                        <span class="menu-text">Tracking</span>
                        <span class="menu-badge">Próximamente</span>
                    </button>
                </div>
                <div class="menu-footer">
                    <div class="menu-version">Alpha DB v9.0</div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', menuHTML);
        this.agregarEstilos();
    },
    
    agregarEstilos: function() {
        const style = document.createElement('style');
        style.textContent = `
            /* Menú Lateral Izquierdo */
            .menu-lateral {
                position: fixed;
                left: 0;
                top: 0;
                width: 280px;
                height: 100vh;
                background: linear-gradient(135deg, #1a1a1a, #0f0f0f);
                border-right: 2px solid #ff6b6b;
                box-shadow: 5px 0 25px rgba(0, 0, 0, 0.5);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                transition: transform 0.3s ease;
                font-family: 'Rubik', sans-serif;
            }
            
            /* Estado colapsado - menú se esconde a la izquierda */
            .menu-lateral.collapsed {
                transform: translateX(-100%);
            }
            
            /* Botón de hamburguesa DENTRO del menú */
            .menu-toggle {
                position: absolute;
                right: -20px;
                top: 20px;
                background: #ff6b6b;
                color: white;
                border: none;
                border-radius: 30px;
                width: 40px;
                height: 40px;
                cursor: pointer;
                z-index: 1002;
                font-size: 20px;
                transition: all 0.3s ease;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .menu-toggle:hover {
                background: #ff8e8e;
                transform: scale(1.05);
            }
            
            /* Cuando el menú está colapsado, el botón se mueve con él */
            .menu-lateral.collapsed .menu-toggle {
                right: -60px;
                background: #ff6b6b;
            }
            .menu-lateral.collapsed .menu-toggle:hover {
                background: #ff8e8e;
            }
            
            /* Ajuste del contenedor principal */
            .container {
                margin-left: 280px;
                transition: margin-left 0.3s ease;
                max-width: calc(100% - 280px);
                padding: 1.5rem;
            }
            
            /* Cuando el menú está colapsado */
            .menu-lateral.collapsed ~ .container {
                margin-left: 0;
                max-width: 100%;
            }
            
            /* Asegurar que el contenedor se ajuste cuando el menú está colapsado */
            body:has(.menu-lateral.collapsed) .container {
                margin-left: 0;
            }
            
            /* Header y logo no se superponen */
            .header {
                position: relative;
                z-index: 1;
            }
            
            .menu-header {
                padding: 25px 20px;
                border-bottom: 1px solid rgba(255, 107, 107, 0.3);
                text-align: center;
                margin-top: 20px;
            }
            .menu-header h3 {
                color: #ffd93d;
                font-size: 1.2rem;
                font-weight: 600;
                margin: 0;
            }
            
            .menu-botones {
                flex: 1;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .menu-btn {
                background: #2a2a2a;
                border: 1px solid rgba(255, 107, 107, 0.3);
                border-radius: 12px;
                padding: 14px 16px;
                color: #fff;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 12px;
                text-align: left;
                font-family: 'Rubik', sans-serif;
            }
            .menu-btn:hover {
                background: #3a3a3a;
                border-color: #ff6b6b;
                transform: translateX(5px);
            }
            .menu-btn.active {
                background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
                border-color: #ffd93d;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            }
            .menu-icon {
                font-size: 1.4rem;
            }
            .menu-text {
                flex: 1;
            }
            .menu-badge {
                font-size: 0.65rem;
                background: rgba(255, 107, 107, 0.3);
                padding: 3px 8px;
                border-radius: 20px;
                color: #ffd93d;
            }
            
            .menu-footer {
                padding: 20px;
                border-top: 1px solid rgba(255, 107, 107, 0.3);
                text-align: center;
            }
            .menu-version {
                font-size: 0.7rem;
                color: #888;
            }
            
            /* Panel de consultas */
            .consultas-panel {
                background: #1e1e1e;
                border-radius: 16px;
                padding: 20px;
                margin-bottom: 20px;
                border: 1px solid rgba(255, 107, 107, 0.2);
                display: none;
            }
            .consultas-panel.active {
                display: block;
                animation: fadeIn 0.3s;
            }
            .consultas-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                flex-wrap: wrap;
                gap: 10px;
            }
            .consultas-header h3 {
                color: #ffd93d;
                font-size: 1rem;
            }
            .consultas-filtros {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-bottom: 20px;
            }
            .consultas-filtros input, .consultas-filtros select {
                padding: 10px 15px;
                background: #2a2a2a;
                border: 1px solid #ff6b6b;
                border-radius: 8px;
                color: white;
                font-family: 'Rubik', sans-serif;
            }
            .consultas-filtros input {
                flex: 1;
                min-width: 200px;
            }
            .btn-filtrar {
                background: #ff6b6b;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            .btn-filtrar:hover {
                background: #ff8e8e;
                transform: translateY(-2px);
            }
            .btn-limpiar {
                background: #2a2a2a;
                border: 1px solid #ff6b6b;
                padding: 10px 20px;
                border-radius: 8px;
                color: #ffd93d;
                cursor: pointer;
            }
            .info-semana {
                background: #2a2a2a;
                padding: 10px;
                border-radius: 8px;
                margin-top: 15px;
                font-size: 0.8rem;
                color: #ffd93d;
                text-align: center;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @media (max-width: 768px) {
                .menu-lateral {
                    width: 260px;
                }
                .container {
                    margin-left: 0;
                    max-width: 100%;
                    padding: 1rem;
                }
                .menu-lateral.collapsed ~ .container {
                    margin-left: 0;
                }
                .menu-toggle {
                    right: -20px;
                }
                .menu-lateral.collapsed .menu-toggle {
                    right: -50px;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Configurar el botón de toggle
        const toggleBtn = document.getElementById('menuToggleBtn');
        if (toggleBtn) {
            toggleBtn.onclick = () => this.toggleMenu();
        }
    },
    
    toggleMenu: function() {
        const menu = document.getElementById('menuLateral');
        const toggleBtn = document.getElementById('menuToggleBtn');
        if (menu) {
            menu.classList.toggle('collapsed');
            if (toggleBtn) {
                toggleBtn.innerHTML = menu.classList.contains('collapsed') ? '☰' : '✕';
                toggleBtn.title = menu.classList.contains('collapsed') ? 'Mostrar menú' : 'Ocultar menú';
            }
        }
    },
    
    configurarEventos: function() {
        document.getElementById('btnBaseDatos')?.addEventListener('click', () => this.mostrarBaseDatos());
        document.getElementById('btnConsultas')?.addEventListener('click', () => this.mostrarConsultas());
        document.getElementById('btnTracking')?.addEventListener('click', () => {
            Notifications.info('📍 Módulo de Tracking en desarrollo');
        });
    },
    
    mostrarBaseDatos: function() {
        document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('btnBaseDatos').classList.add('active');
        document.getElementById('consultasPanel')?.classList.remove('active');
        
        const formSection = document.querySelector('.form-section');
        const filtersSection = document.querySelector('.filters-section');
        const tableSection = document.querySelector('.table-section');
        
        if (formSection) formSection.style.display = 'block';
        if (filtersSection) filtersSection.style.display = 'block';
        if (tableSection) tableSection.style.display = 'block';
        
        AppState.setFiltros('', '');
        if (TablaUI) TablaUI.actualizar();
        Notifications.info('🗄️ Vista de Base de Datos completa');
    },
    
    mostrarConsultas: function() {
        document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('btnConsultas').classList.add('active');
        
        if (!document.getElementById('consultasPanel')) this.crearPanelConsultas();
        
        const formSection = document.querySelector('.form-section');
        const filtersSection = document.querySelector('.filters-section');
        if (formSection) formSection.style.display = 'none';
        if (filtersSection) filtersSection.style.display = 'none';
        
        document.getElementById('consultasPanel')?.classList.add('active');
        const tableSection = document.querySelector('.table-section');
        if (tableSection) tableSection.style.display = 'block';
        
        this.aplicarVistaUltimasSemanas();
        Notifications.info('🔍 Vista de Consultas - Últimas 2 semanas');
    },
    
    crearPanelConsultas: function() {
        const tableSection = document.querySelector('.table-section');
        if (!tableSection) return;
        
        tableSection.insertAdjacentHTML('beforebegin', `
            <div id="consultasPanel" class="consultas-panel">
                <div class="consultas-header">
                    <h3>🔍 CONSULTAS Y FILTROS</h3>
                    <div class="info-semana" id="infoSemanaActual"></div>
                </div>
                <div class="consultas-filtros">
                    <input type="text" id="consultaSearchInput" placeholder="Buscar por PO, estilo, tela, proceso...">
                    <select id="consultaSemanaSelect"><option value="">Todas las semanas</option></select>
                    <button id="consultaFiltrarBtn" class="btn-filtrar">🔍 Buscar</button>
                    <button id="consultaLimpiarBtn" class="btn-limpiar">✕ Limpiar</button>
                </div>
                <div class="info-semana" id="infoFiltroActivo"></div>
            </div>
        `);
        
        this.configurarEventosConsultas();
        this.cargarOpcionesSemanas();
        this.actualizarInfoSemanaActual();
    },
    
    configurarEventosConsultas: function() {
        const searchInput = document.getElementById('consultaSearchInput');
        const semanaSelect = document.getElementById('consultaSemanaSelect');
        const filtrarBtn = document.getElementById('consultaFiltrarBtn');
        const limpiarBtn = document.getElementById('consultaLimpiarBtn');
        
        filtrarBtn?.addEventListener('click', () => {
            this.aplicarFiltrosConsulta(searchInput?.value || '', semanaSelect?.value || '');
        });
        limpiarBtn?.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (semanaSelect) semanaSelect.value = '';
            this.aplicarVistaUltimasSemanas();
        });
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.aplicarFiltrosConsulta(searchInput.value, semanaSelect?.value || '');
            }
        });
    },
    
    cargarOpcionesSemanas: function() {
        const semanaSelect = document.getElementById('consultaSemanaSelect');
        if (!semanaSelect) return;
        const semanas = [...new Set(AppState.registros.map(r => r.semana))].sort((a,b) => b - a);
        semanaSelect.innerHTML = '<option value="">Todas las semanas</option>' + semanas.map(s => `<option value="${s}">Semana ${s}</option>`).join('');
    },
    
    actualizarInfoSemanaActual: function() {
        const infoDiv = document.getElementById('infoSemanaActual');
        if (!infoDiv) return;
        const fecha = new Date();
        infoDiv.innerHTML = `📅 Semana actual: ${Utils.obtenerSemana(fecha)} | Fecha: ${Utils.formatearFecha(fecha.toISOString().split('T')[0])}`;
    },
    
    aplicarVistaUltimasSemanas: function() {
        const fecha = new Date();
        const semanaActual = Utils.obtenerSemana(fecha);
        const hace14Dias = new Date(fecha);
        hace14Dias.setDate(fecha.getDate() - 14);
        const semanaHace14Dias = Utils.obtenerSemana(hace14Dias);
        
        const semanasSet = new Set();
        for (let i = 0; i <= semanaActual - semanaHace14Dias; i++) {
            semanasSet.add(semanaHace14Dias + i);
        }
        const semanasArray = Array.from(semanasSet);
        
        const registrosFiltrados = AppState.registros.filter(reg => semanasArray.includes(parseInt(reg.semana)));
        
        if (TablaUI) {
            const filtrosGuardados = { search: AppState.currentSearch, semana: AppState.currentSemana };
            AppState.setFiltros('', '');
            TablaUI.render(registrosFiltrados);
            AppState.setFiltros(filtrosGuardados.search, filtrosGuardados.semana);
        }
        
        const infoFiltro = document.getElementById('infoFiltroActivo');
        if (infoFiltro) {
            infoFiltro.innerHTML = `📊 Mostrando registros de las últimas 2 semanas (Semana ${semanaHace14Dias} - Semana ${semanaActual})`;
        }
        if (TablaUI) TablaUI.actualizarEstadisticas();
    },
    
    aplicarFiltrosConsulta: function(search, semana) {
        AppState.setFiltros(search, semana);
        if (TablaUI) TablaUI.actualizar();
        
        const infoFiltro = document.getElementById('infoFiltroActivo');
        if (infoFiltro) {
            if (search && semana) infoFiltro.innerHTML = `🔍 Buscando: "${search}" | Semana: ${semana}`;
            else if (search) infoFiltro.innerHTML = `🔍 Buscando: "${search}"`;
            else if (semana) infoFiltro.innerHTML = `📅 Semana: ${semana}`;
            else infoFiltro.innerHTML = `📊 Mostrando todos los registros`;
        }
    },
    
    aplicarVistaInicial: function() {
        this.mostrarBaseDatos();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => MenuLateral.init(), 500);
});

window.MenuLateral = MenuLateral;
