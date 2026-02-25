# Guía de Despliegue Técnico - REDSEV FCA-UNCA

Este documento detalla los requisitos técnicos para migrar y alojar el sistema en la infraestructura propia de la Universidad.

## 🛠 Requisitos del Servidor
- **Entorno**: Node.js v20.x o superior.
- **Gestor de paquetes**: NPM o Yarn.
- **Memoria Mínima**: 1GB RAM (2GB recomendados para compilación).
- **Almacenamiento**: ~500MB para el código y dependencias.

## 🔑 Variables de Entorno (.env)
El equipo técnico deberá configurar las siguientes variables en el servidor de producción (estos valores son los actuales del proyecto):

```env
# Clave de Inteligencia Artificial (Google AI Studio)
GEMINI_API_KEY="TU_CLAVE_AQUI"

# Configuración de Firebase (Se obtiene de la Consola de Firebase)
NEXT_PUBLIC_FIREBASE_PROJECT_ID="studio-1591734897-74b97"
NEXT_PUBLIC_FIREBASE_APP_ID="1:957661959248:web:408cc98776a9d5889ced55"
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDZZAdRqDm-SxSuVXlBoWqlX4WvbhMSI5w"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="studio-1591734897-74b97.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="957661959248"
```

## 🚀 Proceso de Construcción y Actualización
Para mantener el sitio actualizado, se recomienda vincular el servidor al repositorio de GitHub:

1. **Clonación inicial**: `git clone https://github.com/USUARIO/redsev-fca.git`
2. **Instalación**: `npm install`
3. **Build**: `npm run build`
4. **Ejecución**: `npm start` (se recomienda usar PM2: `pm2 start npm --name "redsev" -- start`)

**Para actualizar el servidor**:
Cuando se realicen mejoras en el código desde Firebase Studio y se suban a GitHub, el equipo de sistemas solo debe ejecutar:
`git pull origin main && npm install && npm run build && pm2 restart redsev`

## 📱 Funcionamiento PWA (Instalable)
El sistema está configurado como una PWA (Progressive Web App). 
1. **Instalación**: Al navegar al sitio desde Chrome (Android) o Safari (iOS), el usuario verá la opción "Instalar aplicación" o "Agregar a inicio".
2. **Actualización Automática**: El usuario **no necesita reinstalar la app**. Cuando el servidor se actualiza (vía `git pull` y `build`), el navegador del celular detecta los cambios automáticamente y refresca la aplicación.

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
