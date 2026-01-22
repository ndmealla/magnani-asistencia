# 🚀 Guía Rápida de Inicio - Magnani Asistencia

## ⚡ OPCIÓN 1: Con archivo .bat (MÁS FÁCIL)

### Paso 1: Descargar el repositorio
1. Abre Git Bash o descarga el ZIP desde GitHub
```bash
git clone https://github.com/ndmealla/magnani-asistencia.git
cd magnani-asistencia
```

### Paso 2: Ejecutar la aplicación
1. Busca el archivo **`start-app.bat`** en la carpeta
2. **Haz doble clic** en él
3. Se abrirá automáticamente una terminal
4. El servidor se iniciará

### Paso 3: Acceder a la aplicación
1. Abre tu navegador (Chrome, Firefox, Edge, etc)
2. Ve a: **`http://192.168.11.127:3000`**
3. ¡Listo! La aplicación está funcionando

---

## 💻 OPCIÓN 2: Manual (Si prefieres línea de comandos)

### Paso 1: Abre CMD/PowerShell
- Presiona `Windows + R`
- Escribe `cmd` y presiona Enter

### Paso 2: Navega a la carpeta
```bash
cd magnani-asistencia
```

### Paso 3: Instala dependencias (solo la primera vez)
```bash
npm install
```

### Paso 4: Inicia el servidor
```bash
node server.js
```

### Paso 5: Abre el navegador
Ve a: **`http://192.168.11.127:3000`**

---

## 📱 Acceder desde otros dispositivos

Cualquier dispositivo conectado a tu WiFi puede acceder usando:
```
http://192.168.11.127:3000
```

**Ejemplos:**
- Desde tu celular: Ve al navegador y escribe la URL
- Desde otro PC: Abre navegador en otra máquina
- Desde tablet: Accede normalmente en la red WiFi

---

## ⚙️ Configuración

- **Servidor**: 192.168.11.127
- **Puerto**: 3000
- **API**: http://192.168.11.127:3000/api
- **Ubicación Geofence**: Juan Jose Paso 7025, Rosario Santa Fe
- **Radio Geofence**: 100 metros

---

## ✅ Características Disponibles

✓ Registro e login seguro
✓ Check-in/Check-out con validación de ubicación
✓ **Validación de dispositivo** - Un dispositivo por empleado
✓ Historial de asistencia
✓ Panel administrativo
✓ Sincronización en tiempo real
✓ Notificaciones de seguridad

---

## ⚠️ Solución de Problemas

**"node no se reconoce"**
- Instala Node.js desde: https://nodejs.org/
- Reinicia tu PC después de instalar

**"No se carga la página"**
- Verifica que el servidor esté corriendo (debe mostrar mensajes en la terminal)
- Prueba en `http://localhost:3000` primero

**"Error de conexión"**
- Verifica que estés en la misma red WiFi
- Intenta con `192.168.11.127:3000` (usa los dos puntos)

**Para detener el servidor**
- Presiona `Ctrl + C` en la terminal

---

## 🔒 Seguridad

- Cada dispositivo está vinculado a un único usuario
- Solo ese dispositivo puede marcar asistencia
- Si cambias de dispositivo, solo el administrador puede autorizarlo
- Todas las ubicaciones se validan con GPS

---

**¿Dudas?** Consulta los otros archivos de documentación en el repositorio.
