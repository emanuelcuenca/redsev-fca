
# Memoria de Lógica Institucional - VínculoAgro

Este documento detalla las reglas de negocio personalizadas implementadas en el sistema para asegurar la integridad de los datos de la Secretaría.

## 1. Categoría: Extensión
- **Proyecto de Extensión**: Genera automáticamente un código con formato `FCA-EXT-***-AÑO`. El número es correlativo basado en la cantidad de proyectos existentes.
- **Vínculos Obligatorios**: Las "Resoluciones de aprobación", "Informes de avance" e "Informes finales" requieren obligatoriamente vincularse a un proyecto mediante su código.
- **Protección de Datos**: Una vez vinculado un proyecto, el Título y el Director se bloquean (solo lectura) para evitar discrepancias.
- **Objetivos**: Los proyectos cuentan con un Objetivo General y una lista dinámica de Objetivos Específicos.

## 2. Categoría: Convenios
- **Responsables**: Inicia con un (1) responsable institucional por defecto, con opción de añadir más.
- **Vigencia**: El sistema calcula la vigencia basándose en la fecha de firma y los años de duración, a menos que tenga "Renovación Automática".

## 3. Gestión de Personas (Padrón Docente)
- **Sincronización Automática**: Cualquier Director o integrante de Equipo Técnico ingresado manualmente que no exista en el padrón, se guarda automáticamente en la colección `staff`.
- **Buscador Inteligente**: Los campos de personas incluyen un componente de autocompletado que busca por Apellido en el padrón docente en tiempo real.

## 4. Movilidad y Pasantías
- **Terminología**: Se utiliza "Estado/Provincia" y "País" para destinos internacionales y nacionales.
- **Datos Específicos**: Las pasantías y movilidades estudiantiles requieren obligatoriamente los datos del alumno (Apellido y Nombre).

## 5. Seguridad
- **Roles**: Solo los usuarios con el ID registrado en la colección `roles_admin` pueden realizar cargas, ediciones o eliminaciones.
- **IA**: La descripción/resumen puede ser generada automáticamente mediante IA analizando visualmente el archivo PDF o imagen subida.
