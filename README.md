# VínculoAgro - FCA UNCA

Sistema de gestión de documentos para la Secretaría de Extensión y Vinculación de la Facultad de Ciencias Agrarias - UNCA.

## 🚀 Cómo publicar la App (Despliegue en Firebase)

Para que tus compañeros puedan ver la aplicación en sus móviles, debes seguir estos pasos:

1. **Subir a GitHub**: Crea un repositorio en GitHub y sube todo el código de esta carpeta.
2. **Consola de Firebase**: Ve a [console.firebase.google.com](https://console.firebase.google.com/).
3. **App Hosting**: En el menú lateral, ve a **Compilación > App Hosting**.
4. **Conectar**: Haz clic en "Comenzar" y conecta tu repositorio de GitHub.
5. **Configurar**: Deja las opciones por defecto y haz clic en "Desplegar".

Una vez finalizado, Firebase te dará una URL pública (ej: `vinculo-agro.web.app`) que podrás compartir con toda la oficina.

---

## Mantenimiento y Actualizaciones

Este sistema está diseñado para que el usuario final no necesite conocimientos técnicos avanzados.

### ¿Cómo aplicar cambios realizados por el Prototipador?
Cuando solicites una mejora visual o funcional:
1. **Sincronizar cambios**: Si usas Git, realiza un `git commit` y `git push`.
2. **Auto-Despliegue**: Firebase App Hosting detectará el cambio automáticamente y actualizará el sitio público en pocos minutos.

### Soporte de Datos
- **Base de Datos**: Los documentos se gestionan vía Firebase Console > Firestore.
- **IA**: La inteligencia (estilo Google Lens) requiere que la clave `GEMINI_API_KEY` esté configurada en el archivo `.env` o en los Secretos de App Hosting en la consola de Firebase.

---
*Desarrollado para la Secretaría de Extensión y Vinculación - FCA UNCA.*
