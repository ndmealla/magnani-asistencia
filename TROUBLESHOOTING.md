# Guía de Solución de Problemas - Magnani Asistencia

## Tabla de Contenidos
1. [Requisitos Previos](#requisitos-previos)
2. [Problemas Comunes de Instalación](#problemas-comunes-de-instalación)
3. [Problemas de Conexión](#problemas-de-conexión)
4. [Problemas del Servidor](#problemas-del-servidor)
5. [Problemas de Características](#problemas-de-características)
6. [Contacto y Soporte](#contacto-y-soporte)

---

## Requisitos Previos

### Verificar Node.js está instalado

Abre una ventana de Comandos (CMD) o PowerShell y ejecuta:

```bash
node --version
npm --version
```

Debes ver versiones como:
```
v18.x.x o superior
npm 9.x.x o superior
```

**Si ves "'node' no se reconoce como comando interno...":**

1. Descarga Node.js desde https://nodejs.org/
2. Selecciona la versión LTS (Recomendado)
3. Ejecuta el instalador y sigue los pasos
4. **IMPORTANTE:** En la pantalla "Tools for Native Modules" marca "Automatically install the necessary tools"
5. Reinicia tu computadora completamente
6. Verifica nuevamente con los comandos anteriores

---

## Problemas Comunes de Instalación

### Problema: "El archivo start-app.bat no hace nada"

**Causa:** El PowerShell tiene restricciones de ejecución de scripts.

**Solución:**

1. Abre PowerShell como Administrador
2. Ejecuta:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Escribe "S" (Sí) cuando pregunte
4. Cierra PowerShell
5. Intenta hacer doble clic en start-app.bat nuevamente

**Alternativa - Ejecutar directamente desde CMD:**

1. Abre CMD en la carpeta del proyecto
2. Ejecuta:
   ```batch
   node server.js
   ```
   O para usar el servidor demo sin Firebase:
   ```batch
   node server-demo.js
   ```

### Problema: "npm install falla"

**Causa:** Permisos insuficientes o conexión a internet

**Solución:**

1. Verifica tu conexión a internet
2. Si usas VPN, intenta sin ella
3. Ejecuta como Administrador
4. Limpia la caché de npm:
   ```bash
   npm cache clean --force
   ```
5. Intenta nuevamente:
   ```bash
   npm install
   ```

### Problema: "Error: Cannot find module 'express'"

**Causa:** Las dependencias no fueron instaladas

**Solución:**

```bash
npm install
```

Espera a que termine completamente (puede tomar 2-5 minutos)

---

## Problemas de Conexión

### Problema: "No puedo acceder a http://192.168.11.127:3000"

**Causa:** La dirección IP ha cambiado o el servidor no está corriendo

**Solución:**

1. Verifica que el servidor esté ejecutándose (deberías ver mensajes en la consola)
2. Encuentra tu IP correcta:
   - En CMD, ejecuta: `ipconfig` y busca "IPv4 Address" bajo tu conexión
   - La dirección IP probablemente sea 192.168.x.x
3. Reemplaza en tu navegador: http://[TU-IP]:3000
4. Por ejemplo: http://192.168.1.100:3000

### Problema: "La conexión se rechaza (Connection refused)"

**Causa:** El servidor no está corriendo o hay un error

**Solución:**

1. Verifica en la consola si hay mensajes de error
2. Reinicia el servidor:
   - Presiona Ctrl+C para detener
   - Espera 2 segundos
   - Ejecuta nuevamente: `node server.js`
3. Si hay error "EADDRINUSE", el puerto 3000 está en uso:
   ```bash
   # Encuentra qué está usando el puerto
   netstat -ano | findstr :3000
   # Termina el proceso (reemplaza PID con el número encontrado)
   taskkill /PID PID /F
   ```

### Problema: "Otros dispositivos en la red no pueden acceder"

**Causa:** El firewall está bloqueando la conexión

**Solución:**

1. **Permitir en Firewall de Windows:**
   - Abre "Firewall de Windows Defender"
   - Click en "Permitir que una aplicación..." 
   - Click en "Cambiar configuración"
   - Busca Node.js y marca ambas casillas (Privada y Pública)
   - Haz clic en "Aceptar"

2. Verifica que todos los dispositivos estén en la misma red WiFi

3. Prueba con otro dispositivo conectándote a: http://[TU-IP]:3000

---

## Problemas del Servidor

### Problema: "Error de Firebase / Firebase no configurado"

**Causa:** Firebase no está configurado o el archivo de credenciales falta

**Solución:**

Usa el servidor demo que no requiere Firebase:

```bash
node server-demo.js
```

Este servidor usa una base de datos en memoria para pruebas locales.

### Problema: "El servidor se detiene solo"

**Causa:** Error no capturado o conexión perdida

**Solución:**

1. Lee el mensaje de error en la consola
2. Si es error de "Cannot find module", ejecuta: `npm install`
3. Reinicia el servidor
4. Si persiste, usa el servidor demo: `node server-demo.js`

---

## Problemas de Características

### Problema: "La geolocalización no funciona"

**Causa:** Permisos del navegador o GPS desactivado

**Solución:**

1. En tu navegador (Chrome, Edge, etc.):
   - Click en el icono de candado en la barra de direcciones
   - Busca "Ubicación" y elige "Permitir"
   - Recarga la página

2. En tu dispositivo móvil:
   - Abre Configuración → Privacidad → Ubicación
   - Verifica que la ubicación está activada
   - Abre el navegador → Configuración
   - Busca "Permisos de sitio" → "Ubicación"
   - Marca "Permitir"

### Problema: "El escaneo QR no funciona"

**Causa:** Cámara no disponible o permisos denegados

**Solución:**

1. Verifica que tu dispositivo tiene cámara
2. En el navegador, permite acceso a la cámara:
   - Click en el icono de candado
   - Busca "Cámara" y selecciona "Permitir"
3. Recarga la página
4. Intenta nuevamente

### Problema: "Error al marcar asistencia"

**Causa:** Datos incompletos o error del servidor

**Solución:**

1. Verifica que:
   - Estés dentro de la zona de geofencing (Juan Jose Paso 7025, Rosario)
   - Tengas conexión a internet
   - Tu dispositivo móvil sea el mismo registrado en el sistema

2. Si el error persiste:
   - Reinicia el servidor
   - Limpia el caché del navegador (Ctrl+Shift+Delete)
   - Intenta nuevamente

---

## Contacto y Soporte

Para problemas adicionales:

1. **Verifica los logs del servidor:**
   - Lee los mensajes en la consola donde ejecutaste el servidor
   - Busca mensajes "[ERROR]" o "error"

2. **Reinicia completamente:**
   - Cierra el servidor (Ctrl+C)
   - Cierra el navegador
   - Espera 5 segundos
   - Reinicia el servidor
   - Abre el navegador nuevamente

3. **Recursos útiles:**
   - Ver QUICK_START.md para guía rápida de inicio
   - Ver TESTING.md para pruebas
   - Ver DEPLOYMENT.md para despliegue

---

**Última actualización:** Enero 2025
**Versión:** 1.0
