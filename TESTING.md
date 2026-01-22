# Guía de Testing - Magnani Asistencia

## 📋 Tabla de Contenidos
1. [Configuración del Ambiente](#configuración-del-ambiente)
2. [Test Cases](#test-cases)
3. [Procedimientos de Testing](#procedimientos-de-testing)
4. [Checklist Pre-Deployment](#checklist-pre-deployment)

---

## Configuración del Ambiente

### Requisitos Previos

```bash
# Node.js v14 o superior
node --version

# npm v6 o superior
npm --version

# Git
git --version
```

### Setup de Desarrollo Local

#### 1. Clonar el Repositorio
```bash
git clone https://github.com/ndmealla/magnani-asistencia.git
cd magnani-asistencia
```

#### 2. Instalar Dependencias Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con credenciales de Firebase
```

#### 3. Configurar Firebase
```bash
# 1. Crear un proyecto en Firebase Console
# 2. Descargar firebase-config.json
# 3. Copiarlo a la carpeta backend/
# 4. Actualizar las variables en .env
```

#### 4. Iniciar el Backend
```bash
node server.js
# El servidor corrará en http://localhost:3000
```

#### 5. Iniciar el Frontend
```bash
# En otra terminal
cd frontend
python -m http.server 8000
# O usar: npx http-server
# Acceder a http://localhost:8000
```

---

## Test Cases

### 1. Authentication Flow Testing

#### TC-AUTH-001: Registro de Nuevo Usuario
**Objetivo**: Verificar que un nuevo usuario pueda registrarse correctamente

**Pasos**:
1. Abrir la aplicación
2. Hacer clic en "¿No tienes cuenta? Regístrate aquí"
3. Completar formulario:
   - Nombre: Test User
   - Email: test@example.com
   - Contraseña: TestPass123!
   - Departamento: Administración
4. Hacer clic en "Registrarse"

**Resultado Esperado**:
- ✅ Notificación de éxito
- ✅ Redirección al dashboard
- ✅ Usuario guardado en Firebase
- ✅ UUID generado en localStorage

**Criterios de Falla**:
- ❌ Error en la notificación
- ❌ Contraseña débil no es rechazada
- ❌ Usuario duplicado no es detectado

---

#### TC-AUTH-002: Login con Credenciales Válidas
**Objetivo**: Verificar autenticación exitosa

**Pasos**:
1. En la pantalla de login
2. Email: test@example.com
3. Contraseña: TestPass123!
4. Clic en "Iniciar Sesión"

**Resultado Esperado**:
- ✅ Token JWT generado
- ✅ Sesión persiste en localStorage
- ✅ Dashboard cargado
- ✅ Información del usuario mostrada

---

#### TC-AUTH-003: Login con Credenciales Inválidas
**Objetivo**: Rechazar acceso con datos incorrectos

**Pasos**:
1. Email: test@example.com
2. Contraseña: WrongPassword123
3. Clic en "Iniciar Sesión"

**Resultado Esperado**:
- ✅ Notificación de error
- ✅ No hay redirección
- ✅ Sin token generado

---

#### TC-AUTH-004: Validación de Contraseña Fuerte
**Objetivo**: Asegurar requisitos de seguridad

**Test Cases**:
| Contraseña | Válida | Razón |
|-----------|--------|-------|
| Test123 | ❌ | Menos de 8 caracteres |
| test123456 | ❌ | Sin mayúscula |
| TEST123456 | ❌ | Sin minúscula |
| TestPass | ❌ | Sin números |
| TestPass123 | ❌ | Sin caracteres especiales |
| TestPass123! | ✅ | Cumple todos los requisitos |

---

### 2. QR Scanning Testing

#### TC-QR-001: Escaneo de QR Válido
**Objetivo**: Verificar detección de QR correcto

**Requisitos**:
- Dispositivo o cámara web
- QR con valor: `MAGNANI_ASISTENCIA_V1`

**Pasos**:
1. Estar dentro del geofence
2. Clic en "Marcar Entrada"
3. Permitir acceso a cámara
4. Apuntar a código QR

**Resultado Esperado**:
- ✅ QR detectado
- ✅ Entrada registrada
- ✅ Notificación de éxito
- ✅ Timestamp guardado

---

#### TC-QR-002: QR Inválido
**Objetivo**: Rechazar QRs incorrectos

**Pasos**:
1. Escanear QR con valor incorrecto

**Resultado Esperado**:
- ✅ Notificación de error
- ✅ Entrada no registrada

---

### 3. Geofencing Testing

#### TC-GEO-001: Dentro del Geofence
**Objetivo**: Permitir check-in dentro del área

**Ubicación**: -32.9387, -60.6611 (Rosario, Argentina)
**Radio**: 100 metros

**Pasos**:
1. Ubicar dispositivo dentro del radio
2. Clic en "Marcar Entrada"

**Resultado Esperado**:
- ✅ Botón habilitado
- ✅ Check-in permitido
- ✅ Status: "📍 En la oficina"

---

#### TC-GEO-002: Fuera del Geofence
**Objetivo**: Rechazar check-in fuera del área

**Pasos**:
1. Ubicar dispositivo fuera del radio (>100m)
2. Intentar clic en "Marcar Entrada"

**Resultado Esperado**:
- ✅ Botón deshabilitado
- ✅ Status: "❌ Fuera de la oficina"
- ✅ Distancia mostrada en metros

---

### 4. Dashboard Admin Testing

#### TC-ADMIN-001: Acceso al Panel Admin
**Objetivo**: Verificar autenticación de admin

**Pasos**:
1. Login como usuario con rol admin
2. Navegar a sección admin (si existe)
3. Ingresar token admin

**Resultado Esperado**:
- ✅ Dashboard admin cargado
- ✅ Ver métricas del día
- ✅ Ver lista de empleados

---

#### TC-ADMIN-002: Exportar Datos a CSV
**Objetivo**: Generar reporte de asistencia

**Pasos**:
1. En dashboard admin
2. Seleccionar fecha
3. Clic en "Exportar CSV"

**Resultado Esperado**:
- ✅ Archivo descargado
- ✅ Formato correcto
- ✅ Datos completos

---

## Procedimientos de Testing

### Testing Manual

#### Checklist de Testing Completo
```
[ ] Registro de usuario
[ ] Login/Logout
[ ] Validación de contraseña
[ ] Escaneo de QR
[ ] Geofencing dentro del rango
[ ] Geofencing fuera del rango
[ ] Check-in exitoso
[ ] Check-out exitoso
[ ] Historial de asistencia
[ ] Dashboard admin
[ ] Exportación de datos
[ ] Notificaciones de error
[ ] Persistencia de sesión
[ ] Responsive en móvil
```

### Testing en Navegadores

**Navegadores soportados**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

---

## Checklist Pre-Deployment

### Verificaciones de Seguridad
```
[ ] Variables de entorno configuradas
[ ] Firebase credenciales seguras
[ ] JWT secret fuerte
[ ] Rate limiting activado
[ ] Input validation funcionando
[ ] HTTPS habilitado
[ ] CORS configurado correctamente
[ ] Credenciales no en repositorio
[ ] Backups configurados
```

### Verificaciones de Performance
```
[ ] Tiempo de carga < 3 segundos
[ ] API responde en < 500ms
[ ] No hay memory leaks
[ ] Base de datos optimizada
[ ] CDN configurado (si aplica)
```

### Verificaciones de Funcionalidad
```
[ ] Todos los test cases pasan
[ ] Notificaciones funcionan
[ ] GPS funciona en múltiples dispositivos
[ ] QR scanning funciona
[ ] Historial se guarda correctamente
[ ] Admin panel funciona
[ ] Exportación de datos funciona
[ ] Sesión persiste correctamente
```

---

## Reporte de Bugs

**Formato de Reporte**:
```markdown
**Título**: [Breve descripción del bug]

**Severidad**: Critical / High / Medium / Low

**Ambiente**: 
- OS: Windows 10 / macOS 12 / Android 11 / iOS 15
- Navegador: Chrome 100
- Versión de app: 1.0.0

**Pasos para reproducir**:
1. ...
2. ...
3. ...

**Resultado esperado**: 
...

**Resultado actual**: 
...

**Screenshot/Video**: 
...
```

---

## Próximos Pasos después de Testing

1. ✅ Corregir todos los bugs encontrados
2. ✅ Hacer pruebas de carga
3. ✅ Configurar monitoreo en producción
4. ✅ Crear manual de usuario final
5. ✅ Entrenar a usuarios finales
6. ✅ Deployment a producción
