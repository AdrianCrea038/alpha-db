// ============================================================
// js/modules/colors.js - Gestión de NK y Colores
// Estructura: Cada NK (código alfanumérico) contiene múltiples COLORES (CMYK)
// ============================================================

const ColorsModule = {
    contadorNks: 1,
    contadorColores: 1,
    
    agregarGrupoTela: function(nombreNk = '', colores = []) {
        const container = document.getElementById('coloresContainer');
        if (!container) return;
        
        const nkId = this.contadorNks++;
        
        const nkGroup = document.createElement('div');
        nkGroup.className = 'tela-grupo';
        nkGroup.dataset.nkId = nkId;
        
        nkGroup.innerHTML = `
            <div class="tela-header">
                <div class="tela-titulo">
                    <span class="tela-icono">🧵</span>
                    <input type="text" class="tela-nombre-input" id="nk_nombre_${nkId}" placeholder="CÓDIGO NK (ej: NK-ALG-001)" value="${escapeHtml(nombreNk)}" style="background:#0D1117; border:1px solid #00D4FF; border-radius:6px; padding:0.4rem 0.7rem; color:white; width:200px;">
                </div>
                <button type="button" class="btn-eliminar-tela" onclick="ColorsModule.eliminarTela(this)" title="Eliminar esta NK">✕</button>
            </div>
            <div class="colores-container" id="colores_nk_${nkId}" style="margin-left: 1.5rem; margin-top: 0.5rem;"></div>
            <div class="agregar-color-tela">
                <button type="button" class="btn-agregar-color-en-tela" onclick="ColorsModule.agregarColorANk(${nkId})">➕ AGREGAR COLOR A ESTA NK</button>
            </div>
        `;
        
        container.appendChild(nkGroup);
        
        if (colores && colores.length > 0) {
            colores.forEach(color => {
                this.agregarColorANk(nkId, color.nombre, color.cyan, color.magenta, color.yellow, color.black, 
                                       color.turquesa, color.naranja, color.fluorYellow, color.fluorPink);
            });
        } else {
            this.agregarColorANk(nkId);
        }
    },
    
    agregarColorANk: function(nkId, nombreColor = '', cyan = 0, magenta = 0, yellow = 0, black = 0,
                                turquesa = 0, naranja = 0, fluorYellow = 0, fluorPink = 0) {
        const container = document.getElementById(`colores_nk_${nkId}`);
        if (!container) return;
        
        const colorId = this.contadorColores++;
        
        const colorDiv = document.createElement('div');
        colorDiv.className = 'color-item';
        colorDiv.dataset.colorId = colorId;
        
        colorDiv.innerHTML = `
            <div class="color-item-header">
                <span class="color-icono">🎨</span>
                <input type="text" class="color-nombre-input" id="color_nombre_${nkId}_${colorId}" placeholder="NOMBRE DEL COLOR" value="${escapeHtml(nombreColor)}" style="background:#0D1117; border:1px solid #00D4FF; border-radius:6px; padding:0.3rem 0.6rem; color:white; width:150px;">
                <button type="button" class="btn-eliminar-color" onclick="ColorsModule.eliminarColor(this)" title="Eliminar este color">✕</button>
            </div>
            <div class="color-valores-grid">
                <div class="color-valor-item"><label>CYAN (C)</label><input type="number" id="color_cyan_${nkId}_${colorId}" step="0.1" min="0" max="100" value="${cyan}" class="input-color"></div>
                <div class="color-valor-item"><label>MAGENTA (M)</label><input type="number" id="color_magenta_${nkId}_${colorId}" step="0.1" min="0" max="100" value="${magenta}" class="input-color"></div>
                <div class="color-valor-item"><label>YELLOW (Y)</label><input type="number" id="color_yellow_${nkId}_${colorId}" step="0.1" min="0" max="100" value="${yellow}" class="input-color"></div>
                <div class="color-valor-item"><label>BLACK (K)</label><input type="number" id="color_black_${nkId}_${colorId}" step="0.1" min="0" max="100" value="${black}" class="input-color"></div>
                <div class="color-valor-item"><label style="color:#00D4FF;">TURQUESA</label><input type="number" id="color_turquesa_${nkId}_${colorId}" step="0.1" min="0" max="100" value="${turquesa}" class="input-color"></div>
                <div class="color-valor-item"><label style="color:#F59E0B;">NARANJA</label><input type="number" id="color_naranja_${nkId}_${colorId}" step="0.1" min="0" max="100" value="${naranja}" class="input-color"></div>
                <div class="color-valor-item"><label style="color:#FFE155;">FLUOR YELLOW</label><input type="number" id="color_fluoryellow_${nkId}_${colorId}" step="0.1" min="0" max="100" value="${fluorYellow}" class="input-color"></div>
                <div class="color-valor-item"><label style="color:#FF69B4;">FLUOR PINK</label><input type="number" id="color_fluorpink_${nkId}_${colorId}" step="0.1" min="0" max="100" value="${fluorPink}" class="input-color"></div>
            </div>
        `;
        
        container.appendChild(colorDiv);
    },
    
    eliminarTela: function(btn) {
        if (confirm('¿Eliminar esta NK y todos sus colores?')) {
            const nkGroup = btn.closest('.tela-grupo');
            if (nkGroup) nkGroup.remove();
        }
    },
    
    eliminarColor: function(btn) {
        if (confirm('¿Eliminar este color?')) {
            const colorItem = btn.closest('.color-item');
            if (colorItem) colorItem.remove();
        }
    },
    
    obtenerDelFormulario: function() {
        const nkGrupos = document.querySelectorAll('.tela-grupo');
        const nks = [];
        
        nkGrupos.forEach(nkGroup => {
            const nkId = nkGroup.dataset.nkId;
            const nombreNk = document.getElementById(`nk_nombre_${nkId}`)?.value || '';
            
            const colores = [];
            const coloresContainer = document.getElementById(`colores_nk_${nkId}`);
            if (coloresContainer) {
                const colorItems = coloresContainer.querySelectorAll('.color-item');
                colorItems.forEach(colorItem => {
                    const inputs = colorItem.querySelectorAll('input[type="text"], input[type="number"]');
                    if (inputs.length > 0) {
                        const nombreInput = colorItem.querySelector('.color-nombre-input');
                        const idParts = nombreInput?.id.split('_') || [];
                        const nkIdActual = idParts[2];
                        const colorIdActual = idParts[3];
                        
                        if (nkIdActual && colorIdActual) {
                            colores.push({
                                id: parseInt(colorIdActual),
                                nombre: document.getElementById(`color_nombre_${nkIdActual}_${colorIdActual}`)?.value || '',
                                cyan: parseFloat(document.getElementById(`color_cyan_${nkIdActual}_${colorIdActual}`)?.value) || 0,
                                magenta: parseFloat(document.getElementById(`color_magenta_${nkIdActual}_${colorIdActual}`)?.value) || 0,
                                yellow: parseFloat(document.getElementById(`color_yellow_${nkIdActual}_${colorIdActual}`)?.value) || 0,
                                black: parseFloat(document.getElementById(`color_black_${nkIdActual}_${colorIdActual}`)?.value) || 0,
                                turquesa: parseFloat(document.getElementById(`color_turquesa_${nkIdActual}_${colorIdActual}`)?.value) || 0,
                                naranja: parseFloat(document.getElementById(`color_naranja_${nkIdActual}_${colorIdActual}`)?.value) || 0,
                                fluorYellow: parseFloat(document.getElementById(`color_fluoryellow_${nkIdActual}_${colorIdActual}`)?.value) || 0,
                                fluorPink: parseFloat(document.getElementById(`color_fluorpink_${nkIdActual}_${colorIdActual}`)?.value) || 0
                            });
                        }
                    }
                });
            }
            
            nks.push({
                nk: nombreNk,
                colores: colores
            });
        });
        
        return nks;
    },
    
    cargarEnFormulario: function(nks) {
        const container = document.getElementById('coloresContainer');
        if (!container) return;
        
        container.innerHTML = '';
        this.contadorNks = 1;
        this.contadorColores = 1;
        
        if (nks && nks.length > 0) {
            nks.forEach(nk => {
                this.agregarGrupoTela(nk.nk, nk.colores || []);
            });
        } else {
            this.agregarGrupoTela('', []);
        }
    },
    
    limpiar: function() {
        const container = document.getElementById('coloresContainer');
        if (container) {
            container.innerHTML = '';
            this.contadorNks = 1;
            this.contadorColores = 1;
            this.agregarGrupoTela('', []);
        }
    }
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

if (!document.getElementById('telasColoresStyles')) {
    const style = document.createElement('style');
    style.id = 'telasColoresStyles';
    style.textContent = `
        .tela-grupo {
            background: #0D1117;
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
            border: 2px solid rgba(0, 212, 255, 0.3);
        }
        .tela-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.8rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid rgba(0, 212, 255, 0.2);
        }
        .tela-titulo {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .tela-icono {
            font-size: 1.2rem;
        }
        .btn-eliminar-tela {
            background: #21262D;
            border: 2px solid #FF4444;
            color: #FF4444;
            width: 1.8rem;
            height: 1.8rem;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 700;
        }
        .btn-eliminar-tela:hover {
            background: #FF4444;
            color: white;
            transform: rotate(90deg);
        }
        .color-item {
            background: #161B22;
            border-radius: 8px;
            padding: 0.8rem;
            margin-bottom: 0.8rem;
            border: 1px solid rgba(0, 212, 255, 0.2);
        }
        .color-item-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        .color-icono {
            font-size: 1rem;
        }
        .btn-eliminar-color {
            background: #21262D;
            border: 1px solid #FF4444;
            color: #FF4444;
            width: 1.5rem;
            height: 1.5rem;
            border-radius: 50%;
            cursor: pointer;
            font-size: 0.7rem;
        }
        .btn-eliminar-color:hover {
            background: #FF4444;
            color: white;
        }
        .agregar-color-tela {
            text-align: center;
            margin-top: 0.5rem;
        }
        .btn-agregar-color-en-tela {
            background: linear-gradient(90deg, #00D4FF, #0099CC);
            border-radius: 20px;
            padding: 0.3rem 1rem;
            font-size: 0.7rem;
            border: none;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-agregar-color-en-tela:hover {
            transform: translateY(-2px);
        }
        .color-valores-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        @media (max-width: 768px) {
            .color-valores-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    `;
    document.head.appendChild(style);
}

window.ColorsModule = ColorsModule;
console.log('✅ ColorsModule actualizado - Estructura NK → COLORES');