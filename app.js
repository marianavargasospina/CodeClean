// ==========================================
// CONFIGURACIÓN DE API (GROQ FREE TIER)
// ==========================================
const GROQ_API_KEY = "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";

document.addEventListener('DOMContentLoaded', () => {
    const btnAnalyze = document.getElementById('btn-analyze');
    const btnClear = document.getElementById('btn-clear');
    const codeInput = document.getElementById('code-input');
    const resultsContent = document.getElementById('results-content');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');

    // 1. Manejo del Tema Claro / Oscuro con Persistencia
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.textContent = '☀️';
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        themeIcon.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });

    // 2. Limpiar el editor y reiniciar resultados
    btnClear.addEventListener('click', () => {
        codeInput.value = '';
        document.getElementById('score-value').textContent = '--';
        document.getElementById('score-container').className = 'score-badge neutral';
        resultsContent.innerHTML = `
            <div class="placeholder-icon">⚡</div>
            <p>Ingresa tu código en el editor y presiona <strong>"Analizar Calidad"</strong> para obtener el diagnóstico estático y por IA.</p>
        `;
    });

    // 3. Evento de Análisis de Código (Estático + IA)
    btnAnalyze.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        
        if (!code) {
            alert('Por favor, ingresa algún código HTML o CSS para analizar.');
            return;
        }

        // Mostrar estado de carga
        btnAnalyze.disabled = true;
        btnAnalyze.style.opacity = '0.7';
        resultsContent.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="color: var(--primary); font-weight: 600; margin-bottom: 0.5rem;">⚡ Ejecutando auditoría de calidad...</p>
                <p style="font-size: 0.85rem; color: var(--text-muted);">Analizando reglas estáticas, semántica de HTML5 y estándares WCAG.</p>
            </div>
        `;

        // A. Ejecutar motor estático local (Reglas directas)
        const staticResults = analyzeStaticRules(code);

        // B. Intentar consultar IA (Groq API) o invocar el motor de respaldo
        let aiIssues = [];
        let aiScore = staticResults.score;

        try {
            const aiData = await analyzeCodeWithAI(code);
            if (aiData && aiData.issues) {
                aiIssues = aiData.issues;
                if (typeof aiData.score === 'number') {
                    aiScore = Math.min(staticResults.score, aiData.score);
                }
            }
        } catch (err) {
            console.warn('API no disponible. Usando motor semántico de respaldo local:', err);
            // Si la API falla, usamos las reglas de semántica local
            const fallbackResults = analyzeSemanticFallback(code);
            aiIssues = fallbackResults.issues;
            aiScore = Math.min(staticResults.score, fallbackResults.score);
        }

        // Restaurar estado del botón
        btnAnalyze.disabled = false;
        btnAnalyze.style.opacity = '1';

        // Actualizar el puntaje en pantalla
        const scoreValue = document.getElementById('score-value');
        const scoreContainer = document.getElementById('score-container');
        scoreValue.textContent = aiScore;
        scoreContainer.className = 'score-badge ' + (aiScore >= 80 ? 'good' : aiScore >= 50 ? 'regular' : 'bad');

        // Unificar resultados
        const allIssues = [...staticResults.issues, ...aiIssues];

        if (allIssues.length === 0) {
            resultsContent.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">🎉</div>
                    <h3 style="color: var(--success); font-weight: 700; margin-bottom: 0.5rem;">¡Código Impecable!</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">No se encontraron violaciones de reglas estáticas ni faltas de semántica en tu marcado.</p>
                </div>
            `;
        } else {
            resultsContent.innerHTML = allIssues.map(item => `
                <div style="background-color: var(--bg-main); border-left: 4px solid var(--${item.type === 'error' ? 'danger' : 'warning'}); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; text-align: left;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                        <strong style="color: var(--${item.type === 'error' ? 'danger' : 'warning'}); font-size: 0.95rem;">
                            ${item.type === 'error' ? '❌ Error' : '⚠️ Advertencia'}: ${item.title}
                        </strong>
                        ${item.source === 'AI' ? '<span style="font-size: 0.7rem; background: var(--border); color: var(--primary); padding: 2px 6px; border-radius: 4px; font-weight: bold;">🤖 IA</span>' : ''}
                    </div>
                    <p style="font-size: 0.88rem; color: var(--text-main); margin-bottom: 0.5rem;">${item.detail}</p>
                    <p style="font-size: 0.82rem; color: var(--primary); font-family: var(--font-code);">💡 <strong>Solución recomendada:</strong> ${item.solution}</p>
                </div>
            `).join('');
        }
    });
});

// ==========================================
// CONSUMO DE API DE IA (GROQ / LLAMA-3.1)
// ==========================================
async function analyzeCodeWithAI(code) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: 'Eres un auditor estricto de accesibilidad WCAG. Revisa el código y responde en formato json puro siguiendo este esquema exacto:\n{\n  "score": 70,\n  "issues": [\n    {\n      "type": "warning",\n      "title": "Falta de semántica HTML5",\n      "detail": "Uso excesivo de elementos div sin valor semántico.",\n      "solution": "Reemplaza los div por etiquetas como header, main o article.",\n      "source": "AI"\n    }\n  ]\n}'
                },
                {
                    role: 'user',
                    content: `Audita este código en formato json:\n\n${code}`
                }
            ],
            temperature: 0.1
        })
    });

    if (!response.ok) {
        throw new Error(`Error HTTP Groq: ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content.trim());
}

// ==========================================
// MOTOR DE RESPALDO SEMÁNTICO (LÓGICA LOCAL)
// ==========================================
function analyzeSemanticFallback(code) {
    const issues = [];
    let scoreDeduction = 0;

    // A. Detectar "Divitis" (Uso excesivo de divs para cabeceras o contenido)
    if (/<div[^>]*class=["'](?:header|nav|content|footer|main|card)["'][^>]*>/i.test(code)) {
        issues.push({
            type: 'warning',
            title: 'Falta de HTML5 Semántico (Divitis)',
            detail: 'Se identificó el uso de elementos <div> genéricos con nombres de clase para representar secciones de la página.',
            solution: 'Reemplaza <div class="header"> por <header>, <div class="content"> por <main> y <div class="card"> por <article>.',
            source: 'AI'
        });
        scoreDeduction += 20;
    }

    // B. Detectar eventos onclick en divs o spans sin accesibilidad
    if (/<(?:div|span)[^>]*onclick=/i.test(code)) {
        issues.push({
            type: 'error',
            title: 'Elemento no interactivo utilizado como botón',
            detail: 'Hay elementos <div> o <span> con eventos onclick. Esto es inaccesible mediante navegación por teclado.',
            solution: 'Utiliza una etiqueta <button> nativa o añade role="button" y tabindex="0".',
            source: 'AI'
        });
        scoreDeduction += 25;
    }

    // C. Detectar ausencia de h1 en documentos grandes
    if (code.length > 50 && !/<h1\b[^>]*>/i.test(code)) {
        issues.push({
            type: 'warning',
            title: 'Ausencia de Encabezado Principal (<h1>)',
            detail: 'El documento no contiene una etiqueta <h1> principal para definir la jerarquía del contenido.',
            solution: 'Añade un <h1> con el título de la aplicación para guiar a los lectores de pantalla.',
            source: 'AI'
        });
        scoreDeduction += 15;
    }

    return { issues, score: Math.max(0, 100 - scoreDeduction) };
}

// ==========================================
// MOTOR DE REGLAS ESTÁTICAS (INSPECCIÓN HTML/CSS)
// ==========================================
function analyzeStaticRules(code) {
    const issues = [];
    let scoreDeduction = 0;

    // Regla 1: Imágenes sin atributo alt
    const imgRegex = /<img(?![^>]*\balt=)[^>]*>/gi;
    const imgMatches = code.match(imgRegex);
    if (imgMatches) {
        issues.push({
            type: 'error',
            title: 'Imágenes sin texto alternativo (alt)',
            detail: `Se encontraron ${imgMatches.length} etiqueta(s) <img> sin el atributo 'alt'. Esto dificulta la lectura para tecnologías de asistencia.`,
            solution: 'Agrega alt="descripción accesible" a cada etiqueta <img>.'
        });
        scoreDeduction += imgMatches.length * 15;
    }

    // Regla 2: Estilos en línea
    const inlineStyleRegex = /style\s*=\s*["'][^"']*["']/gi;
    const styleMatches = code.match(inlineStyleRegex);
    if (styleMatches) {
        issues.push({
            type: 'warning',
            title: 'Uso de estilos en línea (Inline Styles)',
            detail: `Se detectaron ${styleMatches.length} atributo(s) 'style'. Rompen el principio de separación de responsabilidades en la web.`,
            solution: 'Traslada las propiedades CSS a un archivo de estilos externo (.css).'
        });
        scoreDeduction += styleMatches.length * 10;
    }

    // Regla 3: Botones vacíos
    const emptyButtonRegex = /<button[^>]*>\s*<\/button>/gi;
    if (emptyButtonRegex.test(code)) {
        issues.push({
            type: 'error',
            title: 'Botón sin contenido accesible',
            detail: 'Existen botones sin texto o descripción en el DOM. Un lector de pantalla no sabrá la acción del botón.',
            solution: 'Incluye un texto legible dentro de <button> o asigna aria-label="Descripción".'
        });
        scoreDeduction += 20;
    }

    // Regla 4: Etiquetas HTML obsoletas
    const deprecatedRegex = /<(center|font|marquee|b|i)\b[^>]*>/gi;
    const deprecatedMatches = code.match(deprecatedRegex);
    if (deprecatedMatches) {
        const cleanTags = deprecatedMatches.map(tag => tag.replace(/</g, '&lt;').replace(/>/g, '&gt;')).join(', ');
        issues.push({
            type: 'warning',
            title: 'Etiquetas HTML desaconsejadas',
            detail: `Se encontraron elementos obsoletos en el marcado: ${cleanTags}.`,
            solution: 'Usa CSS para la alineación o fuentes, y prefiere &lt;strong&gt; o &lt;em&gt; para dar énfasis semántico.'
        });
        scoreDeduction += 10;
    }

    const finalScore = Math.max(0, 100 - scoreDeduction);
    return { issues, score: finalScore };
}