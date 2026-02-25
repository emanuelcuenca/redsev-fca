# Guía de Despliegue Técnico - REDSEV FCA-UNCA

Este documento detalla los requisitos técnicos para migrar, alojar y desarrollar el sistema en entornos locales o infraestructura propia de la Universidad.

## 🚀 Proceso de Actualización (Flujo GitHub)
El sistema utiliza un flujo de Integración Continua simplificado:

1. **Origen (Firebase Studio)**: Se realizan las mejoras en la interfaz. El desarrollador usa la pestaña **Git** interna para hacer "Sync Changes". Esto actualiza el repositorio en GitHub.
2. **Destino (Servidor UNCA)**: El servidor de producción está vinculado al mismo repositorio. Para actualizar el sitio vivo, se ejecutan los siguientes comandos en la carpeta raíz:
   ```bash
   # 1. Obtener los últimos cambios de GitHub
   git pull origin main

   # 2. Instalar nuevas dependencias si las hubiera
   npm install

   # 3. Compilar la aplicación para producción (Optimización)
   npm run build

   # 4. Reiniciar el proceso (Ejemplo usando PM2)
   pm2 restart redsev
   ```

## 📱 Funcionamiento PWA (Instalable)
El sistema es una **Progressive Web App (PWA)**. 
- **Instalación**: Al navegar al sitio desde Chrome (Android) o Safari (iOS), aparecerá la opción "Instalar" o "Agregar a la pantalla de inicio".
- **Actualización Transparente**: Cuando el servidor se actualiza (vía `git pull` y `build`), el Service Worker del navegador detecta la nueva versión. El usuario verá los cambios la próxima vez que abra la app, sin necesidad de reinstalar nada.

## 🔑 Variables de Entorno (.env)
El equipo técnico deberá configurar las siguientes variables en el servidor de producción:

```env
# Clave de Inteligencia Artificial (Google AI Studio)
GEMINI_API_KEY="TU_CLAVE_AQUI"

# Configuración de Firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID="studio-1591734897-74b97"
NEXT_PUBLIC_FIREBASE_APP_ID="1:957661959248:web:408cc98776a9d5889ced55"
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDZZAdRqDm-SxSuVXlBoWqlX4WvbhMSI5w"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="studio-1591734897-74b97.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="957661959248"
```

## 🛠 Requisitos del Servidor
- **Node.js**: v20.x o superior.
- **Gestor de Procesos**: Se recomienda `pm2` para mantener la app corriendo 24/7.
- **SSL**: Es obligatorio el uso de HTTPS para que las funciones de PWA (instalación) funcionen correctamente.

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
