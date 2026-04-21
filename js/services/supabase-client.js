// ============================================================
// js/services/supabase-client.js - Cliente de Supabase
// ============================================================

const SupabaseClient = {
    client: null,
    initialized: false,
    
    init: function() {
        if (this.initialized && this.client) return true;
        
        if (!window.SUPABASE_CONFIG) {
            console.error('❌ SUPABASE_CONFIG no definido');
            return false;
        }
        
        if (!window.supabase) {
            console.error('❌ Librería supabase no cargada (¿falta CDN?)');
            return false;
        }
        
        try {
            this.client = window.supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey
            );
            this.initialized = true;
            console.log('✅ Supabase cliente inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error creando cliente Supabase:', error);
            return false;
        }
    },
    
    // ========== REGISTROS ==========
    
    getRegistros: async function() {
        if (!this.init()) return null;
        try {
            const { data, error } = await this.client
                .from('registros')
                .select('*')
                .order('creado', { ascending: false });
            if (error) throw error;
            console.log(`📦 Registros obtenidos: ${data?.length || 0}`);
            return data;
        } catch (error) {
            console.error('Error en getRegistros:', error);
            return null;
        }
    },
    
    guardarRegistro: async function(registro) {
        if (!this.init()) return null;
        try {
            const { data, error } = await this.client
                .from('registros')
                .upsert(registro)
                .select();
            if (error) throw error;
            console.log('✅ Registro guardado en Supabase');
            return data;
        } catch (error) {
            console.error('Error en guardarRegistro:', error);
            return null;
        }
    },
    
    eliminarRegistro: async function(id) {
        if (!this.init()) return false;
        try {
            const { error } = await this.client
                .from('registros')
                .delete()
                .eq('id', id);
            if (error) throw error;
            console.log('🗑️ Registro eliminado de Supabase');
            return true;
        } catch (error) {
            console.error('Error en eliminarRegistro:', error);
            return false;
        }
    },
    
    // ========== USUARIOS ==========
    
    getUsuarios: async function() {
        if (!this.init()) return null;
        try {
            const { data, error } = await this.client
                .from('usuarios')
                .select('*')
                .order('creado', { ascending: true });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error en getUsuarios:', error);
            return null;
        }
    },
    
    guardarUsuario: async function(usuario) {
        if (!this.init()) return null;
        try {
            console.log('📡 Intentando guardar usuario en Supabase:', usuario.username);
            const { data, error } = await this.client
                .from('usuarios')
                .upsert(usuario)
                .select();
            
            if (error) {
                console.error('❌ Error de Supabase al guardar usuario:', error);
                throw error;
            }
            
            console.log('✅ Usuario guardado exitosamente en Supabase');
            return data;
        } catch (error) {
            console.error('Error en guardarUsuario:', error);
            throw error; // Propagar el error para que el llamador lo maneje
        }
    },
    
    eliminarUsuario: async function(id) {
        if (!this.init()) return false;
        try {
            const { error } = await this.client
                .from('usuarios')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error en eliminarUsuario:', error);
            return false;
        }
    },
    
    // ========== SOLICITUDES ==========
    
    getSolicitudes: async function() {
        if (!this.init()) return null;
        try {
            const { data, error } = await this.client
                .from('solicitudes')
                .select('*')
                .order('fecha', { ascending: false });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error en getSolicitudes:', error);
            return null;
        }
    },
    
    guardarSolicitud: async function(solicitud) {
        if (!this.init()) return null;
        try {
            const { data, error } = await this.client
                .from('solicitudes')
                .upsert(solicitud)
                .select();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error en guardarSolicitud:', error);
            return null;
        }
    },
    
    eliminarSolicitud: async function(id) {
        if (!this.init()) return false;
        try {
            const { error } = await this.client
                .from('solicitudes')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error en eliminarSolicitud:', error);
            return false;
        }
    },
    
    // ========== BANDEJA DE ENTRADA ==========
    
    getBandejaItems: async function() {
        if (!this.init()) return null;
        try {
            console.log('📡 Intentando leer tabla: bandeja_entrada...');
            const { data, error } = await this.client
                .from('bandeja_entrada')
                .select('*')
                .order('fecha', { ascending: false });
            
            if (error) {
                console.error('❌ Error de Supabase en bandeja_entrada:', error);
                if (window.Notifications) Notifications.error('Error DB: ' + error.message);
                throw error;
            }
            
            console.log('✅ Datos recibidos de bandeja:', data ? data.length : 0, 'items');
            return data;
        } catch (error) {
            console.error('Error en getBandejaItems:', error);
            return null;
        }
    },
    
    marcarLeidoBandeja: async function(id) {
        if (!this.init()) return false;
        try {
            const { error } = await this.client
                .from('bandeja_entrada')
                .update({ leido: true })
                .eq('id', id);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error en marcarLeidoBandeja:', error);
            return false;
        }
    },
    
    guardarBandejaItem: async function(item) {
        if (!this.init()) return null;
        try {
            // Asegurar que siempre haya un ID único para evitar error 400
            if (!item.id) {
                item.id = 'NOT-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4);
            }

            console.log('📤 Enviando a bandeja:', item.titulo);
            const { data, error } = await this.client
                .from('bandeja_entrada')
                .upsert(item)
                .select();
            
            if (error) {
                console.error('❌ Error al guardar en bandeja:', error);
                throw error;
            }
            return data;
        } catch (error) {
            console.error('Error en guardarBandejaItem:', error);
            return null;
        }
    },
    
    eliminarBandejaItem: async function(id) {
        if (!this.init()) return false;
        try {
            const { error } = await this.client
                .from('bandeja_entrada')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error en eliminarBandejaItem:', error);
            return false;
        }
    },
    
    // ========== APROBACIONES ==========
    
    getAprobaciones: async function() {
        if (!this.init()) return null;
        try {
            const { data, error } = await this.client
                .from('aprobaciones')
                .select('*')
                .order('fecha', { ascending: false });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error en getAprobaciones:', error);
            return null;
        }
    },
    
    guardarAprobacion: async function(aprobacion) {
        if (!this.init()) return null;
        try {
            const { data, error } = await this.client
                .from('aprobaciones')
                .upsert(aprobacion)
                .select();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error en guardarAprobacion:', error);
            return null;
        }
    },
    
    eliminarAprobacion: async function(id) {
        if (!this.init()) return false;
        try {
            const { error } = await this.client
                .from('aprobaciones')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error en eliminarAprobacion:', error);
            return false;
        }
    }
};

window.SupabaseClient = SupabaseClient;
console.log('✅ SupabaseClient cargado');
