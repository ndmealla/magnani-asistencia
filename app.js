// Configuration
const CONFIG = {
    GEOFENCE_CENTER: { lat: -32.9387, lng: -60.6611 },
    GEOFENCE_RADIUS: 100, // meters
    API_BASE_URL: 'http://localhost:3000/api',
};

// Global State
let currentUser = null;
let attendanceToday = null;
let deviceUUID = null;

// Utility Functions
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getOrCreateDeviceUUID() {
    let uuid = localStorage.getItem('deviceUUID');
    if (!uuid) {
        uuid = generateUUID();
        localStorage.setItem('deviceUUID', uuid);
    }
    return uuid;
}

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
        CONFIG.GEOFENCE_CENTER.lat,
        CONFIG.GEOFENCE_CENTER.lng,
        userLat,
        userLng
    );
    return distance <= CONFIG.GEOFENCE_RADIUS;
}

function formatTime(date) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function toggleView(viewId) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

// Firebase Mock - Replace with actual Firebase config
class AttendanceDB {
    constructor() {
        this.data = JSON.parse(localStorage.getItem('attendanceData')) || {};
    }

    saveUser(email, userData) {
        const hashedEmail = btoa(email);
        this.data[hashedEmail] = userData;
        this.persist();
    }

    getUser(email) {
        const hashedEmail = btoa(email);
        return this.data[hashedEmail];
    }

    saveAttendance(email, attendanceRecord) {
        const hashedEmail = btoa(email);
        if (!this.data[hashedEmail]) {
            this.data[hashedEmail] = {};
        }
        const today = formatDate(new Date());
        if (!this.data[hashedEmail].attendance) {
            this.data[hashedEmail].attendance = {};
        }
        if (!this.data[hashedEmail].attendance[today]) {
            this.data[hashedEmail].attendance[today] = [];
        }
        this.data[hashedEmail].attendance[today].push(attendanceRecord);
        this.persist();
    }

    getAttendance(email, date) {
        const hashedEmail = btoa(email);
        if (!this.data[hashedEmail]) return [];
        return this.data[hashedEmail].attendance?.[date] || [];
    }

    persist() {
        localStorage.setItem('attendanceData', JSON.stringify(this.data));
    }
}

const db = new AttendanceDB();

// Authentication
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const user = db.getUser(email);
    if (user && user.password === btoa(password)) {
        currentUser = user;
        currentUser.email = email;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showDashboard();
    } else {
        alert('Credenciales inválidas');
    }
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const department = document.getElementById('registerDepartment').value;

    if (db.getUser(email)) {
        alert('El correo ya está registrado');
        return;
    }

    const userData = {
        name,
        email,
        password: btoa(password),
        department,
        registeredAt: new Date().toISOString(),
        deviceUUID: deviceUUID
    };

    db.saveUser(email, userData);
    currentUser = userData;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    alert('Registro exitoso');
    showDashboard();
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    toggleView('loginView');
}

// Dashboard Functions
function showDashboard() {
    updateUserInfo();
    updateLocationStatus();
    updateAttendanceInfo();
    updateAttendanceHistory();
    toggleView('dashboardView');
}

function updateUserInfo() {
    const userInfoDiv = document.getElementById('userInfo');
    if (currentUser) {
        userInfoDiv.innerHTML = `
            <div class="user-info-item">Ñ<strong>${currentUser.name}</strong></div>
            <div class="user-info-item">${currentUser.department}</div>
            <button class="logout-btn" onclick="handleLogout()">Cerrar Sesión</button>
        `;
    }
}

function updateLocationStatus() {
    const statusDiv = document.getElementById('locationStatus');
    const checkInBtn = document.getElementById('checkInBtn');
    const checkOutBtn = document.getElementById('checkOutBtn');

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            function(position) {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                const accuracy = position.coords.accuracy;

                const withinGeofence = isWithinGeofence(userLat, userLng);
                const distance = calculateDistance(
                    CONFIG.GEOFENCE_CENTER.lat,
                    CONFIG.GEOFENCE_CENTER.lng,
                    userLat,
                    userLng
                );

                if (withinGeofence) {
                    statusDiv.className = 'status-indicator success';
                    statusDiv.innerHTML = `📍 En la oficina<br><small>${Math.round(distance)}m de distancia</small>`;
                    checkInBtn.disabled = false;
                    checkOutBtn.disabled = false;
                } else {
                    statusDiv.className = 'status-indicator error';
                    statusDiv.innerHTML = `❌ Fuera de la oficina<br><small>${Math.round(distance)}m de distancia</small>`;
                    checkInBtn.disabled = true;
                    checkOutBtn.disabled = true;
                }

                // Store location data
                window.currentLocation = { lat: userLat, lng: userLng, accuracy };
            },
            function(error) {
                statusDiv.className = 'status-indicator error';
                statusDiv.innerHTML = `Error: ${error.message}`;
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
    } else {
        statusDiv.className = 'status-indicator error';
        statusDiv.innerHTML = 'Geolocalización no soportada';
    }
}

function checkIn() {
    if (!window.currentLocation) {
        alert('No se puede obtener la ubicación');
        return;
    }

    const now = new Date();
    const attendanceRecord = {
        type: 'check-in',
        timestamp: now.toISOString(),
        time: formatTime(now),
        location: window.currentLocation,
        deviceUUID: deviceUUID
    };

    db.saveAttendance(currentUser.email, attendanceRecord);
    attendanceToday = attendanceRecord;
    updateAttendanceInfo();
    updateAttendanceHistory();
    alert(`Entrada registrada a las ${attendanceRecord.time}`);
}

function checkOut() {
    if (!window.currentLocation) {
        alert('No se puede obtener la ubicación');
        return;
    }

    if (!attendanceToday || attendanceToday.type !== 'check-in') {
        alert('Debes marcar entrada primero');
        return;
    }

    const now = new Date();
    const attendanceRecord = {
        type: 'check-out',
        timestamp: now.toISOString(),
        time: formatTime(now),
        location: window.currentLocation,
        deviceUUID: deviceUUID
    };

    db.saveAttendance(currentUser.email, attendanceRecord);
    updateAttendanceInfo();
    updateAttendanceHistory();
    alert(`Salida registrada a las ${attendanceRecord.time}`);
}

function updateAttendanceInfo() {
    const today = formatDate(new Date());
    const records = db.getAttendance(currentUser.email, today);
    const todayDiv = document.getElementById('todayAttendance');

    if (records.length === 0) {
        todayDiv.innerHTML = '<p style="color: var(--color-text-light);">Aún no has marcado entrada</p>';
    } else {
        let html = '';
        records.forEach(record => {
            const icon = record.type === 'check-in' ? '✓ Entrada' : '✗ Salida';
            html += `<div class="attendance-row"><span class="attendance-label">${icon}:</span><span class="attendance-value">${record.time}</span></div>`;
        });
        todayDiv.innerHTML = html;
    }
}

function updateAttendanceHistory() {
    const today = formatDate(new Date());
    const records = db.getAttendance(currentUser.email, today);
    const historyDiv = document.getElementById('historyList');

    if (records.length === 0) {
        historyDiv.innerHTML = '<p style="color: var(--color-text-light);">Sin registros</p>';
    } else {
        const lastRecords = records.slice(-5).reverse();
        const html = lastRecords.map(record => {
            const className = record.type === 'check-in' ? 'history-item check-in' : 'history-item check-out';
            const type = record.type === 'check-in' ? 'Entrada' : 'Salida';
            return `<li class="${className}"><span class="history-time">${record.time}</span> - <span class="history-type">${type}</span></li>`;
        }).join('');
        historyDiv.innerHTML = `<ul class="history-list">${html}</ul>`;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize device UUID
    deviceUUID = getOrCreateDeviceUUID();

    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }

    // Form handlers
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('checkInBtn').addEventListener('click', checkIn);
    document.getElementById('checkOutBtn').addEventListener('click', checkOut);
});

// Helper function for toggling views
window.toggleView = toggleView;
