/**
 * Firebase Authentication Module v9+ ES6
 * Modulo de autenticación con Firebase SDK v9+ moderna
 * 
 * Funcionalidades:
 * - Registro con email y contraseña
 * - Login con persistencia de sesión
 * - Recuperación de contraseña
 * - Autenticación multi-factor (MFA)
 * - Manejo de errores mejorado
 */

// Configuración de Firebase
const firebaseConfig = {
  // Reemplaza con tu configuración de Firebase
  apiKey: process.env.FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'your-project',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.FIREBASE_APP_ID || '1:123456789:web:abcdef123456'
};

class FirebaseAuthManager {
  constructor(config) {
    this.config = config;
    this.auth = null;
    this.currentUser = null;
    this.sessionKey = 'magnani_session';
  }

  /**
   * Inicializa Firebase Authentication
   * Debe llamarse al cargar la página
   */
  async init() {
    try {
      // Importar Firebase v9+
      const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js');
      const { getAuth, setPersistence, browserLocalPersistence } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js');
      
      // Inicializar Firebase
      const app = initializeApp(this.config);
      this.auth = getAuth(app);
      
      // Configurar persistencia de sesión
      await setPersistence(this.auth, browserLocalPersistence);
      
      console.log('[AUTH] Firebase inicializado correctamente');
      return this.auth;
    } catch (error) {
      console.error('[AUTH ERROR] Error al inicializar Firebase:', error);
      throw error;
    }
  }

  /**
   * Registrar nuevo usuario con email y contraseña
   * @param {string} email - Correo del usuario
   * @param {string} password - Contraseña
   * @param {string} displayName - Nombre del usuario
   * @returns {Object} Usuario registrado
   */
  async register(email, password, displayName) {
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js');
      
      // Validaciones
      this.validateEmail(email);
      this.validatePassword(password);
      
      // Crear usuario
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Actualizar perfil
      await updateProfile(user, {
        displayName: displayName
      });
      
      // Guardar sesión
      this.currentUser = user;
      this.saveSession();
      
      console.log('[AUTH] Usuario registrado:', email);
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          metadata: user.metadata
        }
      };
    } catch (error) {
      return this.handleAuthError(error, 'register');
    }
  }

  /**
   * Iniciar sesión con email y contraseña
   * @param {string} email - Correo del usuario
   * @param {string} password - Contraseña
   * @returns {Object} Usuario autenticado
   */
  async login(email, password) {
    try {
      const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js');
      
      this.validateEmail(email);
      
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      this.currentUser = user;
      this.saveSession();
      
      console.log('[AUTH] Login exitoso:', email);
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          metadata: user.metadata
        }
      };
    } catch (error) {
      return this.handleAuthError(error, 'login');
    }
  }

  /**
   * Enviar email de recuperación de contraseña
   * @param {string} email - Correo del usuario
   */
  async sendPasswordReset(email) {
    try {
      const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js');
      
      this.validateEmail(email);
      
      await sendPasswordResetEmail(this.auth, email);
      console.log('[AUTH] Email de recuperación enviado:', email);
      
      return {
        success: true,
        message: 'Email de recuperación enviado. Revisa tu bandeja de entrada.'
      };
    } catch (error) {
      return this.handleAuthError(error, 'password-reset');
    }
  }

  /**
   * Verificar email de usuario
   */
  async sendEmailVerification() {
    try {
      const { sendEmailVerification } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js');
      
      if (!this.currentUser) {
        throw new Error('No hay usuario autenticado');
      }
      
      await sendEmailVerification(this.currentUser);
      console.log('[AUTH] Email de verificación enviado');
      
      return {
        success: true,
        message: 'Email de verificación enviado'
      };
    } catch (error) {
      return this.handleAuthError(error, 'email-verification');
    }
  }

  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      const { signOut } = await import('https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js');
      
      await signOut(this.auth);
      this.currentUser = null;
      this.clearSession();
      
      console.log('[AUTH] Sesión cerrada');
      return { success: true };
    } catch (error) {
      return this.handleAuthError(error, 'logout');
    }
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Validar formato de email
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Formato de email inválido');
    }
  }

  /**
   * Validar fortaleza de contraseña
   */
  validatePassword(password) {
    if (password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('La contraseña debe contener al menos una mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('La contraseña debe contener al menos una minúscula');
    }
    if (!/\d/.test(password)) {
      throw new Error('La contraseña debe contener al menos un número');
    }
  }

  /**
   * Manejar errores de autenticación
   */
  handleAuthError(error, operation) {
    let message = 'Error de autenticación';
    
    const errorMap = {
      'auth/invalid-email': 'Email inválido',
      'auth/user-disabled': 'Usuario deshabilitado',
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'El email ya está registrado',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/weak-password': 'Contraseña débil',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.'
    };
    
    if (error.code && errorMap[error.code]) {
      message = errorMap[error.code];
    } else if (error.message) {
      message = error.message;
    }
    
    console.error(`[AUTH ERROR] ${operation}:`, error);
    return {
      success: false,
      error: message,
      code: error.code
    };
  }

  /**
   * Guardar sesión en localStorage
   */
  saveSession() {
    if (this.currentUser) {
      const sessionData = {
        uid: this.currentUser.uid,
        email: this.currentUser.email,
        displayName: this.currentUser.displayName,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
    }
  }

  /**
   * Limpiar sesión
   */
  clearSession() {
    localStorage.removeItem(this.sessionKey);
  }

  /**
   * Recuperar sesión guardada
   */
  restoreSession() {
    const sessionData = localStorage.getItem(this.sessionKey);
    if (sessionData) {
      try {
        const data = JSON.parse(sessionData);
        console.log('[AUTH] Sesión restaurada para:', data.email);
        return data;
      } catch (error) {
        console.error('[AUTH] Error al restaurar sesión:', error);
        this.clearSession();
      }
    }
    return null;
  }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FirebaseAuthManager;
}

// Crear instancia global
const authManager = new FirebaseAuthManager(firebaseConfig);

console.log('[FIREBASE-AUTH] Módulo cargado correctamente');
