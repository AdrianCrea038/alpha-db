// js/modules/tracking.js
const TrackingModule = {
    poActual: null,
    datosPO: null,
    procesos: ['DISEÑO', 'PLOTTER', 'SUBLIMADO', 'FLAT', 'LASER', 'BORDADO'],
    metaPiezas: 500,
    
    metasPorProceso: {
        'DISEÑO': 500,
        'PLOTTER': 450,
        'SUBLIMADO': 400,
        'FLAT': 350,
        'LASER': 300,
        'BORDADO': 250
    },
    
    avancePorProceso: {
        'DISEÑO': 500,
        'PLOTTER': 380,
        'SUBLIMADO': 320,
        'FLAT': 280,
        'LASER': 220,
        'BORDADO': 180
    },
    
    modoEdicion: false,
    
    init: function() {
        console.log('📍 Módulo de Tracking iniciado');
        this.cargarMetasGuardadas();
        this.renderizar();
        this.configurarEventos();
    },
    
    cargarMetasGuardadas: function() {
        const metasGuardadas = localStorage.getItem('alpha_db_metas_proceso');
        if (metasGuardadas) {
            try {
                const parsed = JSON.parse(metasGuardadas);
                this.metasPorProceso = { ...this.metasPorProceso, ...parsed.metas };
                this.avancePorProceso = { ...this.avancePorProceso, ...parsed.avance };
            } catch(e) {}
        }
    },
    
    guardarMetas: function() {
        localStorage.setItem('alpha_db_metas_proceso', JSON.stringify({
            metas: this.metasPorProceso,
            avance: this.avancePorProceso
        }));
    },
    
    renderizar: function() {
        const container = document.querySelector('.container');
        if (!container) return;
        
        let trackingPanel = document.getElementById('trackingPanel');
        if (trackingPanel) trackingPanel.remove();
        
        const panelHTML = `
            <div id="trackingPanel" class="tracking-panel">
                <div class="tracking-header">
                    <h2>📍 TRACKING DE PRODUCCIÓN</h2>
                    <p>Seguimiento detallado por orden de producción (PO)</p>
                </div>
                
                <div class="tracking-buscador">
                    <div class="buscador-input-group">
                        <input type="text" id="trackingPoInput" placeholder="Ingrese número de PO..." class="input-bonito">
                        <button id="trackingBuscarBtn" class="btn-primary">🔍 BUSCAR</button>
                        <button id="trackingEscanearBtn" class="btn-secondary" style="background: #9c27b0;">📷 ESCANEAR QR</button>
                    </div>
                    <div id="trackingScannerContainer" class="scanner-container" style="display: none;">
                        <video id="trackingVideo" autoplay playsinline></video>
                        <canvas id="trackingCanvas" style="display: none;"></canvas>
                        <button id="trackingCerrarScanner" class="btn-secondary">✕ Cerrar escáner</button>
                    </div>
                </div>
                
                <div id="trackingLoader" class="tracking-loader" style="display: none;">
                    <div class="spinner"></div>
                    <p>Cargando información de la PO...</p>
                </div>
                
                <div id="trackingResultados" style="display: none;"></div>
                
                <div id="indicadoresProceso" class="indicadores-proceso-section">
                    <div class="indicadores-header">
                        <h3>📊 INDICADORES DE CUMPLIMIENTO POR PROCESO</h3>
                        <button id="editarMetasBtn" class="btn-editar-metas">✏️ EDITAR METAS</button>
                    </div>
                    <div id="indicadoresGrid" class="indicadores-grid">
                        ${this.renderizarIndicadores()}
                    </div>
                    <div class="indicadores-footer">
                        <small>⚠️ Los valores de cumplimiento son configurables. Use "Editar metas" para actualizar.</small>
                    </div>
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
    
    renderizarIndicadores: function() {
        let html = '';
        
        for (const proceso of this.procesos) {
            const meta = this.metasPorProceso[proceso];
            const avance = this.avancePorProceso[proceso];
            const porcentaje = meta > 0 ? Math.min(100, Math.round((avance / meta) * 100)) : 0;
            
            let colorBarra = 'rojo';
            if (porcentaje >= 80) colorBarra = 'verde';
            else if (porcentaje >= 50) colorBarra = 'amarillo';
            
            html += `
                <div class="indicador-card" data-proceso="${proceso}">
                    <div class="indicador-header">
                        <span class="indicador-icono">${this.getIconoProceso(proceso)}</span>
                        <span class="indicador-nombre">${proceso}</span>
                    </div>
                    <div class="indicador-meta">
                        <span>🎯 Meta: ${meta} piezas</span>
                        <span>✅ Avance: ${avance} piezas</span>
                    </div>
                    <div class="progreso-barra-indicador">
                        <div class="progreso-fill-indicador ${colorBarra}" style="width: ${porcentaje}%"></div>
                    </div>
                    <div class="indicador-porcentaje">
                        <span class="porcentaje-valor">${porcentaje}%</span>
                        <span class="porcentaje-estado">${this.getEstadoCumplimiento(porcentaje)}</span>
                    </div>
                    <div class="indicador-semana">
                        <span>📅 Semana actual: ${this.getSemanaActual()}</span>
                    </div>
                </div>
            `;
        }
        
        return html;
    },
    
    getEstadoCumplimiento: function(porcentaje) {
        if (porcentaje >= 80) return '🎉 Excelente';
        if (porcentaje >= 50) return '⚠️ En progreso';
        return '🔴 Por debajo';
    },
    
    getSemanaActual: function() {
        if (window.Utils) {
            const fecha = new Date();
            return Utils.obtenerSemana(fecha);
        }
        return '?';
    },
    
    agregarEstilos: function() {
        if (document.getElementById('trackingStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'trackingStyles';
        styles.textContent = `
            .tracking-panel {
                background: linear-gradient(160deg, rgba(45,35,85,0.85) 0%, rgba(90,40,80,0.8) 30%, rgba(60,50,100,0.85) 60%, rgba(30,40,80,0.9) 100%);
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                border: 1px solid rgba(255,75,125,0.3);
                backdrop-filter: blur(10px);
            }
            .tracking-header h2 { font-size: 1.1rem; color: #ff4b7d; margin-bottom: 0.3rem; }
            .tracking-header p { font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 1.5rem; }
            .tracking-buscador { margin-bottom: 1.5rem; }
            .buscador-input-group { display: flex; gap: 0.8rem; flex-wrap: wrap; }
            .buscador-input-group input { flex: 1; min-width: 250px; background: rgba(26,26,26,0.8); border: 1px solid #ff4b7d; border-radius: 6px; padding: 0.7rem 1rem; color: white; }
            .btn-primary { background: linear-gradient(90deg, #ff4b7d, #ff6b8a); border: none; padding: 0.7rem 1.5rem; border-radius: 6px; color: white; font-weight: 600; cursor: pointer; }
            .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255,75,125,0.3); }
            .scanner-container { margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.5); border-radius: 8px; text-align: center; }
            .scanner-container video { width: 100%; max-width: 400px; border-radius: 8px; border: 2px solid #ff4b7d; }
            .tracking-loader { text-align: center; padding: 2rem; }
            .tracking-loader .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,75,125,0.3); border-top-color: #ff4b7d; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
            
            .indicadores-proceso-section {
                margin-top: 2rem;
                padding-top: 1rem;
                border-top: 2px solid rgba(255,75,125,0.3);
            }
            .indicadores-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                flex-wrap: wrap;
                gap: 0.5rem;
            }
            .indicadores-header h3 {
                font-size: 0.9rem;
                color: #ff6b8a;
            }
            .btn-editar-metas {
                background: rgba(42,42,42,0.8);
                border: 1px solid #ff4b7d;
                padding: 0.4rem 1rem;
                border-radius: 6px;
                color: #ff6b8a;
                cursor: pointer;
                font-size: 0.7rem;
                transition: all 0.2s;
            }
            .btn-editar-metas:hover {
                background: #ff4b7d;
                color: white;
            }
            .indicadores-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1rem;
            }
            .indicador-card {
                background: rgba(42,42,42,0.6);
                border-radius: 8px;
                padding: 1rem;
                transition: all 0.3s;
                border-left: 3px solid #ff4b7d;
            }
            .indicador-card.editando {
                background: rgba(255,75,125,0.2);
                border: 1px solid #ff4b7d;
            }
            .indicador-header {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.8rem;
            }
            .indicador-icono {
                font-size: 1.2rem;
            }
            .indicador-nombre {
                font-weight: 600;
                font-size: 0.9rem;
                color: #ff6b8a;
            }
            .indicador-meta {
                display: flex;
                justify-content: space-between;
                font-size: 0.7rem;
                margin-bottom: 0.5rem;
                color: rgba(255,255,255,0.7);
            }
            .progreso-barra-indicador {
                background: rgba(0,0,0,0.5);
                border-radius: 10px;
                height: 10px;
                overflow: hidden;
                margin: 0.5rem 0;
            }
            .progreso-fill-indicador {
                height: 100%;
                width: 0%;
                border-radius: 10px;
                transition: width 0.5s ease;
            }
            .progreso-fill-indicador.verde { background: linear-gradient(90deg, #10b981, #34d399); }
            .progreso-fill-indicador.amarillo { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
            .progreso-fill-indicador.rojo { background: linear-gradient(90deg, #ef4444, #f87171); }
            .indicador-porcentaje {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 0.5rem;
                font-size: 0.75rem;
            }
            .porcentaje-valor {
                font-weight: 700;
                font-size: 1rem;
                color: #ffd93d;
            }
            .porcentaje-estado {
                font-size: 0.7rem;
                color: rgba(255,255,255,0.6);
            }
            .indicador-semana {
                margin-top: 0.5rem;
                font-size: 0.65rem;
                color: rgba(255,255,255,0.5);
                text-align: center;
            }
            .indicadores-footer {
                margin-top: 1rem;
                text-align: center;
                font-size: 0.65rem;
                color: rgba(255,255,255,0.4);
            }
            
            .modal-editar-meta {
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
            .modal-editar-meta-content {
                background: linear-gradient(160deg, rgba(45,35,85,0.95) 0%, rgba(90,40,80,0.9) 100%);
                border: 2px solid #ff4b7d;
                border-radius: 12px;
                width: 90%;
                max-width: 450px;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                padding: 1.5rem;
            }
            .modal-editar-meta-content h3 {
                color: #ff6b8a;
                margin-bottom: 0.5rem;
                margin-top: 0;
            }
            .modal-editar-meta-content input {
                width: 100%;
                padding: 0.4rem;
                margin: 0.3rem 0;
                background: rgba(26,26,26,0.8);
                border: 1px solid #ff4b7d;
                border-radius: 6px;
                color: white;
                font-size: 0.8rem;
            }
            .modal-buttons {
                display: flex;
                gap: 0.5rem;
                margin-top: 0.8rem;
            }
            .modal-buttons button {
                flex: 1;
                padding: 0.6rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
            }
            .btn-guardar-meta {
                background: linear-gradient(90deg, #10b981, #34d399);
                color: white;
            }
            .btn-cancelar-meta {
                background: rgba(42,42,42,0.8);
                border: 1px solid #ff4b7d;
                color: #ff6b8a;
            }
            
            .dashboard-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
            .dashboard-card { background: rgba(42,42,42,0.6); border-radius: 8px; padding: 1rem; text-align: center; border-left: 3px solid #ff4b7d; }
            .dashboard-card h4 { font-size: 0.7rem; color: #ff6b8a; margin-bottom: 0.5rem; text-transform: uppercase; }
            .dashboard-card .valor { font-size: 1.4rem; font-weight: 700; color: white; }
            .dashboard-card .unidad { font-size: 0.7rem; color: rgba(255,255,255,0.5); }
            
            .procesos-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
            .proceso-card { background: rgba(42,42,42,0.6); border-radius: 8px; padding: 1rem; transition: all 0.3s; }
            .proceso-card.completado { border-left: 3px solid #10b981; }
            .proceso-card.actual { border-left: 3px solid #ff4b7d; background: rgba(255,75,125,0.15); }
            .proceso-card.pendiente { border-left: 3px solid #f59e0b; }
            .proceso-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
            .proceso-nombre { font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
            .proceso-estado { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 20px; }
            .proceso-estado.completado { background: rgba(16,185,129,0.2); color: #10b981; }
            .proceso-estado.actual { background: rgba(255,75,125,0.2); color: #ff4b7d; }
            .proceso-estado.pendiente { background: rgba(245,158,11,0.2); color: #f59e0b; }
            .proceso-stats { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.75rem; }
            .progreso-barra { background: rgba(0,0,0,0.5); border-radius: 10px; height: 8px; overflow: hidden; margin: 0.5rem 0; }
            .progreso-fill { height: 100%; width: 0%; border-radius: 10px; transition: width 0.5s ease; }
            .progreso-fill.verde { background: linear-gradient(90deg, #10b981, #34d399); }
            .progreso-fill.amarillo { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
            .progreso-fill.rojo { background: linear-gradient(90deg, #ef4444, #f87171); }
            
            .progresso-total { background: rgba(42,42,42,0.6); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; }
            .progresso-total h4 { font-size: 0.8rem; color: #ff6b8a; margin-bottom: 0.5rem; }
            .progress-bar-container { background: rgba(0,0,0,0.5); border-radius: 10px; height: 12px; overflow: hidden; margin: 0.5rem 0; }
            .progress-bar-fill { height: 100%; width: 0%; border-radius: 10px; transition: width 0.5s ease; }
            .progress-bar-fill.verde { background: linear-gradient(90deg, #10b981, #34d399); }
            .progress-bar-fill.amarillo { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
            .progress-bar-fill.rojo { background: linear-gradient(90deg, #ef4444, #f87171); }
            
            .produccion-semanal { background: rgba(42,42,42,0.6); border-radius: 8px; padding: 1rem; margin-top: 1rem; }
            .produccion-semanal h4 { font-size: 0.8rem; color: #ff6b8a; margin-bottom: 0.8rem; }
            .produccion-stats { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.8rem; flex-wrap: wrap; gap: 0.5rem; }
            
            .tracking-error { background: rgba(239,68,68,0.2); border-left: 3px solid #ef4444; padding: 1rem; border-radius: 6px; margin-top: 1rem; text-align: center; color: #f87171; }
            @keyframes spin { to { transform: rotate(360deg); } }
            
            @media (max-width: 768px) { 
                .procesos-cards { grid-template-columns: 1fr; }
                .indicadores-grid { grid-template-columns: 1fr; }
            }
        `;
        document.head.appendChild(styles);
    },
    
    configurarEventos: function() {
        document.getElementById('trackingBuscarBtn')?.addEventListener('click', () => this.buscarPO());
        document.getElementById('trackingEscanearBtn')?.addEventListener('click', () => this.iniciarScanner());
        document.getElementById('trackingCerrarScanner')?.addEventListener('click', () => this.cerrarScanner());
        document.getElementById('trackingPoInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.buscarPO();
        });
        document.getElementById('editarMetasBtn')?.addEventListener('click', () => this.abrirEditorMetas());
    },
    
    abrirEditorMetas: function() {
        const modal = document.createElement('div');
        modal.className = 'modal-editar-meta';
        modal.innerHTML = `
            <div class="modal-editar-meta-content">
                <h3>✏️ EDITAR METAS Y AVANCES</h3>
                <p style="font-size:0.7rem; color:#ffd93d; margin-bottom:0.8rem;">Ajusta las metas de producción y el avance real por proceso</p>
                <div id="editorMetasLista" style="flex:1; overflow-y:auto; max-height:55vh; padding-right:0.5rem;"></div>
                <div class="modal-buttons">
                    <button id="guardarMetasBtn" class="btn-guardar-meta">💾 GUARDAR CAMBIOS</button>
                    <button id="cancelarMetasBtn" class="btn-cancelar-meta">✕ CANCELAR</button>
                </div>
            </div>
        `;
        
        const lista = modal.querySelector('#editorMetasLista');
        let html = '';
        for (const proceso of this.procesos) {
            html += `
                <div style="margin-bottom:0.6rem; padding:0.4rem; background:rgba(0,0,0,0.3); border-radius:6px;">
                    <label style="display:block; margin-bottom:0.2rem; color:#ff6b8a; font-size:0.75rem;">${this.getIconoProceso(proceso)} ${proceso}</label>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem;">
                        <div>
                            <label style="font-size:0.6rem;">Meta (piezas)</label>
                            <input type="number" id="meta_${proceso}" value="${this.metasPorProceso[proceso]}" class="input-bonito" style="padding:0.3rem; font-size:0.7rem;">
                        </div>
                        <div>
                            <label style="font-size:0.6rem;">Avance real (piezas)</label>
                            <input type="number" id="avance_${proceso}" value="${this.avancePorProceso[proceso]}" class="input-bonito" style="padding:0.3rem; font-size:0.7rem;">
                        </div>
                    </div>
                </div>
            `;
        }
        lista.innerHTML = html;
        
        document.body.appendChild(modal);
        
        const guardarBtn = modal.querySelector('#guardarMetasBtn');
        const cancelarBtn = modal.querySelector('#cancelarMetasBtn');
        
        guardarBtn.onclick = () => {
            for (const proceso of this.procesos) {
                const metaInput = modal.querySelector(`#meta_${proceso}`);
                const avanceInput = modal.querySelector(`#avance_${proceso}`);
                if (metaInput) this.metasPorProceso[proceso] = parseFloat(metaInput.value) || 0;
                if (avanceInput) this.avancePorProceso[proceso] = parseFloat(avanceInput.value) || 0;
            }
            this.guardarMetas();
            this.actualizarIndicadores();
            modal.remove();
            if (window.Notifications) Notifications.success('✅ Metas actualizadas correctamente');
        };
        
        cancelarBtn.onclick = () => modal.remove();
    },
    
    actualizarIndicadores: function() {
        const grid = document.getElementById('indicadoresGrid');
        if (grid) {
            grid.innerHTML = this.renderizarIndicadores();
        }
    },
    
    buscarPO: function() {
        const poInput = document.getElementById('trackingPoInput');
        const po = poInput ? poInput.value.trim().toUpperCase() : '';
        
        if (!po) {
            this.mostrarError('Por favor ingrese un número de PO');
            return;
        }
        
        this.mostrarLoader(true);
        
        setTimeout(() => {
            const registroEncontrado = AppState.registros.find(r => r.po === po);
            
            if (registroEncontrado) {
                this.datosPO = registroEncontrado;
                this.poActual = po;
                this.mostrarResultados();
            } else {
                this.mostrarError('No se encontró la PO: ' + po);
                document.getElementById('trackingResultados').style.display = 'none';
            }
            this.mostrarLoader(false);
        }, 500);
    },
    
    iniciarScanner: function() {
        const scannerContainer = document.getElementById('trackingScannerContainer');
        const video = document.getElementById('trackingVideo');
        const canvas = document.getElementById('trackingCanvas');
        
        if (!scannerContainer || !video) return;
        
        scannerContainer.style.display = 'block';
        
        let scanning = true;
        let animationId = null;
        
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                video.srcObject = stream;
                video.setAttribute('playsinline', true);
                video.play();
                
                const context = canvas.getContext('2d');
                
                const tick = () => {
                    if (!scanning) return;
                    
                    if (video.readyState === video.HAVE_ENOUGH_DATA) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        context.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert",
                        });
                        
                        if (code) {
                            // QR detectado!
                            const qrData = code.data;
                            console.log('📷 QR detectado:', qrData);
                            
                            // Detener escaneo
                            scanning = false;
                            if (animationId) cancelAnimationFrame(animationId);
                            
                            // Cerrar scanner
                            this.cerrarScanner();
                            
                            // Extraer PO del QR
                            let poEncontrado = '';
                            
                            // Intentar extraer PO de diferentes formatos
                            const matchPO = qrData.match(/PO[:\s]*([A-Z0-9\-]+)/i);
                            if (matchPO) {
                                poEncontrado = matchPO[1];
                            } else {
                                // Si no encuentra patrón, usar todo el texto
                                poEncontrado = qrData.trim();
                            }
                            
                            // Escribir en el input de búsqueda
                            const poInput = document.getElementById('trackingPoInput');
                            if (poInput) {
                                poInput.value = poEncontrado;
                            }
                            
                            // Ejecutar búsqueda automática
                            this.buscarPO();
                            
                            this.mostrarMensajeQR(`📱 QR leído: ${poEncontrado}`, 'success');
                            return;
                        }
                    }
                    
                    animationId = requestAnimationFrame(tick);
                };
                
                tick();
            })
            .catch(err => {
                console.error('Error al acceder a cámara:', err);
                this.mostrarError('No se pudo acceder a la cámara. Verifica los permisos.');
                this.cerrarScanner();
            });
    },
    
    mostrarMensajeQR: function(mensaje, tipo) {
        const resultadosDiv = document.getElementById('trackingResultados');
        if (resultadosDiv) {
            const msgDiv = document.createElement('div');
            msgDiv.style.cssText = `
                background: rgba(16,185,129,0.2);
                border-left: 3px solid #10b981;
                padding: 0.8rem;
                margin: 0.5rem 0;
                border-radius: 6px;
                text-align: center;
                color: #10b981;
            `;
            msgDiv.innerHTML = `✅ ${mensaje}`;
            resultadosDiv.insertAdjacentElement('afterbegin', msgDiv);
            setTimeout(() => msgDiv.remove(), 3000);
        }
        if (window.Notifications) Notifications.success(mensaje);
    },
    
    cerrarScanner: function() {
        const scannerContainer = document.getElementById('trackingScannerContainer');
        const video = document.getElementById('trackingVideo');
        
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        
        if (scannerContainer) {
            scannerContainer.style.display = 'none';
        }
    },
    
    mostrarResultados: function() {
        if (!this.datosPO) return;
        
        const resultadosDiv = document.getElementById('trackingResultados');
        if (!resultadosDiv) return;
        
        const procesoActual = this.datosPO.proceso;
        const procesosCompletados = this.obtenerProcesosCompletados(procesoActual);
        const porcentajeTotal = this.calcularPorcentajeAvance(procesoActual);
        
        let colorBarra = 'rojo';
        if (porcentajeTotal >= 80) colorBarra = 'verde';
        else if (porcentajeTotal >= 40) colorBarra = 'amarillo';
        
        const piezasCompletadas = this.calcularPiezasCompletadas(procesoActual);
        const porcentajeCumplimiento = Math.min(100, Math.round((piezasCompletadas / this.metaPiezas) * 100));
        
        let procesosCardsHtml = '';
        for (let i = 0; i < this.procesos.length; i++) {
            const proceso = this.procesos[i];
            const estado = this.getEstadoProceso(proceso, procesoActual, procesosCompletados);
            const piezasProceso = this.piezasPorProceso[proceso];
            const piezasRealizadas = this.getPiezasRealizadasProceso(proceso, procesoActual);
            const porcentajeProceso = Math.min(100, Math.round((piezasRealizadas / piezasProceso) * 100));
            
            let colorProgreso = 'rojo';
            if (porcentajeProceso >= 80) colorProgreso = 'verde';
            else if (porcentajeProceso >= 40) colorProgreso = 'amarillo';
            
            procesosCardsHtml += `
                <div class="proceso-card ${estado}">
                    <div class="proceso-header">
                        <div class="proceso-nombre">${this.getIconoProceso(proceso)} ${proceso}</div>
                        <div class="proceso-estado ${estado}">${this.getTextoEstado(estado)}</div>
                    </div>
                    <div class="proceso-stats">
                        <span>📦 Piezas: ${piezasRealizadas} / ${piezasProceso}</span>
                        <span>📊 ${porcentajeProceso}%</span>
                    </div>
                    <div class="progreso-barra">
                        <div class="progreso-fill ${colorProgreso}" style="width: ${porcentajeProceso}%"></div>
                    </div>
                    <div class="proceso-stats" style="margin-top: 0.5rem;">
                        <span>👤 ${this.getResponsableProceso(proceso)}</span>
                        <span>📅 ${this.getFechaProceso(proceso)}</span>
                    </div>
                </div>
            `;
        }
        
        const html = `
            <div class="tracking-dashboard">
                <div class="dashboard-cards">
                    <div class="dashboard-card"><h4>PO</h4><div class="valor">${this.datosPO.po}</div></div>
                    <div class="dashboard-card"><h4>ESTILO</h4><div class="valor">${this.datosPO.estilo || '-'}</div></div>
                    <div class="dashboard-card"><h4>TELA</h4><div class="valor">${this.datosPO.tela || '-'}</div></div>
                    <div class="dashboard-card"><h4>VERSIÓN</h4><div class="valor">v${this.datosPO.version || 1}</div></div>
                    <div class="dashboard-card"><h4>META</h4><div class="valor">${this.metaPiezas}</div><div class="unidad">piezas</div></div>
                    <div class="dashboard-card"><h4>COMPLETADAS</h4><div class="valor">${piezasCompletadas}</div><div class="unidad">piezas (${porcentajeCumplimiento}%)</div></div>
                </div>
                
                <div class="progresso-total">
                    <h4>📊 AVANCE TOTAL DE PRODUCCIÓN</h4>
                    <div class="progress-bar-container"><div class="progress-bar-fill ${colorBarra}" style="width: ${porcentajeTotal}%"></div></div>
                    <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                        <span>${porcentajeTotal}% completado</span>
                        <span>Proceso actual: ${procesoActual}</span>
                        <span>Cumplimiento: ${porcentajeCumplimiento}%</span>
                    </div>
                </div>
                
                <h3 style="margin: 1rem 0 0.8rem; color: #ff6b8a;">📋 PROGRESO POR PROCESO</h3>
                <div class="procesos-cards">${procesosCardsHtml}</div>
                
                <div class="produccion-semanal">
                    <h4>📈 PRODUCCIÓN SEMANAL</h4>
                    <div class="produccion-stats">
                        <span>Meta: <strong>${this.metaPiezas}</strong> piezas</span>
                        <span>Completadas: <strong>${piezasCompletadas}</strong> piezas</span>
                        <span>Cumplimiento: <strong>${porcentajeCumplimiento}%</strong></span>
                    </div>
                    <div class="progress-bar-container"><div class="progress-bar-fill verde" style="width: ${porcentajeCumplimiento}%"></div></div>
                </div>
            </div>
        `;
        
        resultadosDiv.innerHTML = html;
        resultadosDiv.style.display = 'block';
    },
    
    obtenerProcesosCompletados: function(procesoActual) {
        const indexActual = this.procesos.indexOf(procesoActual);
        return this.procesos.slice(0, indexActual);
    },
    
    calcularPorcentajeAvance: function(procesoActual) {
        const indexActual = this.procesos.indexOf(procesoActual);
        return Math.round(((indexActual + 1) / this.procesos.length) * 100);
    },
    
    calcularPiezasCompletadas: function(procesoActual) {
        const indexActual = this.procesos.indexOf(procesoActual);
        let total = 0;
        for (let i = 0; i <= indexActual; i++) {
            total += this.piezasPorProceso[this.procesos[i]];
        }
        return total;
    },
    
    getPiezasRealizadasProceso: function(proceso, procesoActual) {
        const completados = this.obtenerProcesosCompletados(procesoActual);
        if (completados.includes(proceso)) {
            return this.piezasPorProceso[proceso];
        } else if (proceso === procesoActual) {
            return Math.round(this.piezasPorProceso[proceso] * 0.6);
        }
        return 0;
    },
    
    getIconoProceso: function(proceso) {
        const iconos = { 'DISEÑO': '🎨', 'PLOTTER': '🖨️', 'SUBLIMADO': '🔥', 'FLAT': '📏', 'LASER': '⚡', 'BORDADO': '🧵' };
        return iconos[proceso] || '⚙️';
    },
    
    getEstadoProceso: function(proceso, procesoActual, completados) {
        if (completados.includes(proceso)) return 'completado';
        if (proceso === procesoActual) return 'actual';
        return 'pendiente';
    },
    
    getTextoEstado: function(estado) {
        if (estado === 'completado') return '✅ Terminado';
        if (estado === 'actual') return '🔄 En proceso';
        return '⏳ Pendiente';
    },
    
    getResponsableProceso: function(proceso) {
        const responsables = { 'DISEÑO': 'Carlos M.', 'PLOTTER': 'Ana G.', 'SUBLIMADO': 'Luis R.', 'FLAT': 'Marta S.', 'LASER': 'Jorge P.', 'BORDADO': 'Elena T.' };
        return responsables[proceso] || 'Por asignar';
    },
    
    getFechaProceso: function(proceso) {
        const fechaBase = new Date(this.datosPO.fecha);
        const dias = { 'DISEÑO': 0, 'PLOTTER': 1, 'SUBLIMADO': 2, 'FLAT': 3, 'LASER': 4, 'BORDADO': 5 };
        const fecha = new Date(fechaBase);
        fecha.setDate(fecha.getDate() + (dias[proceso] || 0));
        return Utils.formatearFecha(fecha.toISOString().split('T')[0]);
    },
    
    mostrarLoader: function(mostrar) {
        const loader = document.getElementById('trackingLoader');
        if (loader) loader.style.display = mostrar ? 'block' : 'none';
    },
    
    mostrarError: function(mensaje) {
        const resultadosDiv = document.getElementById('trackingResultados');
        if (resultadosDiv) {
            resultadosDiv.innerHTML = '<div class="tracking-error">⚠️ ' + mensaje + '</div>';
            resultadosDiv.style.display = 'block';
        }
        setTimeout(() => {
            if (resultadosDiv && resultadosDiv.innerHTML.includes('tracking-error')) {
                resultadosDiv.style.display = 'none';
            }
        }, 3000);
    }
};

window.TrackingModule = TrackingModule;
