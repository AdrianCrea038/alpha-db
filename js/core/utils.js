// js/core/utils.js
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
            'DISEÑO': '#9c27b0',
            'PLOTTER': '#2196f3',
            'SUBLIMADO': '#ff9800',
            'FLAT': '#4caf50',
            'LASER': '#f44336',
            'BORDADO': '#795548'
        };
        return colores[proceso] || '#6b5bff';
    }
};

window.Utils = Utils;
console.log('✅ Utils cargado');