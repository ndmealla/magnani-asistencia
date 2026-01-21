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
const GEOFENCE_CENTER = { lat: -32.9387, lng: -60.6611 };
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
