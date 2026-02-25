# Guía de Despliegue Técnico - REDSEV FCA-UNCA

Este documento detalla los requisitos técnicos para migrar, alojar y desarrollar el sistema en entornos locales o infraestructura propia de la Universidad.

## 💻 Desarrollo Local (Visual Studio Code)
Para trabajar en el código o visualizar el sitio localmente en tu computadora:

1. **Requisitos**: Instalar [Node.js v20+](https://nodejs.org/).
2. **Preparación**:
   - Descarga el proyecto (.zip) desde Firebase Studio.
   - Descomprime en una carpeta local.
3. **Ejecución en VS Code**:
   - Abre la carpeta en VS Code.
   - Abre una terminal (`Ctrl + ~`) y ejecuta:
     ```bash
     npm install
     ```
   - Luego inicia el servidor de desarrollo:
     ```bash
     npm run dev
     ```
   - El sitio estará disponible en: `http://localhost:9002` (o el puerto que indique la terminal).

## 🚀 Proceso de Actualización (Ciclo de Mejora)
Debido a que Firebase Studio no tiene conexión directa de salida (Push) a GitHub, el flujo es unidireccional:

**Firebase Studio (Prototipado) -> Descarga ZIP -> Git Local -> GitHub -> Servidor UNCA**

El desarrollador debe descargar el código cada vez que finalice una sesión de mejoras en Firebase Studio para mantener el repositorio institucional al día.

## 🛠 Requisitos del Servidor de Producción
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

## 📱 Funcionamiento PWA (Instalable)
El sistema es una PWA. 
1. **Instalación**: Al navegar al sitio desde móviles, se puede "Agregar a la pantalla de inicio".
2. **Actualización Automática**: El usuario **no necesita reinstalar la app**. Cuando el servidor se actualiza (vía `git pull` y `build`), el Service Worker detectará los cambios y actualizará la interfaz en el celular del usuario automáticamente.

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
