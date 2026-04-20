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
        if (!fechaStr) return '-';
        try {
            const fecha = new Date(fechaStr);
            return fecha.toLocaleDateString();
        } catch (e) { return fechaStr; }
    },

    /**
     * Carga un archivo JS de forma dinámica y devuelve una promesa
     * @param {string} url - Ruta del archivo
     * @returns {Promise}
     */
    loadScript: function(url) {
        return new Promise((resolve, reject) => {
            // Si ya existe un script con esa URL, no lo cargamos de nuevo
            if (document.querySelector(`script[src="${url}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => {
                console.log(`📦 Módulo cargado dinámicamente: ${url}`);
                resolve();
            };
            script.onerror = () => reject(new Error(`Error cargando script: ${url}`));
            document.head.appendChild(script);
        });
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
    },

    tiempoTranscurrido: function(fechaStr) {
        if (!fechaStr) return '';
        const ahora = new Date();
        const pasado = new Date(fechaStr);
        const diffMs = ahora - pasado;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'HACE UN MOMENTO';
        if (diffMins < 60) return `HACE ${diffMins} MIN`;
        
        const diffHoras = Math.floor(diffMins / 60);
        if (diffHoras < 24) return `HACE ${diffHoras} HORAS`;
        
        const diffDias = Math.floor(diffHoras / 24);
        return `HACE ${diffDias} DÍAS`;
    }
};

window.Utils = Utils;
console.log('✅ Utils cargado');