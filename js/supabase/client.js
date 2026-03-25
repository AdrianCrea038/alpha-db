// js/supabase/client.js
const SupabaseClient = {
    client: null,
    initialized: false,
    
    init: function() {
        if (this.initialized && this.client) return true;
        
        if (!window.SUPABASE_CONFIG) {
            console.warn('⚠️ SUPABASE_CONFIG no definido, usando modo offline');
            return false;
        }
        
        if (!window.supabase) {
            console.warn('⚠️ Librería Supabase no cargada, usando modo offline');
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
            console.error('❌ Error inicializando Supabase:', error);
            return false;
        }
    },
    
    getRegistros: async function() {
        if (!this.init()) return null;
        
        try {
            const { data, error } = await this.client
                .from(window.SUPABASE_CONFIG.tabla)
                .select('*')
                .order('creado', { ascending: false });
            
            if (error) {
                console.error('Error cargando registros:', error);
                return null;
            }
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
                .from(window.SUPABASE_CONFIG.tabla)
                .upsert(registro)
                .select();
            
            if (error) {
                console.error('Error guardando registro:', error);
                return null;
            }
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
                .from(window.SUPABASE_CONFIG.tabla)
                .delete()
                .eq('id', id);
            
            if (error) {
                console.error('Error eliminando registro:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error en eliminarRegistro:', error);
            return false;
        }
    },
    
    guardarHistorial: async function(historialData) {
        if (!this.init()) return false;
        
        try {
            const { error } = await this.client
                .from(window.SUPABASE_CONFIG.tablaHistorial)
                .insert(historialData);
            
            if (error) {
                console.error('Error guardando historial:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error en guardarHistorial:', error);
            return false;
        }
    }
};

window.SupabaseClient = SupabaseClient;
console.log('✅ SupabaseClient cargado correctamente');
