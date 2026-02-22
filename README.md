# VínculoAgro - FCA UNCA

Sistema de gestión de documentos para la Secretaría de Extensión y Vinculación de la Facultad de Ciencias Agrarias - UNCA.

## Guía para el Personal Técnico (IT)

Para alojar esta aplicación en un servidor institucional, siga estos pasos:

### 1. Requisitos Previos
- **Node.js**: Versión 18.17 o superior.
- **Acceso a Internet**: Necesario para conectar con Firebase y Google Gemini API.
- **Gestor de Procesos**: Se recomienda `PM2` para asegurar que el sitio esté siempre activo.

### 2. Configuración Inicial
1. Clonar el repositorio o subir los archivos al servidor.
2. Crear un archivo `.env` en la raíz con la clave de API:
   ```env
   GEMINI_API_KEY=tu_clave_aqui
   ```

### 3. Despliegue (Build)
```bash
npm install
npm run build
pm2 start npm --name "vinculo-agro" -- start
```

---

## Mantenimiento y Actualizaciones (Soporte)

Este sistema está diseñado para que el usuario final no necesite conocimientos técnicos. El flujo de actualización es el siguiente:

### ¿Cómo aplicar cambios realizados por el Prototipador?
Cuando el titular de la Secretaría solicite una actualización o soporte:
1. **Sincronizar cambios (Git Pull)**: El técnico debe ejecutar `git pull` para descargar las nuevas mejoras visuales o funcionales.
2. **Re-construir**: Se debe ejecutar `npm run build` para que los cambios se procesen.
3. **Reiniciar servicio**: Ejecutar `pm2 reload vinculo-agro` para que el sitio se actualice sin dejar de funcionar ni un segundo.

### Soporte de Datos
- **Base de Datos**: Los documentos se gestionan vía Firebase Console. No requiere intervención en el servidor.
- **IA**: Si los resúmenes fallan, verifique la validez de la clave en el archivo `.env`.

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
