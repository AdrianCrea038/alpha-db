// ============================================================
// js/config/supabase.js - Configuración de Supabase
// ============================================================

const SUPABASE_CONFIG = {
    url: "https://ofhkwhrelrdbqiaffkna.supabase.co",
    anonKey: "sb_publishable_-ohMnlFIugkBUxP1M2hGsQ_cbYhDpt6",
    tablas: {
        registros: "registros",
        historial: "historial",
        aprobaciones: "aprobaciones"
    }
};

// Exportar globalmente
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
console.log('✅ Supabase configurado correctamente');