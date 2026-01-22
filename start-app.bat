@echo off
REM Magnani Asistencia - Inicializador Mejorado
REM Este archivo inicia la aplicacion en Windows con mejor manejo de errores

setlocal enabledelayedexpansion
echo =============================================
echo Magnani Asistencia - Inicializador
echo =============================================
echo.
echo Verificando dependencias...
echo.

REM Verificar si Node.js esta instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado o no esta en el PATH
    echo.
    echo Por favor descarga Node.js desde: https://nodejs.org/
    echo Selecciona la version LTS e instala
    echo Luego reinicia tu computadora
    echo.
    pause
    exit /b 1
)

REM Obtener version de Node
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js encontrado: %NODE_VERSION%
echo.

REM Verificar si npm esta disponible
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm no esta disponible
    echo Por favor reinstala Node.js
    pause
    exit /b 1
)

echo [OK] npm esta disponible
echo.

REM Verificar si node_modules existe
if not exist "node_modules" (
    echo Instalando dependencias (primera vez)...
    echo.
    call npm install
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Fallo al instalar dependencias
        pause
        exit /b 1
    )
    echo.
) else (
    echo [OK] Dependencias ya estan instaladas
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
echo =============================================
echo.

REM Ejecutar con manejo de errores mejorado
node server.js

REM Si hay error, mostrar mensaje
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] El servidor se detuvo con error
    echo.
    pause
    exit /b 1
)

pause
