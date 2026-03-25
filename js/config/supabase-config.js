// js/config/supabase-config.js
const SUPABASE_CONFIG = {
    url: "https://ofhkwhrelrdbqiaffkna.supabase.co",
    anonKey: "sb_publishable_-ohMnlFIugkBUxP1M2hGsQ_cbYhDpt6",
    tabla: "registros",
    tablaHistorial: "historial"
};

// Asegurar que esté disponible globalmente
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}

console.log('✅ Supabase configurado correctamente');
console.log('📌 URL:', SUPABASE_CONFIG.url);;
