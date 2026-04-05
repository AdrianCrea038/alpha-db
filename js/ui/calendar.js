// ============================================================
// js/ui/calendar.js - Calendario de semanas (Filtro por semana)
// ============================================================

const CalendarUI = {
    // Semana actual seleccionada
    semanaSeleccionada: null,
    
    // Inicializar calendario
    init: function() {
        this.actualizar();
        this.configurarEventos();
    },
    
    // Actualizar vista del calendario
    actualizar: function() {
        const container = document.getElementById('calendarioMensualContainer');
        if (!container) return;
        
        if (!AppState.registros || AppState.registros.length === 0) {
            container.innerHTML = '<p class="no-data" style="text-align:center; padding:1rem; color:#8B949E;">📅 No hay semanas disponibles</p>';
            return;
        }
        
        // Agrupar registros por semana
        const semanasMap = this.agruparPorSemana();
        
        if (semanasMap.size === 0) {
            container.innerHTML = '<p class="no-data" style="text-align:center; padding:1rem; color:#8B949E;">📅 No hay semanas disponibles</p>';
            return;
        }
        
        // Ordenar semanas de más reciente a más antigua
        const semanasArray = Array.from(semanasMap.keys()).sort((a, b) => b - a);
        
        // Agrupar por año/mes para mejor visualización
        const agrupadoPorMes = this.agruparPorMes(semanasArray, semanasMap);
        
        // Renderizar HTML
        let html = '';
        
        for (const [mesKey, mesData] of agrupadoPorMes) {
            html += `
                <div class="mes-bloque">
                    <div class="mes-titulo">
                        <span>📅 ${mesData.nombre}</span>
                        <span class="mes-semanas-count">${mesData.semanas.length} semanas</span>
                    </div>
                    <div class="semanas-mes">
                        ${mesData.semanas.map(semana => this.renderizarSemanaChip(semana, semanasMap.get(semana))).join('')}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        // Actualizar badge de filtro activo
        this.actualizarBadgeFiltro();
    },
    
    // Agrupar registros por semana
    agruparPorSemana: function() {
        const semanasMap = new Map();
        
        AppState.registros.forEach(reg => {
            if (!reg.semana) return;
            
            const semanaNum = parseInt(reg.semana);
            if (!semanasMap.has(semanaNum)) {
                // Obtener fechas de ejemplo para la semana
                const fechaEjemplo = this.obtenerFechaDesdeSemana(semanaNum);
                semanasMap.set(semanaNum, {
                    semana: semanaNum,
                    cantidad: 0,
                    fechaInicio: fechaEjemplo,
                    año: fechaEjemplo.getFullYear()
                });
            }
            semanasMap.get(semanaNum).cantidad++;
        });
        
        return semanasMap;
    },
    
    // Obtener fecha aproximada desde número de semana
    obtenerFechaDesdeSemana: function(semanaNum) {
        // Usar el primer registro que tenga esa semana para obtener la fecha
        const registro = AppState.registros.find(r => parseInt(r.semana) === semanaNum);
        if (registro && registro.fecha) {
            return new Date(registro.fecha);
        }
        
        // Fallback: calcular fecha aproximada
        const fechaActual = new Date();
        const semanaActual = Utils.obtenerSemana(fechaActual);
        const diffSemanas = semanaNum - semanaActual;
        const fecha = new Date(fechaActual);
        fecha.setDate(fechaActual.getDate() + (diffSemanas * 7));
        return fecha;
    },
    
    // Agrupar semanas por mes para mejor visualización
    agruparPorMes: function(semanasArray, semanasMap) {
        const mesesMap = new Map();
        
        semanasArray.forEach(semanaNum => {
            const data = semanasMap.get(semanaNum);
            const fecha = data.fechaInicio;
            const año = fecha.getFullYear();
            const mes = fecha.getMonth();
            const mesKey = `${año}-${mes}`;
            const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
            
            if (!mesesMap.has(mesKey)) {
                mesesMap.set(mesKey, {
                    nombre: nombreMes,
                    semanas: []
                });
            }
            mesesMap.get(mesKey).semanas.push({
                numero: semanaNum,
                cantidad: data.cantidad,
                fecha: fecha
            });
        });
        
        // Ordenar semanas dentro de cada mes
        for (const [key, value] of mesesMap) {
            value.semanas.sort((a, b) => b.numero - a.numero);
        }
        
        // Ordenar meses de más reciente a más antiguo
        const mesesOrdenados = new Map([...mesesMap.entries()].sort((a, b) => b[0].localeCompare(a[0])));
        
        return mesesOrdenados;
    },
    
    // Renderizar chip de semana individual
    renderizarSemanaChip: function(semanaNum, data) {
        const isActive = (AppState.currentSemana === semanaNum.toString());
        const fechaInicio = data.fechaInicio;
        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaInicio.getDate() + 6);
        
        const fechaStr = `${fechaInicio.getDate()}/${fechaInicio.getMonth() + 1} - ${fechaFin.getDate()}/${fechaFin.getMonth() + 1}`;
        
        return `
            <div class="semana-chip ${isActive ? 'active' : ''}" 
                 data-semana="${semanaNum}"
                 onclick="CalendarUI.filtrarPorSemana(${semanaNum})"
                 title="Semana ${semanaNum}: ${data.cantidad} registros">
                <span class="semana-numero">Semana ${semanaNum}</span>
                <span class="semana-fecha">${fechaStr}</span>
                <span class="semana-cantidad">${data.cantidad} reg</span>
            </div>
        `;
    },
    
    // Filtrar por semana (llamada desde el onclick)
    filtrarPorSemana: function(semanaNum) {
        const semanaStr = semanaNum.toString();
        
        // Si ya está activa, limpiar filtro
        if (AppState.currentSemana === semanaStr) {
            this.limpiarFiltroSemana();
            Notifications.info(`📅 Filtro de Semana ${semanaNum} eliminado`);
        } else {
            // Aplicar nuevo filtro
            AppState.setFiltros(AppState.currentSearch, semanaStr);
            Notifications.success(`📅 Filtrado por Semana ${semanaNum}`);
        }
        
        // Actualizar UI
        this.actualizar();
        if (window.TableUI && TableUI.actualizar) {
            TableUI.actualizar();
        }
    },
    
    // Limpiar filtro de semana
    limpiarFiltroSemana: function() {
        AppState.setFiltros(AppState.currentSearch, '');
        this.actualizar();
        if (window.TableUI && TableUI.actualizar) {
            TableUI.actualizar();
        }
    },
    
    // Actualizar badge de filtro activo en la tabla
    actualizarBadgeFiltro: function() {
        const filtroBadge = document.getElementById('filtroActivo');
        if (!filtroBadge) return;
        
        if (AppState.currentSemana) {
            filtroBadge.style.display = 'inline';
            filtroBadge.innerHTML = `📅 Semana ${AppState.currentSemana}`;
        } else {
            filtroBadge.style.display = 'none';
        }
    },
    
    // Configurar eventos globales
    configurarEventos: function() {
        // Botón limpiar filtros del calendario
        const limpiarFiltroBtn = document.getElementById('limpiarFiltroBtn');
        if (limpiarFiltroBtn) {
            limpiarFiltroBtn.addEventListener('click', () => {
                this.limpiarFiltroSemana();
                // También limpiar búsqueda si existe
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.value = '';
                AppState.setFiltros('', '');
                if (window.TableUI && TableUI.actualizar) {
                    TableUI.actualizar();
                }
                Notifications.info('🧹 Todos los filtros eliminados');
            });
        }
    },
    
    // Obtener semanas disponibles (para otros módulos)
    getSemanasDisponibles: function() {
        const semanas = new Set();
        AppState.registros.forEach(reg => {
            if (reg.semana) semanas.add(parseInt(reg.semana));
        });
        return Array.from(semanas).sort((a, b) => b - a);
    },
    
    // Obtener rango de fechas de una semana
    getRangoSemana: function(semanaNum) {
        const registro = AppState.registros.find(r => parseInt(r.semana) === semanaNum);
        if (registro && registro.fecha) {
            const fechaInicio = new Date(registro.fecha);
            // Encontrar el lunes de esa semana
            const dia = fechaInicio.getDay();
            const diff = dia === 0 ? 6 : dia - 1;
            fechaInicio.setDate(fechaInicio.getDate() - diff);
            const fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaInicio.getDate() + 6);
            return {
                inicio: fechaInicio,
                fin: fechaFin,
                inicioStr: Utils.formatearFecha(fechaInicio.toISOString().split('T')[0]),
                finStr: Utils.formatearFecha(fechaFin.toISOString().split('T')[0])
            };
        }
        return null;
    }
};

// Agregar estilos adicionales para el calendario
const styleCalendar = document.createElement('style');
styleCalendar.textContent = `
    .semana-chip {
        background: #21262D;
        border: 1px solid rgba(0, 212, 255, 0.3);
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        min-width: 100px;
    }
    
    .semana-chip:hover {
        background: rgba(0, 212, 255, 0.1);
        border-color: #00D4FF;
        transform: translateY(-2px);
    }
    
    .semana-chip.active {
        background: linear-gradient(135deg, #00D4FF, #0099CC);
        border-color: transparent;
    }
    
    .semana-chip.active .semana-numero,
    .semana-chip.active .semana-fecha,
    .semana-chip.active .semana-cantidad {
        color: #0D1117;
    }
    
    .semana-numero {
        font-size: 0.75rem;
        font-weight: 700;
        color: #00D4FF;
    }
    
    .semana-chip.active .semana-numero {
        color: #0D1117;
    }
    
    .semana-fecha {
        font-size: 0.6rem;
        color: #8B949E;
    }
    
    .semana-cantidad {
        font-size: 0.55rem;
        color: #8B949E;
        background: rgba(0, 212, 255, 0.15);
        padding: 0.1rem 0.4rem;
        border-radius: 10px;
    }
    
    .semana-chip.active .semana-cantidad {
        background: rgba(13, 17, 23, 0.3);
        color: #0D1117;
    }
    
    .mes-bloque {
        margin-bottom: 1rem;
    }
    
    .mes-titulo {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        padding-bottom: 0.25rem;
        border-bottom: 1px solid rgba(0, 212, 255, 0.2);
        font-size: 0.7rem;
        color: #00D4FF;
        font-weight: 600;
    }
    
    .mes-semanas-count {
        font-size: 0.6rem;
        color: #8B949E;
        background: #21262D;
        padding: 0.15rem 0.5rem;
        border-radius: 12px;
    }
    
    .semanas-mes {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    
    .calendario-mensual {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .calendario-mensual::-webkit-scrollbar {
        width: 4px;
    }
    
    .calendario-mensual::-webkit-scrollbar-track {
        background: #0D1117;
    }
    
    .calendario-mensual::-webkit-scrollbar-thumb {
        background: #00D4FF;
        border-radius: 4px;
    }
`;

if (!document.getElementById('calendarStyles')) {
    styleCalendar.id = 'calendarStyles';
    document.head.appendChild(styleCalendar);
}

window.CalendarUI = CalendarUI;
console.log('✅ CalendarUI cargado - Filtro por semana funcional');