#!/bin/bash
# Script para crear la estructura del proyecto Magnani Asistencia

echo 'Creando estructura del proyecto Magnani Asistencia...'

# Crear carpetas
mkdir -p frontend backend

# FRONTEND - ARCHIVOS PRINCIPALES
echo 'Creando archivos frontend...'

# index.html - Se proporciona en https://github.com/ndmealla/magnani-asistencia/raw/main/create_project.sh
# app.js - Se proporciona en https://github.com/ndmealla/magnani-asistencia/raw/main/create_project.sh  
# styles.css - Se proporciona en https://github.com/ndmealla/magnani-asistencia/raw/main/create_project.sh

# BACKEND - ARCHIVOS
echo 'Creando archivos backend...'

# server.js - Se proporciona en https://github.com/ndmealla/magnani-asistencia/raw/main/create_project.sh
# package.json
# .env.example

echo 'Estructura creada. Para completar la instalacion:'
echo '1. Descarga todos los archivos desde GitHub'
echo '2. En backend/: npm install'
echo '3. Configura las variables de entorno en .env'
echo '4. node server.js para iniciar el backend'
echo '5. El frontend se sirve desde GitHub Pages o un servidor local'
