// js/auth-local.js
// Credenciales de prueba
const USUARIO_VALIDO = {
    username: "ALPHA",
    password: "DB2024"
};

// También permitir versión en minúsculas para facilidad
const USUARIO_VALIDO_LOWERCASE = {
    username: "alpha",
    password: "db2024"
};

// Verificar si ya hay una sesión activa
function verificarSesion() {
    const session = localStorage.getItem('alpha_db_session');
    if (session) {
        try {
            const data = JSON.parse(session);
            const expiracion = new Date(data.expiracion);
            if (expiracion > new Date()) {
                // Sesión válida, redirigir al sistema principal
                window.location.href = 'index.html';
                return true;
            } else {
                // Sesión expirada
                localStorage.removeItem('alpha_db_session');
            }
        } catch(e) {
            localStorage.removeItem('alpha_db_session');
        }
    }
    return false;
}

// Guardar sesión
function guardarSesion(recordar) {
    const sessionData = {
        usuario: USUARIO_VALIDO.username,
        fecha: new Date().toISOString()
    };
    
    if (recordar) {
        // 30 días de sesión
        sessionData.expiracion = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
        // 24 horas de sesión
        sessionData.expiracion = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }
    
    localStorage.setItem('alpha_db_session', JSON.stringify(sessionData));
}

// Cerrar sesión (para usar desde el sistema principal)
window.cerrarSesion = function() {
    localStorage.removeItem('alpha_db_session');
    window.location.href = 'login.html';
};

// Inicializar el login
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Página de login cargada');
    
    // Verificar si ya hay sesión activa
    if (verificarSesion()) {
        console.log('✅ Sesión existente, redirigiendo...');
        return;
    }
    
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberMeCheck = document.getElementById('rememberMe');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    
    // Cargar usuario recordado si existe
    const rememberedUser = localStorage.getItem('alpha_db_remembered_user');
    if (rememberedUser) {
        usernameInput.value = rememberedUser;
        rememberMeCheck.checked = true;
    }
    
    // Manejar envío del formulario
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        console.log('🔐 Intentando login con:', username);
        
        // Validar credenciales (mayúsculas o minúsculas)
        const esValido = (username === USUARIO_VALIDO.username && password === USUARIO_VALIDO.password) ||
                         (username === USUARIO_VALIDO_LOWERCASE.username && password === USUARIO_VALIDO_LOWERCASE.password);
        
        if (esValido) {
            console.log('✅ Login exitoso, redirigiendo...');
            
            // Guardar usuario recordado
            if (rememberMeCheck.checked) {
                localStorage.setItem('alpha_db_remembered_user', username);
            } else {
                localStorage.removeItem('alpha_db_remembered_user');
            }
            
            // Guardar sesión
            guardarSesion(rememberMeCheck.checked);
            
            // Redirigir al sistema principal
            window.location.href = 'index.html';
        } else {
            console.log('❌ Login fallido');
            mostrarError('Usuario o contraseña incorrectos');
        }
    });
    
    // Mostrar mensaje de error
    function mostrarError(mensaje) {
        // Eliminar error existente
        const errorExistente = document.querySelector('.error-message');
        if (errorExistente) errorExistente.remove();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = mensaje;
        loginForm.insertAdjacentElement('afterend', errorDiv);
        
        // Limpiar campos
        passwordInput.value = '';
        
        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            if (errorDiv) errorDiv.remove();
        }, 3000);
    }
    
    // Manejar "Olvidé mi contraseña"
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        mostrarError('Credenciales de prueba: Usuario: ALPHA / Contraseña: DB2024');
    });
    
    // Permitir Enter en los campos
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            passwordInput.focus();
        }
    });
    
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
});
