# REDSEV FCA - FCA UNCA

Sistema de gestión de documentos para la Secretaría de Extensión y Vinculación de la Facultad de Ciencias Agrarias - UNCA.

## 🛡 Copia de Seguridad (Backup)
**IMPORTANTE:** Para realizar una copia de seguridad de este estado actual del sitio:
1. Haz clic en el icono de la **nube con flecha hacia abajo** (Download Project) en la esquina superior derecha de la pantalla.
2. Guarda el archivo `.zip` resultante en un lugar seguro (Google Drive, Pendrive o Disco Externo).
3. En caso de errores futuros, este archivo contiene el código fuente exacto que funciona correctamente hoy.

## 📥 Cómo descargar y subir a GitHub
Para llevar este proyecto a tu propio servidor o GitHub:
1. Usa el botón **"Download Project"** (icono de nube arriba a la derecha).
2. Crea un nuevo repositorio en tu cuenta de GitHub llamado `redsev-fca`.
3. Descomprime el archivo descargado en tu computadora.
4. Abre una terminal en esa carpeta y ejecuta:
   ```bash
   git init
   git remote add origin https://github.com/TU_USUARIO/redsev-fca.git
   git add .
   git commit -m "Carga inicial REDSEV"
   git branch -M main
   git push -u origin main
   ```

## 🏛 Migración a Servidores de la Universidad
Esta aplicación es un proyecto estándar de **NextJS**. Para alojarla en servidores propios de la UNCA, entrega la carpeta completa al equipo de sistemas. Ellos podrán ejecutarla siguiendo la guía en `docs/ENTREGA_TECNICA.md`.

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
