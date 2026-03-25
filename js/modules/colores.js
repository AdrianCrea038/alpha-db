// js/modules/colores.js
const ColoresModule = {
    contador: 1,
    
    agregarGrupo: function(nombreColor = '', cyan = 0, magenta = 0, yellow = 0, black = 0, 
                           turquesa = 0, naranja = 0, fluorYellow = 0, fluorPink = 0) {
        const container = document.getElementById('coloresContainer');
        const nuevoId = this.contador++;
        
        const colorGroup = document.createElement('div');
        colorGroup.className = 'color-grupo';
        colorGroup.dataset.id = nuevoId;
        
        colorGroup.innerHTML = `
            <div class="color-header">
                <span class="color-titulo">🎨 ESPECIFICACIÓN DE COLOR ${nuevoId}</span>
                <button type="button" class="btn-eliminar-color" onclick="ColoresModule.eliminar(this)">✕</button>
            </div>
            <div class="color-nombre-grupo">
                <input type="text" id="color_nombre_${nuevoId}" placeholder="NOMBRE DEL COLOR" value="${nombreColor.replace(/[&<>]/g, function(m){return m==='&'?'&amp;':m==='<'?'&lt;':'&gt;';})}" class="input-bonito">
            </div>
            <div class="color-valores-grid">
                <div class="color-valor-item"><label>CYAN (C)</label><input type="number" id="color_cyan_${nuevoId}" step="0.1" min="0" max="100" value="${cyan}" class="input-color"></div>
                <div class="color-valor-item"><label>MAGENTA (M)</label><input type="number" id="color_magenta_${nuevoId}" step="0.1" min="0" max="100" value="${magenta}" class="input-color"></div>
                <div class="color-valor-item"><label>YELLOW (Y)</label><input type="number" id="color_yellow_${nuevoId}" step="0.1" min="0" max="100" value="${yellow}" class="input-color"></div>
                <div class="color-valor-item"><label>BLACK (K)</label><input type="number" id="color_black_${nuevoId}" step="0.1" min="0" max="100" value="${black}" class="input-color"></div>
            </div>
            <div style="margin-top: 0.8rem; font-size: 0.8rem; color: #ffd93d; text-align: center;">COLORES EXTRAS</div>
            <div class="color-valores-grid" style="margin-top: 0.5rem;">
                <div class="color-valor-item"><label style="color: #40e0d0;">TURQUESA</label><input type="number" id="color_turquesa_${nuevoId}" step="0.1" min="0" max="100" value="${turquesa}" class="input-color"></div>
                <div class="color-valor-item"><label style="color: #ffa500;">NARANJA</label><input type="number" id="color_naranja_${nuevoId}" step="0.1" min="0" max="100" value="${naranja}" class="input-color"></div>
                <div class="color-valor-item"><label style="color: #ffff00;">FLUOR YELLOW</label><input type="number" id="color_fluoryellow_${nuevoId}" step="0.1" min="0" max="100" value="${fluorYellow}" class="input-color"></div>
                <div class="color-valor-item"><label style="color: #ff69b4;">FLUOR PINK</label><input type="number" id="color_fluorpink_${nuevoId}" step="0.1" min="0" max="100" value="${fluorPink}" class="input-color"></div>
            </div>
        `;
        
        container.appendChild(colorGroup);
    },
    
    eliminar: function(btn) {
        if (confirm('¿Eliminar este grupo de color?')) {
            const grupo = btn.closest('.color-grupo');
            if (grupo) grupo.remove();
        }
    },
    
    obtenerDelFormulario: function() {
        const grupos = document.querySelectorAll('.color-grupo');
        const colores = [];
        
        grupos.forEach(grupo => {
            const id = grupo.dataset.id;
            colores.push({
                id: parseInt(id),
                nombre: document.getElementById(`color_nombre_${id}`)?.value || '',
                cyan: parseFloat(document.getElementById(`color_cyan_${id}`)?.value) || 0,
                magenta: parseFloat(document.getElementById(`color_magenta_${id}`)?.value) || 0,
                yellow: parseFloat(document.getElementById(`color_yellow_${id}`)?.value) || 0,
                black: parseFloat(document.getElementById(`color_black_${id}`)?.value) || 0,
                turquesa: parseFloat(document.getElementById(`color_turquesa_${id}`)?.value) || 0,
                naranja: parseFloat(document.getElementById(`color_naranja_${id}`)?.value) || 0,
                fluorYellow: parseFloat(document.getElementById(`color_fluoryellow_${id}`)?.value) || 0,
                fluorPink: parseFloat(document.getElementById(`color_fluorpink_${id}`)?.value) || 0
            });
        });
        
        return colores;
    },
    
    cargarEnFormulario: function(colores) {
        const container = document.getElementById('coloresContainer');
        container.innerHTML = '';
        this.contador = 1;
        
        if (colores && colores.length > 0) {
            colores.forEach(color => {
                this.agregarGrupo(
                    color.nombre, color.cyan, color.magenta, color.yellow, color.black,
                    color.turquesa, color.naranja, color.fluorYellow, color.fluorPink
                );
            });
        } else {
            this.agregarGrupo();
        }
    }
};

window.ColoresModule = ColoresModule;
console.log('✅ ColoresModule cargado');