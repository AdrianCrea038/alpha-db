// js/core/notifications.js
const Notifications = {
    mostrar: function(mensaje, tipo = 'success') {
        // Eliminar notificación existente para evitar acumulación
        const existing = document.querySelector('.alpha-notification');
        if (existing) existing.remove();
        
        const notificacion = document.createElement('div');
        notificacion.className = 'alpha-notification';
        
        const colores = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        
        const iconos = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        
        notificacion.innerHTML = `${iconos[tipo] || '✅'} ${mensaje}`;
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 0.8rem 1.5rem;
            background: ${colores[tipo] || colores.success};
            color: white;
            border-radius: 0.5rem;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-weight: 500;
            font-family: 'Rubik', sans-serif;
            font-size: 0.9rem;
            pointer-events: none;
        `;
        
        document.body.appendChild(notificacion);
        
        setTimeout(() => {
            if (notificacion && notificacion.parentNode) {
                notificacion.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notificacion.parentNode) notificacion.remove();
                }, 300);
            }
        }, 3000);
    },
    
    success: function(msg) { this.mostrar(msg, 'success'); },
    error: function(msg) { this.mostrar(msg, 'error'); },
    info: function(msg) { this.mostrar(msg, 'info'); },
    warning: function(msg) { this.mostrar(msg, 'warning'); }
};

// Asegurar que las animaciones existan
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

window.Notifications = Notifications;
console.log('✅ Notifications cargado correctamente');
