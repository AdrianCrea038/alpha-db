// ============================================================
// js/modules/tracking.js - Tracking de producción por PO
// Versión con: Avanzar, Regresar (con comentario), Selector Admin
// ============================================================

const TrackingModule = {
    poActual: null,
    datosPO: null,
    procesos: ['COLORIMETRÍA', 'PLOTTER', 'SUBLIMADO', 'FLAT', 'LASER', 'BORDADO'],
    metaPiezas: 500,
    semanaSeleccionada: null,
    
    metasPorProceso: {
        'COLORIMETRÍA': 500,
        'PLOTTER': 450,
        'SUBLIMADO': 400,
        'FLAT': 350,
        'LASER': 300,
        'BORDADO': 250
    },
    
    avancePorProceso: {
        'COLORIMETRÍA': 500,
        'PLOTTER': 380,
        'SUBLIMADO': 320,
        'FLAT': 280,
        'LASER': 220,
        'BORDADO': 180
    },
    
    piezasPorProceso: {
        'COLORIMETRÍA': 500,
        'PLOTTER': 450,
        'SUBLIMADO': 400,
        'FLAT': 350,
        'LASER': 300,
        'BORDADO': 250
    },
    
    modoEdicion: false,
    
    init: function() {
        console.log('📍 Módulo de Tracking iniciado');
        // Seleccionar automáticamente la última semana con datos
        const opciones = this.getSemanasConDatos();
        if (opciones.length > 0 && !this.semanaSeleccionada) {
            this.semanaSeleccionada = opciones[0]; // La más reciente
        } else if (!this.semanaSeleccionada) {
            this.semanaSeleccionada = this.getSemanaActual();
        }
        
        this.cargarMetasGuardadas();
        this.renderizar();
    },
    
    cargarMetasGuardadas: function() {
        const metasGuardadas = localStorage.getItem('alpha_db_metas_proceso');
        if (metasGuardadas) {
            try {
                const parsed = JSON.parse(metasGuardadas);
                this.metasPorProceso = { ...this.metasPorProceso, ...parsed.metas };
                this.avancePorProceso = { ...this.avancePorProceso, ...parsed.avance };
                for (const proceso of this.procesos) {
                    if (this.metasPorProceso[proceso]) {
                        this.piezasPorProceso[proceso] = this.metasPorProceso[proceso];
                    }
                }
            } catch(e) {}
        }
        console.log('Metas cargadas en Tracking:', this.metasPorProceso);
    },
    
    guardarMetas: function() {
        localStorage.setItem('alpha_db_metas_proceso', JSON.stringify({
            metas: this.metasPorProceso,
            avance: this.avancePorProceso
        }));
    },
    
    renderizar: function() {
        console.log('🖌️ Renderizando Tracking...');
        const container = document.querySelector('.container');
        if (!container) return;
        
        // Limpiar rastro de paneles viejos
        const panels = document.querySelectorAll('.tracking-panel');
        panels.forEach(p => p.remove());
        
        const panelHTML = `
            <div id="trackingPanel" class="tracking-panel">
                <div id="indicadoresProceso" class="indicadores-proceso-section">
                    <div class="indicadores-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; background: #161B22; padding: 1rem; border-radius: 8px; border: 1px solid rgba(0,212,255,0.2);">
                        <h3 style="margin: 0; font-size: 0.9rem; color: #00D4FF;">📊 CUMPLIMIENTO POR PROCESO</h3>
                        
                        <div class="filtro-semana-tracking" style="display: flex; align-items: center; gap: 0.8rem;">
                            <label style="font-size: 0.7rem; color: #8B949E; font-weight: 800;">VER SEMANA:</label>
                            <select id="selectSemanaTracking" class="select-bonito" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; background: #0D1117; border-color: #00D4FF; color: #00D4FF; min-width: 120px;">
                                ${this.obtenerOpcionesSemanas()}
                            </select>
                        </div>
                    </div>
                    <div id="indicadoresGrid" class="indicadores-grid">
                        ${this.renderizarIndicadores()}
                    </div>
                </div>
                
                <div class="tracking-buscador" style="margin-top: 1rem; margin-bottom: 1rem;">
                    <div class="buscador-input-group" style="display: flex; gap: 0.5rem; max-width: 600px; margin: 0 auto;">
                        <input type="text" id="trackingPoInput" placeholder="PO..." class="input-bonito" style="padding: 0.5rem 0.8rem; font-size: 0.85rem;">
                        <button id="trackingBuscarBtn" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.8rem;">🔍 BUSCAR</button>
                    </div>
                </div>
                
                <div id="trackingResultados" style="display: none;"></div>
            </div>
        `;
        
        const filtersSection = document.querySelector('.filters-section');
        if (filtersSection) {
            filtersSection.insertAdjacentHTML('beforebegin', panelHTML);
        } else {
            container.insertAdjacentHTML('afterbegin', panelHTML);
        }
        
        this.agregarEstilos();
        this.configurarEventos();
    },
    
    renderizarIndicadores: function() {
        const semanaActual = String(this.getSemanaVisualizada());
        
        // 1. CARGA DE DATOS (Forzada para que el filtro funcione siempre)
        let ordenesImportadas = (window.OrderImportModule && window.OrderImportModule.ordenes) || [];
        if (ordenesImportadas.length === 0) {
            const guardadas = localStorage.getItem('alpha_db_ordenes_importadas');
            if (guardadas) ordenesImportadas = JSON.parse(guardadas);
        }
        
        const registrosSemana = (window.AppState && window.AppState.registros) || [];
        
        // 2. LIMPIEZA DE NÚMEROS (Estricta)
        const parseNum = (val) => {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            const limpio = String(val).replace(/[^0-9]/g, '');
            return parseInt(limpio) || 0;
        };

        const getPiezas = (obj) => {
            if (!obj) return 0;
            // Prioridad a 'meka' como pediste
            return parseNum(obj.meka) || parseNum(obj.make) || parseNum(obj.meta) || parseNum(obj.piezas) || parseNum(obj.qty) || parseNum(obj.pcz) || 0;
        };

        // 3. FILTRADO POR SEMANA (El filtro manda)
        const actualLower = semanaActual.trim().toLowerCase();
        
        const planSemana = ordenesImportadas.filter(o => {
            const s = String(o.semana || '').trim().toLowerCase();
            return s === actualLower || s.includes(actualLower) || actualLower.includes(s);
        });

        const registrosEnSemana = registrosSemana.filter(r => {
            const s = String(r.semana || '').trim().toLowerCase();
            return s === actualLower || s.includes(actualLower) || actualLower.includes(s);
        });

        // 4. META UNIFICADA (Solo del Excel, sin inventos)
        let metaGlobal = planSemana.reduce((sum, o) => sum + getPiezas(o), 0);

        if (metaGlobal === 0 && registrosEnSemana.length === 0) {
            return `
                <div class="no-data-msg" style="text-align: center; padding: 2.5rem; color: #8B949E; border: 1px dashed #30363D; border-radius: 12px;">
                    <p style="margin: 0; font-weight: 800; color: #F85149;">⚠️ SIN PLAN EN EXCEL (SEMANA ${semanaActual})</p>
                </div>
            `;
        }

        let html = '';
        
        for (let i = 0; i < this.procesos.length; i++) {
            const proceso = this.procesos[i];
            
            // Sumar piezas solo de registros reales
            const piezasRealizadas = registrosEnSemana.reduce((sum, r) => {
                let procesoReg = r.proceso === 'DISEÑO' ? 'COLORIMETRÍA' : (r.proceso || 'COLORIMETRÍA');
                const idxActual = this.procesos.indexOf(procesoReg);
                
                if (idxActual >= i) {
                    let p = getPiezas(r);
                    // BÚSQUEDA INTELIGENTE: Si el registro no tiene piezas, buscamos en el Excel original
                    if (p === 0) {
                        const ord = planSemana.find(o => o.po_item === r.po || o.po === r.po);
                        p = ord ? getPiezas(ord) : 0; // Solo lo que diga el Excel, nada de inventos
                    }
                    return sum + p;
                }
                return sum;
            }, 0);

            const porcentaje = metaGlobal > 0 ? Math.min(100, Math.round((piezasRealizadas / metaGlobal) * 100)) : 0;
            
            let color = '#FF4444'; // Rojo (<50%)
            if (porcentaje >= 85) color = '#00FF88'; // Verde (>=85%)
            else if (porcentaje >= 50) color = '#F59E0B'; // Naranja (>=50%)
            
            html += `
                <div class="indicador-card" data-proceso="${proceso}" style="display: flex; flex-direction: column; justify-content: space-between; min-height: 220px; padding: 1.25rem;">
                    <!-- Nivel 1: Encabezado y Meta -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 1.2rem;">${this.getIconoProceso(proceso)}</span>
                            <span style="font-size: 0.85rem; font-weight: 900; color: #00D4FF; letter-spacing: 0.5px;">${proceso}</span>
                        </div>
                        <div style="text-align: right; background: rgba(255,255,255,0.03); padding: 5px 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="font-size: 0.6rem; color: #8B949E; font-weight: 800; text-transform: uppercase; margin-bottom: 2px;">META</div>
                            <div style="font-size: 1rem; color: #FFFFFF; font-weight: 900;">${metaGlobal.toLocaleString()}</div>
                        </div>
                    </div>

                    <!-- Nivel 2: Progreso Principal -->
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <div style="font-size: 3rem; font-weight: 950; color: ${color}; line-height: 1; letter-spacing: -1.5px; text-shadow: 0 0 20px ${color}22;">
                            ${piezasRealizadas.toLocaleString()}
                        </div>
                        <div style="font-size: 0.65rem; color: #8B949E; font-weight: 700; text-transform: uppercase; margin-top: 8px; letter-spacing: 1px;">Piezas Realizadas</div>
                    </div>

                    <!-- Nivel 3: Barra y Porcentaje -->
                    <div style="margin-top: 1rem;">
                        <div style="background: rgba(255,255,255,0.05); height: 6px; border-radius: 3px; margin-bottom: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.03);">
                            <div style="width: ${porcentaje}%; background: ${color}; height: 100%; border-radius: 3px; transition: width 1s ease-out; box-shadow: 0 0 12px ${color}55;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: baseline; gap: 4px;">
                                <span style="color: ${color}; font-size: 1.6rem; font-weight: 950;">${porcentaje}</span>
                                <span style="color: ${color}; font-size: 0.8rem; font-weight: 800;">%</span>
                            </div>
                            <span style="color: ${color}; font-size: 0.6rem; font-weight: 900; text-transform: uppercase; padding: 4px 10px; background: ${color}15; border-radius: 4px; border: 1px solid ${color}25; letter-spacing: 0.5px;">${this.getEstadoCumplimiento(porcentaje)}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        return html;
    },
    
    getEstadoCumplimiento: function(porcentaje) {
        if (porcentaje >= 85) return '🚀 Excelente';
        if (porcentaje >= 50) return '🚧 En progreso';
        return '📉 Por debajo';
    },
    
    getSemanaActual: function() {
        if (window.Utils) return Utils.obtenerSemana(new Date());
        return '?';
    },

    getSemanaVisualizada: function() {
        return this.semanaSeleccionada || this.getSemanaActual();
    },

    getSemanasConDatos: function() {
        const semanas = new Set();
        const ordenes = (window.OrderImportModule && window.OrderImportModule.ordenes) || [];
        ordenes.forEach(o => { if(o.semana) semanas.add(String(o.semana)); });
        const registros = (window.AppState && window.AppState.registros) || [];
        registros.forEach(r => { if(r.semana) semanas.add(String(r.semana)); });
        return Array.from(semanas).sort((a, b) => parseInt(b) - parseInt(a));
    },

    obtenerOpcionesSemanas: function() {
        const sorted = this.getSemanasConDatos();
        const actual = String(this.getSemanaActual());
        
        // Si no hay ninguna semana con datos, mostrar al menos la actual
        if (sorted.length === 0) {
            sorted.push(actual);
        }
        
        const sel = String(this.getSemanaVisualizada());
        
        return sorted.map(s => `
            <option value="${s}" ${s === sel ? 'selected' : ''}>
                Semana ${s} ${s === actual ? '(Actual)' : ''}
            </option>
        `).join('');
    },
    
    getIconoProceso: function(proceso) {
        const iconos = { 'COLORIMETRÍA': '🎨', 'PLOTTER': '🖨️', 'SUBLIMADO': '🔥', 'FLAT': '📏', 'LASER': '⚡', 'BORDADO': '🧵' };
        return iconos[proceso] || '⚙️';
    },

    renderizarPlanSemanal: function() {
        const semanaActual = this.getSemanaVisualizada();
        const ordenesImportadas = (window.OrderImportModule && window.OrderImportModule.ordenes) || [];
        
        const planSemana = ordenesImportadas.filter(o => String(o.semana) === String(semanaActual));
        
        if (planSemana.length === 0) {
            return ''; // No mostrar el banner si no hay plan (el mensaje estará en indicadores)
        }
        
        const totalPiezasPlan = planSemana.reduce((sum, o) => sum + (o.make || 0), 0);
        
        // Ver cuántas de estas POs ya tienen registro
        const registrosSemana = (window.AppState && window.AppState.registros) || [];
        const registrosEnPlan = registrosSemana.filter(r => String(r.semana) === String(semanaActual));
        
        const poConRegistro = new Set(registrosEnPlan.map(r => r.po));
        const completadasEnPlan = planSemana.filter(o => poConRegistro.has(o.po_item));
        
        const porcentajePlan = totalPiezasPlan > 0 ? Math.round((completadasEnPlan.length / planSemana.length) * 100) : 0;

        return `
            <div class="plan-card" style="background: linear-gradient(135deg, #161B22 0%, #0D1117 100%); border: 1px solid rgba(0,212,255,0.3); border-radius: 12px; padding: 1.5rem; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -20px; right: -20px; font-size: 5rem; opacity: 0.05; color: #00D4FF;">📅</div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="margin: 0; color: #00D4FF; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
                            📋 PLAN SEMANAL (SEM ${semanaActual})
                        </h3>
                        <p style="margin: 5px 0 0; color: #8B949E; font-size: 0.8rem;">Basado en órdenes importadas de Excel</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; font-size: 1.5rem; font-weight: 900; color: #00D4FF;">${porcentajePlan}%</span>
                        <span style="font-size: 0.65rem; color: #8B949E; text-transform: uppercase;">Avance de Carga</span>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem;">
                    <div style="background: rgba(0,212,255,0.05); padding: 1rem; border-radius: 8px; border: 1px solid rgba(0,212,255,0.1); text-align: center;">
                        <div style="font-size: 0.7rem; color: #8B949E; margin-bottom: 0.3rem;">📦 ÓRDENES EN PLAN</div>
                        <div style="font-size: 1.2rem; font-weight: 800; color: white;">${planSemana.length}</div>
                    </div>
                    <div style="background: rgba(0,255,136,0.05); padding: 1rem; border-radius: 8px; border: 1px solid rgba(0,255,136,0.1); text-align: center;">
                        <div style="font-size: 0.7rem; color: #8B949E; margin-bottom: 0.3rem;">🎯 META SEMANAL</div>
                        <div style="font-size: 1.2rem; font-weight: 800; color: #00FF88;">${totalPiezasPlan.toLocaleString()} <span style="font-size: 0.7rem;">piezas</span></div>
                    </div>
                    <div style="background: rgba(245,158,11,0.05); padding: 1rem; border-radius: 8px; border: 1px solid rgba(245,158,11,0.1); text-align: center;">
                        <div style="font-size: 0.7rem; color: #8B949E; margin-bottom: 0.3rem;">⏳ POR REGISTRAR</div>
                        <div style="font-size: 1.2rem; font-weight: 800; color: #F59E0B;">${planSemana.length - completadasEnPlan.length}</div>
                    </div>
                </div>

                <div class="progreso-barra-indicador" style="margin-top: 1.5rem; height: 6px; background: #21262D;">
                    <div class="progreso-fill-indicador" style="width: ${porcentajePlan}%; background: linear-gradient(90deg, #00D4FF, #00FF88); height: 100%;"></div>
                </div>
                
                <div style="margin-top: 0.8rem; text-align: center;">
                    <button onclick="Sidebar.mostrarOrdenes()" style="background: transparent; border: 1px solid #00D4FF; color: #00D4FF; padding: 0.3rem 1rem; border-radius: 20px; font-size: 0.7rem; cursor: pointer; transition: all 0.3s;">
                        🔍 VER DETALLE DEL PLAN
                    </button>
                </div>
            </div>
        `;
    },
    
    agregarEstilos: function() {
        if (document.getElementById('trackingStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'trackingStyles';
        styles.textContent = `
            .tracking-panel {
                background: #161B22;
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                border: 1px solid rgba(0,212,255,0.25);
            }
            .buscador-input-group {
                display: flex;
                gap: 0.8rem;
                flex-wrap: wrap;
            }
            .buscador-input-group input {
                flex: 1;
                min-width: 250px;
                background: #0D1117;
                border: 1px solid #00D4FF;
                border-radius: 8px;
                padding: 0.7rem 1rem;
                color: white;
            }
            .btn-primary {
                background: linear-gradient(90deg, #00D4FF, #0099CC);
                border: none;
                padding: 0.7rem 1.5rem;
                border-radius: 8px;
                color: white;
                font-weight: 700;
                cursor: pointer;
            }
            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,212,255,0.3);
            }
            .scanner-container {
                margin-top: 1rem;
                padding: 1rem;
                background: rgba(0,0,0,0.5);
                border-radius: 8px;
                text-align: center;
            }
            .scanner-container video {
                width: 100%;
                max-width: 400px;
                border-radius: 8px;
                border: 2px solid #00D4FF;
            }
            .tracking-loader {
                text-align: center;
                padding: 2rem;
            }
            .tracking-loader .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(0,212,255,0.3);
                border-top-color: #00D4FF;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .indicadores-proceso-section {
                margin-bottom: 1.5rem;
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
                color: #00D4FF;
            }
            .btn-editar-metas {
                background: #21262D;
                border: 1px solid #00D4FF;
                padding: 0.4rem 1rem;
                border-radius: 6px;
                color: #00D4FF;
                cursor: pointer;
                font-size: 0.7rem;
            }
            .indicadores-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1rem;
            }
            .indicador-card {
                background: #0D1117;
                border-radius: 8px;
                padding: 1rem;
                border-left: 3px solid #00D4FF;
            }
            .indicador-header {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.8rem;
            }
            .indicador-nombre {
                font-weight: 700;
                color: #00D4FF;
            }
            .indicador-meta {
                display: flex;
                justify-content: space-between;
                font-size: 0.7rem;
                margin-bottom: 0.5rem;
                color: #8B949E;
            }
            .progreso-barra-indicador {
                background: #21262D;
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
            .indicador-porcentaje {
                display: flex;
                justify-content: space-between;
                margin-top: 0.5rem;
                font-size: 0.75rem;
            }
            .porcentaje-valor {
                font-weight: 700;
                color: #00D4FF;
            }
            .indicador-semana {
                margin-top: 0.5rem;
                font-size: 0.65rem;
                color: #8B949E;
                text-align: center;
            }
            .indicadores-footer {
                margin-top: 1rem;
                text-align: center;
                font-size: 0.65rem;
                color: #8B949E;
            }
            
            .dashboard-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            .dashboard-card {
                background: #0D1117;
                border-radius: 8px;
                padding: 1rem;
                text-align: center;
                border-left: 3px solid #00D4FF;
            }
            .dashboard-card h4 {
                font-size: 0.7rem;
                color: #00D4FF;
                margin-bottom: 0.5rem;
            }
            .dashboard-card .valor {
                font-size: 1.4rem;
                font-weight: 700;
                color: white;
            }
            .dashboard-card .unidad {
                font-size: 0.7rem;
                color: #8B949E;
            }
            
            .progresso-total, .produccion-semanal {
                background: #0D1117;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1.5rem;
            }
            .progresso-total h4, .produccion-semanal h4 {
                font-size: 0.8rem;
                color: #00D4FF;
                margin-bottom: 0.5rem;
            }
            .progress-bar-container {
                background: #21262D;
                border-radius: 10px;
                height: 8px;
                overflow: hidden;
            }
            .progress-bar-fill {
                height: 100%;
                width: 0%;
                border-radius: 10px;
                transition: width 0.5s ease;
            }
            
            .procesos-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            .proceso-card {
                background: #0D1117;
                border-radius: 8px;
                padding: 1rem;
                position: relative;
            }
            .proceso-card.completado {
                border-left: 3px solid #00FF88;
            }
            .proceso-card.actual {
                border-left: 3px solid #00D4FF;
                background: rgba(0,212,255,0.1);
            }
            .proceso-card.pendiente {
                border-left: 3px solid #F59E0B;
            }
            .proceso-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.8rem;
                flex-wrap: wrap;
                gap: 0.5rem;
            }
            .proceso-nombre {
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .proceso-estado {
                font-size: 0.7rem;
                padding: 0.2rem 0.6rem;
                border-radius: 20px;
            }
            .proceso-estado.completado {
                background: rgba(0,255,136,0.2);
                color: #00FF88;
            }
            .proceso-estado.actual {
                background: rgba(0,212,255,0.2);
                color: #00D4FF;
            }
            .proceso-estado.pendiente {
                background: rgba(245,158,11,0.2);
                color: #F59E0B;
            }
            .proceso-stats {
                display: flex;
                justify-content: space-between;
                font-size: 0.75rem;
                margin-bottom: 0.5rem;
            }
            .progreso-barra {
                background: #21262D;
                border-radius: 10px;
                height: 8px;
                overflow: hidden;
                margin: 0.5rem 0;
            }
            .progreso-fill {
                height: 100%;
                width: 0%;
                border-radius: 10px;
                transition: width 0.5s ease;
            }
            .botones-accion {
                display: flex;
                gap: 0.5rem;
                margin-top: 0.5rem;
            }
            .btn-avanzar {
                background: linear-gradient(90deg, #00D4FF, #0099CC);
                border: none;
                padding: 0.4rem 1rem;
                border-radius: 6px;
                color: #0D1117;
                font-weight: 700;
                cursor: pointer;
                font-size: 0.7rem;
                flex: 1;
            }
            .btn-regresar {
                background: linear-gradient(90deg, #F59E0B, #D97706);
                border: none;
                padding: 0.4rem 1rem;
                border-radius: 6px;
                color: #0D1117;
                font-weight: 700;
                cursor: pointer;
                font-size: 0.7rem;
                flex: 1;
            }
            .btn-avanzar:hover, .btn-regresar:hover {
                transform: translateY(-2px);
            }
            .selector-proceso {
                background: #21262D;
                border: 1px solid #A855F7;
                border-radius: 6px;
                padding: 0.3rem;
                color: white;
                font-size: 0.7rem;
                width: 100%;
                margin-top: 0.5rem;
                cursor: pointer;
            }
            .selector-proceso:focus {
                outline: none;
                border-color: #A855F7;
            }
            .admin-badge {
                background: rgba(168, 85, 247, 0.3);
                color: #A855F7;
                font-size: 0.6rem;
                padding: 0.2rem 0.4rem;
                border-radius: 4px;
                margin-left: 0.5rem;
            }
            .produccion-stats {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
                font-size: 0.8rem;
                flex-wrap: wrap;
                gap: 0.5rem;
            }
            .tracking-error {
                background: rgba(255,68,68,0.1);
                border-left: 3px solid #FF4444;
                padding: 1rem;
                border-radius: 8px;
                margin-top: 1rem;
                text-align: center;
                color: #FF4444;
            }
            
            @media (max-width: 768px) {
                .indicadores-grid, .procesos-cards {
                    grid-template-columns: 1fr;
                }
                .dashboard-cards {
                    grid-template-columns: repeat(2, 1fr);
                }
                .botones-accion {
                    flex-direction: column;
                }
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
        document.getElementById('editarMetasBtn')?.addEventListener('click', () => {
            window.location.href = 'admin.html';
        });

        document.getElementById('selectSemanaTracking')?.addEventListener('change', (e) => {
            this.semanaSeleccionada = e.target.value;
            console.log('📅 Cambiando vista de Tracking a semana:', this.semanaSeleccionada);
            this.renderizar();
        });
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
            const registroEncontrado = AppState.registros.find(r => {
                if (!r.po) return false;
                const poVal = r.po.toUpperCase().trim();
                const inputVal = po.toUpperCase().trim();
                return poVal === inputVal || 
                       poVal === 'PO-' + inputVal || 
                       'PO-' + poVal === inputVal;
            });
            
            if (registroEncontrado) {
                this.datosPO = registroEncontrado;
                this.poActual = po;
                const indicadores = document.getElementById('indicadoresProceso');
                if (indicadores) indicadores.style.display = 'none';
                this.mostrarResultados();
            } else {
                this.mostrarError('No se encontró la PO: ' + po);
                document.getElementById('trackingResultados').style.display = 'none';
                const indicadores = document.getElementById('indicadoresProceso');
                if (indicadores) indicadores.style.display = 'block';
            }
            this.mostrarLoader(false);
        }, 500);
    },
    
    cerrarTracking: function() {
        this.poActual = null;
        this.datosPO = null;
        const resultadosDiv = document.getElementById('trackingResultados');
        if (resultadosDiv) {
            resultadosDiv.style.display = 'none';
            resultadosDiv.innerHTML = '';
        }
        const indicadores = document.getElementById('indicadoresProceso');
        if (indicadores) indicadores.style.display = 'block';
        const poInput = document.getElementById('trackingPoInput');
        if (poInput) poInput.value = '';
        if (window.Notifications) Notifications.info('🔄 Tracking cerrado');
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
                            console.log('📷 QR detectado:', code.data);
                            scanning = false;
                            if (animationId) cancelAnimationFrame(animationId);
                            this.cerrarScanner();
                            
                            let poEncontrado = '';
                            const matchPO = code.data.match(/PO[:\s]*([A-Z0-9\-]+)/i);
                            if (matchPO) {
                                poEncontrado = matchPO[1];
                            } else {
                                poEncontrado = code.data.trim();
                            }
                            
                            const poInput = document.getElementById('trackingPoInput');
                            if (poInput) {
                                poInput.value = poEncontrado;
                            }
                            
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
                background: rgba(0,255,136,0.1);
                border-left: 3px solid #00FF88;
                padding: 0.8rem;
                margin: 0.5rem 0;
                border-radius: 6px;
                text-align: center;
                color: #00FF88;
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
        
        const procesoActual = this.datosPO.proceso === 'DISEÑO' ? 'COLORIMETRÍA' : (this.datosPO.proceso || 'COLORIMETRÍA');
        const indiceActual = this.procesos.indexOf(procesoActual);
        const completados = this.procesos.slice(0, indiceActual);
        const pendientes = this.procesos.slice(indiceActual + 1);
        const porcentajeTotal = Math.round(((indiceActual + 1) / this.procesos.length) * 100);
        
        let colorBarra = '#FF4444';
        if (porcentajeTotal >= 80) colorBarra = '#00FF88';
        else if (porcentajeTotal >= 40) colorBarra = '#F59E0B';
        
        const esAdmin = window.esAdmin && window.esAdmin();
        const puedeAvanzar = window.puedeAvanzarProceso && window.puedeAvanzarProceso(procesoActual);
        const puedeRegresar = window.puedeAvanzarProceso && window.puedeAvanzarProceso(procesoActual) && indiceActual > 0;
        
        let procesosCardsHtml = '';
        for (let i = 0; i < this.procesos.length; i++) {
            const proceso = this.procesos[i];
            let estado = 'pendiente';
            if (i < indiceActual) estado = 'completado';
            else if (i === indiceActual) estado = 'actual';
            
            const piezasProceso = this.piezasPorProceso[proceso] || 0;
            let piezasRealizadas = 0;
            if (estado === 'completado') piezasRealizadas = piezasProceso;
            else if (estado === 'actual') piezasRealizadas = Math.round(piezasProceso * 0.6);
            
            const porcentajeProceso = piezasProceso > 0 ? Math.min(100, Math.round((piezasRealizadas / piezasProceso) * 100)) : 0;
            let colorProgreso = '#FF4444';
            if (porcentajeProceso >= 80) colorProgreso = '#00FF88';
            else if (porcentajeProceso >= 40) colorProgreso = '#F59E0B';
            
            const mostrarBotonAvanzar = (estado === 'actual' && puedeAvanzar && i < this.procesos.length - 1);
            const mostrarBotonRegresar = (estado === 'actual' && puedeRegresar && i > 0);
            
            procesosCardsHtml += `
                <div class="proceso-card ${estado}">
                    <div class="proceso-header">
                        <div class="proceso-nombre">
                            ${this.getIconoProceso(proceso)} ${proceso}
                            ${esAdmin ? `<span class="admin-badge">👑 Admin</span>` : ''}
                        </div>
                        <div class="proceso-estado ${estado}">${estado === 'completado' ? '✅ Terminado' : estado === 'actual' ? '🔄 En proceso' : '⏳ Pendiente'}</div>
                    </div>
                    <div class="proceso-stats">
                        <span>📦 Piezas: ${piezasRealizadas} / ${piezasProceso}</span>
                        <span>📊 ${porcentajeProceso}%</span>
                    </div>
                    <div class="progreso-barra">
                        <div class="progreso-fill" style="width: ${porcentajeProceso}%; background: ${colorProgreso};"></div>
                    </div>
                    <div class="botones-accion">
                        ${mostrarBotonRegresar ? `<button class="btn-regresar" onclick="TrackingModule.regresarProceso('${this.datosPO.id}', '${proceso}')">◀️ REGRESAR</button>` : ''}
                        ${mostrarBotonAvanzar ? `<button class="btn-avanzar" onclick="TrackingModule.avanzarProceso('${this.datosPO.id}', '${proceso}')">▶️ AVANZAR</button>` : ''}
                    </div>
                    ${esAdmin ? `
                        <select class="selector-proceso" onchange="TrackingModule.saltarAProceso('${this.datosPO.id}', this.value)">
                            <option value="">🔀 Saltar a proceso...</option>
                            ${this.procesos.map((p, idx) => `<option value="${p}" ${p === procesoActual ? 'selected' : ''} ${idx <= i ? '' : ''}>${this.getIconoProceso(p)} ${p} ${idx < i ? '✅' : idx === i ? '🔄' : '⏳'}</option>`).join('')}
                        </select>
                    ` : ''}
                </div>
            `;
        }
        
        const metaPO = this.datosPO.meta || this.metaPiezas;
        const piezasCompletadas = completados.reduce((sum, p) => sum + (this.piezasPorProceso[p] || 0), 0) + ((this.piezasPorProceso[procesoActual] || 0) * 0.6);
        const porcentajeCumplimiento = metaPO > 0 ? Math.min(100, Math.round((piezasCompletadas / metaPO) * 100)) : 0;
        
        const html = `
            <div class="tracking-dashboard">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="color: #00D4FF; margin: 0; font-size: 1rem;">📊 DASHBOARD DE PRODUCCIÓN</h3>
                    <button onclick="TrackingModule.cerrarTracking()" class="btn-secondary" style="background: #21262D; border: 1px solid #FF4444; color: #FF4444; padding: 0.3rem 0.8rem; font-size: 0.7rem; border-radius: 6px; cursor: pointer;">✕ CERRAR VISTA</button>
                </div>
                <div class="dashboard-cards">
                    <div class="dashboard-card"><h4>PO</h4><div class="valor">${this.datosPO.po}</div></div>
                    <div class="dashboard-card"><h4>ESTILO</h4><div class="valor">${this.datosPO.estilo || '-'}</div></div>
                    <div class="dashboard-card"><h4>TELAS</h4><div class="valor" style="font-size:0.9rem;">${this.datosPO.telas ? this.datosPO.telas.length : 0}</div><div class="unidad">telas</div></div>
                    <div class="dashboard-card"><h4>VERSIÓN</h4><div class="valor">v${this.datosPO.version || 1}</div></div>
                    <div class="dashboard-card"><h4>META</h4><div class="valor">${metaPO}</div><div class="unidad">piezas (Auto)</div></div>
                    <div class="dashboard-card"><h4>COMPLETADAS</h4><div class="valor">${Math.round(piezasCompletadas)}</div><div class="unidad">piezas (${porcentajeCumplimiento}%)</div></div>
                </div>
                
                <div class="progresso-total">
                    <h4>📊 AVANCE TOTAL DE PRODUCCIÓN</h4>
                    <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${porcentajeTotal}%; background: ${colorBarra};"></div></div>
                    <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                        <span>${porcentajeTotal}% completado</span>
                        <span>Proceso actual: ${procesoActual}</span>
                        <span>Cumplimiento: ${porcentajeCumplimiento}%</span>
                    </div>
                </div>
                
                <h3 style="margin: 1rem 0 0.8rem; color: #00D4FF;">📋 PROGRESO POR PROCESO</h3>
                <div class="procesos-cards">${procesosCardsHtml}</div>
                
                <div class="produccion-semanal">
                    <h4>📈 PRODUCCIÓN SEMANAL</h4>
                    <div class="produccion-stats">
                        <span>Meta: <strong>${this.metaPiezas}</strong> piezas</span>
                        <span>Completadas: <strong>${Math.round(piezasCompletadas)}</strong> piezas</span>
                        <span>Cumplimiento: <strong>${porcentajeCumplimiento}%</strong></span>
                    </div>
                    <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${porcentajeCumplimiento}%; background: #00FF88;"></div></div>
                </div>
            </div>
        `;
        
        resultadosDiv.innerHTML = html;
        resultadosDiv.style.display = 'block';
    },
    
    // ============================================================
    // AVANZAR PROCESO
    // ============================================================
    
    avanzarProceso: function(registroId, procesoActual) {
        console.log('Avanzando proceso:', { registroId, procesoActual });
        
        if (!window.puedeAvanzarProceso || !window.puedeAvanzarProceso(procesoActual)) {
            Notifications.error('❌ No tiene permisos para avanzar este proceso');
            return;
        }
        
        const registro = AppState.getRegistroById(registroId);
        if (!registro) {
            Notifications.error('❌ Registro no encontrado');
            return;
        }
        
        const indiceActual = this.procesos.indexOf(procesoActual);
        if (indiceActual === -1) {
            Notifications.error('❌ Proceso no válido');
            return;
        }
        
        if (indiceActual === this.procesos.length - 1) {
            Notifications.warning('⚠️ Este es el último proceso. La producción está completada.');
            return;
        }
        
        const siguienteProceso = this.procesos[indiceActual + 1];
        const usuario = window.getUsuarioActual();
        const nombreUsuario = usuario ? usuario.username : 'Desconocido';
        
        if (!confirm(`¿Confirmar avance de ${procesoActual} a ${siguienteProceso}?\n\nUsuario: ${nombreUsuario}`)) {
            return;
        }
        
        this.ejecutarCambioProceso(registroId, siguienteProceso, `Avance automático de ${procesoActual} a ${siguienteProceso} por ${nombreUsuario}`);
    },
    
    // ============================================================
    // REGRESAR PROCESO (CON COMENTARIO OBLIGATORIO)
    // ============================================================
    
    regresarProceso: function(registroId, procesoActual) {
        console.log('Regresando proceso:', { registroId, procesoActual });
        
        if (!window.puedeAvanzarProceso || !window.puedeAvanzarProceso(procesoActual)) {
            Notifications.error('❌ No tiene permisos para regresar este proceso');
            return;
        }
        
        const registro = AppState.getRegistroById(registroId);
        if (!registro) {
            Notifications.error('❌ Registro no encontrado');
            return;
        }
        
        const indiceActual = this.procesos.indexOf(procesoActual);
        if (indiceActual === -1) {
            Notifications.error('❌ Proceso no válido');
            return;
        }
        
        if (indiceActual === 0) {
            Notifications.warning('⚠️ Este es el primer proceso. No se puede regresar más.');
            return;
        }
        
        const procesoAnterior = this.procesos[indiceActual - 1];
        const usuario = window.getUsuarioActual();
        const nombreUsuario = usuario ? usuario.username : 'Desconocido';
        
        // COMENTARIO OBLIGATORIO
        const comentario = prompt('📝 Ingrese el motivo del regreso (obligatorio):', '');
        if (!comentario || comentario.trim() === '') {
            Notifications.warning('⚠️ Es obligatorio ingresar un comentario para regresar el proceso');
            return;
        }
        
        if (!confirm(`¿Confirmar regreso de ${procesoActual} a ${procesoAnterior}?\n\nUsuario: ${nombreUsuario}\nMotivo: ${comentario}`)) {
            return;
        }
        
        // Guardar comentario en observación del registro
        const observacionActual = registro.observacion || '';
        const nuevaObservacion = `[REGRESO: ${new Date().toLocaleString()}] ${procesoActual} → ${procesoAnterior} por ${nombreUsuario}. Motivo: ${comentario}`;
        const observacionFinal = observacionActual ? observacionActual + '\n' + nuevaObservacion : nuevaObservacion;
        
        this.ejecutarCambioProceso(registroId, procesoAnterior, observacionFinal);
        Notifications.info(`📝 Comentario registrado: ${comentario.substring(0, 50)}...`);
    },
    
    // ============================================================
    // SALTAR A CUALQUIER PROCESO (SOLO ADMIN)
    // ============================================================
    
    saltarAProceso: function(registroId, procesoDestino) {
        if (!procesoDestino) return;
        
        const esAdmin = window.esAdmin && window.esAdmin();
        if (!esAdmin) {
            Notifications.error('❌ Solo administradores pueden saltar directamente a un proceso');
            return;
        }
        
        const registro = AppState.getRegistroById(registroId);
        if (!registro) {
            Notifications.error('❌ Registro no encontrado');
            return;
        }
        
        const procesoActual = registro.proceso;
        const usuario = window.getUsuarioActual();
        const nombreUsuario = usuario ? usuario.username : 'Desconocido';
        
        const comentario = prompt(`📝 Saltar de ${procesoActual} a ${procesoDestino}\n\nIngrese el motivo del salto (obligatorio):`, '');
        if (!comentario || comentario.trim() === '') {
            Notifications.warning('⚠️ Es obligatorio ingresar un comentario para saltar de proceso');
            return;
        }
        
        if (!confirm(`¿Confirmar salto de ${procesoActual} a ${procesoDestino}?\n\nUsuario: ${nombreUsuario}\nMotivo: ${comentario}`)) {
            return;
        }
        
        const observacionActual = registro.observacion || '';
        const nuevaObservacion = `[SALTO: ${new Date().toLocaleString()}] ${procesoActual} → ${procesoDestino} por ${nombreUsuario}. Motivo: ${comentario}`;
        const observacionFinal = observacionActual ? observacionActual + '\n' + nuevaObservacion : nuevaObservacion;
        
        this.ejecutarCambioProceso(registroId, procesoDestino, observacionFinal);
        Notifications.success(`✅ Salto completado: ${procesoActual} → ${procesoDestino}`);
    },
    
    // ============================================================
    // EJECUTAR CAMBIO DE PROCESO (COMÚN PARA TODOS)
    // ============================================================
    
    ejecutarCambioProceso: function(registroId, nuevoProceso, observacion) {
        const registro = AppState.getRegistroById(registroId);
        if (!registro) return;
        
        const registroActualizado = { 
            ...registro, 
            proceso: nuevoProceso, 
            observacion: observacion,
            actualizado: new Date().toISOString() 
        };
        
        AppState.updateRegistro(registroId, registroActualizado);
        this.guardarTrackingLocal();
        
        if (window.SupabaseClient && window.SupabaseClient.client) {
            window.SupabaseClient.guardarRegistro(registroActualizado);
        }
        
        this.datosPO = registroActualizado;
        this.mostrarResultados();
        
        if (window.TableUI && window.TableUI.actualizar) {
            window.TableUI.actualizar();
        }
    },
    
    guardarTrackingLocal: function() {
        if (!AppState) return;
        try {
            const registrosParaGuardar = AppState.registros.map(reg => {
                const { historial, ...regSinHistorial } = reg;
                return regSinHistorial;
            });
            const dataToSave = {
                registros: registrosParaGuardar,
                historial: AppState.historialEdiciones
            };
            localStorage.setItem('alpha_db_registros_v10', JSON.stringify(dataToSave));
        } catch(error) {
            console.error('Error al guardar tracking:', error);
        }
    },
    
    mostrarLoader: function(mostrar) {
        const loader = document.getElementById('trackingLoader');
        if (loader) loader.style.display = mostrar ? 'block' : 'none';
    },
    
    mostrarError: function(mensaje) {
        const resultadosDiv = document.getElementById('trackingResultados');
        if (resultadosDiv) {
            resultadosDiv.innerHTML = `<div class="tracking-error">⚠️ ${mensaje}</div>`;
            resultadosDiv.style.display = 'block';
            setTimeout(() => {
                if (resultadosDiv && resultadosDiv.innerHTML.includes('tracking-error')) {
                    resultadosDiv.style.display = 'none';
                }
            }, 3000);
        }
    }
};

window.TrackingModule = TrackingModule;
console.log('✅ TrackingModule cargado - Con Avanzar, Regresar (con comentario) y Selector Admin');