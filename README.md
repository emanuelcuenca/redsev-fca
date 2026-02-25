# REDSEV FCA - FCA UNCA

Sistema de gestión de documentos para la Secretaría de Extensión y Vinculación de la Facultad de Ciencias Agrarias - UNCA.

## 🔄 Flujo de Trabajo y Actualización (IMPORTANTE)
Este proyecto está vinculado directamente con GitHub. Sigue este ciclo para mantener el sistema actualizado:

1. **Realizar Cambios**: Solicita cambios o mejoras aquí en Firebase Studio.
2. **Sincronizar (GitHub Sync)**: 
   - Ve a la pestaña de **Git** en el menú izquierdo de Firebase Studio.
   - Escribe un mensaje breve sobre los cambios realizados.
   - Presiona `Sync Changes` (o `Ctrl + Enter`). Esto subirá el código automáticamente a tu repositorio en GitHub.
3. **Actualizar el Servidor de Producción**: Una vez el código esté en GitHub, el equipo técnico en la Universidad debe entrar al servidor y ejecutar:
   ```bash
   git pull origin main
   npm run build
   pm2 restart redsev
   ```

## 🛡 Copia de Seguridad (Backup)
Aunque uses la sincronización con GitHub, puedes descargar una copia completa en `.zip` en cualquier momento usando el icono de la nube en la esquina superior derecha como respaldo adicional.

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
