// ============================================================
// js/main.js - Punto de entrada principal
// ============================================================

// --- FUNCIONES GLOBALES DE CARGA (Lazy Loading) ---
window.imprimirEtiqueta = function(id) {
    if (window.PrintingModule) {
        window.PrintingModule.imprimirEtiqueta(id);
    } else {
        console.error('PrintingModule no cargado');
    }
};

window.exportarExcel = async function() {
    if (!window.ExcelModule) {
        try {
            if (window.Notifications) Notifications.info('📥 Cargando Excel...');
            await Utils.loadScript('js/modules/excel.js');
            await new Promise(r => setTimeout(r, 150));
        } catch (e) { return; }
    }
    if (window.ExcelModule) window.ExcelModule.exportar();
};


document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando Alpha DB v10.0...');
    
    window.onStateChange = function() {
        if (window.TableUI && TableUI.actualizar) TableUI.actualizar();
        if (window.CalendarUI && CalendarUI.actualizar) CalendarUI.actualizar();
    };
    
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.value = hoy;
        fechaInput.setAttribute('max', hoy);
        fechaInput.addEventListener('change', () => {
            if (window.FormUI && FormUI.verificarFecha) FormUI.verificarFecha();
        });
    }
    
    configurarEventosUI();
    cargarDatosIniciales();
    
    if (window.Sidebar && Sidebar.init) {
        setTimeout(() => Sidebar.init(), 100);
    }
    
    // ============================================================
    // DETECTAR REEMPLAZO PENDIENTE DESDE BANDEJA
    // ============================================================
    verificarReemplazoPendiente();
});

function verificarReemplazoPendiente() {
    const reemplazoPendiente = sessionStorage.getItem('reemplazoPendiente');
    const solicitudId = sessionStorage.getItem('solicitudId');
    
    if (reemplazoPendiente && solicitudId) {
        try {
            const datosPrellenados = JSON.parse(reemplazoPendiente);
            console.log('🔄 Reemplazo pendiente detectado:', datosPrellenados);
            
            // Mostrar notificación
            setTimeout(() => {
                if (window.Notifications) {
                    Notifications.info('📋 Tiene un reemplazo pendiente. El formulario ha sido pre-llenado.', 5000);
                }
            }, 1000);
            
            // Cambiar a la pestaña de Base de Datos si es necesario
            if (window.Sidebar && window.Sidebar.mostrarBaseDatos) {
                window.Sidebar.mostrarBaseDatos();
            }
            
            // Cargar los datos en el formulario
            setTimeout(() => {
                if (window.RecordsModule && window.RecordsModule.cargarDatosPrellenados) {
                    window.RecordsModule.cargarDatosPrellenados(datosPrellenados);
                }
            }, 500);
            
            // Limpiar sessionStorage después de cargar
            // No limpiar inmediatamente para permitir recargas
            window.addEventListener('beforeunload', function() {
                sessionStorage.removeItem('reemplazoPendiente');
                sessionStorage.removeItem('solicitudId');
            });
            
        } catch(e) {
            console.error('Error cargando reemplazo pendiente:', e);
            sessionStorage.removeItem('reemplazoPendiente');
            sessionStorage.removeItem('solicitudId');
        }
    }
    
    // Verificar si hay hash en la URL indicando reemplazo
    if (window.location.hash === '#reemplazo') {
        window.location.hash = '';
    }
}

function configurarEventosUI() {
    const agregarTelaBtn = document.getElementById('agregarTelaBtn');
    if (agregarTelaBtn && window.ColorsModule) {
        agregarTelaBtn.addEventListener('click', () => window.ColorsModule.agregarGrupoTela('', []));
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            AppState.setFiltros(e.target.value, AppState.currentSemana);
            if (window.TableUI) TableUI.actualizar();
        });
    }
    
    const clearSearch = document.getElementById('clearSearch');
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            const input = document.getElementById('searchInput');
            if (input) input.value = '';
            AppState.limpiarFiltros();
            if (window.TableUI) TableUI.actualizar();
        });
    }
    
    const limpiarFiltro = document.getElementById('limpiarFiltroBtn');
    if (limpiarFiltro) {
        limpiarFiltro.addEventListener('click', () => {
            const input = document.getElementById('searchInput');
            if (input) input.value = '';
            AppState.limpiarFiltros();
            if (window.TableUI) TableUI.actualizar();
            if (window.Notifications) Notifications.info('🧹 Filtros eliminados');
        });
    }
    
    const registroForm = document.getElementById('registroForm');
    if (registroForm && window.RecordsModule) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!window.puedeEditar || !window.puedeEditar()) {
                if (window.Notifications) Notifications.error('❌ No tiene permisos para guardar registros');
                return;
            }
            
            const datos = window.RecordsModule.obtenerFormulario();
            const editId = document.getElementById('editId').value;
            
            if (editId) {
                const regActual = AppState.getRegistroById(editId);
                
                // Preguntar tipo de edición
                const tipoEdicion = prompt('Elija el tipo de edición:\n1 - ORDEN NUEVA (No genera historial ni marca de edición)\n2 - REEMPLAZO (Guarda historial y descripción)', '2');
                
                if (tipoEdicion === '1') {
                    // Orden Nueva: No pedimos descripción y marcamos como limpia
                    datos.esOrdenNueva = true;
                    datos.descripcionEdicion = 'Orden Nueva (Corrección)';
                } else if (tipoEdicion === '2') {
                    // Reemplazo: Lógica normal de descripción obligatoria
                    const msg = regActual && regActual.en_produccion ? 
                        '⚠️ ESTA ORDEN ESTÁ EN PRODUCCIÓN. Describe obligatoriamente los cambios realizados:' : 
                        '📝 Describe los cambios realizados:';
                    
                    datos.descripcionEdicion = prompt(msg, '');
                    
                    if (!datos.descripcionEdicion || datos.descripcionEdicion.trim() === '') {
                        if (window.Notifications) Notifications.warning('⚠️ Es necesario describir los cambios para guardar un REEMPLAZO');
                        return;
                    }
                    datos.esOrdenNueva = false;
                } else {
                    if (window.Notifications) Notifications.info('🚫 Edición cancelada');
                    return;
                }
                
                // Si estaba en producción, mantenemos ese estado al guardar la edición
                if (regActual && regActual.en_produccion) {
                    datos.en_produccion = true;
                }
            }
            
            const exito = await window.RecordsModule.guardar(datos);
            if (exito) {
                guardarDatosLocal();
                
                // Limpiar reemplazo pendiente si existe
                if (sessionStorage.getItem('reemplazoPendiente')) {
                    sessionStorage.removeItem('reemplazoPendiente');
                    sessionStorage.removeItem('solicitudId');
                    if (window.Notifications) {
                        Notifications.success('✅ Reemplazo completado. La solicitud ha sido actualizada.');
                    }
                }
                
                if (window.FormUI && window.FormUI.reset) window.FormUI.reset();
                if (window.TableUI) TableUI.actualizar();
            }
        });
    }
    
    const cancelEdit = document.getElementById('cancelEditBtn');
    if (cancelEdit && window.FormUI) {
        cancelEdit.addEventListener('click', () => window.FormUI.reset());
    }
    
    const exportarDB = document.getElementById('exportarDBBtn');
    if (exportarDB) {
        exportarDB.addEventListener('click', () => exportarBaseDatos());
    }
    
    const importarDB = document.getElementById('importarDB');
    if (importarDB) {
        importarDB.addEventListener('change', (e) => importarBaseDatos(e));
    }
    
    const exportarExcel = document.getElementById('exportarExcelBtn');
    if (exportarExcel) {
        exportarExcel.addEventListener('click', () => window.exportarExcel());
    }
    
    const imprimirReportes = document.getElementById('imprimirReportesBtn');
    if (imprimirReportes) {
        imprimirReportes.addEventListener('click', async () => {
            if (!window.PrintingModule) {
                if (window.Notifications) Notifications.info('📥 Cargando módulo de impresión...');
                try { await Utils.loadScript('js/modules/printing.js'); } catch(e) { return; }
            }
            if (window.PrintingModule) window.PrintingModule.imprimirReporte();
        });
    }
    
    const imprimirIndividual = document.getElementById('imprimirIndividualBtn');
    const imprimirIndividualAction = document.getElementById('imprimirIndividualBtnAction');
    if (imprimirIndividual) {
        imprimirIndividual.addEventListener('click', () => {
            const select = document.getElementById('selectRegistroImprimir');
            const modal = document.getElementById('modalImpresion');
            if (select) {
                select.innerHTML = '<option value="">Seleccionar</option>' + 
                    AppState.registros.map(r => `<option value="${r.id}">${r.po} v${r.version}</option>`).join('');
            }
            if (modal) modal.classList.add('show');
        });
    }
    if (imprimirIndividualAction) {
        imprimirIndividualAction.addEventListener('click', () => {
            const select = document.getElementById('selectRegistroImprimir');
            const id = select ? select.value : null;
            if (id) {
                document.getElementById('modalImpresion').classList.remove('show');
                if (window.PrintingModule) window.PrintingModule.imprimirEtiqueta(id);
            } else {
                if (window.Notifications) Notifications.error('❌ Selecciona un registro');
            }
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Cerrar sesión?')) {
                localStorage.removeItem('alpha_db_session');
                window.location.href = 'login.html';
            }
        });
    }

    const reformulacionEstado = document.getElementById('reformulacionEstado');
    const reformulacionTiempoRow = document.getElementById('reformulacionTiempoRow');
    if (reformulacionEstado && reformulacionTiempoRow) {
        reformulacionEstado.addEventListener('change', (e) => {
            reformulacionTiempoRow.style.display = (e.target.value === 'reformulado') ? 'block' : 'none';
        });
    }
}

async function cargarDatosIniciales() {
    if (window.SupabaseClient && window.SupabaseClient.init()) {
        console.log('📡 Conectando a Supabase...');
        const data = await window.SupabaseClient.getRegistros();
        if (data && data.length > 0) {
            AppState.setRegistros(data);
            console.log(`📦 Cargados ${data.length} registros desde Supabase`);
            if (window.TableUI) TableUI.actualizar();
            return;
        }
    }
    
    const saved = localStorage.getItem('alpha_db_registros_v10');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            AppState.setRegistros(data.registros || []);
            AppState.historialEdiciones = data.historial || {};
            console.log(`📦 Cargados ${AppState.registros.length} registros de localStorage`);
        } catch(e) { 
            console.error('Error cargando localStorage:', e);
            generarDatosEjemplo(); 
        }
    } else {
        generarDatosEjemplo();
    }
    
    if (window.TableUI) TableUI.actualizar();
}

function generarDatosEjemplo() {
    if (!AppState || !window.Utils) return;
    
    const ejemplos = [];
    const pos = ['PO-2401-001', 'PO-2401-002', 'PO-2402-015'];
    const procesos = ['DISEÑO', 'PLOTTER', 'SUBLIMADO'];
    const estilos = ['LIBRE', 'MARIPOSA', 'PECHO'];
    const ahora = new Date().toISOString();
    
    for (let i = 0; i < 3; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i * 2);
        const fechaStr = fecha.toISOString().split('T')[0];
        
        ejemplos.push({
            id: window.Utils.generarIdUnico(),
            po: pos[i % pos.length],
            proceso: procesos[i % procesos.length],
            es_reemplazo: false,
            semana: window.Utils.obtenerSemana(fecha),
            fecha: fechaStr,
            estilo: estilos[i % estilos.length],
            nks: [{ nk: 'NK-ALG-001', colores: [{ nombre: 'ROJO', cyan: 100, magenta: 0, yellow: 0, black: 0, turquesa: 0, naranja: 0, fluorYellow: 0, fluorPink: 0 }] }],
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
            actualizado: ahora,
            usuarioModifico: 'Sistema'
        });
    }
    
    AppState.setRegistros(ejemplos);
    guardarDatosLocal();
}

function guardarDatosLocal() {
    if (!AppState) return;
    try {
        const registrosParaGuardar = AppState.registros.map(reg => {
            const { historial, ...regSinHistorial } = reg;
            return regSinHistorial;
        });
        const dataToSave = {
            registros: registrosParaGuardar,
            historial: AppState.historialEdiciones
        };
        localStorage.setItem('alpha_db_registros_v10', JSON.stringify(dataToSave));
    } catch(error) {
        console.error('Error al guardar:', error);
    }
}

function exportarBaseDatos() {
    const dataToExport = {
        sistema: "ALPHA DB",
        version: "10.0",
        registros: AppState.registros,
        historial: AppState.historialEdiciones
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ALPHA_DB_${new Date().toISOString().split('T')[0]}.adb`;
    a.click();
    URL.revokeObjectURL(a.href);
    if (window.Notifications) Notifications.success('💾 Backup guardado');
}

function importarBaseDatos(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.adb')) {
        if (window.Notifications) Notifications.error('Debe ser archivo .adb');
        return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!importedData.registros) throw new Error('Estructura inválida');
            if (confirm(`¿Cargar ${importedData.registros.length} registros?`)) {
                AppState.setRegistros(importedData.registros);
                AppState.historialEdiciones = importedData.historial || {};
                guardarDatosLocal();
                if (window.SupabaseClient && window.SupabaseClient.client) {
                    for(const reg of AppState.registros) {
                        await window.SupabaseClient.guardarRegistro(reg);
                    }
                }
                if (window.FormUI && window.FormUI.reset) window.FormUI.reset();
                if (window.TableUI) TableUI.actualizar();
                if (window.Notifications) Notifications.success(`📂 Cargados ${AppState.registros.length} registros`);
            }
        } catch(error) {
            if (window.Notifications) Notifications.error('Archivo inválido');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

window.editarRegistro = (id) => {
    if (window.FormUI && window.FormUI.cargarParaEdicion) {
        window.FormUI.cargarParaEdicion(id, 'general');
    }
};

window.reformularRegistro = (id) => {
    if (window.FormUI && window.FormUI.cargarParaEdicion) {
        window.FormUI.cargarParaEdicion(id, 'reform');
    }
};

window.eliminarRegistro = async (id) => {
    if (!window.puedeEliminar || !window.puedeEliminar()) {
        if (window.Notifications) Notifications.error('❌ No tiene permisos para eliminar registros');
        return;
    }
    if (await window.RecordsModule.eliminar(id)) {
        guardarDatosLocal();
        if (window.TableUI) TableUI.actualizar();
    }
};


window.verHistorial = (id) => {
    const reg = AppState.getRegistroById(id);
    if (!reg) {
        if (window.Notifications) Notifications.error('Registro no encontrado');
        return;
    }
    
    const hist = AppState.getHistorial(id);
    const modal = document.getElementById('modalHistorial');
    const container = document.getElementById('historialContainer');
    
    if (!modal || !container) return;
    
    let html = '';
    if (hist.length === 0) {
        html = '<p class="no-data" style="text-align:center; padding:20px;">📭 No hay historial de ediciones</p>';
    } else {
        html = hist.map((e, i) => `
            <div class="historial-item" style="background:#0D1117; border-radius:12px; padding:12px; margin-bottom:12px; border:1px solid rgba(0,212,255,0.2);">
                <div style="color:#00D4FF; margin-bottom:8px;">📅 ${new Date(e.fecha).toLocaleString()}</div>
                <div style="margin-bottom:8px;">👤 ${e.usuario || 'Desconocido'}</div>
                <div style="margin-bottom:8px;">📝 ${e.descripcion || 'Sin descripción'}</div>
                <div style="display:flex; gap:16px; flex-wrap:wrap;">
                    <div style="border-left:3px solid #FF4444; padding-left:8px;">
                        <div style="font-size:11px; color:#FF4444;">ANTERIOR</div>
                        <div>PO: ${e.anterior.po}</div>
                        <div>Proceso: ${e.anterior.proceso}</div>
                        <div>v${e.anterior.version}</div>
                    </div>
                    <div style="border-left:3px solid #00FF88; padding-left:8px;">
                        <div style="font-size:11px; color:#00FF88;">NUEVO</div>
                        <div>PO: ${e.nuevo.po}</div>
                        <div>Proceso: ${e.nuevo.proceso}</div>
                        <div>v${e.nuevo.version}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    html += `
        <div class="historial-item" style="background:#161B22; border-radius:12px; padding:12px; border-left:4px solid #00D4FF;">
            <div style="color:#00D4FF;">⚡ VERSIÓN ACTUAL v${reg.version}</div>
            <div>PO: ${reg.po}</div>
            <div>Proceso: ${reg.proceso}</div>
            <div>👤 Última modificación: ${reg.usuarioModifico || 'Sistema'}</div>
            ${reg.observacion ? `<div>📝 ${reg.observacion}</div>` : ''}
        </div>
    `;
    
    container.innerHTML = html;
    modal.classList.add('show');
};

window.imprimirEtiqueta = (id) => {
    if (window.PrintingModule && window.PrintingModule.imprimirEtiqueta) {
        window.PrintingModule.imprimirEtiqueta(id);
    }
};

window.filtrarPorSemana = (semana) => {
    if (AppState.currentSemana == semana) {
        AppState.limpiarFiltros();
        if (window.Notifications) Notifications.info('📅 Filtro de semana eliminado');
    } else {
        AppState.setFiltros(AppState.currentSearch, semana);
        if (window.Notifications) Notifications.success(`📅 Semana ${semana} seleccionada`);
    }
    if (window.TableUI) TableUI.actualizar();
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

window.mandarAProduccion = async (event, id) => {
    const btn = event.currentTarget;
    if (!confirm('¿Desea marcar este registro como EN PRODUCCIÓN?')) return;
    
    // Feedback visual inmediato
    const originalContent = btn.innerHTML;
    btn.innerHTML = '⌛';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    if (window.Notifications) Notifications.info('🚀 Iniciando producción...');
    
    try {
        if (window.SupabaseClient && window.SupabaseClient.client) {
            const { error } = await window.SupabaseClient.client
                .from('registros')
                .update({ 
                    en_produccion: true, 
                    actualizado: new Date().toISOString()
                })
                .eq('id', id);
            
            if (error) throw error;
            
            // Actualizar estado local
            if (window.AppState) {
                const reg = AppState.registros.find(r => r.id === id);
                if (reg) {
                    reg.en_produccion = true;
                    reg.actualizado = new Date().toISOString();
                }
                if (window.onStateChange) window.onStateChange();
            }

            // Notificación de éxito
            Notifications.success('✅ Registro enviado a Producción');

            // Sincronizar automáticamente con el panel de producción si está visible
            if (window.ProductionModule && window.ProductionModule.cargarProduccion) {
                window.ProductionModule.cargarProduccion();
            }

            // Preguntar por impresión inmediata
            setTimeout(() => {
                if (confirm('🚀 ¿Deseas imprimir la etiqueta QR para esta orden ahora mismo?')) {
                    window.imprimirEtiqueta(id);
                }
            }, 500);

        }
    } catch (error) {
        console.error('Error al mandar a producción:', error);
        Notifications.error('Error al actualizar estado');
        btn.innerHTML = originalContent;
        btn.disabled = false;
        btn.style.opacity = '1';
    }
};

console.log('✅ main.js cargado - Con botón de Producción unificado');