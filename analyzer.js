/**
 * Motor local de análisis de CodeClean.
 * Reglas deterministas sin solicitudes de red ni ejecución del código analizado.
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

    const emptyButton = /<button\b[^>]*>\s*<\/button>/i.test(code);
    if (emptyButton) {
        issues.push(createIssue({
            type: "error",
            ruleId: "EMPTY_BUTTON",
            title: "Botón sin nombre accesible",
            detail: "Se encontró un botón sin contenido textual.",
            solution: "Incluye texto descriptivo o proporciona un nombre accesible mediante aria-label."
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
        - (emptyButton ? 20 : 0)
        - deprecatedTags.length * 10);

    return { issues, score };
}

function analyzeSemanticFallback(code) {
    const issues = [];
    const containsHtml = /<[a-z][\s\S]*?>/i.test(code);

    if (!containsHtml) {
        return { issues, score: MAX_SCORE };
    }

    if (/<div\b[^>]*class\s*=\s*["'][^"']*\b(header|nav|content|footer|main|card)\b[^"']*["']/i.test(code)) {
        issues.push(createIssue({
            type: "warning",
            ruleId: "SEMANTIC_HTML",
            title: "Posible oportunidad de mejorar la semántica HTML5",
            detail: "Se detectaron contenedores div que podrían representar regiones semánticas.",
            solution: "Evalúa si corresponde utilizar header, nav, main, footer, section o article. La clase por sí sola no demuestra un error."
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

    if (code.length > 50 && !/<h1\b[^>]*>/i.test(code) && /<body\b/i.test(code)) {
        issues.push(createIssue({
            type: "warning",
            ruleId: "MISSING_H1",
            title: "No se encontró un encabezado principal",
            detail: "El documento HTML no contiene un elemento h1.",
            solution: "Incluye un encabezado principal que describa el propósito de la página."
        }));
    }

    const score = Math.max(0, MAX_SCORE
        - issues.reduce((total, issue) => total + (issue.type === "error" ? 25 : 15), 0));

    return { issues, score };
}

export function analyzeCodeLocally(code) {
    if (typeof code !== "string") {
        throw new TypeError("El código que se va a analizar debe ser una cadena de texto.");
    }

    const staticResult = analyzeStaticRules(code);
    const semanticResult = analyzeSemanticFallback(code);

    return {
        issues: [...staticResult.issues, ...semanticResult.issues],
        score: Math.min(staticResult.score, semanticResult.score)
    };
}
