// js/modules/registros.js
const RegistrosModule = {
    getById: function(id) {
        return AppState.registros.find(r => r.id === id);
    },
    
    filtrar: function() {
        const search = AppState.currentSearch;
        const semana = AppState.currentSemana;
        if (!search && !semana) return AppState.registros;
        const termino = search ? search.toLowerCase().trim() : '';
        return AppState.registros.filter(reg => {
            if (semana && parseInt(reg.semana) !== parseInt(semana)) return false;
            if (!termino) return true;
            let texto = `${reg.po} ${reg.proceso} ${reg.estilo} ${reg.tela} ${reg.adhesivo}`;
            if (reg.colores) reg.colores.forEach(c => texto += ' ' + c.nombre);
            return texto.toLowerCase().includes(termino);
        });
    },
    
    guardar: async function(datos) {
        const editId = document.getElementById('editId').value;
        const ahora = new Date().toISOString();
        
        // Asegurar que el ID existe para edición
        if (editId && !datos.id) {
            datos.id = editId;
        }
        
        const registroData = { ...datos, actualizado: ahora, version: 1 };
        
        if (editId) {
            // Edición - asegurar que el ID es correcto
            registroData.id = editId;
            
            const index = AppState.registros.findIndex(r => r.id === editId);
            if (index !== -1) {
                const original = AppState.registros[index];
                if (!AppState.historialEdiciones[editId]) AppState.historialEdiciones[editId] = [];
                AppState.historialEdiciones[editId].push({
                    fecha: ahora, 
                    descripcion: datos.descripcionEdicion || 'Edición',
                    anterior: { po: original.po, proceso: original.proceso, version: original.version },
                    nuevo: { po: registroData.po, proceso: registroData.proceso, version: registroData.version }
                });
                registroData.creado = original.creado;
                registroData.version = (original.version || 1) + 1;
                AppState.updateRegistro(editId, registroData);
                
                if(window.SupabaseClient && window.SupabaseClient.client) {
                    await window.SupabaseClient.guardarRegistro(registroData);
                    await window.SupabaseClient.guardarHistorial({
                        registro_id: editId,
                        descripcion: datos.descripcionEdicion || 'Edición',
                        anterior_po: original.po,
                        anterior_proceso: original.proceso,
                        anterior_version: original.version,
                        nuevo_po: registroData.po,
                        nuevo_proceso: registroData.proceso,
                        nuevo_version: registroData.version
                    });
                }
                Notifications.success(`✅ Editado v${registroData.version}`);
                return true;
            }
        } else {
            // Nuevo registro - generar ID único
            registroData.id = Utils.generarIdUnico();
            registroData.creado = ahora;
            AppState.addRegistro(registroData);
            if(window.SupabaseClient && window.SupabaseClient.client) {
                await window.SupabaseClient.guardarRegistro(registroData);
            }
            Notifications.success('✅ Registro guardado');
            return true;
        }
        return false;
    },
    
    eliminar: async function(id) {
        if (confirm('¿Eliminar este registro?')) {
            AppState.registros = AppState.registros.filter(r => r.id !== id);
            delete AppState.historialEdiciones[id];
            if(window.SupabaseClient && window.SupabaseClient.client) {
                await window.SupabaseClient.eliminarRegistro(id);
            }
            Notifications.success('🗑️ Eliminado');
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
            tela: getValor('tela', '').toUpperCase(),
            colores: ColoresModule.obtenerDelFormulario(),
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
        setValor('tela', reg.tela);
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
        ColoresModule.cargarEnFormulario(reg.colores);
    }
};

window.RegistrosModule = RegistrosModule;
console.log('✅ RegistrosModule cargado');
