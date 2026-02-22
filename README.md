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
2.  **Variables de Entorno**: Crea un archivo `.env` en la raíz del proyecto con tu clave de API de Google Gemini (necesaria para los resúmenes con IA):
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

**Ejemplo para Nginx:**
```nginx
server {
    listen 80;
    server_name vinculoagro.unca.edu.ar;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*