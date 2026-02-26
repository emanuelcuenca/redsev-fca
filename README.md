# REDSEV FCA - FCA UNCA

Sistema de gestión de documentos para la Secretaría de Extensión y Vinculación de la Facultad de Ciencias Agrarias - UNCA.

## 🚀 Arquitectura del Proyecto
Este sitio está desarrollado con **Next.js 15**. No busques un archivo `index.html` en la raíz; las páginas se generan dinámicamente desde la carpeta `src/app`. El servidor se encarga de "construir" el sitio automáticamente.

## 🔄 Flujo de Trabajo y Actualización (IMPORTANTE)
Este proyecto está vinculado directamente con GitHub. Sigue este ciclo para mantener el sistema actualizado:

1. **Realizar Cambios**: Solicita cambios o mejoras aquí en Firebase Studio.
2. **Sincronizar (GitHub Sync)**: 
   - Ve a la pestaña de **Git** en el menú izquierdo de Firebase Studio (icono de dos flechas).
   - Escribe un mensaje breve sobre los cambios realizados (ej: "Mejora en formulario de extensión").
   - Presiona `Sync Changes` (o `Ctrl + Enter`). Esto subirá el código automáticamente a tu repositorio en GitHub.
3. **Visualización de Avances (Para Jefes/Autoridades)**:
   - Al sincronizar con GitHub, Firebase App Hosting generará una versión en vivo. 
   - Puedes encontrar la URL de previsualización en el **Firebase Console > App Hosting**.
   - Comparte esa URL con tu jefe para que pruebe el sistema antes de pasarlo al servidor definitivo.
4. **Actualizar el Servidor de Producción**: Una vez el código esté aprobado en la versión de prueba:
   ```bash
   git pull origin main
   npm run build
   pm2 restart redsev
   ```

## 🛡 Copia de Seguridad (Backup)
Aunque uses la sincronización con GitHub, puedes descargar una copia completa en `.zip` en cualquier momento usando el icono de la nube en la esquina superior derecha como respaldo adicional.

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
