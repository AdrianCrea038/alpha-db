// ============================================================
// js/admin.js - Administración de usuarios y roles
// Versión: Con Supabase - Guarda usuarios en la nube
// ============================================================

const AdminModule = {
    usuarios: [],
    procesosDisponibles: ['DISEÑO', 'PLOTTER', 'SUBLIMADO', 'FLAT', 'LASER', 'BORDADO'],
    metasProduccion: {},
    avanceProduccion: {},
    sincronizando: false,
    
    init: async function() {
        console.log('🚀 Iniciando AdminModule...');
        
        const usuarioActual = this.getUsuarioActual();
        console.log('Usuario actual:', usuarioActual);
        
        if (!usuarioActual || usuarioActual.rol !== 'admin') {
            alert('⚠️ Acceso denegado. Solo administradores pueden acceder a esta sección.');
            window.location.href = 'index.html';
            return;
        }
        
        await this.cargarUsuarios();
        this.cargarMetasProduccion();
        this.actualizarEstadisticas();
        this.renderizarTabla();
        this.renderizarTablaMetas();
        this.configurarEventos();
        this.configurarPestanas();
    },
    
    togglePassword: function(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const button = input.nextElementSibling;
        if (input.type === 'password') {
            input.type = 'text';
            if (button) button.textContent = '🙈';
        } else {
            input.type = 'password';
            if (button) button.textContent = '👁️';
        }
    },
    
    getUsuarioActual: function() {
        const session = localStorage.getItem('alpha_db_session');
        if (!session) return null;
        try {
            return JSON.parse(session);
        } catch(e) {
            return null;
        }
    },
    
    // ============================================================
    // USUARIOS CON SUPABASE
    // ============================================================
    
    cargarUsuarios: async function() {
        // Mostrar loader
        this.mostrarLoader(true);
        
        try {
            // Intentar cargar desde Supabase
            if (window.SupabaseClient && window.SupabaseClient.init()) {
                const usuariosDB = await window.SupabaseClient.getUsuarios();
                if (usuariosDB && usuariosDB.length > 0) {
                    this.usuarios = usuariosDB;
                    localStorage.setItem('alpha_db_usuarios', JSON.stringify(usuariosDB));
                    console.log('📦 Usuarios cargados desde Supabase:', this.usuarios.length);
                    this.mostrarLoader(false);
                    return;
                }
            }
        } catch (error) {
            console.error('Error cargando usuarios desde Supabase:', error);
        }
        
        // Fallback a localStorage
        const usuariosGuardados = localStorage.getItem('alpha_db_usuarios');
        if (usuariosGuardados) {
            this.usuarios = JSON.parse(usuariosGuardados);
            console.log('📦 Usuarios cargados desde localStorage:', this.usuarios.length);
        } else {
            this.usuarios = [
                { id: '1', username: 'ADMIN', password: 'admin123', rol: 'admin', procesos_asignados: ['DISEÑO', 'PLOTTER', 'SUBLIMADO', 'FLAT', 'LASER', 'BORDADO'], creado: new Date().toISOString() },
                { id: '2', username: 'OPERADOR', password: 'operador123', rol: 'operador', procesos_asignados: ['DISEÑO'], creado: new Date().toISOString() },
                { id: '3', username: 'CONSULTOR', password: 'consultor123', rol: 'consultor', procesos_asignados: [], creado: new Date().toISOString() },
                { id: '4', username: 'TRACKING', password: 'tracking123', rol: 'usuario_tracking', procesos_asignados: ['DISEÑO', 'PLOTTER', 'SUBLIMADO', 'FLAT', 'LASER', 'BORDADO'], creado: new Date().toISOString() }
            ];
            this.guardarUsuariosLocal();
        }
        
        this.mostrarLoader(false);
    },
    
    guardarUsuariosLocal: function() {
        localStorage.setItem('alpha_db_usuarios', JSON.stringify(this.usuarios));
    },
    
    guardarUsuariosEnSupabase: async function() {
        if (this.sincronizando) return;
        this.sincronizando = true;
        
        try {
            if (window.SupabaseClient && window.SupabaseClient.init()) {
                for (const usuario of this.usuarios) {
                    await window.SupabaseClient.guardarUsuario(usuario);
                }
                console.log('✅ Usuarios sincronizados con Supabase');
            }
        } catch (error) {
            console.error('Error guardando usuarios en Supabase:', error);
        } finally {
            this.sincronizando = false;
        }
        
        this.guardarUsuariosLocal();
    },
    
    guardarUsuarios: async function() {
        this.guardarUsuariosLocal();
        await this.guardarUsuariosEnSupabase();
        
        const usuarioActual = this.getUsuarioActual();
        if (usuarioActual) {
            const usuarioModificado = this.usuarios.find(u => u.id === usuarioActual.id);
            if (usuarioModificado && usuarioModificado.username !== usuarioActual.username) {
                const session = localStorage.getItem('alpha_db_session');
                if (session) {
                    const sessionData = JSON.parse(session);
                    sessionData.username = usuarioModificado.username;
                    localStorage.setItem('alpha_db_session', JSON.stringify(sessionData));
                }
            }
        }
    },
    
    mostrarLoader: function(mostrar) {
        const tbody = document.getElementById('tablaUsuariosBody');
        if (tbody && mostrar) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">🔄 Cargando usuarios desde la nube...</td></tr>';
        }
    },
    
    // ============================================================
    // METAS DE PRODUCCIÓN
    // ============================================================
    
    cargarMetasProduccion: function() {
        const metasGuardadas = localStorage.getItem('alpha_db_metas_proceso');
        if (metasGuardadas) {
            try {
                const parsed = JSON.parse(metasGuardadas);
                this.metasProduccion = parsed.metas || {};
                this.avanceProduccion = parsed.avance || {};
            } catch(e) {}
        }
        
        const metasDefault = {
            'DISEÑO': 500, 'PLOTTER': 450, 'SUBLIMADO': 400,
            'FLAT': 350, 'LASER': 300, 'BORDADO': 250
        };
        
        const avanceDefault = {
            'DISEÑO': 500, 'PLOTTER': 380, 'SUBLIMADO': 320,
            'FLAT': 280, 'LASER': 220, 'BORDADO': 180
        };
        
        for (const proceso of this.procesosDisponibles) {
            if (!this.metasProduccion[proceso]) this.metasProduccion[proceso] = metasDefault[proceso];
            if (!this.avanceProduccion[proceso]) this.avanceProduccion[proceso] = avanceDefault[proceso];
        }
    },
    
    guardarMetasProduccion: function() {
        localStorage.setItem('alpha_db_metas_proceso', JSON.stringify({
            metas: this.metasProduccion,
            avance: this.avanceProduccion
        }));
        
        if (window.TrackingModule) {
            if (window.TrackingModule.metasPorProceso) {
                window.TrackingModule.metasPorProceso = { ...this.metasProduccion };
            }
            if (window.TrackingModule.avancePorProceso) {
                window.TrackingModule.avancePorProceso = { ...this.avanceProduccion };
            }
        }
    },
    
    aplicarMetaBase: function() {
        const metaBaseInput = document.getElementById('metaBaseValor');
        const metaBase = parseInt(metaBaseInput.value);
        
        if (isNaN(metaBase) || metaBase <= 0) {
            alert('⚠️ Ingrese un valor válido para la meta base');
            return;
        }
        
        if (confirm(`¿Aplicar meta de ${metaBase} piezas a TODOS los procesos?`)) {
            for (const proceso of this.procesosDisponibles) {
                this.metasProduccion[proceso] = metaBase;
            }
            this.guardarMetasProduccion();
            this.renderizarTablaMetas();
            alert(`✅ Meta base de ${metaBase} piezas aplicada a todos los procesos`);
        }
    },
    
    renderizarTablaMetas: function() {
        const tbody = document.getElementById('tablaMetasBody');
        if (!tbody) return;
        
        let html = '';
        for (const proceso of this.procesosDisponibles) {
            const meta = this.metasProduccion[proceso] || 0;
            const avance = this.avanceProduccion[proceso] || 0;
            const porcentaje = meta > 0 ? Math.min(100, Math.round((avance / meta) * 100)) : 0;
            let colorPorcentaje = '#FF4444';
            if (porcentaje >= 80) colorPorcentaje = '#00FF88';
            else if (porcentaje >= 50) colorPorcentaje = '#F59E0B';
            
            html += `
                <tr data-proceso="${proceso}">
                    <td><strong>${proceso}</strong></td>
                    <td style="font-size:1.2rem;">${this.getIconoProceso(proceso)}</td>
                    <td><input type="number" id="meta_${proceso}" value="${meta}" class="meta-input" step="10" min="0"></td>
                    <td>
                        <input type="number" id="avance_${proceso}" value="${avance}" class="meta-avance-input" step="10" min="0">
                        <div style="margin-top:4px; font-size:0.65rem; color:${colorPorcentaje};">${porcentaje}% cumplimiento</div>
                    </td>
                </tr>
            `;
        }
        tbody.innerHTML = html;
    },
    
    guardarMetasDesdeTabla: function() {
        for (const proceso of this.procesosDisponibles) {
            const metaInput = document.getElementById(`meta_${proceso}`);
            const avanceInput = document.getElementById(`avance_${proceso}`);
            if (metaInput) this.metasProduccion[proceso] = parseInt(metaInput.value) || 0;
            if (avanceInput) this.avanceProduccion[proceso] = parseInt(avanceInput.value) || 0;
        }
        this.guardarMetasProduccion();
        this.renderizarTablaMetas();
        alert('✅ Metas de producción guardadas correctamente');
    },
    
    getIconoProceso: function(proceso) {
        const iconos = { 'DISEÑO': '🎨', 'PLOTTER': '🖨️', 'SUBLIMADO': '🔥', 'FLAT': '📏', 'LASER': '⚡', 'BORDADO': '🧵' };
        return iconos[proceso] || '⚙️';
    },
    
    // ============================================================
    // CONFIGURACIÓN DE PESTAÑAS
    // ============================================================
    
    configurarPestanas: function() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.getAttribute('data-tab');
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                tabPanes.forEach(pane => pane.classList.remove('active'));
                if (tabId === 'usuarios') {
                    document.getElementById('tabUsuarios').classList.add('active');
                } else if (tabId === 'metas') {
                    document.getElementById('tabMetas').classList.add('active');
                    this.renderizarTablaMetas();
                }
            });
        });
    },
    
    // ============================================================
    // RENDERIZAR TABLA DE USUARIOS
    // ============================================================
    
    actualizarEstadisticas: function() {
        const total = this.usuarios.length;
        const admins = this.usuarios.filter(u => u.rol === 'admin').length;
        const operadores = this.usuarios.filter(u => u.rol === 'operador').length;
        const usuariosTracking = this.usuarios.filter(u => u.rol === 'usuario_tracking').length;
        const consultores = this.usuarios.filter(u => u.rol === 'consultor').length;
        
        const totalEl = document.getElementById('totalUsuarios');
        const adminsEl = document.getElementById('totalAdmins');
        const operadoresEl = document.getElementById('totalOperadores');
        const usuariosTrackingEl = document.getElementById('totalUsuariosTracking');
        const consultoresEl = document.getElementById('totalConsultores');
        
        if (totalEl) totalEl.textContent = total;
        if (adminsEl) adminsEl.textContent = admins;
        if (operadoresEl) operadoresEl.textContent = operadores;
        if (usuariosTrackingEl) usuariosTrackingEl.textContent = usuariosTracking;
        if (consultoresEl) consultoresEl.textContent = consultores;
    },
    
    renderizarTabla: function() {
        const tbody = document.getElementById('tablaUsuariosBody');
        if (!tbody) return;
        
        if (this.usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay usuarios registrados</td></tr>';
            return;
        }
        
        let html = '';
        for (let i = 0; i < this.usuarios.length; i++) {
            const user = this.usuarios[i];
            let rolClass = '';
            let rolText = '';
            
            switch(user.rol) {
                case 'admin': rolClass = 'rol-admin'; rolText = '👑 Administrador'; break;
                case 'operador': rolClass = 'rol-operador'; rolText = '👤 Operador'; break;
                case 'usuario_tracking': rolClass = 'rol-usuario-tracking'; rolText = '📍 Usuario Tracking'; break;
                case 'consultor': rolClass = 'rol-consultor'; rolText = '👁️ Consultor'; break;
                default: rolClass = 'rol-operador'; rolText = '👤 Usuario';
            }
            
            const procesosStr = (user.procesos_asignados || []).join(', ') || 'Ninguno';
            const fecha = new Date(user.creado).toLocaleDateString();
            
            html += `
                <tr data-id="${user.id}">
                    <td><strong>${this.escapeHtml(user.username)}</strong></td>
                    <td><span class="rol-badge ${rolClass}">${rolText}</span></td>
                    <td>${procesosStr}</td>
                    <td>${fecha}</td>
                    <td>
                        <button class="btn-editar" data-id="${user.id}">✏️ Editar</button>
                        <button class="btn-cambiar-pass" data-id="${user.id}">🔑 Cambiar Pass</button>
                        <button class="btn-eliminar" data-id="${user.id}">🗑️ Eliminar</button>
                    </td>
                </tr>
            `;
        }
        tbody.innerHTML = html;
        
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', () => this.editarUsuario(btn.getAttribute('data-id')));
        });
        document.querySelectorAll('.btn-cambiar-pass').forEach(btn => {
            btn.addEventListener('click', () => this.cambiarPassword(btn.getAttribute('data-id')));
        });
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', () => this.eliminarUsuario(btn.getAttribute('data-id')));
        });
    },
    
    configurarEventos: function() {
        const agregarBtn = document.getElementById('agregarUsuarioBtn');
        const guardarBtn = document.getElementById('guardarUsuarioBtn');
        const cancelarBtn = document.getElementById('cancelarModalBtn');
        const guardarPassBtn = document.getElementById('guardarPasswordBtn');
        const cancelarPassBtn = document.getElementById('cancelarPasswordBtn');
        const guardarMetasBtn = document.getElementById('guardarMetasBtn');
        const aplicarMetaBaseBtn = document.getElementById('aplicarMetaBaseBtn');
        
        if (agregarBtn) agregarBtn.addEventListener('click', () => this.mostrarModal());
        if (guardarBtn) guardarBtn.addEventListener('click', () => this.guardarUsuario());
        if (cancelarBtn) cancelarBtn.addEventListener('click', () => this.cerrarModal());
        if (guardarPassBtn) guardarPassBtn.addEventListener('click', () => this.guardarPassword());
        if (cancelarPassBtn) cancelarPassBtn.addEventListener('click', () => this.cerrarModalPassword());
        if (guardarMetasBtn) guardarMetasBtn.addEventListener('click', () => this.guardarMetasDesdeTabla());
        if (aplicarMetaBaseBtn) aplicarMetaBaseBtn.addEventListener('click', () => this.aplicarMetaBase());
    },
    
    mostrarModal: function(usuario = null) {
        const modal = document.getElementById('usuarioModal');
        const titulo = document.getElementById('modalTitulo');
        const editId = document.getElementById('editUserId');
        const usernameInput = document.getElementById('usuarioUsername');
        const passwordInput = document.getElementById('usuarioPassword');
        const rolSelect = document.getElementById('usuarioRol');
        
        if (!modal) return;
        
        if (usernameInput) {
            usernameInput.disabled = false;
            usernameInput.readOnly = false;
        }
        
        if (passwordInput) {
            passwordInput.type = 'password';
            const toggleBtn = passwordInput.nextElementSibling;
            if (toggleBtn) toggleBtn.textContent = '👁️';
        }
        
        if (usuario) {
            console.log('✏️ Editando usuario:', usuario);
            titulo.textContent = '✏️ EDITAR USUARIO';
            editId.value = usuario.id;
            usernameInput.value = usuario.username;
            passwordInput.value = '';
            passwordInput.placeholder = 'Nueva contraseña (dejar en blanco para no cambiar)';
            rolSelect.value = usuario.rol;
            this.cargarCheckboxesProcesos(usuario.procesos_asignados || []);
        } else {
            console.log('➕ Nuevo usuario');
            titulo.textContent = '➕ NUEVO USUARIO';
            editId.value = '';
            usernameInput.value = '';
            passwordInput.value = '';
            passwordInput.placeholder = 'Contraseña (obligatoria)';
            rolSelect.value = 'consultor';
            this.cargarCheckboxesProcesos([]);
        }
        
        modal.classList.add('show');
    },
    
    cargarCheckboxesProcesos: function(procesosSeleccionados) {
        const container = document.getElementById('procesosAsignadosContainer');
        if (!container) return;
        
        let html = '<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">';
        for (const proceso of this.procesosDisponibles) {
            const checked = procesosSeleccionados.includes(proceso) ? 'checked' : '';
            html += `
                <label style="display: flex; align-items: center; gap: 0.3rem; background: #21262D; padding: 0.3rem 0.6rem; border-radius: 20px; cursor: pointer;">
                    <input type="checkbox" value="${proceso}" ${checked} class="proceso-checkbox">
                    <span style="font-size: 0.7rem;">${this.getIconoProceso(proceso)} ${proceso}</span>
                </label>
            `;
        }
        html += '</div>';
        container.innerHTML = html;
    },
    
    obtenerProcesosSeleccionados: function() {
        const checkboxes = document.querySelectorAll('.proceso-checkbox');
        const seleccionados = [];
        checkboxes.forEach(cb => {
            if (cb.checked) seleccionados.push(cb.value);
        });
        return seleccionados;
    },
    
    cerrarModal: function() {
        const modal = document.getElementById('usuarioModal');
        if (modal) modal.classList.remove('show');
        
        const editId = document.getElementById('editUserId');
        const usernameInput = document.getElementById('usuarioUsername');
        const passwordInput = document.getElementById('usuarioPassword');
        
        if (editId) editId.value = '';
        if (usernameInput) {
            usernameInput.value = '';
            usernameInput.disabled = false;
        }
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.type = 'password';
            const toggleBtn = passwordInput.nextElementSibling;
            if (toggleBtn) toggleBtn.textContent = '👁️';
        }
    },
    
    cambiarPassword: function(id) {
        console.log('🔑 Cambiar password para ID:', id);
        let usuario = null;
        for (let i = 0; i < this.usuarios.length; i++) {
            if (this.usuarios[i].id === id) {
                usuario = this.usuarios[i];
                break;
            }
        }
        
        if (!usuario) {
            alert('❌ Usuario no encontrado');
            return;
        }
        
        const modal = document.getElementById('passwordModal');
        const userIdInput = document.getElementById('passwordUserId');
        const userNameSpan = document.getElementById('passwordUserName');
        const newPassInput = document.getElementById('newPassword');
        const confirmPassInput = document.getElementById('confirmPassword');
        
        if (!modal) return;
        
        if (newPassInput) {
            newPassInput.type = 'password';
            const toggleBtn = newPassInput.nextElementSibling;
            if (toggleBtn) toggleBtn.textContent = '👁️';
        }
        if (confirmPassInput) {
            confirmPassInput.type = 'password';
            const toggleBtn = confirmPassInput.nextElementSibling;
            if (toggleBtn) toggleBtn.textContent = '👁️';
        }
        
        userIdInput.value = usuario.id;
        userNameSpan.textContent = usuario.username;
        newPassInput.value = '';
        confirmPassInput.value = '';
        
        modal.classList.add('show');
    },
    
    guardarPassword: async function() {
        const userId = document.getElementById('passwordUserId').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!newPassword) {
            alert('⚠️ Ingrese la nueva contraseña');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('⚠️ Las contraseñas no coinciden');
            return;
        }
        
        if (newPassword.length < 4) {
            alert('⚠️ La contraseña debe tener al menos 4 caracteres');
            return;
        }
        
        let encontrado = false;
        for (let i = 0; i < this.usuarios.length; i++) {
            if (this.usuarios[i].id === userId) {
                this.usuarios[i].password = newPassword;
                encontrado = true;
                break;
            }
        }
        
        if (!encontrado) {
            alert('❌ Usuario no encontrado');
            return;
        }
        
        await this.guardarUsuarios();
        this.renderizarTabla();
        this.cerrarModalPassword();
        alert('✅ Contraseña actualizada correctamente');
    },
    
    cerrarModalPassword: function() {
        const modal = document.getElementById('passwordModal');
        if (modal) modal.classList.remove('show');
        
        const newPassInput = document.getElementById('newPassword');
        const confirmPassInput = document.getElementById('confirmPassword');
        
        if (newPassInput) {
            newPassInput.value = '';
            newPassInput.type = 'password';
            const toggleBtn = newPassInput.nextElementSibling;
            if (toggleBtn) toggleBtn.textContent = '👁️';
        }
        if (confirmPassInput) {
            confirmPassInput.value = '';
            confirmPassInput.type = 'password';
            const toggleBtn = confirmPassInput.nextElementSibling;
            if (toggleBtn) toggleBtn.textContent = '👁️';
        }
    },
    
    guardarUsuario: async function() {
        const editId = document.getElementById('editUserId').value;
        const nuevoNombre = document.getElementById('usuarioUsername').value.trim().toUpperCase();
        const nuevaPassword = document.getElementById('usuarioPassword').value;
        const nuevoRol = document.getElementById('usuarioRol').value;
        const procesosAsignados = this.obtenerProcesosSeleccionados();
        
        console.log('=== GUARDANDO USUARIO ===');
        
        if (!nuevoNombre) {
            alert('⚠️ El nombre de usuario es obligatorio');
            return;
        }
        
        if (nuevoRol === 'operador' && procesosAsignados.length === 0) {
            alert('⚠️ Un Operador debe tener al menos un proceso asignado');
            return;
        }
        
        let existe = false;
        for (let i = 0; i < this.usuarios.length; i++) {
            if (this.usuarios[i].username === nuevoNombre && this.usuarios[i].id !== editId) {
                existe = true;
                break;
            }
        }
        
        if (existe) {
            alert('⚠️ Ya existe un usuario con ese nombre');
            return;
        }
        
        if (editId) {
            let encontrado = false;
            for (let i = 0; i < this.usuarios.length; i++) {
                if (this.usuarios[i].id === editId) {
                    this.usuarios[i].username = nuevoNombre;
                    if (nuevaPassword && nuevaPassword.trim() !== '') {
                        this.usuarios[i].password = nuevaPassword;
                    }
                    this.usuarios[i].rol = nuevoRol;
                    this.usuarios[i].procesos_asignados = procesosAsignados;
                    encontrado = true;
                    break;
                }
            }
            if (!encontrado) {
                alert('❌ Usuario no encontrado');
                return;
            }
            await this.guardarUsuarios();
            alert(`✅ Usuario editado correctamente. Nuevo nombre: ${nuevoNombre}`);
        } else {
            if (!nuevaPassword) {
                alert('⚠️ La contraseña es obligatoria para nuevos usuarios');
                return;
            }
            if (nuevaPassword.length < 4) {
                alert('⚠️ La contraseña debe tener al menos 4 caracteres');
                return;
            }
            
            const nuevoUsuario = {
                id: Date.now().toString(),
                username: nuevoNombre,
                password: nuevaPassword,
                rol: nuevoRol,
                procesos_asignados: procesosAsignados,
                creado: new Date().toISOString()
            };
            this.usuarios.push(nuevoUsuario);
            await this.guardarUsuarios();
            alert(`✅ Usuario "${nuevoNombre}" creado correctamente`);
        }
        
        this.actualizarEstadisticas();
        this.renderizarTabla();
        this.cerrarModal();
    },
    
    editarUsuario: function(id) {
        console.log('✏️ Editar usuario ID:', id);
        let usuario = null;
        for (let i = 0; i < this.usuarios.length; i++) {
            if (this.usuarios[i].id === id) {
                usuario = this.usuarios[i];
                break;
            }
        }
        if (usuario) {
            this.mostrarModal(usuario);
        } else {
            alert('❌ Usuario no encontrado');
        }
    },
    
    eliminarUsuario: async function(id) {
        console.log('🗑️ Eliminar usuario ID:', id);
        let usuario = null;
        for (let i = 0; i < this.usuarios.length; i++) {
            if (this.usuarios[i].id === id) {
                usuario = this.usuarios[i];
                break;
            }
        }
        
        if (!usuario) {
            alert('❌ Usuario no encontrado');
            return;
        }
        
        let admins = 0;
        for (let i = 0; i < this.usuarios.length; i++) {
            if (this.usuarios[i].rol === 'admin') admins++;
        }
        
        if (usuario.rol === 'admin' && admins === 1) {
            alert('⚠️ No puedes eliminar al último administrador del sistema');
            return;
        }
        
        if (confirm(`¿Eliminar al usuario "${usuario.username}"?`)) {
            this.usuarios = this.usuarios.filter(u => u.id !== id);
            await this.guardarUsuarios();
            this.actualizarEstadisticas();
            this.renderizarTabla();
            alert('✅ Usuario eliminado');
        }
    },
    
    escapeHtml: function(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
};

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando AdminModule...');
    AdminModule.init();
});

window.AdminModule = AdminModule;
console.log('✅ admin.js cargado - Con Supabase para usuarios');