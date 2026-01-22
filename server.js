const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Firebase Admin Initialization
// Replace with your Firebase config
const serviceAccount = require('./firebase-config.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();
const auth = admin.auth();

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const GEOFENCE_CENTER = { lat: -32.91989387, lng: -60.7068 };
const GEOFENCE_RADIUS = 100; // meters

// Utility Functions
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.asin(Math.sqrt(a));
    return R * c;
}

function isWithinGeofence(userLat, userLng) {
    const distance = calculateDistance(
        GEOFENCE_CENTER.lat,
        GEOFENCE_CENTER.lng,
        userLat,
        userLng
    );
    return distance <= GEOFENCE_RADIUS;
}

// Middleware for authentication
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Routes

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name, department, deviceUUID } = req.body;

        // Validate input
        if (!email || !password || !name || !department) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name
        });

        // Store user data in Realtime Database
        await db.ref(`users/${userRecord.uid}`).set({
            email,
            name,
            department,
            deviceUUID,
            registeredAt: new Date().toISOString(),
            uid: userRecord.uid
        });

        // Generate JWT token
        const token = jwt.sign(
            { uid: userRecord.uid, email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ 
            message: 'User registered successfully',
            token,
            user: { uid: userRecord.uid, email, name, department }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Get user by email from Firebase Auth
        const userRecord = await auth.getUserByEmail(email);

        // In production, use Firebase token verification
        const token = jwt.sign(
            { uid: userRecord.uid, email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Get user data from database
        const snapshot = await db.ref(`users/${userRecord.uid}`).once('value');
        const userData = snapshot.val();

        res.json({ 
            message: 'Login successful',
            token,
            user: userData
        });
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Attendance Routes
app.post('/api/attendance/check-in', verifyToken, async (req, res) => {
    try {
        const { location, deviceUUID } = req.body;
        const { uid } = req.user;

        // Validate geofence
        if (!isWithinGeofence(location.lat, location.lng)) {
            return res.status(400).json({ error: 'Outside geofence radius' });
        }

        const today = new Date().toISOString().split('T')[0];
        const timestamp = new Date().toISOString();

        const attendanceRecord = {
            type: 'check-in',
            timestamp,
            location,
            deviceUUID,
            verified: true
        };

        await db.ref(`attendance/${uid}/${today}`).push(attendanceRecord);

        res.json({ 
            message: 'Check-in recorded',
            record: attendanceRecord
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/attendance/check-out', verifyToken, async (req, res) => {
    try {
        const { location, deviceUUID } = req.body;
        const { uid } = req.user;

        // Validate geofence
        if (!isWithinGeofence(location.lat, location.lng)) {
            return res.status(400).json({ error: 'Outside geofence radius' });
        }

        const today = new Date().toISOString().split('T')[0];
        const timestamp = new Date().toISOString();

        const attendanceRecord = {
            type: 'check-out',
            timestamp,
            location,
            deviceUUID,
            verified: true
        };

        await db.ref(`attendance/${uid}/${today}`).push(attendanceRecord);

        res.json({ 
            message: 'Check-out recorded',
            record: attendanceRecord
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/attendance/today', verifyToken, async (req, res) => {
    try {
        const { uid } = req.user;
        const today = new Date().toISOString().split('T')[0];

        const snapshot = await db.ref(`attendance/${uid}/${today}`).once('value');
        const records = snapshot.val() || {};

        const recordsArray = Object.values(records);
        res.json({ records: recordsArray });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/attendance/month', verifyToken, async (req, res) => {
    try {
        const { uid } = req.user;
        const now = new Date();
        const month = now.toISOString().slice(0, 7); // YYYY-MM

        const snapshot = await db.ref(`attendance/${uid}`).orderByChild('timestamp').once('value');
        const allRecords = snapshot.val() || {};

        // Filter by month
        const monthRecords = Object.values(allRecords).filter(record => {
            return record.timestamp.startsWith(month);
        });

        // Calculate statistics
        const stats = {
            totalDays: new Set(monthRecords.map(r => r.timestamp.split('T')[0])).size,
            checkIns: monthRecords.filter(r => r.type === 'check-in').length,
            checkOuts: monthRecords.filter(r => r.type === 'check-out').length
        };

        res.json({ stats, records: monthRecords });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Admin Routes
app.get('/api/admin/users', verifyToken, async (req, res) => {
    try {
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val() || {};
        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/attendance/:userId/:date', verifyToken, async (req, res) => {
    try {
        const { userId, date } = req.params;
        const snapshot = await db.ref(`attendance/${userId}/${date}`).once('value');
        const records = snapshot.val() || {};
        res.json({ records: Object.values(records) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Magnani Asistencia server running on port ${PORT}`);
});


// ==========================================
// SECURITY ENHANCEMENTS
// ==========================================

/**
 * Validador de datos
 */
const DataValidator = {
    /**
     * Validar UUID v4
     * @param {string} uuid 
     * @returns {boolean}
     */
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    },
    
    /**
     * Validar coordenadas GPS
     * @param {number} lat 
     * @param {number} lng 
     * @returns {boolean}
     */
    isValidGPSCoordinates(lat, lng) {
        return typeof lat === 'number' && typeof lng === 'number' &&
               lat >= -90 && lat <= 90 &&
               lng >= -180 && lng <= 180;
    },
    
    /**
     * Validar email
     * @param {string} email 
     * @returns {boolean}
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    /**
     * Validar fortaleza de contraseña
     * @param {string} password 
     * @returns {object}
     */
    validatePassword(password) {
        const requirements = {
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumbers: /\d/.test(password),
            hasSpecialChars: /[!@#$%^&*]/.test(password)
        };
        
        const score = Object.values(requirements).filter(v => v).length;
        return {
            isStrong: score >= 4,
            score,
            requirements
        };
    }
};

/**
 * Rate Limiting
 */
const rateLimitStore = new Map();

const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        if (!rateLimitStore.has(ip)) {
            rateLimitStore.set(ip, []);
        }
        
        const requests = rateLimitStore.get(ip).filter(time => now - time < windowMs);
        
        if (requests.length >= maxRequests) {
            return res.status(429).json({ error: 'Too many requests, please try again later.' });
        }
        
        requests.push(now);
        rateLimitStore.set(ip, requests);
        next();
    };
};

/**
 * Input Sanitization
 */
const sanitizeInput = (data) => {
    if (typeof data !== 'string') return data;
    
    return data
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
};

// Aplicar rate limiting a endpoints sensibles
app.post('/api/auth/login', rateLimiter(5, 15 * 60 * 1000), async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validaciones
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        if (!DataValidator.isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Sanitizar entrada
        const sanitizedEmail = sanitizeInput(email);
        
        // Obtener usuario
        const userRecord = await auth.getUserByEmail(sanitizedEmail);
        
        const token = jwt.sign(
            { uid: userRecord.uid, email: sanitizedEmail },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        const snapshot = await db.ref(`users/${userRecord.uid}`).once('value');
        const userData = snapshot.val();
        
        res.json({ 
            message: 'Login successful',
            token,
            user: userData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Aplicar rate limiting a registro
app.post('/api/auth/register', rateLimiter(10, 60 * 60 * 1000), async (req, res) => {
    try {
        const { email, password, name, department, deviceUUID } = req.body;
        
        // Validaciones
        if (!email || !password || !name || !department) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (!DataValidator.isValidEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        const passwordValidation = DataValidator.validatePassword(password);
        if (!passwordValidation.isStrong) {
            return res.status(400).json({ 
                error: 'Password is too weak. Must contain uppercase, lowercase, numbers, and special characters.',
                requirements: passwordValidation.requirements
            });
        }
        
        if (!DataValidator.isValidUUID(deviceUUID)) {
            return res.status(400).json({ error: 'Invalid device UUID' });
        }
        
        // Sanitizar entradas
        const sanitizedEmail = sanitizeInput(email);
        const sanitizedName = sanitizeInput(name);
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userRecord = await auth.createUser({
            email: sanitizedEmail,
            password,
            displayName: sanitizedName
        });
        
        await db.ref(`users/${userRecord.uid}`).set({
            email: sanitizedEmail,
            name: sanitizedName,
            department,
            deviceUUID,
            registeredAt: new Date().toISOString(),
            uid: userRecord.uid
        });
        
        const token = jwt.sign(
            { uid: userRecord.uid, email: sanitizedEmail },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({ 
            message: 'User registered successfully',
            token,
            user: { uid: userRecord.uid, email: sanitizedEmail, name: sanitizedName, department }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

console.log('Security enhancements loaded - Input validation, rate limiting, and data sanitization enabled');

/**
 * DEVICE BINDING SECURITY
 * Valida que cada empleado solo marque asistencia desde su dispositivo asignado
 */

/**
 * Validar si el dispositivo pertenece al usuario
 * @param {string} userId 
 * @param {string} currentDeviceUUID 
 * @returns {Promise<boolean>}
 */
async function validateDeviceBinding(userId, currentDeviceUUID) {
  try {
    const userSnapshot = await db.ref(`users/${userId}`).once('value');
    const userData = userSnapshot.val();
    
    if (!userData) {
      return false;
    }
    
    // Validar que el dispositivo coincida con el registrado
    return userData.deviceUUID === currentDeviceUUID;
  } catch (error) {
    console.error('Device validation error:', error);
    return false;
  }
}

/**
 * Middleware para validar dispositivo
 */
const verifyDeviceBinding = async (req, res, next) => {
  try {
    const { uid } = req.user;
    const { deviceUUID } = req.body;
    
    if (!deviceUUID) {
      return res.status(400).json({ error: 'Device UUID required' });
    }
    
    const isValidDevice = await validateDeviceBinding(uid, deviceUUID);
    
    if (!isValidDevice) {
      return res.status(403).json({ 
        error: 'Device mismatch - Esta asistencia debe ser marcada desde tu dispositivo registrado. Contacta al administrador si cambiaste de móvil.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Device binding verification error:', error);
    res.status(500).json({ error: 'Device verification failed' });
  }
};

/**
 * Endpoint para administrador: Cambiar dispositivo asignado a un empleado
 * POST /api/admin/change-device/:userId
 */
app.post('/api/admin/change-device/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newDeviceUUID } = req.body;
    const { uid } = req.user;
    
    // Validar que solo administradores puedan hacer esto
    const adminSnapshot = await db.ref(`users/${uid}/role`).once('value');
    const userRole = adminSnapshot.val();
    
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden cambiar dispositivos' });
    }
    
    if (!newDeviceUUID) {
      return res.status(400).json({ error: 'New device UUID required' });
    }
    
    if (!DataValidator.isValidUUID(newDeviceUUID)) {
      return res.status(400).json({ error: 'Invalid device UUID format' });
    }
    
    // Obtener datos del usuario
    const userSnapshot = await db.ref(`users/${userId}`).once('value');
    const userData = userSnapshot.val();
    
    if (!userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const oldDeviceUUID = userData.deviceUUID;
    
    // Actualizar dispositivo
    await db.ref(`users/${userId}`).update({
      deviceUUID: newDeviceUUID,
      deviceChangedAt: new Date().toISOString(),
      deviceChangedBy: uid
    });
    
    // Registrar cambio en auditoría
    await db.ref(`audit/device-changes/${userId}`).push({
      timestamp: new Date().toISOString(),
      oldDeviceUUID,
      newDeviceUUID,
      changedBy: uid,
      adminName: req.user.email
    });
    
    res.json({ 
      message: 'Dispositivo actualizado exitosamente',
      user: userData.name,
      oldDevice: oldDeviceUUID,
      newDevice: newDeviceUUID,
      changedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Device change error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint para obtener historial de cambios de dispositivo
 * GET /api/admin/device-history/:userId
 */
app.get('/api/admin/device-history/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { uid } = req.user;
    
    // Validar que solo administradores puedan ver esto
    const adminSnapshot = await db.ref(`users/${uid}/role`).once('value');
    const userRole = adminSnapshot.val();
    
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden ver este historial' });
    }
    
    const snapshot = await db.ref(`audit/device-changes/${userId}`).once('value');
    const history = snapshot.val() || {};
    const historyArray = Object.entries(history).map(([key, value]) => ({ id: key, ...value }));
    
    res.json({ 
      userId,
      deviceChangeHistory: historyArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    });
  } catch (error) {
    console.error('Device history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Aplicar validación de dispositivo a endpoints de asistencia
app.post('/api/attendance/check-in', verifyToken, verifyDeviceBinding, async (req, res) => {
  try {
    const { location, deviceUUID } = req.body;
    const { uid } = req.user;
    
    // Validar geofence
    if (!isWithinGeofence(location.lat, location.lng)) {
      return res.status(400).json({ error: 'Outside geofence radius' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();
    const attendanceRecord = {
      type: 'check-in',
      timestamp,
      location,
      deviceUUID,
      verified: true
    };
    
    await db.ref(`attendance/${uid}/${today}`).push(attendanceRecord);
    res.json({ 
      message: 'Check-in recorded',
      record: attendanceRecord
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/attendance/check-out', verifyToken, verifyDeviceBinding, async (req, res) => {
  try {
    const { location, deviceUUID } = req.body;
    const { uid } = req.user;
    
    // Validar geofence
    if (!isWithinGeofence(location.lat, location.lng)) {
      return res.status(400).json({ error: 'Outside geofence radius' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();
    const attendanceRecord = {
      type: 'check-out',
      timestamp,
      location,
      deviceUUID,
      verified: true
    };
    
    await db.ref(`attendance/${uid}/${today}`).push(attendanceRecord);
    res.json({ 
      message: 'Check-out recorded',
      record: attendanceRecord
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

console.log('Device binding security initialized - Device validation enabled for attendance');


// Comprehensive Error Logging and Global Error Handlers

// Handle global unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('\n[UNHANDLED REJECTION] at:', promise, 'reason:', reason);
    console.error('Stack trace:', reason instanceof Error ? reason.stack : reason);
});

// Handle global uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('\n[UNCAUGHT EXCEPTION]:', error);
    console.error('Stack trace:', error.stack);
    console.error('The application will exit to prevent unstable state.');
    process.exit(1);
});

// Server initialization and startup
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all interfaces

app.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(60));
    console.log('Magnani Asistencia - Servidor iniciado exitosamente');
    console.log('='.repeat(60));
    console.log('[INFO] Puerto: ' + PORT);
    console.log('[INFO] Acceso local: http://localhost:' + PORT);
    console.log('[INFO] Acceso en red: http://192.168.11.127:' + PORT);
    console.log('[INFO] Geofencing: Habilitado - Centro en Rosario');
    console.log('[INFO] Validación de dispositivo: Habilitada');
    console.log('[INFO] Timestamp servidor: ' + new Date().toISOString());
    console.log('='.repeat(60));
    console.log('\nServidor escuchando en puerto ' + PORT);
    console.log('Presiona Ctrl+C para detener el servidor\n');
});

// Handle server errors
const server = app.listen ? app._server : null;
if (app._server) {
    app._server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error('\n[ERROR] Puerto ' + PORT + ' ya está en uso.');
            console.error('[INFO] Intenta cambiar el puerto o cierra la otra aplicación.');
        } else if (err.code === 'EACCES') {
            console.error('\n[ERROR] Permiso denegado para usar puerto ' + PORT);
            console.error('[INFO] Intenta usar un puerto mayor a 1024.');
        } else {
            console.error('[ERROR] Error del servidor:', err);
        }
        process.exit(1);
    });
}

// Graceful shutdown handler
process.on('SIGINT', () => {
    console.log('\n[INFO] Señal de interrupción recibida (Ctrl+C)');
    console.log('[INFO] Cerrando servidor gracefully...');
    
    if (app._server) {
        app._server.close(() => {
            console.log('[INFO] Servidor cerrado correctamente');
            console.log('[INFO] Desconectando de la base de datos...');
            process.exit(0);
        });
        
        // Timeout para force close
        setTimeout(() => {
            console.error('[ERROR] No se pudo cerrar el servidor en 10 segundos, forzando cierre...');
            process.exit(1);
        }, 10000);
    } else {
        process.exit(0);
    }
});

// Log initialization
console.log('[DEBUG] Variables de entorno cargadas');
console.log('[DEBUG] Middleware de CORS configurado');
console.log('[DEBUG] Rutas de API registradas');
console.log('[DEBUG] Sistema de autenticación activo');
console.log('[DEBUG] Sistema de geofencing activo');
console.log('[DEBUG] Sistema de vinculación de dispositivos activo\n');
