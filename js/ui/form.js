// ============================================================
// js/ui/form.js - Gestión del formulario principal
// CORREGIDO: Edición de registros funcionando
// ============================================================

const FormUI = {
    reset: function() {
        try {
            console.log('Reseteando formulario');
            AppState.editandoId = null;
            const editIdField = document.getElementById('editId');
            if (editIdField) editIdField.value = '';
            const form = document.getElementById('registroForm');
            if (form) form.reset();
            
            if (window.ColorsModule && window.ColorsModule.limpiar) {
                window.ColorsModule.limpiar();
            } else if (window.ColorsModule && window.ColorsModule.cargarEnFormulario) {
                window.ColorsModule.cargarEnFormulario([]);
            }
            
            const hoy = new Date().toISOString().split('T')[0];
            const fechaInput = document.getElementById('fecha');
            if (fechaInput) fechaInput.value = hoy;
            
            const observacionContainer = document.getElementById('observacionContainer');
            if (observacionContainer) observacionContainer.style.display = 'none';
            const observacionField = document.getElementById('observacion');
            if (observacionField) { observacionField.required = false; observacionField.value = ''; }
            
            const formTitle = document.getElementById('formTitle');
            if (formTitle) formTitle.innerHTML = '➕ NUEVO REGISTRO';
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) submitBtn.innerHTML = '<span>💾</span> GUARDAR';
            const cancelEditBtn = document.getElementById('cancelEditBtn');
            if (cancelEditBtn) cancelEditBtn.style.display = 'none';
            const formSection = document.querySelector('.form-section');
            if (formSection) formSection.classList.remove('edit-mode');
        } catch(e) { console.error('Error en reset:', e); }
    },
    
    cargarParaEdicion: function(id) {
        // Verificar permisos para editar
        if (!window.puedeEditar || !window.puedeEditar()) {
            if (window.Notifications) Notifications.error('❌ No tiene permisos para editar registros');
            return;
        }
        
        try {
            console.log('Cargando registro para edición, ID:', id);
            
            if (!window.RecordsModule) {
                console.error('RecordsModule no disponible');
                Notifications.error('Error al cargar registro');
                return;
            }
            
            const registro = RecordsModule.getById(id);
            if (!registro) {
                console.error('Registro no encontrado con ID:', id);
                Notifications.error('❌ Registro no encontrado');
                return;
            }
            
            console.log('Registro encontrado:', registro);
            
            // Guardar ID en edición
            AppState.editandoId = id;
            const editIdField = document.getElementById('editId');
            if (editIdField) editIdField.value = id;
            
            // Cargar datos en el formulario
            if (window.RecordsModule.cargarFormulario) {
                RecordsModule.cargarFormulario(registro);
            }
            
            // Cambiar UI del formulario a modo edición
            const formTitle = document.getElementById('formTitle');
            if (formTitle) formTitle.innerHTML = '✏️ EDITANDO REGISTRO';
            
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) submitBtn.innerHTML = '<span>✏️</span> ACTUALIZAR';
            
            const cancelEditBtn = document.getElementById('cancelEditBtn');
            if (cancelEditBtn) cancelEditBtn.style.display = 'block';
            
            const formSection = document.querySelector('.form-section');
            if (formSection) {
                formSection.classList.add('edit-mode');
                formSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Verificar fecha
            this.verificarFecha();
            
            console.log('Formulario cargado en modo edición para ID:', id);
            Notifications.info('✏️ Modo edición activado');
            
        } catch(e) {
            console.error('Error en cargarParaEdicion:', e);
            Notifications.error('Error al cargar registro para edición');
        }
    },
    
    verificarFecha: function() {
        try {
            const fechaInput = document.getElementById('fecha');
            const observacionContainer = document.getElementById('observacionContainer');
            const observacionField = document.getElementById('observacion');
            if (!fechaInput || !observacionContainer || !observacionField) return;
            const fechaSeleccionada = fechaInput.value;
            const hoy = new Date().toISOString().split('T')[0];
            if (fechaSeleccionada < hoy) {
                observacionContainer.style.display = 'block';
                observacionField.required = true;
            } else {
                observacionContainer.style.display = 'none';
                observacionField.required = false;
                observacionField.value = '';
            }
        } catch(e) { console.error('Error en verificarFecha:', e); }
    }
};

window.FormUI = FormUI;
console.log('✅ FormUI actualizado - Edición de registros CORREGIDA');