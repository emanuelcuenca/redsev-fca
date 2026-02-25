# REDSEV FCA - FCA UNCA

Sistema de gestión de documentos para la Secretaría de Extensión y Vinculación de la Facultad de Ciencias Agrarias - UNCA.

## 🔄 Flujo de Trabajo y Actualización (IMPORTANTE)
La sincronización entre Firebase Studio y tu repositorio de GitHub **no es automática**. Debes seguir este ciclo cada vez que realices cambios en el código:

1. **Realizar Cambios**: Modifica el sitio aquí en Firebase Studio con la ayuda del asistente.
2. **Descargar el Proyecto**: Haz clic en el icono de la **nube con flecha hacia abajo** (Download Project) en la esquina superior derecha. Esto genera un archivo `.zip` con la última versión del código.
3. **Sincronizar localmente**:
   - Descomprime el archivo `.zip` y copia los archivos sobre tu carpeta local donde tienes el repositorio (reemplazando los anteriores).
4. **Subir a GitHub (Push)**:
   - Abre una terminal en esa carpeta y ejecuta:
     ```bash
     git add .
     git commit -m "Mejoras realizadas en Firebase Studio"
     git push origin main
     ```
5. **Actualizar el Servidor de Producción**: Una vez los cambios están en GitHub, el equipo técnico debe entrar al servidor y ejecutar:
   ```bash
   git pull origin main
   npm install
   npm run build
   pm2 restart redsev
   ```

## 🛡 Copia de Seguridad (Backup)
**IMPORTANTE:** Cada descarga es un backup completo. Guarda siempre la última versión estable en un lugar seguro antes de subirla al servidor de producción. Los datos de la base de datos (Firestore) son persistentes y no se ven afectados por este proceso de código.

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
