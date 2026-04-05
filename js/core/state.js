// ============================================================
// js/core/state.js - Estado Global de la Aplicación
// Versión con MIGRACIÓN de tela a NK
// ============================================================

const AppState = {
    registros: [],
    historialEdiciones: {},
    currentSearch: '',
    currentSemana: '',
    editandoId: null,
    contadorColores: 1,
    modoActual: 'completo',
    
    migrarRegistro: function(registro) {
        if (!registro) return registro;
        
        if (registro.nks && Array.isArray(registro.nks) && registro.nks.length > 0) {
            return registro;
        }
        
        const registrosMigrado = { ...registro };
        
        if (!registrosMigrado.nks || !Array.isArray(registrosMigrado.nks)) {
            registrosMigrado.nks = [];
        }
        
        if (registrosMigrado.telas && registrosMigrado.telas.length > 0) {
            registrosMigrado.nks = registrosMigrado.telas.map(tela => ({
                nk: tela.nombre || 'SIN NK',
                colores: tela.colores || []
            }));
            delete registrosMigrado.telas;
        }
        else if (registrosMigrado.tela || (registrosMigrado.colores && registrosMigrado.colores.length > 0)) {
            const nombreNk = registrosMigrado.tela || 'SIN NK';
            const coloresAntiguos = registrosMigrado.colores || [];
            const coloresMigrados = coloresAntiguos.map(color => ({
                id: color.id || Math.floor(Math.random() * 10000),
                nombre: color.nombre || 'SIN NOMBRE',
                cyan: color.cyan || 0,
                magenta: color.magenta || 0,
                yellow: color.yellow || 0,
                black: color.black || 0,
                turquesa: color.turquesa || 0,
                naranja: color.naranja || 0,
                fluorYellow: color.fluorYellow || 0,
                fluorPink: color.fluorPink || 0
            }));
            registrosMigrado.nks.push({ nk: nombreNk, colores: coloresMigrados });
            delete registrosMigrado.tela;
            delete registrosMigrado.colores;
        }
        
        if (registrosMigrado.nks.length === 0) {
            registrosMigrado.nks = [];
        }
        
        return registrosMigrado;
    },
    
    migrarRegistros: function(registros) {
        if (!registros || !Array.isArray(registros)) return [];
        return registros.map(reg => this.migrarRegistro(reg));
    },
    
    setRegistros: function(data) {
        this.registros = this.migrarRegistros(data || []);
        this._notifyChange();
        console.log(`🔄 Migración completada: ${this.registros.length} registros en nuevo formato (NK)`);
    },
    
    addRegistro: function(registro) {
        const registroMigrado = this.migrarRegistro(registro);
        this.registros.unshift(registroMigrado);
        this._notifyChange();
    },
    
    updateRegistro: function(id, registro) {
        const index = this.registros.findIndex(r => r.id === id);
        if (index !== -1) {
            const registroMigrado = this.migrarRegistro(registro);
            this.registros[index] = registroMigrado;
            this._notifyChange();
        }
    },
    
    deleteRegistro: function(id) {
        this.registros = this.registros.filter(r => r.id !== id);
        delete this.historialEdiciones[id];
        this._notifyChange();
    },
    
    getRegistroById: function(id) {
        const registro = this.registros.find(r => r.id === id);
        return registro ? this.migrarRegistro(registro) : null;
    },
    
    setFiltros: function(search, semana) {
        this.currentSearch = search || '';
        this.currentSemana = semana || '';
        this._notifyChange();
    },
    
    getRegistrosFiltrados: function() {
        let filtrados = [...this.registros];
        
        if (this.currentSemana) {
            const semanaNum = parseInt(this.currentSemana);
            filtrados = filtrados.filter(r => parseInt(r.semana) === semanaNum);
        }
        
        if (this.currentSearch) {
            const termino = this.currentSearch.toLowerCase().trim();
            filtrados = filtrados.filter(reg => {
                let texto = `${reg.po} ${reg.proceso} ${reg.estilo}`;
                if (reg.nks && reg.nks.length > 0) {
                    reg.nks.forEach(nk => {
                        texto += ` ${nk.nk}`;
                        if (nk.colores) {
                            nk.colores.forEach(c => texto += ` ${c.nombre}`);
                        }
                    });
                }
                texto += ` ${reg.adhesivo || ''}`;
                return texto.toLowerCase().includes(termino);
            });
        }
        
        return filtrados;
    },
    
    addHistorialEntry: function(id, entry) {
        if (!this.historialEdiciones[id]) {
            this.historialEdiciones[id] = [];
        }
        this.historialEdiciones[id].push(entry);
        this._notifyChange();
    },
    
    getHistorial: function(id) {
        return this.historialEdiciones[id] || [];
    },
    
    limpiarFiltros: function() {
        this.currentSearch = '';
        this.currentSemana = '';
        this._notifyChange();
    },
    
    tieneFiltroActivo: function() {
        return this.currentSearch !== '' || this.currentSemana !== '';
    },
    
    getInfoFiltro: function() {
        let info = '';
        if (this.currentSemana) info += `Semana ${this.currentSemana}`;
        if (this.currentSearch) info += `${info ? ' + ' : ''}Búsqueda: "${this.currentSearch}"`;
        return info || 'Sin filtros';
    },
    
    _notifyChange: function() {
        if (window.onStateChange) {
            window.onStateChange();
        }
    }
};

window.AppState = AppState;
console.log('✅ AppState cargado - Con migración automática de TELA a NK');