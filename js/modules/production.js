// ============================================================
// js/modules/production.js - Panel de Producción Activa
// Muestra únicamente los registros marcados para producir
// ============================================================

const ProductionModule = {
    init: async function() {
        console.log('🏭 Módulo de Producción Activa iniciado');
        this.renderizar();
        this.cargarProduccion();
    },
    
    renderizar: function() {
        const container = document.querySelector('.container');
        if (!container) return;
        
        // Limpiar cualquier panel de producción anterior
        let productionPanel = document.getElementById('productionPanel');
        if (productionPanel) productionPanel.remove();
        
        const panelHTML = `
            <div id="productionPanel" class="production-panel" style="animation: fadeIn 0.3s ease-in-out;">
                <div class="production-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 2px solid #00D4FF; padding-bottom: 1rem;">
                    <div>
                        <h2 style="color: #00D4FF; font-size: 1.4rem; margin: 0;">🏭 COLA DE PRODUCCIÓN ACTIVA</h2>
                        <p style="color: #8B949E; font-size: 0.9rem; margin: 0.2rem 0 0 0;">Visualización de órdenes autorizadas para correr en máquina.</p>
                    </div>
                    <button id="refrescarProduccionBtn" class="btn-guardar-solicitud" style="width: auto; padding: 0.6rem 1.2rem; background: #21262D; border: 1px solid #00D4FF; color: #00D4FF;">🔄 Actualizar Cola</button>
                </div>
                
                <div id="colaProduccionContainer" class="cola-produccion-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
                    <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: #8B949E;">
                        <div style="font-size: 2rem; margin-bottom: 1rem;">📦</div>
                        Cargando cola de producción...
                    </div>
                </div>
            </div>
        `;
        
        // En lugar de insertAdjacentHTML, reemplazamos el contenido o lo ponemos al inicio
        // Pero primero ocultamos las otras secciones de la Base de Datos si existen
        const formSection = document.querySelector('.form-section');
        const filtersSection = document.querySelector('.filters-section');
        const tableSection = document.querySelector('.table-section');
        
        if (formSection) formSection.style.display = 'none';
        if (filtersSection) filtersSection.style.display = 'none';
        if (tableSection) tableSection.style.display = 'none';

        container.insertAdjacentHTML('afterbegin', panelHTML);
        
        document.getElementById('refrescarProduccionBtn')?.addEventListener('click', () => this.cargarProduccion());
    },
    
    cargarProduccion: async function() {
        const container = document.getElementById('colaProduccionContainer');
        if (!container) return;
        
        try {
            // Obtener registros directamente de Supabase para tener lo más reciente
            let registros = [];
            if (window.SupabaseClient && window.SupabaseClient.client) {
                const { data, error } = await window.SupabaseClient.client
                    .from('registros')
                    .select('*')
                    .eq('en_produccion', true)
                    .order('actualizado', { ascending: false });
                
                if (error) throw error;
                registros = data;
            } else {
                // Fallback local
                registros = (AppState.registros || []).filter(r => r.en_produccion === true);
            }
            
            this.renderizarTarjetas(registros);
        } catch (error) {
            console.error('Error cargando producción:', error);
            container.innerHTML = '<div style="grid-column: 1/-1; color: #FF4444; text-align: center;">Error al conectar con la base de datos de producción</div>';
        }
    },
    
    renderizarTarjetas: function(registros) {
        const container = document.getElementById('colaProduccionContainer');
        if (!container) return;
        
        if (!registros || registros.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem; background: rgba(255,255,255,0.02); border-radius: 15px; border: 1px dashed rgba(139,148,158,0.3);">
                    <div style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.5;">📭</div>
                    <h3 style="color: #8B949E; margin: 0;">No hay órdenes en producción en este momento</h3>
                    <p style="color: #484F58; font-size: 0.8rem; margin-top: 0.5rem;">Las órdenes aparecerán aquí cuando se marquen con 🚀 en la sección de DATOS.</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        registros.forEach(reg => {
            const haEmpezado = !!reg.inicio_produccion;
            const haTerminado = !!reg.fin_produccion;
            
            let statusColor = '#F59E0B'; // En espera
            let statusText = 'EN ESPERA';
            if (haTerminado) {
                statusColor = '#58A6FF'; // Completado
                statusText = 'COMPLETADO';
            } else if (haEmpezado) {
                statusColor = '#00FF88'; // Produciendo
                statusText = 'PRODUCIENDO';
            }
            
            const tiempoRelativo = Utils.tiempoTranscurrido(reg.actualizado || reg.creado);
            
            // Procesar NKs y Colores
            let nksHtml = '';
            if (reg.nks && reg.nks.length > 0) {
                nksHtml = reg.nks.map(nk => `
                    <div style="margin-bottom: 8px; border-left: 2px solid #00D4FF; padding-left: 8px;">
                        <div style="color: #8B949E; font-size: 0.6rem; text-transform: uppercase;">NK (TELA)</div>
                        <div style="color: #00D4FF; font-weight: bold; font-size: 0.85rem;">${nk.nk || 'NK-STANDARD'}</div>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px;">
                            ${(nk.colores || []).map(c => `
                                <span style="background: #21262D; color: #E6EDF3; font-size: 0.6rem; padding: 1px 5px; border-radius: 3px; border: 1px solid rgba(0,212,255,0.2);">${c.nombre}</span>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
            }

            html += `
                <div class="prod-card" style="background: #161B22; border: 1px solid ${statusColor}55; border-radius: 12px; padding: 1.2rem; position: relative; overflow: hidden; transition: border-color 0.3s, box-shadow 0.3s, opacity 0.3s; ${haTerminado ? 'opacity: 0.85;' : ''}">
                    <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: ${statusColor}; box-shadow: 0 0 10px ${statusColor}55;"></div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div>
                            <span style="background: ${statusColor}22; color: ${statusColor}; font-size: 0.65rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px; text-transform: uppercase; border: 1px solid ${statusColor}44;">${statusText}</span>
                            <h3 style="color: white; margin: 0.5rem 0 0 0; font-size: 1.2rem;">PO: ${reg.po}</h3>
                            <p style="color: #8B949E; font-size: 0.75rem; margin: 0;">${reg.estilo}</p>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: #00D4FF; font-size: 0.75rem; font-weight: bold;">v${reg.version || 1}</div>
                            <div class="time-badge" style="color: #8B949E; font-size: 0.6rem; font-weight: 500; background: rgba(139,148,158,0.1); padding: 2px 6px; border-radius: 4px; margin-top: 4px; display: inline-block;">
                                🕒 ${haTerminado ? 'Terminado' : tiempoRelativo}
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; background: rgba(0,0,0,0.2); padding: 0.8rem; border-radius: 8px; margin-bottom: 1rem;">
                        <div>
                            <div style="color: #8B949E; font-size: 0.6rem; text-transform: uppercase;">MÁQUINA</div>
                            <div style="color: white; font-weight: bold; font-size: 0.9rem;"># ${reg.numero_plotter || reg.monti_numero || '-'}</div>
                        </div>
                        <div>
                            <div style="color: #8B949E; font-size: 0.6rem; text-transform: uppercase;">PARÁMETROS</div>
                            <div style="color: #00D4FF; font-size: 0.75rem; font-weight: bold;">
                                ${reg.plotter_temp ? `🔥 ${reg.plotter_temp}° / 💧 ${reg.plotter_humedad}%` : '⏳ Pendiente'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="nks-container" style="max-height: 80px; overflow-y: auto; margin-bottom: 1rem; scrollbar-width: thin; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        ${nksHtml}
                    </div>

                    <div style="margin-top: auto; display: flex; gap: 0.5rem; padding-top: 0.8rem;">
                        <button onclick="window.imprimirEtiqueta('${reg.id}')" style="flex: 1; background: #21262D; border: 1px solid #00D4FF; color: #00D4FF; padding: 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: bold; cursor: pointer;">🖨️ QR</button>
                        
                        ${!haEmpezado ? 
                            `<button onclick="ProductionModule.abrirModalParametros('${reg.id}')" style="flex: 1.5; background: #F59E0B; border: none; color: #0D1117; padding: 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: bold; cursor: pointer;">🚀 EMPEZAR</button>` :
                            haTerminado ?
                            `<div style="display:flex; gap:0.3rem; flex:1.5;">
                                <button onclick="ProductionModule.repetirProduccion('${reg.id}')" style="flex: 1; background: #21262D; border: 1px solid #F59E0B; color: #F59E0B; padding: 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: bold; cursor: pointer;">🔄 REPETIR</button>
                                <button onclick="ProductionModule.archivarProduccion('${reg.id}')" style="flex: 1; background: #21262D; border: 1px solid #58A6FF; color: #58A6FF; padding: 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: bold; cursor: pointer;">📦 ARCHIVAR</button>
                             </div>` :
                            `<button onclick="ProductionModule.finalizarProduccion('${reg.id}')" style="flex: 1.5; background: #00FF88; border: none; color: #0D1117; padding: 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: bold; cursor: pointer;">🏁 FINALIZAR</button>`
                        }
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },

    repetirProduccion: async function(id) {
        if (!confirm('¿Deseas iniciar una nueva vuelta de producción para esta PO? Se reiniciarán los tiempos.')) return;
        
        try {
            if (window.SupabaseClient && window.SupabaseClient.client) {
                // Obtener registro actual para saber cuántas veces se ha repetido
                const { data: regActual } = await window.SupabaseClient.client.from('registros').select('*').eq('id', id).single();
                const nuevasRepeticiones = (regActual.veces_repetida || 0) + 1;

                await window.SupabaseClient.client.from('registros').update({ 
                    inicio_produccion: null,
                    fin_produccion: null,
                    veces_repetida: nuevasRepeticiones,
                    actualizado: new Date().toISOString()
                }).eq('id', id);
                
                // Notificación de repetición con CONTEO
                const usuario = window.getUsuarioActual ? window.getUsuarioActual().username : 'Operador';
                const notificacion = {
                    tipo: 'produccion',
                    titulo: `⚠️ REPETICIÓN #${nuevasRepeticiones}: ${regActual.po}`,
                    descripcion: `AVISO DE REPETICIÓN\n\nEl operador ${usuario} ha reiniciado la producción.\n\nESTADO:\n• Esta es la repetición NÚMERO ${nuevasRepeticiones}.\n• PO: ${regActual.po}\n• Estilo: ${regActual.estilo}`,
                    po: regActual.po,
                    estilo: regActual.estilo,
                    fecha: new Date().toISOString(),
                    leido: false
                };
                await window.SupabaseClient.guardarBandejaItem(notificacion);

                Notifications.info(`🔄 Orden reiniciada (Intento #${nuevasRepeticiones + 1})`);
                this.cargarProduccion();
            }
        } catch (error) { 
            console.error(error);
            Notifications.error('Error al repetir orden'); 
        }
    },

    abrirModalParametros: function(id) {
        const modalId = 'modalParametrosProduccion';
        if (document.getElementById(modalId)) document.getElementById(modalId).remove();

        const modalHTML = `
            <div id="${modalId}" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); z-index: 9999; display: flex; justify-content: center; align-items: center;">
                <div style="background: #161B22; border: 2px solid #F59E0B; border-radius: 15px; width: 90%; max-width: 400px; padding: 2rem; box-shadow: 0 0 30px rgba(245,158,11,0.2);">
                    <h3 style="color: #F59E0B; margin-top: 0; display: flex; align-items: center; gap: 10px;">🚀 Iniciar Producción</h3>
                    <p style="color: #8B949E; font-size: 0.8rem; margin-bottom: 1.5rem;">Defina los parámetros del plotter.</p>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="color: #8B949E; font-size: 0.7rem; display: block; margin-bottom: 0.4rem;">TEMPERATURA (°C)</label>
                        <input type="number" id="param_temp" placeholder="Ej: 195.5" step="0.1" style="width: 100%; background: #0D1117; border: 1px solid #30363D; color: white; padding: 0.8rem; border-radius: 8px;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="color: #8B949E; font-size: 0.7rem; display: block; margin-bottom: 0.4rem;">HUMEDAD (%)</label>
                        <input type="number" id="param_hum" placeholder="Ej: 45" style="width: 100%; background: #0D1117; border: 1px solid #30363D; color: white; padding: 0.8rem; border-radius: 8px;">
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="color: #8B949E; font-size: 0.7rem; display: block; margin-bottom: 0.4rem;">NÚMERO DE PLOTTER</label>
                        <select id="param_plotter" style="width: 100%; background: #0D1117; border: 1px solid #30363D; color: white; padding: 0.8rem; border-radius: 8px;">
                            ${Array.from({length: 17}, (_, i) => `<option value="${i+1}">Plotter #${i+1}</option>`).join('')}
                        </select>
                    </div>
                    <div style="margin-bottom: 2rem;">
                        <label style="color: #8B949E; font-size: 0.7rem; display: block; margin-bottom: 0.4rem;">PERFIL DE IMPRESIÓN</label>
                        <select id="param_perfil" style="width: 100%; background: #0D1117; border: 1px solid #30363D; color: white; padding: 0.8rem; border-radius: 8px;">
                            <option value="BEMIS MS JP12 8C (2) 4 PASS K08 R2R 5260">1. BEMIS MS JP12 8C (2) 4 PASS K08 R2R 5260</option>
                            <option value="JP12 8C (B2) 4 PASS SPC FLAT NEW 2025 PRODUCCION">2. JP12 8C (B2) 4 PASS SPC FLAT NEW 2025 PRODUCCION</option>
                            <option value="MS BEMIS NFL JP4#15 8C (B2) 4 Pass K08 R2R 5260 Desarrollo">3. MS BEMIS NFL JP4#15 8C (B2) 4 Pass K08 R2R 5260 Desarrollo</option>
                            <option value="BEMIS MSJP4#12 8C (B2) 4 Pass S10 SPC R2R">4. BEMIS MSJP4#12 8C (B2) 4 Pass S10 SPC R2R</option>
                            <option value="JP4#12 8C (B2) 4 Pass spc FALT NEW 2025 PRODUCCION">5. JP4#12 8C (B2) 4 Pass spc FALT NEW 2025 PRODUCCION</option>
                            <option value="JP4#12 8C (B2) 4 Pass SPC R2R GRILL NEW 2025">6. JP4#12 8C (B2) 4 Pass SPC R2R GRILL NEW 2025</option>
                            <option value="RECUT TWILL">7. RECUT TWILL</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button onclick="document.getElementById('${modalId}').remove()" style="flex: 1; background: #21262D; border: 1px solid #30363D; color: white; padding: 0.8rem; border-radius: 8px; cursor: pointer;">Cancelar</button>
                        <button onclick="ProductionModule.empezarProduccion('${id}')" style="flex: 1; background: #F59E0B; border: none; color: #0D1117; font-weight: bold; padding: 0.8rem; border-radius: 8px; cursor: pointer;">Empezar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    empezarProduccion: async function(id) {
        console.log('🏁 Iniciando proceso de empezarProduccion para ID:', id);
        const temp = document.getElementById('param_temp')?.value;
        const hum = document.getElementById('param_hum')?.value;
        const perfil = document.getElementById('param_perfil')?.value;
        const plotter = document.getElementById('param_plotter')?.value;

        if (!temp || !hum) { 
            Notifications.warning('⚠️ Faltan datos técnicos'); 
            return; 
        }

        try {
            if (window.SupabaseClient && window.SupabaseClient.client) {
                console.log('📡 Buscando datos de la orden...');
                const { data: regActual, error: errorFetch } = await window.SupabaseClient.client
                    .from('registros')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (errorFetch) console.warn('Aviso: No se pudo obtener regActual, usando datos genéricos');

                console.log('📡 Actualizando estado en tabla REGISTROS...');
                const { error: errorUpdate } = await window.SupabaseClient.client.from('registros').update({ 
                    actualizado: new Date().toISOString(),
                    inicio_produccion: new Date().toISOString(),
                    plotter_temp: parseFloat(temp),
                    plotter_humedad: parseFloat(hum),
                    perfil_impresion: perfil,
                    numero_plotter: plotter
                }).eq('id', id);

                if (errorUpdate) {
                    console.error('❌ Error al actualizar tabla registros:', errorUpdate);
                }

                console.log('📡 Enviando notificación a BANDEJA...');
                const usuario = window.getUsuarioActual ? window.getUsuarioActual().username : 'Operador';
                const poName = regActual ? regActual.po : 'PO Desconocida';
                
                const notificacionInicio = {
                    tipo: 'produccion',
                    titulo: `🚀 INICIO: PO ${poName}`,
                    descripcion: `PRODUCCIÓN INICIADA\n\nOperador: ${usuario}\nPlotter: #${plotter}\nTemp: ${temp}°C | Hum: ${hum}%\nPerfil: ${perfil}`,
                    po: poName,
                    fecha: new Date().toISOString(),
                    leido: false
                };

                await window.SupabaseClient.guardarBandejaItem(notificacionInicio);
                console.log('✅ Proceso de notificación completado');

                Notifications.success('🚀 Producción Iniciada');
                document.getElementById('modalParametrosProduccion')?.remove();
                this.cargarProduccion();
            }
        } catch (error) { 
            console.error('❌ Error crítico en empezarProduccion:', error);
            Notifications.error('Error al iniciar producción'); 
        }
    },

    finalizarProduccion: async function(id) {
        console.log('🏁 FINALIZANDO ORDEN - Paso 1: Obtener datos');
        if (!confirm('¿Desea marcar esta orden como FINALIZADA?')) return;

        try {
            if (window.SupabaseClient && window.SupabaseClient.client) {
                // 1. Obtener datos actuales ANTES de cualquier cambio
                const { data: reg, error: errorFetch } = await window.SupabaseClient.client
                    .from('registros')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (errorFetch) console.warn('Aviso: No se pudo obtener el registro, se usará info parcial');

                // 2. DISPARAR NOTIFICACIÓN INMEDIATAMENTE (Prioridad)
                console.log('🏁 Paso 2: Enviando aviso a bandeja...');
                const user = window.getUsuarioActual ? window.getUsuarioActual().username : 'Operador';
                const poName = reg ? reg.po : 'PO Desconocida';
                
                const notificacionFin = {
                    tipo: 'produccion',
                    titulo: `🏁 FINALIZADA: PO ${poName}`,
                    descripcion: `ORDEN COMPLETADA\n\nLa PO ${poName} ha sido finalizada por ${user}.\n\nRESUMEN:\n• Plotter: #${reg?.numero_plotter || '-'}\n• Temp: ${reg?.plotter_temp || '-'}°C\n• Hum: ${reg?.plotter_humedad || '-'}%`,
                    po: poName,
                    estilo: reg?.estilo || 'N/A',
                    fecha: new Date().toISOString(),
                    leido: false
                };

                // Enviamos sin esperar al update de registros
                await window.SupabaseClient.guardarBandejaItem(notificacionFin);
                console.log('✅ Aviso enviado a bandeja');

                // 3. ACTUALIZAR TABLA DE REGISTROS (Seguimiento interno)
                console.log('🏁 Paso 3: Actualizando tabla registros...');
                await window.SupabaseClient.client.from('registros').update({ 
                    actualizado: new Date().toISOString(),
                    fin_produccion: new Date().toISOString()
                }).eq('id', id);
                
                Notifications.success('✅ Producción Finalizada y Notificada');
                this.cargarProduccion();
            }
        } catch (error) { 
            console.error('❌ Error en finalizarProduccion:', error);
            Notifications.error('Error al procesar finalización'); 
        }
    },

    archivarProduccion: async function(id) {
        if (!confirm('¿Deseas quitar esta orden del panel de producción? (Se guardará en el historial general)')) return;
        
        try {
            if (window.SupabaseClient && window.SupabaseClient.client) {
                await window.SupabaseClient.client.from('registros').update({ 
                    en_produccion: false,
                    actualizado: new Date().toISOString()
                }).eq('id', id);
                Notifications.info('📦 Orden archivada');
                this.cargarProduccion();
            }
        } catch (error) { Notifications.error('Error'); }
    },

    enviarNotificacionFinalizacion: async function(reg) {
        if (!window.SupabaseClient || !window.SupabaseClient.guardarBandejaItem) return;
        const user = window.getUsuarioActual ? window.getUsuarioActual().username : 'Operador';
        
        const notificacionFin = {
            tipo: 'produccion',
            titulo: `🏁 FINALIZADA: PO ${reg.po}`,
            descripcion: `ORDEN COMPLETADA\n\nLa PO ${reg.po} ha salido de máquina exitosamente.\n\nRESUMEN FINAL:\n• Operador: ${user}\n• Plotter: #${reg.numero_plotter || '-'}\n• Temp Final: ${reg.plotter_temp}°C\n• Humedad Final: ${reg.plotter_humedad}%`,
            po: reg.po,
            estilo: reg.estilo,
            fecha: new Date().toISOString(),
            leido: false,
            estadoAsignacion: 'completado',
            asignadoA: user
        };
        await window.SupabaseClient.guardarBandejaItem(notificacionFin);
    }
};

window.ProductionModule = ProductionModule;
