# Guía de Despliegue Técnico - REDSEV FCA-UNCA

Este documento detalla los requisitos técnicos para migrar, alojar y desarrollar el sistema en entornos locales o infraestructura propia de la Universidad.

## 🛠 Arquitectura
El sistema es una aplicación **Next.js** con **React**. 
- **NO requiere un index.html manual**: La estructura de carpetas sigue el estándar de *App Router*.
- **Backend**: Utiliza Firebase (Firestore y Auth) para la persistencia de datos y seguridad.
- **PWA**: El sistema incluye un `manifest.json` y configuraciones para ser instalable en dispositivos móviles.

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

   # 3. Compilar la aplicación (genera la carpeta .next)
   npm run build

   # 4. Reiniciar el servicio
   pm2 restart redsev
   ```

## 🔑 Configuración de Variables de Entorno (Sin archivo .env)
Si los administradores del servidor prohíben el uso de archivos `.env`, las claves deben configurarse directamente en el entorno de ejecución (ej. PM2, Docker o Bash).

### Configuración con PM2:
Si usa PM2 para gestionar el proceso, cree un archivo `ecosystem.config.js`:
```js
module.exports = {
  apps : [{
    name: "redsev",
    script: "npm start",
    env: {
      GEMINI_API_KEY: "TU_CLAVE_AQUI",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: "studio-1591734897-74b97",
      NEXT_PUBLIC_FIREBASE_APP_ID: "1:957661959248:web:408cc98776a9d5889ced55"
      // ... otras variables
    }
  }]
}
```

### Configuración en Linux (Bash):
Agregue las variables a su perfil de usuario o ejecute el comando antes de iniciar:
```bash
export GEMINI_API_KEY="TU_CLAVE_AQUI"
npm start
```

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
