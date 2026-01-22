@echo off
echo ==========================================
echo Magnani Asistencia - Inicializador
echo ==========================================
echo.
echo Verificando dependencias...
echo.

if not exist "node_modules" (
    echo Instalando dependencias (primera vez)...
    call npm install
    echo.
)

echo Iniciando servidor...
echo.
echo Servidor disponible en: http://192.168.11.127:3000
echo.
echo IMPORTANTE: 
echo - Abre tu navegador en http://192.168.11.127:3000
echo - Otros dispositivos en la red WiFi pueden acceder con la misma URL
echo - Presiona Ctrl+C para detener el servidor
echo.
echo ==========================================
echo.

node server.js

pause
