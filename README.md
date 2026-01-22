# Magnani Asistencia

Sistema profesional de control de asistencia con **QR + GPS + Geofencing**. Backend Node.js + Firebase. Frontend SPA con HTML5/CSS3/JavaScript Vanilla.

## Características Principales

- ✅ **Escaneo de QR**: Lectura de QR estático con ZXing.js
- 📍 **Geofencing Dinámico**: Validación GPS en radio de 100 metros
- 🔐 **Seguridad**: UUID por dispositivo, validación en servidor
- 📊 **Dashboard Admin**: Métricas de asistencia, filtros avanzados
- 🔴 **Control de Puntualidad**: Detección automática de llegadas tarde
- 📈 **Exportación**: CSV para reportes
- 🌐 **Responsive**: Interfaz profesional con CSS moderno

## Stack Tecnológico

### Backend
- **Node.js** + **Express.js**
- **Firebase Realtime Database** (JSON)
- **Fórmula de Haversine** para cálculo de distancias GPS

### Frontend  
- **HTML5** + **CSS3** (Flexbox/Grid, variables CSS)
- **JavaScript Vanilla** (ES6+)
- **ZXing.js** para escaneo de QR
- **Geolocation API** nativa del navegador

## Estructura del Proyecto

```
magnani-asistencia/
├── frontend/
│   ├── index.html          # Aplicación principal
│   ├── app.js              # Lógica del cliente (ZXing, GPS)
│   ├── styles.css          # Estilos modernos
│   └── .nojekyll           # Para GitHub Pages
├── backend/
│   ├── server.js           # Express + validación Haversine
│   ├── package.json        # Dependencias
│   └── .env.example        # Template de env
├── create_project.sh       # Script de setup
└── README.md               # Este archivo
```

## Variables de Entorno

```env
# Backend (.env)
PORT=3000
FIREBASE_API_KEY=tu_api_key
FIREBASE_AUTH_DOMAIN=tu_auth_domain
FIREBASE_DB_URL=https://tu-proyecto.firebaseio.com
FIREBASE_PROJECT_ID=tu_project_id
FIREBASE_STORAGE_BUCKET=tu_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
FIREBASE_APP_ID=tu_app_id
STATIC_QR_VALUE=MAGNANI_ASISTENCIA_V1
ADMIN_TOKEN=admin1234
```

## Instalación

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus credenciales de Firebase
node server.js
```

El backend estará disponible en `http://localhost:3000`

### Frontend

**Opción 1: GitHub Pages**
```bash
# Los archivos están en /frontend
# GitHub Pages automáticamente sirve index.html
# Accede a: https://tu-usuario.github.io/magnani-asistencia
```

**Opción 2: Servidor Local**
```bash
python -m http.server 8000
# Luego abre http://localhost:8000
```

## API Endpoints

### POST `/api/register-device`
Registra un dispositivo con un empleado.
```json
{ "nombre": "Juan Pérez", "uuid_dispositivo": "uuid-123", "rol": "empleado" }
```

### POST `/api/check-in`
Registra entrada/salida con GPS y QR.
```json
{
  "uuid_dispositivo": "uuid-123",
  "coordenadas": {"latitude": -32.921, "longitude": -60.74034},
  "qr_data": "MAGNANI_ASISTENCIA_V1",
  "tipo": "entrada"
}
```

### GET `/api/stats`
Obtiene estadísticas (requiere `x-admin-token`).

## Flujo de Seguridad

1. **Generación UUID**: Cada dispositivo genera un UUID único en localStorage
2. **Escaneo QR**: El QR estático contiene un valor predefinido
3. **GPS + Timestamp**: Se captura ubicación en tiempo real
4. **Haversine Check**: Servidor valida distancia al centro (Rosario)
5. **Registro Guardado**: Si todo es válido, se guarda en Firebase

## Centro de Geofencing
- **Ubicación**: -32.921, -60.74034 (Rosario, Argentina)
- **Radio**: 100 metros
- **Rechazo**: Registros fuera del rango son rechazados

## Uso

### Como Empleado
1. Abre la app
2. Haz clic en "Escanear QR"
3. Apunta la cámara al QR estático
4. El sistema verifica GPS automáticamente
5. Verás confirmación: ✅ Entrada (A tiempo) o ⚠️ Llegada tarde

### Como Admin
1. Selecciona "Admin" en el menú
2. Ingresa el token de administrador
3. Visualiza métricas del día
4. Filtra por fecha y empleado
5. Exporta a CSV

## Notas Técnicas

- **Fórmula de Haversine**: Calcula distancia entre dos puntos GPS considerando la curvatura terrestre
- **ZXing.js**: Library UMD para QR scanning sin librerías externas
- **Firebase Realtime**: Base de datos en tiempo real, sin servidor tradicional requerido
- **UUID en localStorage**: Solución web a la restricción de acceso a MAC

## Roadmap Futuro

- [ ] Autenticación Firebase Auth
- [ ] Notificaciones en tiempo real
- [ ] Biometría (huella dactilar en mobile)
- [ ] Análisis de asistencia (reportes AI)
- [ ] App nativa con React Native
- [ ] 
## Plan de Desarrollo Detallado

### Fase 1: Mejoras de Autenticación y Seguridad (Semana 1-2)
**Estado: EN PROGRESO**

- [ ] Integrar Firebase Auth v9+ en el frontend
  - Implementar método de registro con validación de email
  - Implementar login con persistencia de sesión
  - Agregar recuperación de contraseña
  - Integrar autenticación de factores múltiples (MFA)

- [ ] Mejorar validación en el backend
  - Validar UUIDs de dispositivo
  - Implementar rate limiting en endpoints
  - Agregar validación de integridad de datos
  - Implementar cifrado de datos sensibles

### Fase 2: Sistema de Notificaciones en Tiempo Real (Semana 2-3)
**Estado: PENDIENTE**

- [ ] Implementar Socket.io para notificaciones
  - Notificaciones de entrada/salida exitosa
  - Alertas de geofencing (entrada fuera de rango)
  - Notificaciones de admin en tiempo real
  - Sistema de push notifications para mobile

- [ ] Agregar sistema de alertas
  - Alertas cuando el usuario llega fuera de horas
  - Alertas de inactividad
  - Notificaciones de cambios de políticas

### Fase 3: Dashboard Admin Mejorado (Semana 3-4)
**Estado: PENDIENTE**

- [ ] Expandir funcionalidades del admin
  - Vista de mapa con ubicaciones de empleados en tiempo real
  - Gráficos de asistencia por departamento
  - Reportes avanzados (CSV, PDF)
  - Gestión de empleados (crear, editar, desactivar)
  - Control de permisos y roles
  - Auditoría de actividades

- [ ] Mejorar interfaz
  - Dashboard responsivo con Bootstrap
  - Tabla de asistencia con filtros avanzados
  - Exportación de datos mejorada

### Fase 4: Biometría (Semana 4-5)
**Estado: PENDIENTE**

- [ ] Implementar autenticación biométrica
  - WebAuthn API para huella dactilar/facial en web
  - React Native Biometrics para app mobile
  - Fallback a autenticación tradicional
  - Almacenamiento seguro de datos biométricos

### Fase 5: Análisis AI y Reportes (Semana 5-6)
**Estado: PENDIENTE**

- [ ] Análisis de asistencia con IA
  - Identificar patrones de ausencias
  - Predicción de ausentismo
  - Análisis de puntualidad
  - Recomendaciones automáticas

- [ ] Generación de reportes
  - Reportes mensuales/anuales
  - Análisis por departamento
  - Métricas de productividad
  - Export a múltiples formatos

### Fase 6: App Nativa React Native (Semana 6-8)
**Estado: PENDIENTE**

- [ ] Setup inicial
  - Crear proyecto React Native
  - Configurar navegación
  - Integración con Firebase
  - Configuración de push notifications

- [ ] Funcionalidades principales
  - QR scanning mejorado
  - Geolocalización avanzada
  - Biometría
  - Modo offline
  - Sincronización automática

## Convenciones de Desarrollo

### Git Workflow
```
main (production)
├── develop (staging)
│   ├── feature/firebase-auth
│   ├── feature/notifications
│   ├── feature/admin-dashboard
│   └── feature/biometric
└── hotfix branches (si es necesario)
```

### Estándares de Código
- ESLint + Prettier para JavaScript
- Comentarios JSDoc para funciones principales
- Variables en camelCase
- Funciones descriptivas
- Manejo de errores con try/catch

### Testing
- Pruebas unitarias con Jest
- Pruebas de integración
- Pruebas E2E con Cypress
- Cobertura mínima: 80%

## Próximos Pasos

1. Crear rama `develop` para desarrollo continuo
2. Comenzar con Fase 1: Firebase Auth
3. Establecer CI/CD con GitHub Actions
4. Documentar cambios en cada commit
5. Hacer code reviews antes de merge

## Licencia

MIT - Libre para uso y modificación

## Autor

[ndmealla](https://github.com/ndmealla) - Desarrollador Full-Stack
