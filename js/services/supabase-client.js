// ============================================================
// js/services/supabase-client.js - Cliente de Supabase
// Versión: Con funciones para gestión de usuarios
// ============================================================

const SupabaseClient = {
    client: null,
    initialized: false,
    
    init: function() {
        if (this.initialized && this.client) return true;
        
        if (!window.SUPABASE_CONFIG || !window.supabase) {
            console.warn('⚠️ Supabase no disponible, modo offline');
            return false;
        }
        
        try {
            this.client = window.supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey
            );
            this.initialized = true;
            console.log('✅ Supabase cliente inicializado');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando Supabase:', error);
            return false;
        }
    },
    
    // ========== REGISTROS ==========
    
    getRegistros: async function() {
        if (!this.init()) return null;
        
        try {
            const { data, error } = await this.client
                .from(window.SUPABASE_CONFIG.tablas.registros)
                .select('*')
                .order('creado', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error cargando registros:', error);
            return null;
        }
    },
    
    guardarRegistro: async function(registro) {
        if (!this.init()) return null;
        
        try {
            const { data, error } = await this.client
                .from(window.SUPABASE_CONFIG.tablas.registros)
                .upsert(registro)
                .select();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error guardando registro:', error);
            return null;
        }
    },
    
    eliminarRegistro: async function(id) {
        if (!this.init()) return false;
        
        try {
            const { error } = await this.client
                .from(window.SUPABASE_CONFIG.tablas.registros)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error eliminando registro:', error);
            return false;
        }
    },
    
    // ========== HISTORIAL ==========
    
    guardarHistorial: async function(historialData) {
        if (!this.init()) return false;
        
        try {
            const { error } = await this.client
                .from(window.SUPABASE_CONFIG.tablas.historial)
                .insert(historialData);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error guardando historial:', error);
            return false;
        }
    },
    
    // ========== APROBACIONES ==========
    
    getAprobaciones: async function() {
        if (!this.init()) return null;
        
        try {
            const { data, error } = await this.client
                .from(window.SUPABASE_CONFIG.tablas.aprobaciones)
                .select('*')
                .order('fecha', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error cargando aprobaciones:', error);
            return null;
        }
    },
    
    guardarAprobacion: async function(aprobacion) {
        if (!this.init()) return null;
        
        try {
            const { data, error } = await this.client
                .from(window.SUPABASE_CONFIG.tablas.aprobaciones)
                .upsert(aprobacion)
                .select();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error guardando aprobación:', error);
            return null;
        }
    },
    
    eliminarAprobacion: async function(id) {
        if (!this.init()) return false;
        
        try {
            const { error } = await this.client
                .from(window.SUPABASE_CONFIG.tablas.aprobaciones)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error eliminando aprobación:', error);
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
            console.error('Error cargando usuarios:', error);
            return null;
        }
    },
    
    guardarUsuario: async function(usuario) {
        if (!this.init()) return null;
        
        try {
            const { data, error } = await this.client
                .from('usuarios')
                .upsert(usuario)
                .select();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error guardando usuario:', error);
            return null;
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
            console.error('Error eliminando usuario:', error);
            return false;
        }
    },
    
    sincronizarUsuarios: async function(usuariosLocales) {
        if (!this.init()) return false;
        
        try {
            // Sincronizar cada usuario
            for (const usuario of usuariosLocales) {
                await this.guardarUsuario(usuario);
            }
            console.log('✅ Usuarios sincronizados con Supabase');
            return true;
        } catch (error) {
            console.error('Error sincronizando usuarios:', error);
            return false;
        }
    }
};

window.SupabaseClient = SupabaseClient;
console.log('✅ SupabaseClient cargado - Con funciones de usuarios');