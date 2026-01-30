/**
 * Socket.io Server for Real-time Notifications
 * Magnani Asistencia - Fase 2
 * 
 * Provides real-time communication between server and clients for:
 * - Check-in/Check-out confirmations
 * - Geofencing alerts
 * - Admin broadcasts
 * - Late arrival notifications
 */

const socketIO = require('socket.io');

/**
 * Initialize Socket.io server
 * @param {Object} httpServer - HTTP server instance
 * @param {Object} db - Firebase database instance
 * @returns {Object} io - Socket.io instance
 */
function initializeSocketServer(httpServer, db) {
  const io = socketIO(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log('[SOCKET] New client connected:', socket.id);
    
    // Client joins room with their user ID
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`[SOCKET] User ${userId} joined room`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('[SOCKET] Client disconnected:', socket.id);
    });
  });

  return io;
}

/**
 * Notification emitters
 */
const NotificationEmitters = {
  /**
   * Send attendance confirmation notification
   */
  sendAttendanceConfirmation(io, userId, data) {
    io.to(userId).emit('attendance_confirmed', {
      type: data.type, // 'check-in' or 'check-out'
      time: new Date(data.timestamp).toLocaleTimeString('es-AR'),
      onTime: data.onTime,
      message: data.onTime ? 'Asistencia registrada a tiempo' : 'Llegada tarde'
    });
    console.log(`[NOTIF] Attendance confirmation sent to ${userId}`);
  },

  /**
   * Send geofencing alert
   */
  sendGeofenceAlert(io, userId, distance) {
    io.to(userId).emit('geofence_alert', {
      distance: Math.round(distance),
      message: `Estás a ${Math.round(distance)}m del punto de control. Acércate para marcar asistencia.`
    });
    console.log(`[NOTIF] Geofence alert sent to ${userId} - ${distance}m away`);
  },

  /**
   * Send admin broadcast to all connected users
   */
  sendAdminBroadcast(io, message, adminName) {
    io.emit('admin_broadcast', {
      message,
      timestamp: new Date().toISOString(),
      from: adminName
    });
    console.log(`[NOTIF] Admin broadcast sent by ${adminName}`);
  },

  /**
   * Send late arrival notification
   */
  sendLateArrivalNotification(io, userId, minutesLate) {
    io.to(userId).emit('late_arrival', {
      minutesLate,
      message: `Llegaste ${minutesLate} minutos tarde.`
    });
    console.log(`[NOTIF] Late arrival notification sent to ${userId}`);
  },

  /**
   * Send inactivity alert
   */
  sendInactivityAlert(io, userId, daysInactive) {
    io.to(userId).emit('inactivity_alert', {
      daysInactive,
      message: `No has marcado asistencia en ${daysInactive} días.`
    });
    console.log(`[NOTIF] Inactivity alert sent to ${userId}`);
  }
};

module.exports = {
  initializeSocketServer,
  NotificationEmitters
};

console.log('[SOCKET-SERVER] Module loaded successfully');
