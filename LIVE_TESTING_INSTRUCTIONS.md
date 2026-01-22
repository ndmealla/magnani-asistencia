# Live Testing Instructions - Magnani Asistencia v1.0

**Status**: READY FOR LIVE TESTING
**Date**: January 22, 2026
**Location**: Rosario, Santa Fe, Argentina

---

## Quick Start (30 minutes)

### 1. Clone & Setup
```bash
git clone https://github.com/ndmealla/magnani-asistencia.git
cd magnani-asistencia
cd backend && npm install && cp .env.example .env
```

### 2. Configure Firebase
- Create project at https://console.firebase.google.com
- Download firebase-config.json to backend/
- Edit .env with your Firebase credentials
- Enable Realtime Database

### 3. Start Services
```bash
# Terminal 1 - Backend
cd backend && node server.js
# Should show: Magnani Asistencia server running on port 3000

# Terminal 2 - Frontend
cd frontend && python -m http.server 8000
# Access: http://localhost:8000
```

---

## Test Scenarios (2-3 hours)

Detailed test cases available in TESTING.md

### Core Tests
- [ ] User Registration
- [ ] User Login
- [ ] Password Validation
- [ ] QR Scanning
- [ ] Geofencing (Inside/Outside radius)
- [ ] Admin Dashboard
- [ ] Error Handling
- [ ] Notifications

### Security Tests
- [ ] Rate Limiting (5 attempts/15min)
- [ ] Input Validation (XSS protection)
- [ ] Session Persistence
- [ ] Strong Password Requirement

---

## Critical Test Points

### Geofencing Center
**Location**: -32.9387, -60.6611 (Juan Jose Paso, Rosario)
**Radius**: 100 meters
**Test**: Within 100m = Button Enabled, Beyond 100m = Button Disabled

### QR Value
**QR Code Value**: MAGNANI_ASISTENCIA_V1
**Test**: Scan QR when inside geofence to record entry

### Password Requirements
- Minimum 8 characters
- Uppercase letters
- Lowercase letters
- Numbers
- Special characters (!@#$%^&*)

---

## Documentation

| File | Purpose |
|------|----------|
| TESTING.md | Detailed test cases (TC-AUTH, TC-QR, TC-GEO, TC-ADMIN) |
| DEPLOYMENT.md | Production deployment (Heroku, AWS, DigitalOcean) |
| DEVELOPMENT_PLAN.md | 6-phase development roadmap |
| README.md | Project overview and features |

---

## Pre-Deployment Checklist

### Security
- [ ] All credentials in .env
- [ ] Firebase security rules configured
- [ ] JWT secret strong (32+ chars)
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] XSS protection active

### Functionality
- [ ] All test cases passing
- [ ] Notifications displaying
- [ ] GPS working accurately
- [ ] QR scanning responsive
- [ ] Admin panel functional
- [ ] Error messages helpful

---

## Bug Report Format

**Title**: [Brief description]
**Severity**: Critical / High / Medium / Low
**Environment**: OS, Browser, Location
**Steps**: 1. ... 2. ... 3. ...
**Expected**: ...
**Actual**: ...

---

## Next Steps

1. Complete local testing (2-3 hours)
2. Report any bugs found
3. Fix bugs if any
4. Deploy to production (see DEPLOYMENT.md)
5. Monitor in production

---

## Key Features Implemented

✅ QR Scanning (ZXing.js)
✅ GPS Geofencing (Haversine formula)
✅ Secure Authentication (JWT)
✅ Notification System (UI alerts)
✅ Error Handling (Centralized)
✅ Input Validation (DataValidator)
✅ Rate Limiting (Anti-brute force)
✅ Admin Dashboard
✅ CSV Export
✅ Responsive Design

---

## Support

**Developer**: ndmealla
**Repository**: https://github.com/ndmealla/magnani-asistencia
**Version**: 1.0.0
**Status**: PRODUCTION READY

🚀 Application is ready for live testing!
