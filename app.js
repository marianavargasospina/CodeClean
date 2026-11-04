import { analyzeCodeLocally } from "./analyzer.js";

const MAX_INPUT_LENGTH = 20_000;

document.addEventListener("DOMContentLoaded", () => {
    const analyzeButton = document.getElementById("btn-analyze");
    const clearButton = document.getElementById("btn-clear");
    const codeInput = document.getElementById("code-input");
    const resultsContent = document.getElementById("results-content");
    const scoreValue = document.getElementById("score-value");
    const scoreContainer = document.getElementById("score-container");
    const themeToggle = document.getElementById("theme-toggle");
    const themeIcon = themeToggle?.querySelector(".theme-icon");

    if (!analyzeButton || !clearButton || !codeInput || !resultsContent
        || !scoreValue || !scoreContainer || !themeToggle || !themeIcon) {
        console.error("CodeClean: faltan elementos requeridos en el DOM.");
        return;
    }

    initializeTheme(themeToggle, themeIcon);

    clearButton.addEventListener("click", () => {
        codeInput.value = "";
        scoreValue.textContent = "--";
        scoreContainer.className = "score-badge neutral";
        renderPlaceholder(resultsContent, "Ingresa código HTML o CSS para iniciar una auditoría.");
        codeInput.focus();
    });

    analyzeButton.addEventListener("click", () => {
        const code = codeInput.value.trim();

        if (!code) {
            renderMessage(resultsContent, "Escribe o pega código antes de iniciar el análisis.", "error");
            codeInput.focus();
            return;
        }

        if (code.length > MAX_INPUT_LENGTH) {
            renderMessage(
                resultsContent,
                `El código supera el límite de ${MAX_INPUT_LENGTH.toLocaleString("es-CO")} caracteres.`,
                "error"
            );
            return;
        }

        analyzeButton.disabled = true;
        analyzeButton.setAttribute("aria-busy", "true");
        renderMessage(resultsContent, "Analizando reglas estáticas y semánticas localmente…", "info");

        try {
            const report = analyzeCodeLocally(code);
            renderReport(report, resultsContent, scoreValue, scoreContainer);
        } catch (error) {
            console.error("CodeClean: error durante el análisis.", error);
            renderMessage(resultsContent, "No fue posible completar el análisis. Inténtalo nuevamente.", "error");
        } finally {
            analyzeButton.disabled = false;
            analyzeButton.removeAttribute("aria-busy");
        }
    });
});

function initializeTheme(toggle, icon) {
    let savedTheme = "dark";

    try {
        savedTheme = localStorage.getItem("theme") ?? "dark";
    } catch (error) {
        console.warn("CodeClean: no fue posible leer la preferencia de tema.", error);
    }

    applyTheme(savedTheme === "light", icon);

    toggle.addEventListener("click", () => {
        const isLight = !document.body.classList.contains("light-theme");
        applyTheme(isLight, icon);

        try {
            localStorage.setItem("theme", isLight ? "light" : "dark");
        } catch (error) {
            console.warn("CodeClean: no fue posible guardar la preferencia de tema.", error);
        }
    });
}

function applyTheme(isLight, icon) {
    document.body.classList.toggle("light-theme", isLight);
    icon.textContent = isLight ? "☀️" : "🌙";
    const toggle = document.getElementById("theme-toggle");
    toggle?.setAttribute("aria-pressed", String(isLight));
    toggle?.setAttribute("aria-label", isLight ? "Activar tema oscuro" : "Activar tema claro");
}

function renderReport(report, container, scoreValue, scoreContainer) {
    const { issues, score } = report;
    scoreValue.textContent = String(score);
    scoreContainer.className = `score-badge ${score >= 80 ? "good" : score >= 50 ? "regular" : "bad"}`;

    container.replaceChildren();

    if (issues.length === 0) {
        const heading = document.createElement("h3");
        heading.className = "report-success";
        heading.textContent = "¡No se encontraron problemas!";
        const description = document.createElement("p");
        description.textContent = "El análisis local no detectó incidencias en las reglas disponibles.";
        container.append(heading, description);
        return;
    }

    const summary = document.createElement("p");
    summary.className = "report-summary";
    summary.textContent = `Se encontraron ${issues.length} hallazgo(s) en el análisis.`;
    container.append(summary);

    for (const issue of issues) {
        container.append(createIssueCard(issue));
    }
}

function createIssueCard(issue) {
    const card = document.createElement("article");
    card.className = `issue-card issue-${issue.type}`;

    const heading = document.createElement("h3");
    heading.textContent = `${issue.type === "error" ? "Error" : "Advertencia"}: ${issue.title}`;

    const rule = document.createElement("p");
    rule.className = "issue-rule";
    rule.textContent = `Regla: ${issue.ruleId}`;

    const detail = document.createElement("p");
    detail.textContent = issue.detail;

    const solution = document.createElement("p");
    solution.className = "issue-solution";
    solution.textContent = `Solución recomendada: ${issue.solution}`;

    card.append(heading, rule, detail, solution);
    return card;
}

function renderPlaceholder(container, message) {
    container.replaceChildren();
    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    container.append(paragraph);
}

function renderMessage(container, message, type) {
    renderPlaceholder(container, message);
    container.className = `results-placeholder message-${type}`;
}
