const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Mock Database
const users = {};
const attendance = {};

// Constants
const GEOFENCE_CENTER = { lat: -32.9198, lng: -60.7068 };
const GEOFENCE_RADIUS = 100;

// Calculate Distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
}

// Verify Token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  req.user = { uid: token.split(':')[0], email: token.split(':')[1] };
  next();
};

// Routes
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, department, deviceUUID } = req.body;
  const uid = Math.random().toString(36).substr(2, 9);
  users[uid] = { email, name, department, deviceUUID, uid };
  const token = `${uid}:${email}`;
  res.json({ message: 'Registered', token, user: users[uid] });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = Object.values(users).find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = `${user.uid}:${email}`;
  res.json({ message: 'Login successful', token, user });
});

app.post('/api/attendance/check-in', verifyToken, (req, res) => {
  const { location, deviceUUID } = req.body;
  const { uid } = req.user;
  
  const distance = calculateDistance(
    GEOFENCE_CENTER.lat, GEOFENCE_CENTER.lng,
    location.lat, location.lng
  );
  
  if (distance > GEOFENCE_RADIUS) {
    return res.status(400).json({ error: 'Outside geofence' });
  }
  
  const today = new Date().toISOString().split('T')[0];
  if (!attendance[uid]) attendance[uid] = {};
  if (!attendance[uid][today]) attendance[uid][today] = [];
  
  attendance[uid][today].push({
    type: 'check-in',
    timestamp: new Date().toISOString(),
    location,
    deviceUUID
  });
  
  res.json({ message: 'Check-in recorded', record: attendance[uid][today][0] });
});

app.post('/api/attendance/check-out', verifyToken, (req, res) => {
  const { location, deviceUUID } = req.body;
  const { uid } = req.user;
  
  const distance = calculateDistance(
    GEOFENCE_CENTER.lat, GEOFENCE_CENTER.lng,
    location.lat, location.lng
  );
  
  if (distance > GEOFENCE_RADIUS) {
    return res.status(400).json({ error: 'Outside geofence' });
  }
  
  const today = new Date().toISOString().split('T')[0];
  if (!attendance[uid]) attendance[uid] = {};
  if (!attendance[uid][today]) attendance[uid][today] = [];
  
  attendance[uid][today].push({
    type: 'check-out',
    timestamp: new Date().toISOString(),
    location,
    deviceUUID
  });
  
  res.json({ message: 'Check-out recorded', record: attendance[uid][today][attendance[uid][today].length-1] });
});

app.get('/api/stats', verifyToken, (req, res) => {
  res.json({ message: 'Demo server running successfully' });
});

app.listen(3000, () => {
  console.log('\n====================================');
  console.log('Magnani Asistencia - DEMO Server');
  console.log('====================================');
  console.log('Server running on port 3000');
  console.log('URL: http://192.168.11.127:3000');
  console.log('====================================\n');
});
