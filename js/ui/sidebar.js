// ============================================================
// js/ui/sidebar.js - Menú lateral según rol del usuario
// Versión con botón de Solicitudes funcional
// ============================================================

const Sidebar = {
    init: function() {
        if (window.location.pathname.includes('login.html')) return;
        this.crearMenu();
        this.configurarEventos();
        this.aplicarVistaInicial();
        this.inicializarCalendario();
        this.inicializarConsultas();
        this.inicializarBaseDatosScanner();
        
        setTimeout(() => {
            this.verificarPermisosMenu();
        }, 100);
    },
    
    crearMenu: function() {
        if (document.getElementById('menuLateral')) return;
        
        const menuHTML = `
            <div id="menuLateral" class="menu-lateral">
                <div class="menu-header"><h3>ALPHA DB</h3></div>
                <div class="menu-botones">
                    <button id="btnBaseDatos" class="menu-btn active">
                        <span class="menu-icon"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2" fill="none"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg></span>
                        <span class="menu-text">DATOS</span>
                    </button>
                    <button id="btnConsultas" class="menu-btn">
                        <span class="menu-icon"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" width="22" height="22"><circle cx="11" cy="11" r="8" fill="none"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                        <span class="menu-text">CONSULTAS</span>
                    </button>
                    <button id="btnTracking" class="menu-btn">
                        <span class="menu-icon"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" width="22" height="22"><path d="M12 2 L12 6 M12 18 L12 22 M4 12 L8 12 M16 12 L20 12" stroke="currentColor"/><circle cx="12" cy="12" r="3" fill="none"/><circle cx="12" cy="12" r="8" fill="none"/></svg></span>
                        <span class="menu-text">TRACKING</span>
                    </button>
                    <button id="btnSolicitudes" class="menu-btn">
                        <span class="menu-icon"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" width="22" height="22"><path d="M22 6.5L12 13L2 6.5M22 6.5L12 13L2 6.5M2 6.5L12 13L2 6.5Z" fill="none"/><path d="M12 13V21M2 6.5V17.5C2 18.3 2.5 19 3.2 19.4L12 22L20.8 19.4C21.5 19 22 18.3 22 17.5V6.5" fill="none"/></svg></span>
                        <span class="menu-text">SOLICITUDES</span>
                    </button>
                    <button id="btnAprobaciones" class="menu-btn">
                        <span class="menu-icon"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" width="22" height="22"><path d="M22 11.1C22 16.5 17.5 20 12 20C6.5 20 2 16.5 2 11.1C2 6.8 6 2.5 12 2.5C18 2.5 22 6.8 22 11.1Z" fill="none"/><path d="M8 12L11 15L16 9" stroke="currentColor" fill="none"/></svg></span>
                        <span class="menu-text">APROBACIONES</span>
                    </button>
                    <button id="btnBandejaEntrada" class="menu-btn">
                        <span class="menu-icon"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" width="22" height="22"><path d="M22 6.5L12 13L2 6.5M22 6.5L12 13L2 6.5M2 6.5L12 13L2 6.5Z" fill="none"/><path d="M12 13V21M2 6.5V17.5C2 18.3 2.5 19 3.2 19.4L12 22L20.8 19.4C21.5 19 22 18.3 22 17.5V6.5" fill="none"/></svg></span>
                        <span class="menu-text">BANDEJA</span>
                    </button>
                    <button id="btnConfiguracion" class="menu-btn" style="display: none;">
                        <span class="menu-icon"><svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" width="22" height="22"><circle cx="12" cy="12" r="3" fill="none"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
                        <span class="menu-text">CONFIGURACIÓN</span>
                    </button>
                </div>
                <div class="menu-footer"><div class="menu-version">Alpha DB v10.0</div></div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', menuHTML);
        const container = document.querySelector('.container');
        if (container) { container.style.marginLeft = '80px'; container.style.maxWidth = 'calc(100% - 80px)'; }
    },
    
    verificarPermisosMenu: function() {
        const puedeAccederBaseDatos = window.puedeAccederBaseDatos && window.puedeAccederBaseDatos();
        const puedeAccederConsultas = window.puedeAccederConsultas && window.puedeAccederConsultas();
        const puedeAccederTracking = window.puedeAccederTracking && window.puedeAccederTracking();
        const puedeAccederSolicitudes = window.puedeAccederConsultas && window.puedeAccederConsultas(); // Todos los usuarios pueden ver solicitudes
        const puedeAccederAprobaciones = window.puedeAccederAprobaciones && window.puedeAccederAprobaciones();
        const puedeAccederBandeja = window.puedeAccederBandeja && window.puedeAccederBandeja();
        const puedeAccederConfiguracion = window.puedeAccederConfiguracion && window.puedeAccederConfiguracion();
        
        const btnBaseDatos = document.getElementById('btnBaseDatos');
        const btnConsultas = document.getElementById('btnConsultas');
        const btnTracking = document.getElementById('btnTracking');
        const btnSolicitudes = document.getElementById('btnSolicitudes');
        const btnAprobaciones = document.getElementById('btnAprobaciones');
        const btnBandeja = document.getElementById('btnBandejaEntrada');
        const btnConfig = document.getElementById('btnConfiguracion');
        
        if (btnBaseDatos) btnBaseDatos.style.display = puedeAccederBaseDatos ? 'flex' : 'none';
        if (btnConsultas) btnConsultas.style.display = puedeAccederConsultas ? 'flex' : 'none';
        if (btnTracking) btnTracking.style.display = puedeAccederTracking ? 'flex' : 'none';
        if (btnSolicitudes) btnSolicitudes.style.display = puedeAccederSolicitudes ? 'flex' : 'none';
        if (btnAprobaciones) btnAprobaciones.style.display = puedeAccederAprobaciones ? 'flex' : 'none';
        if (btnBandeja) btnBandeja.style.display = puedeAccederBandeja ? 'flex' : 'none';
        if (btnConfig) btnConfig.style.display = puedeAccederConfiguracion ? 'flex' : 'none';
        
        const usuario = window.getUsuarioActual && window.getUsuarioActual();
        const nombreRol = window.getNombreRol && window.getNombreRol();
        if (usuario) {
            console.log(`👤 Usuario: ${usuario.username} | ${nombreRol}`);
        }
    },
    
    // ============================================================
    // CALENDARIO INTEGRADO
    // ============================================================
    
    inicializarCalendario: function() {
        this.actualizarCalendario();
        this.configurarCalendario();
    },
    
    actualizarCalendario: function() {
        const container = document.getElementById('calendarioMensualContainer');
        if (!container) return;
        
        if (!AppState.registros || AppState.registros.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:1rem; color:#8B949E;">📅 No hay registros</div>';
            return;
        }
        
        const semanasMap = new Map();
        
        for (let i = 0; i < AppState.registros.length; i++) {
            const reg = AppState.registros[i];
            if (!reg.semana) continue;
            
            const semanaNum = parseInt(reg.semana);
            if (isNaN(semanaNum)) continue;
            
            if (!semanasMap.has(semanaNum)) {
                semanasMap.set(semanaNum, { semana: semanaNum, cantidad: 0 });
            }
            semanasMap.get(semanaNum).cantidad++;
        }
        
        if (semanasMap.size === 0) {
            container.innerHTML = '<div style="text-align:center; padding:1rem; color:#8B949E;">📅 No hay semanas disponibles</div>';
            return;
        }
        
        const semanasArray = Array.from(semanasMap.values()).sort((a, b) => b.semana - a.semana);
        
        let html = '<div style="display: flex; flex-wrap: wrap; gap: 8px;">';
        
        for (let i = 0; i < semanasArray.length; i++) {
            const item = semanasArray[i];
            const isActive = (AppState.currentSemana === item.semana.toString());
            
            html += `
                <div class="semana-calendario-btn ${isActive ? 'activo' : ''}" 
                     data-semana="${item.semana}"
                     style="background: ${isActive ? '#00D4FF' : '#21262D'}; border: 1px solid ${isActive ? 'transparent' : 'rgba(0, 212, 255, 0.3)'}; border-radius: 8px; padding: 8px 12px; cursor: pointer; transition: all 0.2s ease; text-align: center; min-width: 80px;"
                     onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,212,255,0.2)';"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <div style="font-weight: 700; font-size: 0.8rem; color: ${isActive ? '#0D1117' : '#00D4FF'};">Semana ${item.semana}</div>
                    <div style="font-size: 0.65rem; color: ${isActive ? '#0D1117' : '#8B949E'};">${item.cantidad} reg</div>
                </div>
            `;
        }
        
        html += '</div>';
        container.innerHTML = html;
        
        const botones = container.querySelectorAll('.semana-calendario-btn');
        for (let i = 0; i < botones.length; i++) {
            const btn = botones[i];
            const semana = parseInt(btn.getAttribute('data-semana'));
            btn.onclick = () => this.filtrarPorSemana(semana);
        }
    },
    
    filtrarPorSemana: function(semana) {
        const semanaStr = semana.toString();
        
        if (AppState.currentSemana === semanaStr) {
            AppState.setFiltros(AppState.currentSearch, '');
            if (window.Notifications) Notifications.info(`📅 Filtro de Semana ${semana} eliminado`);
        } else {
            AppState.setFiltros(AppState.currentSearch, semanaStr);
            if (window.Notifications) Notifications.success(`📅 Mostrando Semana ${semana}`);
        }
        
        this.actualizarCalendario();
        this.actualizarBadgeFiltro();
        if (window.TableUI && TableUI.actualizar) {
            TableUI.actualizar();
        }
    },
    
    limpiarFiltros: function() {
        AppState.setFiltros('', '');
        this.actualizarCalendario();
        this.actualizarBadgeFiltro();
        if (window.TableUI && TableUI.actualizar) {
            TableUI.actualizar();
        }
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        if (window.Notifications) Notifications.info('🧹 Todos los filtros eliminados');
    },
    
    actualizarBadgeFiltro: function() {
        const filtroBadge = document.getElementById('filtroActivo');
        if (!filtroBadge) return;
        
        if (AppState.currentSemana) {
            filtroBadge.style.display = 'inline';
            filtroBadge.innerHTML = `📅 Semana ${AppState.currentSemana}`;
        } else {
            filtroBadge.style.display = 'none';
        }
    },
    
    configurarCalendario: function() {
        const limpiarBtn = document.getElementById('limpiarFiltroBtn');
        if (limpiarBtn) {
            const nuevoBtn = limpiarBtn.cloneNode(true);
            limpiarBtn.parentNode.replaceChild(nuevoBtn, limpiarBtn);
            nuevoBtn.addEventListener('click', () => this.limpiarFiltros());
        }
    },
    
    // ============================================================
    // ESCÁNER QR PARA BASE DE DATOS
    // ============================================================
    
    inicializarBaseDatosScanner: function() {
        const escanearBtn = document.getElementById('baseDatosEscanearBtn');
        const cerrarBtn = document.getElementById('baseDatosCerrarScanner');
        const scannerContainer = document.getElementById('baseDatosScannerContainer');
        const video = document.getElementById('baseDatosVideo');
        const canvas = document.getElementById('baseDatosCanvas');
        
        if (!escanearBtn) return;
        
        let scanning = false;
        let animationId = null;
        
        const iniciarScanner = () => {
            if (scannerContainer) scannerContainer.style.display = 'block';
            
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => {
                    if (video) {
                        video.srcObject = stream;
                        video.setAttribute('playsinline', true);
                        video.play();
                        scanning = true;
                        
                        const context = canvas?.getContext('2d');
                        
                        const tick = () => {
                            if (!scanning) return;
                            
                            if (video.readyState === video.HAVE_ENOUGH_DATA && canvas && context) {
                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;
                                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                                
                                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                                const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                                
                                if (code) {
                                    console.log('📷 QR detectado en Base de Datos:', code.data);
                                    scanning = false;
                                    if (animationId) cancelAnimationFrame(animationId);
                                    
                                    if (video.srcObject) {
                                        video.srcObject.getTracks().forEach(track => track.stop());
                                        video.srcObject = null;
                                    }
                                    
                                    if (scannerContainer) scannerContainer.style.display = 'none';
                                    
                                    let poEncontrado = '';
                                    const matchPO = code.data.match(/PO[:\s]*([A-Z0-9\-]+)/i);
                                    if (matchPO) {
                                        poEncontrado = matchPO[1];
                                    } else {
                                        poEncontrado = code.data.trim();
                                    }
                                    
                                    const searchInput = document.getElementById('searchInput');
                                    if (searchInput) {
                                        searchInput.value = poEncontrado;
                                        AppState.currentSearch = poEncontrado;
                                        AppState.currentSemana = '';
                                        this.actualizarCalendario();
                                        if (window.TableUI) TableUI.actualizar();
                                    }
                                    
                                    if (window.Notifications) Notifications.success(`📱 QR leído: ${poEncontrado}`);
                                    return;
                                }
                            }
                            animationId = requestAnimationFrame(tick);
                        };
                        tick();
                    }
                })
                .catch(err => {
                    console.error('Error al acceder a cámara:', err);
                    if (window.Notifications) Notifications.error('No se pudo acceder a la cámara');
                    if (scannerContainer) scannerContainer.style.display = 'none';
                });
        };
        
        escanearBtn.onclick = iniciarScanner.bind(this);
        
        if (cerrarBtn) {
            cerrarBtn.onclick = () => {
                scanning = false;
                if (animationId) cancelAnimationFrame(animationId);
                if (video && video.srcObject) {
                    video.srcObject.getTracks().forEach(track => track.stop());
                    video.srcObject = null;
                }
                if (scannerContainer) scannerContainer.style.display = 'none';
            };
        }
    },
    
    // ============================================================
    // CONSULTAS (filtros y escáner)
    // ============================================================
    
    inicializarConsultas: function() {
        this.configurarEventosConsultas();
        this.cargarOpcionesSemanas();
        this.actualizarInfoSemanaActual();
        this.configurarScannerConsultas();
    },
    
    configurarScannerConsultas: function() {
        const escanearBtn = document.getElementById('consultaEscanearBtn');
        const cerrarBtn = document.getElementById('consultaCerrarScanner');
        const scannerContainer = document.getElementById('consultaScannerContainer');
        const video = document.getElementById('consultaVideo');
        const canvas = document.getElementById('consultaCanvas');
        
        if (!escanearBtn) return;
        
        let scanning = false;
        let animationId = null;
        
        const iniciarScanner = () => {
            if (scannerContainer) scannerContainer.style.display = 'block';
            
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => {
                    if (video) {
                        video.srcObject = stream;
                        video.setAttribute('playsinline', true);
                        video.play();
                        scanning = true;
                        
                        const context = canvas?.getContext('2d');
                        
                        const tick = () => {
                            if (!scanning) return;
                            
                            if (video.readyState === video.HAVE_ENOUGH_DATA && canvas && context) {
                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;
                                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                                
                                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                                const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                                
                                if (code) {
                                    console.log('📷 QR detectado en Consultas:', code.data);
                                    scanning = false;
                                    if (animationId) cancelAnimationFrame(animationId);
                                    
                                    if (video.srcObject) {
                                        video.srcObject.getTracks().forEach(track => track.stop());
                                        video.srcObject = null;
                                    }
                                    
                                    if (scannerContainer) scannerContainer.style.display = 'none';
                                    
                                    let poEncontrado = '';
                                    const matchPO = code.data.match(/PO[:\s]*([A-Z0-9\-]+)/i);
                                    if (matchPO) {
                                        poEncontrado = matchPO[1];
                                    } else {
                                        poEncontrado = code.data.trim();
                                    }
                                    
                                    const searchInput = document.getElementById('consultaSearchInput');
                                    if (searchInput) {
                                        searchInput.value = poEncontrado;
                                    }
                                    
                                    document.getElementById('consultaFiltrarBtn')?.click();
                                    if (window.Notifications) Notifications.success(`📱 QR leído: ${poEncontrado}`);
                                    return;
                                }
                            }
                            animationId = requestAnimationFrame(tick);
                        };
                        tick();
                    }
                })
                .catch(err => {
                    console.error('Error al acceder a cámara:', err);
                    if (window.Notifications) Notifications.error('No se pudo acceder a la cámara');
                    if (scannerContainer) scannerContainer.style.display = 'none';
                });
        };
        
        escanearBtn.onclick = iniciarScanner;
        
        if (cerrarBtn) {
            cerrarBtn.onclick = () => {
                scanning = false;
                if (animationId) cancelAnimationFrame(animationId);
                if (video && video.srcObject) {
                    video.srcObject.getTracks().forEach(track => track.stop());
                    video.srcObject = null;
                }
                if (scannerContainer) scannerContainer.style.display = 'none';
            };
        }
    },
    
    configurarEventosConsultas: function() {
        const searchInput = document.getElementById('consultaSearchInput');
        const semanaSelect = document.getElementById('consultaSemanaSelect');
        const filtrarBtn = document.getElementById('consultaFiltrarBtn');
        const limpiarBtn = document.getElementById('consultaLimpiarBtn');
        
        if (filtrarBtn) {
            filtrarBtn.onclick = () => {
                const searchTerm = searchInput?.value || '';
                const semanaVal = semanaSelect?.value || '';
                
                AppState.currentSearch = searchTerm;
                AppState.currentSemana = semanaVal;
                
                this.actualizarCalendario();
                this.actualizarBadgeFiltro();
                
                if (window.TableUI) TableUI.actualizar();
                
                const infoDiv = document.getElementById('infoFiltroActivo');
                if (infoDiv) {
                    let msg = '';
                    if (searchTerm && semanaVal) msg = `🔍 "${searchTerm}" | 📅 Semana ${semanaVal}`;
                    else if (searchTerm) msg = `🔍 "${searchTerm}"`;
                    else if (semanaVal) msg = `📅 Semana ${semanaVal}`;
                    else msg = '📊 Mostrando todos los registros';
                    infoDiv.innerHTML = msg;
                }
                
                if (window.Notifications && searchTerm) {
                    const filtrados = AppState.getRegistrosFiltrados();
                    Notifications.info(`🔍 ${filtrados.length} resultado(s) encontrado(s)`);
                }
            };
        }
        
        if (limpiarBtn) {
            limpiarBtn.onclick = () => {
                if (searchInput) searchInput.value = '';
                if (semanaSelect) semanaSelect.value = '';
                AppState.limpiarFiltros();
                this.actualizarCalendario();
                this.actualizarBadgeFiltro();
                if (window.TableUI) TableUI.actualizar();
                
                const infoDiv = document.getElementById('infoFiltroActivo');
                if (infoDiv) infoDiv.innerHTML = '📊 Mostrando todos los registros';
                
                if (window.Notifications) Notifications.info('🧹 Filtros eliminados');
            };
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    filtrarBtn?.click();
                }
            });
        }
    },
    
    cargarOpcionesSemanas: function() {
        const semanaSelect = document.getElementById('consultaSemanaSelect');
        if (!semanaSelect || !AppState.registros) return;
        
        const semanas = new Set();
        AppState.registros.forEach(r => { if (r.semana) semanas.add(r.semana); });
        const semanasArray = Array.from(semanas).sort((a, b) => b - a);
        
        semanaSelect.innerHTML = '<option value="">📅 Todas las semanas</option>' + 
            semanasArray.map(s => `<option value="${s}">📅 Semana ${s}</option>`).join('');
    },
    
    actualizarInfoSemanaActual: function() {
        const infoDiv = document.getElementById('infoSemanaActual');
        if (!infoDiv || !window.Utils) return;
        const fecha = new Date();
        infoDiv.innerHTML = `📅 Semana actual: ${Utils.obtenerSemana(fecha)} | ${Utils.formatearFecha(fecha.toISOString().split('T')[0])}`;
    },
    
    // ============================================================
    // NAVEGACIÓN DEL MENÚ
    // ============================================================
    
    configurarEventos: function() {
        document.getElementById('btnBaseDatos')?.addEventListener('click', () => this.mostrarBaseDatos());
        document.getElementById('btnConsultas')?.addEventListener('click', () => this.mostrarConsultas());
        document.getElementById('btnTracking')?.addEventListener('click', () => this.mostrarTracking());
        document.getElementById('btnSolicitudes')?.addEventListener('click', () => this.mostrarSolicitudes());
        document.getElementById('btnAprobaciones')?.addEventListener('click', () => this.mostrarAprobaciones());
        document.getElementById('btnBandejaEntrada')?.addEventListener('click', () => this.mostrarBandejaEntrada());
        
        const btnConfig = document.getElementById('btnConfiguracion');
        if (btnConfig) {
            btnConfig.addEventListener('click', () => this.mostrarConfiguracion());
        }
    },
    
    mostrarConfiguracion: function() {
        if (window.puedeAccederConfiguracion && window.puedeAccederConfiguracion()) {
            window.location.href = 'admin.html';
        } else {
            if (window.Notifications) Notifications.error('❌ No tiene permisos para acceder a configuración');
        }
    },
    
    mostrarBaseDatos: function() {
        if (!window.puedeAccederBaseDatos || !window.puedeAccederBaseDatos()) {
            if (window.Notifications) Notifications.error('❌ No tiene permisos para acceder a Base de Datos');
            return;
        }
        
        this.ocultarTodosLosPaneles();
        document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('btnBaseDatos')?.classList.add('active');
        
        const formSection = document.querySelector('.form-section');
        const filtersSection = document.querySelector('.filters-section');
        const tableSection = document.querySelector('.table-section');
        const consultasPanel = document.getElementById('consultasPanel');
        
        const puedeVerForm = window.puedeVerFormulario && window.puedeVerFormulario();
        if (formSection) formSection.style.display = puedeVerForm ? 'block' : 'none';
        
        if (filtersSection) filtersSection.style.display = 'block';
        if (tableSection) tableSection.style.display = 'block';
        if (consultasPanel) consultasPanel.style.display = 'none';
        
        if (window.TableUI && TableUI.setModo) TableUI.setModo('completo');
        AppState.limpiarFiltros();
        this.actualizarCalendario();
        if (window.TableUI && TableUI.actualizar) TableUI.actualizar();
        if (window.Notifications) Notifications.info('🗄️ Vista de Base de Datos');
    },
    
    mostrarConsultas: function() {
        if (!window.puedeAccederConsultas || !window.puedeAccederConsultas()) {
            if (window.Notifications) Notifications.error('❌ No tiene permisos para acceder a Consultas');
            return;
        }
        
        this.ocultarTodosLosPaneles();
        document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('btnConsultas')?.classList.add('active');
        
        const formSection = document.querySelector('.form-section');
        const filtersSection = document.querySelector('.filters-section');
        const tableSection = document.querySelector('.table-section');
        const consultasPanel = document.getElementById('consultasPanel');
        
        if (formSection) formSection.style.display = 'none';
        if (filtersSection) filtersSection.style.display = 'none';
        if (tableSection) tableSection.style.display = 'block';
        if (consultasPanel) consultasPanel.style.display = 'block';
        
        const esConsultor = window.esConsultor && window.esConsultor();
        if (window.TableUI && TableUI.setModo) {
            TableUI.setModo(esConsultor ? 'solo-lectura' : 'solo-lectura');
        }
        
        this.cargarOpcionesSemanas();
        this.actualizarInfoSemanaActual();
        
        if (window.Notifications) Notifications.info('🔍 Vista de Consultas - Solo lectura');
    },
    
    mostrarTracking: function() {
        if (!window.puedeAccederTracking || !window.puedeAccederTracking()) {
            if (window.Notifications) Notifications.error('❌ No tiene permisos para acceder a Tracking');
            return;
        }
        
        this.ocultarTodosLosPaneles();
        document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('btnTracking')?.classList.add('active');
        
        const tableSection = document.querySelector('.table-section');
        if (tableSection) tableSection.style.display = 'block';
        
        if (window.TableUI && TableUI.setModo) TableUI.setModo('tracking');
        if (window.TrackingModule && TrackingModule.init) TrackingModule.init();
        if (window.Notifications) Notifications.info('📍 Módulo de Tracking');
    },
    
    mostrarSolicitudes: function() {
        this.ocultarTodosLosPaneles();
        document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('btnSolicitudes')?.classList.add('active');
        
        const tableSection = document.querySelector('.table-section');
        if (tableSection) tableSection.style.display = 'none';
        
        if (window.SolicitudesModule && typeof SolicitudesModule.init === 'function') {
            SolicitudesModule.init();
        } else {
            console.error('SolicitudesModule no cargado');
            if (window.Notifications) Notifications.error('Error al cargar módulo de Solicitudes');
        }
        
        if (window.Notifications) Notifications.info('📋 Módulo de Solicitudes');
    },
    
    mostrarAprobaciones: function() {
        if (!window.puedeAccederAprobaciones || !window.puedeAccederAprobaciones()) {
            if (window.Notifications) Notifications.error('❌ No tiene permisos para acceder a Aprobaciones');
            return;
        }
        
        this.ocultarTodosLosPaneles();
        document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('btnAprobaciones')?.classList.add('active');
        
        const tableSection = document.querySelector('.table-section');
        if (tableSection) tableSection.style.display = 'none';
        
        if (window.ApprovalsModule && typeof ApprovalsModule.init === 'function') {
            ApprovalsModule.init();
        }
        if (window.Notifications) Notifications.info('✅ Aprobaciones de Piso');
    },
    
    mostrarBandejaEntrada: function() {
        if (!window.puedeAccederBandeja || !window.puedeAccederBandeja()) {
            if (window.Notifications) Notifications.error('❌ No tiene permisos para acceder a Bandeja de Entrada');
            return;
        }
        
        this.ocultarTodosLosPaneles();
        document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('btnBandejaEntrada')?.classList.add('active');
        
        const tableSection = document.querySelector('.table-section');
        if (tableSection) tableSection.style.display = 'none';
        
        if (window.InboxModule && typeof InboxModule.init === 'function') {
            InboxModule.init();
        }
        if (window.Notifications) Notifications.info('📥 Bandeja de Entrada');
    },
    
    ocultarTodosLosPaneles: function() {
        const formSection = document.querySelector('.form-section');
        if (formSection) formSection.style.display = 'none';
        
        const filtersSection = document.querySelector('.filters-section');
        if (filtersSection) filtersSection.style.display = 'none';
        
        const consultasPanel = document.getElementById('consultasPanel');
        if (consultasPanel) consultasPanel.style.display = 'none';
        
        const trackingPanel = document.getElementById('trackingPanel');
        if (trackingPanel) trackingPanel.remove();
        
        const solicitudesPanel = document.getElementById('solicitudesPanel');
        if (solicitudesPanel) solicitudesPanel.remove();
        
        const aprobacionesPanel = document.getElementById('aprobacionesPanel');
        if (aprobacionesPanel) aprobacionesPanel.remove();
        
        const bandejaPanel = document.getElementById('bandejaEntradaPanel');
        if (bandejaPanel) bandejaPanel.remove();
        
        const proximamentePanel = document.getElementById('proximamentePanel');
        if (proximamentePanel) proximamentePanel.remove();
    },
    
    mostrarMensajeProximamente: function(titulo) {
        const existingPanel = document.getElementById('proximamentePanel');
        if (existingPanel) existingPanel.remove();
        
        const tableSection = document.querySelector('.table-section');
        if (!tableSection) return;
        
        const panelHTML = `<div id="proximamentePanel" class="consultas-panel" style="display:block; text-align:center; padding:3rem; background:#161B22; border-radius:12px; margin-bottom:1.5rem; border:1px solid rgba(0,212,255,0.25);">
            <div style="font-size:4rem; margin-bottom:1rem;">🚧</div>
            <h3 style="color:#00D4FF; margin-bottom:1rem;">${titulo}</h3>
            <p style="color:#8B949E;">Próximamente disponible</p>
        </div>`;
        
        tableSection.insertAdjacentHTML('beforebegin', panelHTML);
        const tableSectionContent = document.querySelector('.table-section');
        if (tableSectionContent) tableSectionContent.style.display = 'none';
    },
    
    aplicarVistaInicial: function() {
        if (window.puedeAccederBaseDatos && window.puedeAccederBaseDatos()) {
            this.mostrarBaseDatos();
        } else if (window.puedeAccederConsultas && window.puedeAccederConsultas()) {
            this.mostrarConsultas();
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.includes('login.html')) {
        setTimeout(() => {
            if (window.Sidebar && Sidebar.init) {
                Sidebar.init();
            }
        }, 500);
    }
});

window.Sidebar = Sidebar;
console.log('✅ Sidebar cargado - Menú según rol de usuario con Solicitudes');