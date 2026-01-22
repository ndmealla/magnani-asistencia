# API Documentation - Magnani Asistencia

## Introducción

Esta es la documentación completa de las APIs REST disponibles en Magnani Asistencia. Todos los endpoints requieren autenticación mediante JWT (JSON Web Token).

## Configuración Base

- **Base URL (Local):** `http://192.168.11.127:3000`
- **Base URL (Local):** `http://localhost:3000`
- **Puerto:** 3000
- **Protocolo:** HTTP (Local), HTTPS (Producción)
- **Content-Type:** `application/json`

## Autenticación

Todos los endpoints (excepto login) requieren el header:

```
Authorization: Bearer {token}
```

El token se obtiene al hacer login y es válido por 24 horas.

---

## Endpoints

### 1. Autenticación

#### Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "usuario@empresa.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "name": "Juan Pérez",
    "email": "usuario@empresa.com",
    "role": "employee"
  }
}
```

**Errores:**
- `401`: Credenciales inválidas
- `400`: Email o contraseña faltantes

---

### 2. Control de Asistencia

#### Check-In (Entrada)
```
POST /api/attendance/check-in
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "location": {
    "lat": -32.9198,
    "lng": -60.7068
  },
  "deviceUUID": "device-123-abc"
}
```

**Response (200):**
```json
{
  "message": "Check-in recorded",
  "record": {
    "type": "check-in",
    "timestamp": "2025-01-24T08:30:00.000Z",
    "location": {
      "lat": -32.9198,
      "lng": -60.7068
    },
    "deviceUUID": "device-123-abc",
    "verified": true
  }
}
```

**Errores:**
- `400`: Fuera del área de geofencing
- `400`: Dispositivo no vinculado
- `401`: Token inválido
- `500`: Error del servidor

#### Check-Out (Salida)
```
POST /api/attendance/check-out
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "location": {
    "lat": -32.9198,
    "lng": -60.7068
  },
  "deviceUUID": "device-123-abc"
}
```

**Response (200):**
```json
{
  "message": "Check-out recorded",
  "record": {
    "type": "check-out",
    "timestamp": "2025-01-24T17:30:00.000Z",
    "location": {
      "lat": -32.9198,
      "lng": -60.7068
    },
    "deviceUUID": "device-123-abc",
    "verified": true
  }
}
```

**Errores:** (Igual a check-in)

#### Obtener Asistencia del Día
```
GET /api/attendance/today
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "date": "2025-01-24",
  "records": [
    {
      "type": "check-in",
      "timestamp": "2025-01-24T08:30:00.000Z",
      "location": {...},
      "verified": true
    },
    {
      "type": "check-out",
      "timestamp": "2025-01-24T17:30:00.000Z",
      "location": {...},
      "verified": true
    }
  ]
}
```

---

### 3. Gestión de Dispositivos

#### Vincular Dispositivo
```
POST /api/device/bind
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "deviceUUID": "device-123-abc",
  "deviceName": "Samsung Galaxy A12"
}
```

**Response (200):**
```json
{
  "message": "Device bound successfully",
  "device": {
    "uuid": "device-123-abc",
    "name": "Samsung Galaxy A12",
    "bindedAt": "2025-01-24T08:00:00.000Z",
    "userId": "user-123"
  }
}
```

#### Cambiar Dispositivo (Admin)
```
PUT /api/device/change/{userId}
Authorization: Bearer {admin-token}
```

**Request Body:**
```json
{
  "newDeviceUUID": "device-456-def",
  "reason": "Device replacement"
}
```

**Response (200):**
```json
{
  "message": "Device changed successfully",
  "oldDevice": "device-123-abc",
  "newDevice": "device-456-def",
  "changedAt": "2025-01-24T14:30:00.000Z"
}
```

---

### 4. Historial de Dispositivos

#### Obtener Historial de Dispositivos
```
GET /api/device/history/{userId}
Authorization: Bearer {admin-token}
```

**Response (200):**
```json
{
  "userId": "user-123",
  "history": [
    {
      "device": "device-123-abc",
      "bindedAt": "2025-01-10T08:00:00.000Z",
      "removedAt": "2025-01-24T14:30:00.000Z",
      "reason": "Device replacement"
    },
    {
      "device": "device-456-def",
      "bindedAt": "2025-01-24T14:30:00.000Z",
      "removedAt": null,
      "reason": null
    }
  ]
}
```

---

## Geofencing

- **Centro:** Juan Jose Paso 7025, Rosario, Santa Fe, Argentina
- **Coordenadas:** -32.9198, -60.7068
- **Radio:** 100 metros
- **Validación:** Se requiere estar dentro del radio para registrar asistencia

---

## Códigos de Error Comunes

| Código | Descripción |
|--------|---------------|
| `200` | Exitoso |
| `400` | Solicitud inválida |
| `401` | No autorizado / Token inválido |
| `403` | Prohibido / Permiso denegado |
| `404` | Recurso no encontrado |
| `500` | Error interno del servidor |

---

## Restricciones de Seguridad

1. **Vinculación de Dispositivos:** Cada usuario puede tener un solo dispositivo activo
2. **Cambio de Dispositivo:** Solo administradores pueden cambiar dispositivos
3. **Geofencing:** Se valida la ubicación en cada check-in/check-out
4. **Token JWT:** Caduca después de 24 horas
5. **CORS:** Configurado para acceso local (192.168.11.127:3000)

---

## Ejemplos con curl

### Login
```bash
curl -X POST http://192.168.11.127:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@empresa.com",
    "password": "password123"
  }'
```

### Check-In
```bash
curl -X POST http://192.168.11.127:3000/api/attendance/check-in \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"lat": -32.9198, "lng": -60.7068},
    "deviceUUID": "device-123-abc"
  }'
```

---

**Versión:** 1.0  
**Última Actualización:** Enero 2025  
**Mantenedor:** Magnani Asistencia Dev Team
