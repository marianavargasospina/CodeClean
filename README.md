# CodeClean AI - Auditoría de Calidad Frontend & Accesibilidad WCAG

**CodeClean AI** es una aplicación web interactiva que realiza auditorías de código HTML y CSS en tiempo real. Combina un motor de reglas estáticas en JavaScript con modelos de Inteligencia Artificial para evaluar la accesibilidad web (estándares WCAG 2.1) y las buenas prácticas de maquetación semántica.

---

## Tecnologías Utilizadas

* **Frontend Nativo:** HTML5, CSS3 (Variables CSS, Flexbox, Grid) y JavaScript Vanilla (ES6+).
* **Integración de IA:** API de Groq Cloud / Modelo Llama 3 para diagnóstico semántico.
* **Diseño Adaptativo:** Modos Claro / Oscuro con persistencia en `localStorage`.

---

## Características Clave

1. **Análisis de Reglas Estáticas:** Detecta imágenes sin atributo `alt`, uso de estilos en línea (`style=""`), botones vacíos y etiquetas desaconsejadas por la W3C.
2. **Evaluación Semántica por IA:** Identifica abuso de elementos `<div>` (*divitis*), falta de jerarquía de encabezados (`<h1>`) y problemas de accesibilidad en elementos interactivos.
3. **Puntuación en Tiempo Real:** Otorga una calificación de 0 a 100 basada en la severidad de los hallazgos.

---

## Desarrollo

Desarrollado por **Mariana Vargas Ospina**  
*Estudiante de Ingeniería de Sistemas | Enfocada en Desarrollo Web e IA*
