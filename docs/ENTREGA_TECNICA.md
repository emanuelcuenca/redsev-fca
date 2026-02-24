# Guía de Despliegue Técnico - VínculoAgro FCA-UNCA

Este documento detalla los requisitos técnicos para migrar y alojar el sistema en la infraestructura propia de la Universidad.

## 🛠 Requisitos del Servidor
- **Entorno**: Node.js v20.x o superior.
- **Gestor de paquetes**: NPM o Yarn.
- **Memoria Mínima**: 1GB RAM (2GB recomendados para compilación).
- **Almacenamiento**: ~500MB para el código y dependencias.

## 🔑 Variables de Entorno (.env)
El equipo técnico deberá configurar las siguientes variables en el servidor de producción:

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

## 🚀 Proceso de Construcción (Build)
1. Clonar el repositorio en el servidor.
2. Instalar dependencias: `npm install`.
3. Generar la versión de producción: `npm run build`.
4. Iniciar el servicio: `npm start`.

*Nota: Se recomienda utilizar un gestor de procesos como **PM2** o **Docker** para asegurar la disponibilidad 24/7.*

## 🔒 Conectividad
El servidor debe tener permisos de salida (egress) para conectar con los dominios de Google:
- `firestore.googleapis.com`
- `firebaseauth.googleapis.com`
- `generativelanguage.googleapis.com`

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
