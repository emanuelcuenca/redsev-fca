# Guía de Despliegue Técnico - REDSEV FCA-UNCA

Este documento detalla los requisitos técnicos para migrar, alojar y desarrollar el sistema en entornos locales o infraestructura propia de la Universidad.

## 🚀 Proceso de Actualización (Flujo GitHub Sync)
El sistema utiliza un flujo de Integración Continua simplificado a través de la herramienta de desarrollo:

1. **Origen (Firebase Studio)**: El administrador realiza mejoras. Al usar el botón **"Sync Changes"** en la pestaña Git, el código se envía (Push) automáticamente al repositorio vinculado en GitHub.
2. **Repositorio (GitHub)**: Actúa como puente y respaldo del código fuente.
3. **Visualización de Pruebas**: Para que las autoridades validen cambios, se recomienda usar la URL de **Firebase App Hosting**. Esto permite probar la aplicación en un entorno idéntico al real antes de actualizar el servidor de la UNCA.
4. **Destino (Servidor UNCA)**: Para aplicar los cambios en el servidor de producción:
   ```bash
   # 1. Obtener los últimos cambios desde GitHub
   git pull origin main

   # 2. Instalar nuevas dependencias (solo si se agregaron paquetes nuevos)
   npm install

   # 3. Compilar la aplicación
   npm run build

   # 4. Reiniciar el servicio
   pm2 restart redsev
   ```

## 💻 Desarrollo Local (Visual Studio Code)
Para trabajar en el código desde tu computadora personal:
1. Descarga el ZIP del proyecto o clona tu repositorio de GitHub.
2. Instala [Node.js](https://nodejs.org/) (v20+).
3. En la terminal de VS Code:
   ```bash
   npm install
   npm run dev
   ```
4. Abre `http://localhost:9002` en tu navegador.

## 📱 Funcionamiento PWA (Instalable)
El sistema es una **Progressive Web App (PWA)**. 
- **Instalación**: En Chrome (Android) o Safari (iOS), aparecerá la opción "Instalar" o "Agregar a la pantalla de inicio".
- **Actualización Transparente**: Al actualizar el servidor, el Service Worker detectará la nueva versión. El usuario verá los cambios la próxima vez que abra la app.

## 🔑 Variables de Entorno (.env)
Configurar estas variables en el servidor de producción:
```env
GEMINI_API_KEY="TU_CLAVE_AQUI"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="studio-1591734897-74b97"
NEXT_PUBLIC_FIREBASE_APP_ID="1:957661959248:web:408cc98776a9d5889ced55"
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyDZZAdRqDm-SxSuVXlBoWqlX4WvbhMSI5w"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="studio-1591734897-74b97.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="957661959248"
```

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
