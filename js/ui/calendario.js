// js/ui/calendario.js
const CalendarioUI = {
    actualizar: function() {
        const container = document.getElementById('calendarioMensualContainer');
        if (!container) return;
        
        if (!AppState.registros || AppState.registros.length === 0) {
            container.innerHTML = '<p class="no-data">📅 Sin semanas</p>';
            return;
        }
        
        const mesesMap = new Map();
        
        AppState.registros.forEach(reg => {
            if (!reg.fecha) return;
            const fecha = new Date(reg.fecha);
            const año = fecha.getFullYear();
            const mes = fecha.getMonth();
            const mesKey = `${año}-${mes}`;
            const nombreMes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
            
            if (!mesesMap.has(mesKey)) {
                mesesMap.set(mesKey, {
                    nombre: nombreMes,
                    semanas: new Set()
                });
            }
            mesesMap.get(mesKey).semanas.add(reg.semana);
        });
        
        const mesesArray = Array.from(mesesMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
        let html = '';
        
        for (let i = 0; i < mesesArray.length; i += 3) {
            const grupoMeses = mesesArray.slice(i, i + 3);
            grupoMeses.forEach(([key, mes]) => {
                const semanasArray = Array.from(mes.semanas).sort((a, b) => a - b);
                html += `
                    <div class="mes-bloque">
                        <div class="mes-titulo">
                            <span>${mes.nombre}</span>
                            <span>${semanasArray.length}</span>
                        </div>
                        <div class="semanas-mes">
                            ${semanasArray.map(semana => `
                                <span class="semana-mes-chip ${AppState.currentSemana == semana ? 'active' : ''}" 
                                      onclick="window.filtrarPorSemana('${semana}')">${semana}</span>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        }
        
        container.innerHTML = html;
    }
};

window.CalendarioUI = CalendarioUI;
console.log('✅ CalendarioUI cargado');