# CodeClean AI

Auditor de calidad frontend enfocado en buenas prácticas de HTML, CSS y accesibilidad web.

## Estado actual

La versión actual ejecuta un conjunto de reglas deterministas en el navegador. No envía el código del usuario a servicios externos y no necesita claves API para el análisis local.

> La integración con un proveedor de IA requiere un backend seguro. Nunca coloques claves privadas en JavaScript del navegador ni en el repositorio.

## Tecnologías

- HTML5 semántico
- CSS3 (Grid, Flexbox y custom properties)
- JavaScript moderno con módulos ES
- Node.js Test Runner para pruebas automatizadas

## Funcionalidades

- Detección de imágenes sin atributo `alt`.
- Detección de atributos de estilo en línea.
- Detección de botones vacíos.
- Detección de elementos HTML obsoletos.
- Revisión heurística de algunos patrones de semántica e interacción.
- Puntuación orientativa de 0 a 100.
- Tema claro/oscuro con preferencia local.

## Estructura

```text
CodeClean/
├── accessibility.css
├── analyzer.js
├── app.js
├── index.html
├── styles.css
├── package.json
└── tests/
    └── analyzer.test.js
```

## Ejecución local

Puedes abrir `index.html` con un servidor estático local. Por ejemplo:

```bash
npx serve .
```

El proyecto utiliza módulos JavaScript, por lo que se recomienda servirlo mediante HTTP y no abrirlo directamente con el protocolo `file://`.

## Pruebas

Requiere Node.js 20 o superior:

```bash
npm test
```

## Alcance y limitaciones

Las reglas actuales son heurísticas basadas en patrones de texto; no sustituyen un parser HTML/CSS ni una auditoría completa de WCAG. Pueden existir falsos positivos y falsos negativos. La puntuación es orientativa y no representa una certificación de accesibilidad.

## Seguridad

- No se almacenan claves API en el frontend.
- El contenido analizado se representa mediante APIs DOM seguras; no se interpreta como HTML ejecutable.
- El análisis local no realiza solicitudes de red.
- Si una clave fue publicada anteriormente en el repositorio, revócala en el proveedor y genera una nueva. Eliminarla del último commit no invalida una credencial expuesta ni elimina su presencia del historial.

## Autora

**Mariana Vargas Ospina**  
Estudiante de Ingeniería de Sistemas | Desarrollo web e inteligencia artificial
