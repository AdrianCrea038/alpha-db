// ============================================================
// js/ui/calendar.js - Calendario de semanas (Filtro por semana)
// Versión simple y funcional - Desde cero
// ============================================================

const CalendarUI = {
    
    // Actualizar el calendario
    actualizar: function() {
        const container = document.getElementById('calendarioMensualContainer');
        if (!container) return;
        
        // Verificar que hay registros
        if (!AppState.registros || AppState.registros.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:1rem; color:#8B949E;">📅 No hay registros</div>';
            return;
        }
        
        // Obtener semanas únicas de los registros
        const semanasSet = new Set();
        AppState.registros.forEach(reg => {
            if (reg.semana) {
                semanasSet.add(parseInt(reg.semana));
            }
        });
        
        if (semanasSet.size === 0) {
            container.innerHTML = '<div style="text-align:center; padding:1rem; color:#8B949E;">📅 No hay semanas disponibles</div>';
            return;
        }
        
        // Convertir a array y ordenar (más reciente primero)
        const semanas = Array.from(semanasSet).sort((a, b) => b - a);
        
        // Generar HTML
        let html = '<div style="display: flex; flex-wrap: wrap; gap: 8px;">';
        
        semanas.forEach(semana => {
            // Contar cuántos registros tienen esta semana
            const cantidad = AppState.registros.filter(r => parseInt(r.semana) === semana).length;
            
            // Verificar si esta semana es la que está activa en el filtro
            const isActive = (AppState.currentSemana === semana.toString());
            
            // Estilo del botón según si está activo o no
            const activeClass = isActive ? 'active' : '';
            
            html += `
                <div class="semana-boton ${activeClass}" 
                     onclick="CalendarUI.filtrarPorSemana(${semana})"
                     style="
                        background: ${isActive ? 'linear-gradient(135deg, #00D4FF, #0099CC)' : '#21262D'};
                        border: 1px solid ${isActive ? 'transparent' : 'rgba(0, 212, 255, 0.3)'};
                        border-radius: 8px;
                        padding: 8px 12px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        text-align: center;
                        min-width: 80px;
                     "
                     onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,212,255,0.2)';"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <div style="font-weight: 700; font-size: 0.8rem; color: ${isActive ? '#0D1117' : '#00D4FF'};">Semana ${semana}</div>
                    <div style="font-size: 0.65rem; color: ${isActive ? '#0D1117' : '#8B949E'};">${cantidad} registro${cantidad !== 1 ? 's' : ''}</div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Actualizar badge de filtro
        this.actualizarBadge();
    },
    
    // Filtrar por semana
    filtrarPorSemana: function(semana) {
        const semanaStr = semana.toString();
        
        // Si ya está activo, limpiar filtro
        if (AppState.currentSemana === semanaStr) {
            AppState.setFiltros(AppState.currentSearch, '');
            if (window.Notifications) Notifications.info(`📅 Filtro de Semana ${semana} eliminado`);
        } else {
            AppState.setFiltros(AppState.currentSearch, semanaStr);
            if (window.Notifications) Notifications.success(`📅 Mostrando Semana ${semana}`);
        }
        
        // Actualizar UI
        this.actualizar();
        if (window.TableUI && TableUI.actualizar) {
            TableUI.actualizar();
        }
    },
    
    // Limpiar todos los filtros
    limpiarFiltros: function() {
        AppState.setFiltros('', '');
        this.actualizar();
        if (window.TableUI && TableUI.actualizar) {
            TableUI.actualizar();
        }
        if (window.Notifications) Notifications.info('🧹 Filtros eliminados');
    },
    
    // Actualizar badge en la tabla
    actualizarBadge: function() {
        const filtroBadge = document.getElementById('filtroActivo');
        if (!filtroBadge) return;
        
        if (AppState.currentSemana) {
            filtroBadge.style.display = 'inline';
            filtroBadge.innerHTML = `📅 Semana ${AppState.currentSemana}`;
        } else {
            filtroBadge.style.display = 'none';
        }
    },
    
    // Configurar eventos
    configurarEventos: function() {
        const limpiarBtn = document.getElementById('limpiarFiltroBtn');
        if (limpiarBtn) {
            // Remover eventos anteriores para evitar duplicados
            const nuevoBtn = limpiarBtn.cloneNode(true);
            limpiarBtn.parentNode.replaceChild(nuevoBtn, limpiarBtn);
            nuevoBtn.addEventListener('click', () => this.limpiarFiltros());
        }
    },
    
    // Inicializar
    init: function() {
        this.actualizar();
        this.configurarEventos();
    }
};

// Agregar estilos globales para el calendario (una sola vez)
if (!document.getElementById('calendarSimpleStyles')) {
    const style = document.createElement('style');
    style.id = 'calendarSimpleStyles';
    style.textContent = `
        .semana-boton {
            background: #21262D;
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 8px;
            padding: 8px 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
            min-width: 80px;
        }
        .semana-boton:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
            background: rgba(0, 212, 255, 0.1);
        }
        .semana-boton.active {
            background: linear-gradient(135deg, #00D4FF, #0099CC);
            border-color: transparent;
        }
        .semana-boton.active div:first-child {
            color: #0D1117;
        }
        .semana-boton.active div:last-child {
            color: #0D1117;
        }
    `;
    document.head.appendChild(style);
}

window.CalendarUI = CalendarUI;
console.log('✅ CalendarUI cargado - Versión simple y funcional');