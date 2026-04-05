// ============================================================
// js/core/utils.js - Utilidades generales
// ============================================================

const Utils = {
    generarIdUnico: function() {
        return 'ADB-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4).toUpperCase();
    },
    
    obtenerSemana: function(fecha) {
        const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },
    
    formatearFecha: function(fechaStr) {
        if (!fechaStr) return '';
        const fecha = new Date(fechaStr);
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}-${mes}-${anio}`;
    },
    
    safeToString: function(valor) {
        if (valor === undefined || valor === null) return '';
        return valor.toString();
    },
    
    getProcesoColor: function(proceso) {
        const colores = {
            'DISEÑO': '#A855F7',
            'PLOTTER': '#00D4FF',
            'SUBLIMADO': '#00FF88',
            'FLAT': '#F59E0B',
            'LASER': '#FF4444',
            'BORDADO': '#EC4899'
        };
        return colores[proceso] || '#8B949E';
    }
};

window.Utils = Utils;
console.log('✅ Utils cargado');