# REDSEV FCA - FCA UNCA

Sistema de gestión de documentos para la Secretaría de Extensión y Vinculación de la Facultad de Ciencias Agrarias - UNCA.

## 🔄 Flujo de Trabajo y Actualización
Para mantener el sistema al día en GitHub y en el servidor de la Universidad tras realizar cambios en Firebase Studio:

1. **Descargar el Proyecto**: Haz clic en el icono de la **nube con flecha hacia abajo** (Download Project) en la esquina superior derecha de Firebase Studio.
2. **Sincronizar con GitHub**:
   - Descomprime el archivo `.zip` descargado en tu carpeta local donde tienes el repositorio.
   - Abre una terminal en esa carpeta y ejecuta:
     ```bash
     git add .
     git commit -m "Descripción de las mejoras realizadas"
     git push origin main
     ```
3. **Actualizar el Servidor**: Una vez los cambios están en GitHub, el equipo técnico solo debe entrar al servidor y ejecutar:
   ```bash
   git pull origin main
   npm install
   npm run build
   pm2 restart redsev
   ```

## 🛡 Copia de Seguridad (Backup)
**IMPORTANTE:** Cada descarga es un backup completo. Guarda siempre la última versión estable en un lugar seguro (Google Drive, Pendrive o Disco Externo) antes de subirla al servidor de producción.

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
