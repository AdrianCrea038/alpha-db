// ============================================================
// js/modules/records.js - CRUD de registros con estructura NK → COLORES
// Versión: Genera ID antes de guardar en Supabase
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
        const nombreUsuario = usuarioActual ? usuarioActual.username : 'Sistema';
        
        // Si es nuevo registro, generar ID ahora (antes de cualquier operación)
        let registroData = { ...datos, actualizado: ahora, version: 1, usuarioModifico: nombreUsuario };
        
        if (editId) {
            // Es edición: usar el ID existente
            registroData.id = editId;
        } else {
            // Es nuevo: generar ID único
            registroData.id = Utils.generarIdUnico();
            console.log('🆕 Generado nuevo ID:', registroData.id);
        }
        
        // Asegurar que nks sea un array
        if (!registroData.nks) registroData.nks = [];
        
        // Intentar guardar en Supabase
        if (window.SupabaseClient && window.SupabaseClient.client) {
            try {
                const { error } = await window.SupabaseClient.client
                    .from('registros')
                    .upsert(registroData);
                
                if (error) {
                    console.error('❌ Error de Supabase:', error);
                    Notifications.error('Error en la nube: ' + (error.message || error.details));
                    return false;
                }
                
                console.log('✅ Guardado en Supabase, ID:', registroData.id);
                
                // Actualizar AppState
                if (editId) {
                    AppState.updateRegistro(editId, registroData);
                } else {
                    AppState.addRegistro(registroData);
                }
                
                Notifications.success('✅ Registro guardado en la nube');
                return true;
                
            } catch (error) {
                console.error('❌ Excepción guardando en Supabase:', error);
                Notifications.error('Error de conexión: ' + error.message);
                return false;
            }
        } else {
            // Fallback a localStorage (modo offline)
            console.warn('⚠️ Supabase no disponible, guardando localmente');
            if (editId) {
                AppState.updateRegistro(editId, registroData);
            } else {
                AppState.addRegistro(registroData);
            }
            guardarDatosLocal();
            Notifications.success('✅ Registro guardado localmente');
            return true;
        }
    },
    
    eliminar: async function(id) {
        if (!confirm('¿Eliminar este registro?')) return false;
        
        if (window.SupabaseClient && window.SupabaseClient.client) {
            try {
                const { error } = await window.SupabaseClient.client
                    .from('registros')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                console.log('🗑️ Eliminado de Supabase');
            } catch (error) {
                console.error('Error eliminando de Supabase:', error);
                Notifications.error('Error al eliminar de la nube');
                return false;
            }
        }
        
        AppState.deleteRegistro(id);
        guardarDatosLocal();
        Notifications.success('🗑️ Registro eliminado');
        return true;
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
            if (el) el.value = (valor !== undefined && valor !== null) ? valor : '';
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
        if (reg.observacion) setValor('observacion', reg.observacion);
    },
    
    cargarDatosPrellenados: function(datos) {
        console.log('Cargando datos pre-llenados para reemplazo:', datos);
        
        const setValor = (id, valor) => {
            const el = document.getElementById(id);
            if (el) el.value = (valor !== undefined && valor !== null) ? valor : '';
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
        if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
    }
};

function guardarDatosLocal() {
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
        console.error('Error al guardar localmente:', error);
    }
}

window.RecordsModule = RecordsModule;
console.log('✅ RecordsModule actualizado - Genera ID antes de guardar en Supabase');
