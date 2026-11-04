import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCodeLocally } from "../analyzer.js";

test("returns a perfect score when no configured rule is violated", () => {
    const report = analyzeCodeLocally("<main><h1>Hola</h1><p>Contenido</p></main>");
    assert.equal(report.score, 100);
    assert.deepEqual(report.issues, []);
});

test("detects images without alternative text", () => {
    const report = analyzeCodeLocally('<main><h1>Galería</h1><img src="photo.jpg"></main>');
    assert.ok(report.issues.some((issue) => issue.ruleId === "IMG_ALT"));
    assert.ok(report.score < 100);
});

test("does not flag images with an empty alt attribute", () => {
    const report = analyzeCodeLocally('<main><h1>Galería</h1><img src="decoration.svg" alt=""></main>');
    assert.ok(!report.issues.some((issue) => issue.ruleId === "IMG_ALT"));
});

test("detects inline styles and empty buttons", () => {
    const report = analyzeCodeLocally('<main><h1>Demo</h1><p style="color:red">Texto</p><button></button></main>');
    const ruleIds = report.issues.map((issue) => issue.ruleId);
    assert.ok(ruleIds.includes("INLINE_STYLE"));
    assert.ok(ruleIds.includes("EMPTY_BUTTON"));
});

test("detects non-semantic click targets", () => {
    const report = analyzeCodeLocally('<main><h1>Demo</h1><div onclick="run()">Abrir</div></main>');
    assert.ok(report.issues.some((issue) => issue.ruleId === "NON_SEMANTIC_INTERACTION"));
});

test("caps the score at zero for many findings", () => {
    const images = '<img src="1"><img src="2"><img src="3"><img src="4"><img src="5"><img src="6"><img src="7">';
    const report = analyzeCodeLocally(`<main><h1>Demo</h1>${images}</main>`);
    assert.equal(report.score, 0);
});

test("does not require an h1 for CSS-only input", () => {
    const report = analyzeCodeLocally("body { color: #222; } .card { padding: 1rem; }");
    assert.ok(!report.issues.some((issue) => issue.ruleId === "MISSING_H1"));
});
