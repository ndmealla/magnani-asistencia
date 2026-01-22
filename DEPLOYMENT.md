# Guía de Deployment - Magnani Asistencia

## 🚀 Opciones de Deployment

1. [Heroku (Recomendado para MVP)](#heroku)
2. [AWS (Para producción escalable)](#aws)
3. [DigitalOcean](#digitalocean)
4. [GitHub Pages (Frontend)](#github-pages)

---

## Heroku

### Ventajas
- ✅ Fácil de configurar
- ✅ Gratis para pruebas iniciales
- ✅ Escalabilidad automática
- ✅ Incluye certificado SSL

### Requisitos
- Cuenta en [Heroku](https://www.heroku.com)
- Heroku CLI instalado
- Git configurado

### Pasos de Deployment

#### 1. Instalar Heroku CLI
```bash
# En Windows (usando npm)
npm install -g heroku

# En macOS (usando Homebrew)
brew tap heroku/brew && brew install heroku

# En Linux
curl https://cli-assets.heroku.com/install-ubuntu.sh | sh
```

#### 2. Login en Heroku
```bash
heroku login
# Se abrirá el navegador para autenticar
```

#### 3. Crear aplicación en Heroku
```bash
cd magnani-asistencia
heroku create magnani-asistencia
```

#### 4. Configurar variables de entorno
```bash
heroku config:set FIREBASE_PROJECT_ID=tu_proyecto_id
heroku config:set FIREBASE_API_KEY=tu_api_key
heroku config:set FIREBASE_DATABASE_URL=tu_db_url
heroku config:set JWT_SECRET=tu_jwt_secret_fuerte
heroku config:set ADMIN_TOKEN=token_admin_seguro
heroku config:set NODE_ENV=production
```

#### 5. Crear Procfile
```bash
# En la raíz del proyecto
echo "web: node server.js" > Procfile
```

#### 6. Actualizar package.json
```json
{
  "name": "magnani-asistencia",
  "version": "1.0.0",
  "main": "server.js",
  "engines": {
    "node": "14.x"
  },
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

#### 7. Deploy a Heroku
```bash
git add .
git commit -m "Deploy a Heroku"
git push heroku main

# Ver logs
heroku logs --tail
```

#### 8. Verificar deployment
```bash
heroku open
# Se abrirá tu aplicación en: https://magnani-asistencia.herokuapp.com
```

---

## AWS

### Servicios recomendados
- **EC2**: Para backend (Node.js)
- **S3**: Para almacenamiento de archivos
- **CloudFront**: Para CDN del frontend
- **RDS**: Para base de datos (aunque usamos Firebase)
- **Amplify**: Para frontend alternative

### Deployment con Amplify (Frontend)

#### 1. Conectar repositorio
```bash
# En AWS Amplify Console
1. Click en "Create app"
2. Seleccionar GitHub
3. Autorizar AWS Amplify
4. Seleccionar repositorio
5. Seleccionar rama: main
```

#### 2. Configurar build
```yaml
# amplify.yml
version: 1
backend:
  phases:
    build:
      commands: []
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build || true
  artifacts:
    baseDirectory: ./
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

#### 3. Configurar dominio personalizado
```bash
# En Amplify Console
1. Ir a "Domain management"
2. Click en "Add domain"
3. Ingresar tu dominio
4. Configurar registros DNS
```

---

## DigitalOcean

### Ventajas
- Precio fijo
- Excelente para VPS
- Incluye Droplets

### Deployment con Docker

#### 1. Crear Dockerfile
```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### 2. Crear docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_API_KEY=${FIREBASE_API_KEY}
      - FIREBASE_DATABASE_URL=${FIREBASE_DATABASE_URL}
    restart: always
```

#### 3. Deployar en DigitalOcean Droplet
```bash
# SSH a tu Droplet
ssh root@your_droplet_ip

# Instalar Docker y Docker Compose
curl -sSL https://get.docker.com | sh

# Clonar repositorio
git clone https://github.com/ndmealla/magnani-asistencia.git
cd magnani-asistencia

# Crear archivo .env
nano .env
# Copiar variables de entorno

# Buildear y correr
docker-compose up -d
```

---

## GitHub Pages (Frontend)

### Ventajas
- Totalmente gratuito
- Hosting rápido
- Integrado con GitHub
- SSL automático

### Pasos

#### 1. Configurar GitHub Pages
```bash
# En Settings del repositorio
1. Ir a Settings
2. Buscar GitHub Pages
3. Seleccionar rama: main
4. Seleccionar carpeta: / (root)
```

#### 2. Configurar URL de backend
```javascript
// En app.js
const CONFIG = {
    API_BASE_URL: 'https://tu-backend-url.com/api'
};
```

#### 3. Verificar acceso
```bash
# Tu frontend estará disponible en:
https://ndmealla.github.io/magnani-asistencia/
```

---

## Checklist Pre-Deployment

### Seguridad
```
[ ] Todas las credenciales en variables de entorno
[ ] HTTPS habilitado
[ ] CORS configurado correctamente
[ ] Rate limiting activado
[ ] Input validation funcionando
[ ] Backup de base de datos configurado
[ ] Logs centralizados configurados
[ ] Monitoreo de errores (Sentry/New Relic)
```

### Performance
```
[ ] Base de datos optimizada
[ ] Índices creados
[ ] Cache configurado
[ ] CDN activado (si aplica)
[ ] Compresión gzip habilitada
[ ] Minificación de assets
```

### Funcionamiento
```
[ ] Todos los test cases pasados
[ ] Notificaciones funcionando
[ ] GPS funcionando
[ ] QR scanning funcionando
[ ] Admin panel accesible
[ ] Exportación de datos funcionando
[ ] Usuarios pueden registrarse
[ ] Usuarios pueden hacer login
```

---

## Monitoreo en Producción

### Herramientas Recomendadas

#### 1. Sentry (Error Tracking)
```javascript
// Instalar
npm install @sentry/node

// Configurar en server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'tu_sentry_url' });
app.use(Sentry.Handlers.errorHandler());
```

#### 2. LogRocket (Session Replay)
```javascript
// Instalar
npm install logrocket

// Configurar en app.js
import LogRocket from 'logrocket';
LogRocket.init('tu-app-id');
```

#### 3. Firebase Monitoring
```javascript
// Ya está integrado con Firebase
// Solo ir a Firebase Console > Monitoring
```

---

## Rollback en caso de errores

### Heroku
```bash
# Ver historial de releases
heroku releases

# Rollback a versión anterior
heroku rollback v123
```

### GitHub/Docker
```bash
# Revertir commit
git revert HEAD
git push

# O volver a tag anterior
git checkout v1.0.0
git push --force
```

---

## Documentación de URLs

### Desarrollo
```
Backend:  http://localhost:3000
Frontend: http://localhost:8000
```

### Producción (Ejemplo)
```
Backend:  https://api.magnani-asistencia.com
Frontend: https://magnani-asistencia.com
```

---

## Soporte y Actualizaciones

1. **Monitoreo continuo**: Revisar logs diariamente
2. **Backups**: Ejecutar backups cada 24 horas
3. **Actualizaciones**: Aplicar security patches inmediatamente
4. **Testing**: Re-ejecutar test suite antes de cada update
5. **Comunicación**: Notificar a usuarios de cambios programados

---

## Próximas fases

- [ ] Configurar CI/CD automatizado
- [ ] Agregar pruebas de carga
- [ ] Implementar blue-green deployment
- [ ] Configurar canary releases
- [ ] Establecer SLA de disponibilidad (99.9%)
