// ============================================================
// js/modules/records.js - CRUD de registros con estructura NK → COLORES
// Versión: Recibe datos pre-llenados desde la bandeja
// ============================================================

const RecordsModule = {
    getById: function(id) {
        return AppState.getRegistroById(id);
    },
    
    filtrar: function() {
        return AppState.getRegistrosFiltrados();
    },
    
    guardar: async function(datos) {
        const editId = document.getElementById('editId').value;
        const ahora = new Date().toISOString();
        const usuarioActual = window.getUsuarioActual();
        const nombreUsuario = usuarioActual ? usuarioActual.username : 'Desconocido';
        
        if (editId && !datos.id) {
            datos.id = editId;
        }
        
        const registroData = { ...datos, actualizado: ahora, version: 1, usuarioModifico: nombreUsuario };
        
        if (editId) {
            registroData.id = editId;
            const original = AppState.getRegistroById(editId);
            if (original) {
                AppState.addHistorialEntry(editId, {
                    fecha: ahora, 
                    descripcion: datos.descripcionEdicion || 'Edición',
                    usuario: nombreUsuario,
                    anterior: { po: original.po, proceso: original.proceso, version: original.version, nks: original.nks },
                    nuevo: { po: registroData.po, proceso: registroData.proceso, version: registroData.version, nks: registroData.nks }
                });
                registroData.creado = original.creado;
                registroData.version = (original.version || 1) + 1;
                AppState.updateRegistro(editId, registroData);
                
                if (window.SupabaseClient && window.SupabaseClient.client) {
                    await window.SupabaseClient.guardarRegistro(registroData);
                    await window.SupabaseClient.guardarHistorial({
                        registro_id: editId,
                        descripcion: datos.descripcionEdicion || 'Edición',
                        usuario: nombreUsuario,
                        anterior_po: original.po,
                        anterior_proceso: original.proceso,
                        anterior_version: original.version,
                        nuevo_po: registroData.po,
                        nuevo_proceso: registroData.proceso,
                        nuevo_version: registroData.version
                    });
                }
                
                // Buscar solicitud pendiente en bandeja para este NK + Color
                await this.buscarYAprobarSolicitudEnBandeja(original, registroData);
                
                Notifications.success(`✅ Editado v${registroData.version}`);
                return true;
            }
        } else {
            registroData.id = Utils.generarIdUnico();
            registroData.creado = ahora;
            AppState.addRegistro(registroData);
            if (window.SupabaseClient && window.SupabaseClient.client) {
                await window.SupabaseClient.guardarRegistro(registroData);
            }
            Notifications.success('✅ Registro guardado');
            return true;
        }
        return false;
    },
    
    // ============================================================
    // BUSCAR SOLICITUD EN BANDEJA POR NK + COLOR
    // ============================================================
    
    buscarYAprobarSolicitudEnBandeja: async function(registroAnterior, registroNuevo) {
        try {
            let bandejaItems = localStorage.getItem('alpha_db_bandeja_entrada');
            if (!bandejaItems) return;
            bandejaItems = JSON.parse(bandejaItems);
            
            const nksNuevo = registroNuevo.nks || [];
            const nksAnterior = registroAnterior.nks || [];
            let solicitudCompletada = false;
            
            for (const nkNuevo of nksNuevo) {
                const nkAnterior = nksAnterior.find(n => n.nk === nkNuevo.nk);
                
                if (nkAnterior) {
                    for (const colorNuevo of nkNuevo.colores) {
                        const colorAnterior = nkAnterior.colores.find(c => c.nombre === colorNuevo.nombre);
                        
                        if (!colorAnterior || JSON.stringify(colorNuevo) !== JSON.stringify(colorAnterior)) {
                            const cambio = !colorAnterior ? 'agregado' : 'modificado';
                            const resultado = await this.procesarSolicitudPorNkYColor(bandejaItems, nkNuevo.nk, colorNuevo.nombre, cambio, registroNuevo);
                            if (resultado) solicitudCompletada = true;
                        }
                    }
                } else {
                    for (const colorNuevo of nkNuevo.colores) {
                        const resultado = await this.procesarSolicitudPorNkYColor(bandejaItems, nkNuevo.nk, colorNuevo.nombre, 'agregado', registroNuevo);
                        if (resultado) solicitudCompletada = true;
                    }
                }
            }
            
            if (solicitudCompletada) {
                if (window.Notifications) {
                    Notifications.success('🎉 Una solicitud pendiente ha sido completada automáticamente');
                }
            }
        } catch(error) {
            console.error('Error buscando solicitud en bandeja:', error);
        }
    },
    
    procesarSolicitudPorNkYColor: async function(bandejaItems, nk, color, tipoCambio, registro) {
        const usuarioActual = window.getUsuarioActual();
        const nombreUsuario = usuarioActual ? usuarioActual.username : 'Desconocido';
        
        const solicitudPendiente = bandejaItems.find(item => 
            item.tipo === 'solicitud' && 
            item.estadoAsignacion !== 'completado' &&
            item.datosCompletos && 
            item.datosCompletos.nk === nk && 
            item.datosCompletos.colorModificar === color
        );
        
        if (solicitudPendiente) {
            solicitudPendiente.estadoAsignacion = 'completado';
            solicitudPendiente.fechaResolucion = new Date().toISOString();
            solicitudPendiente.resueltoPor = nombreUsuario;
            solicitudPendiente.cambiosRealizados = `${tipoCambio === 'agregado' ? 'Agregado' : 'Modificado'} color ${color} en NK ${nk}`;
            solicitudPendiente.descripcion = (solicitudPendiente.descripcion || '') + `\n✅ Resuelto automáticamente por ${nombreUsuario} el ${new Date().toLocaleString()}. Cambio: ${tipoCambio === 'agregado' ? 'Agregó' : 'Modificó'} color ${color}.`;
            
            localStorage.setItem('alpha_db_bandeja_entrada', JSON.stringify(bandejaItems));
            console.log(`✅ Solicitud ${solicitudPendiente.id} completada automáticamente`);
            return true;
        }
        return false;
    },
    
    eliminar: async function(id) {
        if (confirm('¿Eliminar este registro?')) {
            AppState.deleteRegistro(id);
            if (window.SupabaseClient && window.SupabaseClient.client) {
                await window.SupabaseClient.eliminarRegistro(id);
            }
            Notifications.success('🗑️ Registro eliminado');
            return true;
        }
        return false;
    },
    
    obtenerFormulario: function() {
        const getValor = (id, defaultValue = '') => {
            const el = document.getElementById(id);
            return el ? el.value : defaultValue;
        };
        
        const getNumero = (id, defaultValue = 0) => {
            const el = document.getElementById(id);
            if (!el) return defaultValue;
            const val = parseFloat(el.value);
            return isNaN(val) ? defaultValue : val;
        };
        
        const getCheck = (id, defaultValue = false) => {
            const el = document.getElementById(id);
            return el ? el.checked : defaultValue;
        };
        
        const fechaStr = getValor('fecha', new Date().toISOString().split('T')[0]);
        const fecha = new Date(fechaStr);
        
        return {
            po: getValor('po', '').toUpperCase(),
            proceso: getValor('proceso', ''),
            es_reemplazo: getCheck('esReemplazo', false),
            fecha: fechaStr,
            estilo: getValor('estilo', '').toUpperCase(),
            nks: window.ColorsModule ? window.ColorsModule.obtenerDelFormulario() : [],
            numero_plotter: getNumero('numero_plotter', 0),
            plotter_temp: getNumero('plotter_temp', 0),
            plotter_humedad: getNumero('plotter_humedad', 0),
            plotter_perfil: getValor('plotter_perfil', '').toUpperCase(),
            monti_numero: getNumero('monti_numero', 0),
            temperatura_monti: getNumero('temp_monti', 0),
            velocidad_monti: getNumero('vel_monti', 0),
            monti_presion: getNumero('monti_presion', 0),
            temperatura_flat: getNumero('temp_flat', 0),
            tiempo_flat: getNumero('tiempo_flat', 0),
            adhesivo: getValor('adhesivo', '').toUpperCase(),
            observacion: getValor('observacion', null),
            descripcionEdicion: null,
            semana: Utils.obtenerSemana(fecha)
        };
    },
    
    cargarFormulario: function(reg) {
        const setValor = (id, valor) => {
            const el = document.getElementById(id);
            if (el) el.value = valor !== undefined && valor !== null ? valor : '';
        };
        
        const setCheck = (id, valor) => {
            const el = document.getElementById(id);
            if (el) el.checked = valor || false;
        };
        
        setValor('po', reg.po);
        setValor('proceso', reg.proceso);
        setCheck('esReemplazo', reg.es_reemplazo);
        setValor('fecha', reg.fecha);
        setValor('estilo', reg.estilo);
        if (window.ColorsModule && window.ColorsModule.cargarEnFormulario) {
            window.ColorsModule.cargarEnFormulario(reg.nks || []);
        }
        setValor('numero_plotter', reg.numero_plotter);
        setValor('plotter_temp', reg.plotter_temp);
        setValor('plotter_humedad', reg.plotter_humedad);
        setValor('plotter_perfil', reg.plotter_perfil);
        setValor('monti_numero', reg.monti_numero);
        setValor('temp_monti', reg.temperatura_monti);
        setValor('vel_monti', reg.velocidad_monti);
        setValor('monti_presion', reg.monti_presion);
        setValor('temp_flat', reg.temperatura_flat);
        setValor('tiempo_flat', reg.tiempo_flat);
        setValor('adhesivo', reg.adhesivo);
        if(reg.observacion) setValor('observacion', reg.observacion);
    },
    
    // ============================================================
    // CARGAR DATOS PRE-LLENADOS DESDE REEMPLAZO
    // ============================================================
    
    cargarDatosPrellenados: function(datos) {
        console.log('Cargando datos pre-llenados para reemplazo:', datos);
        
        const setValor = (id, valor) => {
            const el = document.getElementById(id);
            if (el) el.value = valor !== undefined && valor !== null ? valor : '';
        };
        
        const setCheck = (id, valor) => {
            const el = document.getElementById(id);
            if (el) el.checked = valor || false;
        };
        
        setValor('po', datos.po);
        setValor('proceso', datos.proceso || '');
        setCheck('esReemplazo', datos.es_reemplazo || false);
        setValor('fecha', datos.fecha || new Date().toISOString().split('T')[0]);
        setValor('estilo', datos.estilo);
        setValor('numero_plotter', datos.numero_plotter || '');
        setValor('plotter_temp', datos.plotter_temp || '');
        setValor('plotter_humedad', datos.plotter_humedad || '');
        setValor('plotter_perfil', datos.plotter_perfil || '');
        setValor('monti_numero', datos.monti_numero || '');
        setValor('temp_monti', datos.temperatura_monti || '');
        setValor('vel_monti', datos.velocidad_monti || '');
        setValor('monti_presion', datos.monti_presion || '');
        setValor('temp_flat', datos.temperatura_flat || '');
        setValor('tiempo_flat', datos.tiempo_flat || '');
        setValor('adhesivo', datos.adhesivo || '');
        
        if (window.ColorsModule && window.ColorsModule.cargarEnFormulario) {
            window.ColorsModule.cargarEnFormulario(datos.nks || []);
        }
        
        if (datos.editando && datos.id) {
            document.getElementById('editId').value = datos.id;
            const formTitle = document.getElementById('formTitle');
            if (formTitle) formTitle.innerHTML = '✏️ REEMPLAZO DE COLOR - EDITANDO REGISTRO';
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) submitBtn.innerHTML = '<span>🔄</span> GUARDAR REEMPLAZO';
            const cancelEditBtn = document.getElementById('cancelEditBtn');
            if (cancelEditBtn) cancelEditBtn.style.display = 'block';
            const formSection = document.querySelector('.form-section');
            if (formSection) formSection.classList.add('edit-mode');
        } else {
            const formTitle = document.getElementById('formTitle');
            if (formTitle) formTitle.innerHTML = '🔄 REEMPLAZO DE COLOR - NUEVO REGISTRO';
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) submitBtn.innerHTML = '<span>🔄</span> GUARDAR REEMPLAZO';
        }
        
        Notifications.info('📋 Formulario pre-llenado con los datos de la solicitud');
        
        const formSection = document.querySelector('.form-section');
        if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
};

window.RecordsModule = RecordsModule;
console.log('✅ RecordsModule actualizado - Soporte para datos pre-llenados desde reemplazo');