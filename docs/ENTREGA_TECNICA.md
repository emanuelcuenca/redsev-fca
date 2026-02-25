# Guía de Despliegue Técnico - REDSEV FCA-UNCA

Este documento detalla los requisitos técnicos para migrar, alojar y desarrollar el sistema en entornos locales o infraestructura propia de la Universidad.

## 🚀 Proceso de Actualización (Flujo GitHub Sync)
El sistema utiliza un flujo de Integración Continua simplificado a través de la herramienta de desarrollo:

1. **Origen (Firebase Studio)**: El administrador realiza mejoras. Al usar el botón **"Sync Changes"** en la pestaña Git, el código se envía (Push) automáticamente al repositorio vinculado en GitHub.
2. **Repositorio (GitHub)**: Actúa como puente y respaldo del código fuente.
3. **Destino (Servidor UNCA)**: Para aplicar los cambios en el servidor de producción y que los usuarios vean las mejoras, se deben ejecutar los siguientes comandos:
   ```bash
   # 1. Obtener los últimos cambios desde GitHub
   git pull origin main

   # 2. Instalar nuevas dependencias (solo si se agregaron paquetes nuevos)
   npm install

   # 3. Compilar la aplicación (Genera la versión optimizada)
   npm run build

   # 4. Reiniciar el servicio (Ejemplo usando PM2)
   pm2 restart redsev
   ```

## 📱 Funcionamiento PWA (Instalable)
El sistema es una **Progressive Web App (PWA)** totalmente funcional. 
- **Instalación**: Al navegar al sitio desde Chrome (Android) o Safari (iOS), aparecerá la opción "Instalar" o "Agregar a la pantalla de inicio".
- **Actualización Transparente**: Una vez actualizado el servidor (punto 3 del flujo anterior), el Service Worker del navegador detectará la nueva versión. El usuario verá los cambios la próxima vez que abra la app, sin necesidad de reinstalarla.

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
- **Git**: Instalado y configurado con acceso al repositorio.
- **Gestor de Procesos**: Se recomienda `pm2` para asegurar que la app corra 24/7.
- **SSL**: Es **obligatorio** el uso de HTTPS (SSL) para que las funciones de PWA (instalación) sean habilitadas por los navegadores.

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
