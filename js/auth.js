// ============================================================
// js/auth.js - Módulo de Autenticación con Roles
// Roles: admin, operador, usuario_tracking, consultor
// ============================================================

const AUTH_CONFIG = {
    sessionDuration: {
        recordar: 30 * 24 * 60 * 60 * 1000,  // 30 días
        normal: 24 * 60 * 60 * 1000          // 24 horas
    }
};

// Obtener usuarios del localStorage
function getUsuarios() {
    const usuariosGuardados = localStorage.getItem('alpha_db_usuarios');
    if (usuariosGuardados) {
        return JSON.parse(usuariosGuardados);
    }
    // Usuarios por defecto con los cuatro roles
    const usuariosDefault = [
        { id: '1', username: 'ADMIN', password: 'admin123', rol: 'admin', procesosAsignados: ['DISEÑO', 'PLOTTER', 'SUBLIMADO', 'FLAT', 'LASER', 'BORDADO'], creado: new Date().toISOString() },
        { id: '2', username: 'OPERADOR', password: 'operador123', rol: 'operador', procesosAsignados: ['DISEÑO'], creado: new Date().toISOString() },
        { id: '3', username: 'CONSULTOR', password: 'consultor123', rol: 'consultor', procesosAsignados: [], creado: new Date().toISOString() },
        { id: '4', username: 'TRACKING', password: 'tracking123', rol: 'usuario_tracking', procesosAsignados: ['DISEÑO', 'PLOTTER', 'SUBLIMADO', 'FLAT', 'LASER', 'BORDADO'], creado: new Date().toISOString() }
    ];
    localStorage.setItem('alpha_db_usuarios', JSON.stringify(usuariosDefault));
    return usuariosDefault;
}

// Verificar sesión activa
function verificarSesion() {
    const session = localStorage.getItem('alpha_db_session');
    if (session) {
        try {
            const data = JSON.parse(session);
            const expiracion = new Date(data.expiracion);
            if (expiracion > new Date()) {
                return data;
            } else {
                localStorage.removeItem('alpha_db_session');
            }
        } catch(e) {
            localStorage.removeItem('alpha_db_session');
        }
    }
    return null;
}

// Guardar sesión
function guardarSesion(usuario, recordar) {
    const sessionData = {
        id: usuario.id,
        username: usuario.username,
        rol: usuario.rol,
        procesosAsignados: usuario.procesosAsignados || [],
        fecha: new Date().toISOString(),
        expiracion: new Date(Date.now() + (recordar ? AUTH_CONFIG.sessionDuration.recordar : AUTH_CONFIG.sessionDuration.normal)).toISOString()
    };
    localStorage.setItem('alpha_db_session', JSON.stringify(sessionData));
}

// Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem('alpha_db_session');
    window.location.href = 'login.html';
}

// Validar credenciales
function validarCredenciales(username, password) {
    const usuarios = getUsuarios();
    const usuario = usuarios.find(u => u.username === username.toUpperCase() && u.password === password);
    return usuario || null;
}

// Obtener usuario actual
function getUsuarioActual() {
    const session = verificarSesion();
    if (session) {
        return session;
    }
    return null;
}

// ============================================================
// FUNCIONES DE PERMISOS POR ROL
// ============================================================

function esAdmin() {
    const usuario = getUsuarioActual();
    return usuario && usuario.rol === 'admin';
}

function esOperador() {
    const usuario = getUsuarioActual();
    return usuario && usuario.rol === 'operador';
}

function esUsuarioTracking() {
    const usuario = getUsuarioActual();
    return usuario && usuario.rol === 'usuario_tracking';
}

function esConsultor() {
    const usuario = getUsuarioActual();
    return usuario && usuario.rol === 'consultor';
}

function puedeEditar() {
    const usuario = getUsuarioActual();
    return usuario && (usuario.rol === 'admin' || usuario.rol === 'operador');
}

function puedeEliminar() {
    const usuario = getUsuarioActual();
    return usuario && (usuario.rol === 'admin' || usuario.rol === 'operador');
}

function puedeAccederConfiguracion() {
    const usuario = getUsuarioActual();
    return usuario && usuario.rol === 'admin';
}

function puedeVerFormulario() {
    const usuario = getUsuarioActual();
    return usuario && (usuario.rol === 'admin' || usuario.rol === 'operador');
}

function puedeAccederBaseDatos() {
    const usuario = getUsuarioActual();
    return usuario && (usuario.rol === 'admin' || usuario.rol === 'operador');
}

function puedeAccederConsultas() {
    const usuario = getUsuarioActual();
    return usuario !== null;
}

function puedeAccederTracking() {
    const usuario = getUsuarioActual();
    return usuario && (usuario.rol === 'admin' || usuario.rol === 'operador' || usuario.rol === 'usuario_tracking');
}

// ============================================================
// FUNCIONES PARA AVANCE DE PROCESOS EN TRACKING
// ============================================================

// Verificar si el usuario puede avanzar un proceso específico
function puedeAvanzarProceso(proceso) {
    const usuario = getUsuarioActual();
    if (!usuario) return false;
    
    // Admin y usuario_tracking pueden avanzar cualquier proceso
    if (usuario.rol === 'admin' || usuario.rol === 'usuario_tracking') {
        return true;
    }
    
    // Operador normal solo puede avanzar sus procesos asignados
    if (usuario.rol === 'operador') {
        const procesosAsignados = usuario.procesosAsignados || [];
        return procesosAsignados.includes(proceso);
    }
    
    return false;
}

// Obtener procesos que el usuario puede avanzar
function getProcesosPermitidos() {
    const usuario = getUsuarioActual();
    if (!usuario) return [];
    
    if (usuario.rol === 'admin' || usuario.rol === 'usuario_tracking') {
        return ['DISEÑO', 'PLOTTER', 'SUBLIMADO', 'FLAT', 'LASER', 'BORDADO'];
    }
    
    if (usuario.rol === 'operador') {
        return usuario.procesosAsignados || [];
    }
    
    return [];
}

function puedeAccederAprobaciones() {
    const usuario = getUsuarioActual();
    return usuario && (usuario.rol === 'admin' || usuario.rol === 'operador');
}

function puedeAccederBandeja() {
    const usuario = getUsuarioActual();
    return usuario && (usuario.rol === 'admin' || usuario.rol === 'operador');
}

function getNombreRol() {
    const usuario = getUsuarioActual();
    if (!usuario) return '';
    switch(usuario.rol) {
        case 'admin': return '👑 Administrador';
        case 'operador': return '👤 Operador';
        case 'usuario_tracking': return '📍 Usuario Tracking';
        case 'consultor': return '👁️ Consultor';
        default: return '👤 Usuario';
    }
}

// Exportar a window
window.cerrarSesion = cerrarSesion;
window.verificarSesion = verificarSesion;
window.getUsuarioActual = getUsuarioActual;
window.esAdmin = esAdmin;
window.esOperador = esOperador;
window.esUsuarioTracking = esUsuarioTracking;
window.esConsultor = esConsultor;
window.puedeEditar = puedeEditar;
window.puedeEliminar = puedeEliminar;
window.puedeAccederConfiguracion = puedeAccederConfiguracion;
window.puedeVerFormulario = puedeVerFormulario;
window.puedeAccederBaseDatos = puedeAccederBaseDatos;
window.puedeAccederConsultas = puedeAccederConsultas;
window.puedeAccederTracking = puedeAccederTracking;
window.puedeAvanzarProceso = puedeAvanzarProceso;
window.getProcesosPermitidos = getProcesosPermitidos;
window.puedeAccederAprobaciones = puedeAccederAprobaciones;
window.puedeAccederBandeja = puedeAccederBandeja;
window.getNombreRol = getNombreRol;

// Inicializar login si estamos en login.html
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('login.html')) {
        console.log('🔐 Página de login cargada');
        
        const session = verificarSesion();
        if (session) {
            window.location.href = 'index.html';
            return;
        }
        
        const loginForm = document.getElementById('loginForm');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const rememberMeCheck = document.getElementById('rememberMe');
        const forgotPasswordLink = document.getElementById('forgotPassword');
        
        const rememberedUser = localStorage.getItem('alpha_db_remembered_user');
        if (rememberedUser) {
            usernameInput.value = rememberedUser;
            rememberMeCheck.checked = true;
        }
        
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            
            const usuario = validarCredenciales(username, password);
            
            if (usuario) {
                if (rememberMeCheck.checked) {
                    localStorage.setItem('alpha_db_remembered_user', username);
                } else {
                    localStorage.removeItem('alpha_db_remembered_user');
                }
                guardarSesion(usuario, rememberMeCheck.checked);
                window.location.href = 'index.html';
            } else {
                mostrarError('Usuario o contraseña incorrectos');
                passwordInput.value = '';
            }
        });
        
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            mostrarError('Contacte al administrador para recuperar su contraseña');
        });
        
        function mostrarError(mensaje) {
            const errorExistente = document.querySelector('.error-message');
            if (errorExistente) errorExistente.remove();
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = mensaje;
            loginForm.insertAdjacentElement('afterend', errorDiv);
            
            setTimeout(() => errorDiv.remove(), 3000);
        }
    }
});

console.log('✅ auth.js cargado - Roles: admin, operador, usuario_tracking, consultor');