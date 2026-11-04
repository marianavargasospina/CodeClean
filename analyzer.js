/**
 * Motor local de análisis de CodeClean.
 * Contiene reglas deterministas; no realiza solicitudes de red ni ejecuta código del usuario.
 */

const MAX_SCORE = 100;

function createIssue({ type, title, detail, solution, ruleId }) {
    return { type, title, detail, solution, ruleId, source: "static" };
}

function analyzeStaticRules(code) {
    const issues = [];

    const imagesWithoutAlt = code.match(/<img\b(?![^>]*\balt\s*=)[^>]*>/gi) ?? [];
    if (imagesWithoutAlt.length > 0) {
        issues.push(createIssue({
            type: "error",
            ruleId: "IMG_ALT",
            title: "Imágenes sin texto alternativo",
            detail: `Se encontraron ${imagesWithoutAlt.length} imagen(es) sin atributo alt.`,
            solution: "Agrega un atributo alt descriptivo. Si la imagen es decorativa, utiliza alt=\"\"."
        }));
    }

    const inlineStyles = code.match(/\sstyle\s*=\s*(["']).*?\1/gi) ?? [];
    if (inlineStyles.length > 0) {
        issues.push(createIssue({
            type: "warning",
            ruleId: "INLINE_STYLE",
            title: "Uso de estilos en línea",
            detail: `Se detectaron ${inlineStyles.length} atributo(s) style.`,
            solution: "Traslada las reglas visuales a una hoja CSS para mantener la separación de responsabilidades."
        }));
    }

    if (/<button\b[^>]*>\s*<\/button>/i.test(code)) {
        issues.push(createIssue({
            type: "error",
            ruleId: "EMPTY_BUTTON",
            title: "Botón sin nombre accesible",
            detail: "Se encontró un botón sin contenido textual.",
            solution: "Incluye un texto descriptivo o proporciona un nombre accesible mediante aria-label."
        }));
    }

    const deprecatedTags = code.match(/<(center|font|marquee)\b[^>]*>/gi) ?? [];
    if (deprecatedTags.length > 0) {
        issues.push(createIssue({
            type: "warning",
            ruleId: "DEPRECATED_TAG",
            title: "Elementos HTML obsoletos",
            detail: `Se encontraron ${deprecatedTags.length} elemento(s) obsoleto(s).`,
            solution: "Sustituye estos elementos por HTML semántico y reglas CSS modernas."
        }));
    }

    const score = Math.max(0, MAX_SCORE
        - imagesWithoutAlt.length * 15
        - inlineStyles.length * 10
        - (/<button\b[^>]*>\s*<\/button>/i.test(code) ? 20 : 0)
        - deprecatedTags.length * 10);

    return { issues, score };
}

function analyzeSemanticFallback(code) {
    const issues = [];

    if (/<div\b[^>]*class\s*=\s*["'][^"']*\b(header|nav|content|footer|main|card)\b[^"']*["']/i.test(code)) {
        issues.push(createIssue({
            type: "warning",
            ruleId: "SEMANTIC_HTML",
            title: "Posible falta de semántica HTML5",
            detail: "Se detectaron contenedores div que podrían representar regiones semánticas.",
            solution: "Evalúa si corresponde utilizar header, nav, main, footer, section o article."
        }));
    }

    if (/<(?:div|span)\b[^>]*\bonclick\s*=/i.test(code)) {
        issues.push(createIssue({
            type: "error",
            ruleId: "NON_SEMANTIC_INTERACTION",
            title: "Interacción sobre un elemento no interactivo",
            detail: "Se detectó onclick en un div o span.",
            solution: "Utiliza un button o un enlace nativo para conservar la interacción por teclado y tecnologías de asistencia."
        }));
    }

    if (code.length > 50 && !/<h1\b[^>]*>/i.test(code)) {
        issues.push(createIssue({
            type: "warning",
            ruleId: "MISSING_H1",
            title: "No se encontró un encabezado principal",
            detail: "El fragmento no contiene un elemento h1.",
            solution: "Incluye un encabezado principal cuando corresponda a la estructura del documento."
        }));
    }

    const score = Math.max(0, MAX_SCORE
        - issues.reduce((total, issue) => total + (issue.type === "error" ? 25 : 15), 0));

    return { issues, score };
}

export function analyzeCodeLocally(code) {
    const staticResult = analyzeStaticRules(code);
    const semanticResult = analyzeSemanticFallback(code);

    return {
        issues: [...staticResult.issues, ...semanticResult.issues],
        score: Math.min(staticResult.score, semanticResult.score)
    };
}
