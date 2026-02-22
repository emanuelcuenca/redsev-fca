# VínculoAgro - FCA UNCA

Sistema de gestión de documentos para la Secretaría de Extensión y Vinculación de la Facultad de Ciencias Agrarias - UNCA.

## Despliegue en Servidor Propio (Universidad)

Para alojar esta aplicación en un servidor institucional, sigue estos pasos:

### 1. Requisitos Previos
- **Node.js**: Versión 18.17 o superior instalada en el servidor.
- **Acceso a Internet**: El servidor debe tener salida a internet para comunicarse con las APIs de Google (Genkit para la IA) y Firebase.
- **Gestor de Procesos**: Se recomienda el uso de `PM2`.

### 2. Preparación en el Servidor
1.  **Clonar/Subir el código**: Copia los archivos del proyecto a una carpeta en el servidor.
2.  **Variables de Envío**: Crea un archivo `.env` en la raíz del proyecto con tu clave de API de Google Gemini (necesaria para los resúmenes con IA):
    ```env
    GEMINI_API_KEY=tu_clave_aqui
    ```

### 3. Instalación y Construcción
Ejecuta los siguientes comandos desde la terminal en la carpeta del proyecto:
```bash
# Instalar las dependencias de producción
npm install

# Construir la aplicación (genera la carpeta .next optimizada)
npm run build
```

### 4. Ejecución Continua con PM2
Para asegurar que la aplicación esté siempre activa y se reinicie sola si hay un fallo:
```bash
# Instalar PM2 globalmente (si no está instalado)
npm install -g pm2

# Iniciar la aplicación
pm2 start npm --name "vinculo-agro" -- start
```

### 5. Configuración del Servidor Web (Proxy Inverso)
Next.js corre por defecto en el puerto `3000`. Debes configurar el servidor web de la universidad (Nginx o Apache) para que actúe como proxy.

---

## Mantenimiento y Actualizaciones

Para realizar actualizaciones o brindar soporte técnico una vez que el sitio está en producción, el flujo de trabajo es el siguiente:

### ¿Cómo aplicar cambios/mejoras?
Cada vez que se necesite subir una nueva versión o corrección:
1.  **Subir los nuevos archivos** al servidor (vía Git o SFTP).
2.  **Actualizar dependencias** (si hubo cambios en el package.json):
    ```bash
    npm install
    ```
3.  **Re-construir el sitio**: Es vital generar una nueva versión optimizada para que los cambios se reflejen.
    ```bash
    npm run build
    ```
4.  **Reiniciar el servicio en PM2**: Para que el servidor empiece a usar la nueva versión sin tiempo de inactividad:
    ```bash
    pm2 reload vinculo-agro
    ```

### Soporte de Base de Datos e IA
- **Firebase**: Los datos y documentos se gestionan desde la consola de Firebase. No requieren reinicio del servidor para actualizarse.
- **Google Genkit/Gemini**: Si la IA deja de funcionar, verificar que la `GEMINI_API_KEY` siga vigente y que el servidor tenga salida a internet por los puertos estándar de API.

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
