/**
 * Notification System v1.0
 * Real-time notifications (Socket.io + Push API)
 * 
 * Funcionalidades:
 * - Conexión WebSocket con Socket.io
 * - Notificaciones visuales (Toasts)
 * - Alertas de Geofencing
 * - Push Notifications para dispositivos móviles
 * - Historial de notificaciones local
 */

class NotificationManager {
  constructor() {
    this.socket = null;
    this.history = JSON.parse(localStorage.getItem('notification_history')) || [];
    this.container = null;
  }

  /**
   * Inicializar el sistema
   * @param {string} serverUrl - URL del servidor Socket.io
   */
  async init(serverUrl) {
    try {
      // Importar Socket.io client
      const { io } = await import('https://cdn.socket.io/4.7.2/socket.io.esm.min.js');
      
      this.socket = io(serverUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5
      });

      this.setupSocketListeners();
      this.createContainer();
      this.requestPushPermission();
      
      console.log('[NOTIF] Sistema de notificaciones inicializado');
    } catch (error) {
      console.error('[NOTIF ERROR] Error al inicializar:', error);
    }
  }

  /**
   * Configurar listeners de socket
   */
  setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('[NOTIF] Conectado al servidor de notificaciones');
      this.showToast('Conexión establecida', 'info');
    });

    this.socket.on('attendance_confirmed', (data) => {
      const msg = `Asistencia registrada: ${data.type.toUpperCase()} a las ${data.time}`;
      this.showToast(msg, 'success');
      this.addToHistory('attendance', msg);
    });

    this.socket.on('geofence_alert', (data) => {
      const msg = `ALERTA: Te encuentras a ${Math.round(data.distance)}m del punto de control.`;
      this.showToast(msg, 'warning');
      this.addToHistory('security', msg);
    });

    this.socket.on('admin_broadcast', (data) => {
      this.showToast(data.message, 'info', 10000);
      this.addToHistory('admin', data.message);
    });

    this.socket.on('disconnect', () => {
      this.showToast('Conexión perdida con el servidor', 'error');
    });
  }

  /**
   * Crear contenedor de toasts en el DOM
   */
  createContainer() {
    if (document.getElementById('notif-container')) return;
    
    this.container = document.createElement('div');
    this.container.id = 'notif-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
    
    // Agregar estilos base
    const style = document.createElement('style');
    style.textContent = `
      .toast-item {
        background: white;
        color: #333;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        transform: translateX(120%);
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        border-left: 5px solid #ccc;
        pointer-events: auto;
      }
      .toast-item.active { transform: translateX(0); }
      .toast-success { border-left-color: #10b981; }
      .toast-error { border-left-color: #ef4444; }
      .toast-warning { border-left-color: #f59e0b; }
      .toast-info { border-left-color: #3b82f6; }
      .toast-icon { font-size: 20px; }
    `;
    document.head.appendChild(style);
  }

  /**
   * Mostrar un toast visual
   */
  showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <div class="toast-content">${message}</div>
    `;

    this.container.appendChild(toast);
    
    // Forzar reflow para animación
    setTimeout(() => toast.classList.add('active'), 10);

    if (duration > 0) {
      setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }
  }

  /**
   * Solicitar permisos para Push Notifications
   */
  async requestPushPermission() {
    if (!('Notification' in window)) return;
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('[NOTIF] Permisos de Push concedidos');
    }
  }

  /**
   * Enviar notificación nativa de sistema
   */
  sendNativeNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/assets/logo.png',
        ...options
      });
    }
  }

  /**
   * Guardar en historial local
   */
  addToHistory(type, message) {
    const entry = {
      type,
      message,
      timestamp: new Date().toISOString()
    };
    this.history.unshift(entry);
    // Mantener últimos 50
    if (this.history.length > 50) this.history.pop();
    localStorage.setItem('notification_history', JSON.stringify(this.history));
  }

  /**
   * Limpiar historial
   */
  clearHistory() {
    this.history = [];
    localStorage.removeItem('notification_history');
  }
}

// Exportar instancia global
const notificationManager = new NotificationManager();

console.log('[NOTIFICATION-SYSTEM] Cargado');
