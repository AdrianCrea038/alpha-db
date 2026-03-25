// js/main.js
let datosCargados = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando Alpha DB v9.0...');
    
    window.onStateChange = function() {
        if (TablaUI && TablaUI.actualizar) TablaUI.actualizar();
    };
    
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.value = hoy;
        fechaInput.setAttribute('max', hoy);
        fechaInput.addEventListener('change', function() {
            if (FormularioUI && FormularioUI.verificarFecha) FormularioUI.verificarFecha();
        });
    }
    
    const agregarColorBtn = document.getElementById('agregarColorBtn');
    if (agregarColorBtn && ColoresModule) {
        agregarColorBtn.addEventListener('click', () => ColoresModule.agregarGrupo());
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            if (AppState) AppState.setFiltros(e.target.value, AppState.currentSemana);
            if (TablaUI) TablaUI.actualizar();
        });
    }
    
    const clearSearch = document.getElementById('clearSearch');
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            const input = document.getElementById('searchInput');
            if (input) input.value = '';
            if (AppState) AppState.setFiltros('', AppState.currentSemana);
            if (TablaUI) TablaUI.actualizar();
        });
    }
    
    const limpiarFiltro = document.getElementById('limpiarFiltroBtn');
    if (limpiarFiltro) {
        limpiarFiltro.addEventListener('click', () => {
            const input = document.getElementById('searchInput');
            if (input) input.value = '';
            if (AppState) AppState.setFiltros('', '');
            if (TablaUI) TablaUI.actualizar();
            if (Notifications) Notifications.info('🧹 Filtros eliminados');
        });
    }
    
    cargarDatosIniciales();
    configurarEventos();
    
    setTimeout(() => {
        const container = document.getElementById('coloresContainer');
        if (container && ColoresModule && container.children.length === 0) {
            ColoresModule.agregarGrupo();
        }
    }, 100);
});

async function cargarDatosIniciales() {
    if(window.SupabaseClient && window.SupabaseClient.init && window.SupabaseClient.init()) {
        console.log('📡 Conectando a Supabase...');
        const data = await window.SupabaseClient.getRegistros();
        if(data && data.length > 0) {
            if(AppState) AppState.setRegistros(data);
            console.log(`📦 Cargados ${data.length} registros desde Supabase`);
            if(TablaUI) TablaUI.actualizar();
            return;
        }
    }
    
    const saved = localStorage.getItem('alpha_db_registros_v9');
    if(saved) {
        try {
            const data = JSON.parse(saved);
            if(AppState) {
                AppState.setRegistros(data.registros || []);
                AppState.historialEdiciones = data.historial || {};
            }
            console.log(`📦 Cargados ${AppState.registros.length} registros de localStorage`);
        } catch(e) { 
            console.error('Error cargando localStorage:', e);
            generarDatosEjemplo(); 
        }
    } else {
        generarDatosEjemplo();
    }
    
    if(TablaUI) TablaUI.actualizar();
}

function generarDatosEjemplo() {
    if(!AppState || !Utils) return;
    
    const ejemplos = [];
    const pos = ['PO-2401-001', 'PO-2401-002', 'PO-2402-015', 'PO-2402-023'];
    const procesos = ['DISEÑO', 'PLOTTER', 'SUBLIMADO', 'FLAT', 'LASER', 'BORDADO'];
    const estilos = ['LIBRE', 'MARIPOSA', 'PECHO', 'ESPALDA'];
    const telas = ['ALGODÓN', 'POLIÉSTER', 'NYLON'];
    const ahora = new Date().toISOString();
    const hoy = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < 3; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i * 2);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        ejemplos.push({
            id: Utils.generarIdUnico(),
            po: pos[i % pos.length],
            proceso: procesos[i % procesos.length],
            es_reemplazo: false,
            semana: Utils.obtenerSemana(fecha),
            fecha: fechaStr,
            estilo: estilos[i % estilos.length],
            tela: telas[i % telas.length],
            colores: [{ id:1, nombre:'ROJO', cyan:100, magenta:0, yellow:0, black:0, turquesa:0, naranja:0, fluorYellow:0, fluorPink:0 }],
            numero_plotter: 1,
            plotter_temp: 22,
            plotter_humedad: 45,
            plotter_perfil: 'MEDIO',
            monti_numero: 1,
            temperatura_monti: 180,
            velocidad_monti: 3,
            monti_presion: 2,
            temperatura_flat: 160,
            tiempo_flat: 15,
            adhesivo: 'TIPO A',
            version: 1,
            observacion: null,
            creado: ahora,
            actualizado: ahora
        });
    }
    
    AppState.setRegistros(ejemplos);
    guardarDatosLocal();
}

function guardarDatosLocal() {
    if(!AppState) return;
    try {
        const registrosParaGuardar = AppState.registros.map(reg => {
            const { historial, ...regSinHistorial } = reg;
            return regSinHistorial;
        });
        const dataToSave = {
            registros: registrosParaGuardar,
            historial: AppState.historialEdiciones
        };
        localStorage.setItem('alpha_db_registros_v9', JSON.stringify(dataToSave));
    } catch(error) {
        console.error('Error al guardar:', error);
    }
}

function configurarEventos() {
    const registroForm = document.getElementById('registroForm');
    if (registroForm && RegistrosModule) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const datos = RegistrosModule.obtenerFormulario();
            const editId = document.getElementById('editId').value;
            if (editId) {
                datos.descripcionEdicion = prompt('📝 Describe los cambios realizados:', '');
            }
            const exito = await RegistrosModule.guardar(datos);
            if (exito) {
                guardarDatosLocal();
                if (FormularioUI && FormularioUI.reset) FormularioUI.reset();
                if (TablaUI) TablaUI.actualizar();
            }
        });
    }
    
    const cancelEdit = document.getElementById('cancelEditBtn');
    if (cancelEdit && FormularioUI && FormularioUI.reset) {
        cancelEdit.addEventListener('click', () => FormularioUI.reset());
    }
    
    const exportarDB = document.getElementById('exportarDBBtn');
    if (exportarDB) {
        exportarDB.addEventListener('click', () => {
            const dataToExport = {
                sistema: "ALPHA DB",
                version: "9.0",
                registros: AppState.registros,
                historial: AppState.historialEdiciones
            };
            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {type:'application/json'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `ALPHA_DB_${new Date().toISOString().split('T')[0]}.adb`;
            a.click();
            URL.revokeObjectURL(a.href);
            Notifications.success('💾 Backup guardado');
        });
    }
    
    const importarDB = document.getElementById('importarDB');
    if (importarDB) {
        importarDB.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            if (!file.name.endsWith('.adb')) { Notifications.error('Debe ser archivo .adb'); return; }
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (!importedData.registros) throw new Error('Estructura inválida');
                    if (confirm(`¿Cargar ${importedData.registros.length} registros?`)) {
                        AppState.setRegistros(importedData.registros);
                        AppState.historialEdiciones = importedData.historial || {};
                        guardarDatosLocal();
                        if(window.SupabaseClient && window.SupabaseClient.client) {
                            for(const reg of AppState.registros) {
                                await window.SupabaseClient.guardarRegistro(reg);
                            }
                        }
                        if (FormularioUI && FormularioUI.reset) FormularioUI.reset();
                        if (TablaUI) TablaUI.actualizar();
                        Notifications.success(`📂 Cargados ${AppState.registros.length} registros`);
                    }
                } catch(error) { Notifications.error('Archivo inválido'); }
            };
            reader.readAsText(file);
            event.target.value = '';
        });
    }
    
    const exportarExcel = document.getElementById('exportarExcelBtn');
    if (exportarExcel && ExcelModule && ExcelModule.exportar) {
        exportarExcel.addEventListener('click', () => ExcelModule.exportar());
    }
    
    const imprimirReportes = document.getElementById('imprimirReportesBtn');
    if (imprimirReportes && ImpresionModule && ImpresionModule.imprimirReporte) {
        imprimirReportes.addEventListener('click', () => ImpresionModule.imprimirReporte());
    }
    
    const imprimirIndividual = document.getElementById('imprimirIndividualBtn');
    const imprimirIndividualAction = document.getElementById('imprimirIndividualBtnAction');
    if (imprimirIndividual) {
        imprimirIndividual.addEventListener('click', () => {
            const select = document.getElementById('selectRegistroImprimir');
            const modal = document.getElementById('modalImpresion');
            if(select) select.innerHTML = '<option value="">Seleccionar</option>' + AppState.registros.map(r => `<option value="${r.id}">${r.po} v${r.version}</option>`).join('');
            if(modal) modal.classList.add('show');
        });
    }
    if (imprimirIndividualAction) {
        imprimirIndividualAction.addEventListener('click', () => {
            const select = document.getElementById('selectRegistroImprimir');
            const id = select ? select.value : null;
            if (id) {
                document.getElementById('modalImpresion').classList.remove('show');
                window.imprimirEtiqueta(id);
            } else {
                Notifications.error('❌ Selecciona un registro');
            }
        });
    }
    
    // ==================== BOTÓN DE SALIR - AGREGADO ====================
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('¿Cerrar sesión?')) {
                localStorage.removeItem('alpha_db_session');
                window.location.href = 'login.html';
            }
        });
    }
}

window.editarRegistro = (id) => {
    console.log('✏️ Editando registro:', id);
    if (FormularioUI && FormularioUI.cargarParaEdicion) {
        FormularioUI.cargarParaEdicion(id);
    } else {
        console.error('FormularioUI no disponible');
        Notifications.error('Error al editar');
    }
};

window.eliminarRegistro = async (id) => {
    console.log('🗑️ Eliminando registro:', id);
    if (await RegistrosModule.eliminar(id)) {
        guardarDatosLocal();
        if (TablaUI) TablaUI.actualizar();
    }
};

window.verHistorial = (id) => {
    console.log('📋 Ver historial:', id);
    const reg = AppState.registros.find(r => r.id === id);
    if (!reg) {
        Notifications.error('Registro no encontrado');
        return;
    }
    
    const hist = AppState.historialEdiciones[id] || [];
    const modal = document.getElementById('modalHistorial');
    const container = document.getElementById('historialContainer');
    
    if (!modal || !container) return;
    
    let html = '';
    if (hist.length === 0) {
        html = '<p class="no-data" style="text-align:center; padding:20px;">📭 No hay historial de ediciones</p>';
    } else {
        html = hist.map((e, i) => `
            <div class="historial-item" style="background:#2a2a2a; border-radius:12px; padding:12px; margin-bottom:12px;">
                <div style="color:#ffd93d; margin-bottom:8px;">📅 ${new Date(e.fecha).toLocaleString()}</div>
                <div style="margin-bottom:8px;">📝 ${e.descripcion || 'Sin descripción'}</div>
                <div style="display:flex; gap:16px; flex-wrap:wrap;">
                    <div style="border-left:3px solid #ff6b6b; padding-left:8px;">
                        <div style="font-size:11px; color:#ff6b6b;">ANTERIOR</div>
                        <div>PO: ${e.anterior.po}</div>
                        <div>Proceso: ${e.anterior.proceso}</div>
                        <div>v${e.anterior.version}</div>
                    </div>
                    <div style="border-left:3px solid #4caf50; padding-left:8px;">
                        <div style="font-size:11px; color:#4caf50;">NUEVO</div>
                        <div>PO: ${e.nuevo.po}</div>
                        <div>Proceso: ${e.nuevo.proceso}</div>
                        <div>v${e.nuevo.version}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    html += `
        <div class="historial-item" style="background:#2a2a2a; border-radius:12px; padding:12px; border-left:4px solid #ffd93d;">
            <div style="color:#ffd93d;">⚡ VERSIÓN ACTUAL v${reg.version}</div>
            <div>PO: ${reg.po}</div>
            <div>Proceso: ${reg.proceso}</div>
            ${reg.observacion ? `<div>📝 ${reg.observacion}</div>` : ''}
        </div>
    `;
    
    container.innerHTML = html;
    modal.classList.add('show');
};

window.imprimirEtiqueta = (id) => {
    console.log('🖨️ Imprimiendo etiqueta para ID:', id);
    if (window.ImpresionModule && window.ImpresionModule.imprimirEtiqueta) {
        window.ImpresionModule.imprimirEtiqueta(id);
    } else {
        Notifications.error('Módulo de impresión no disponible');
    }
};

window.filtrarPorSemana = (semana) => {
    if (AppState.currentSemana == semana) {
        AppState.setFiltros(AppState.currentSearch, '');
        Notifications.info('📅 Filtro de semana eliminado');
    } else {
        AppState.setFiltros(AppState.currentSearch, semana);
        Notifications.success(`📅 Semana ${semana} seleccionada`);
    }
    if (TablaUI) TablaUI.actualizar();
};

document.querySelectorAll('.modal-close, .close-btn, .cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    });
});

window.addEventListener('click', (e) => {
    document.querySelectorAll('.modal').forEach(modal => {
        if (e.target === modal) modal.classList.remove('show');
    });
});
