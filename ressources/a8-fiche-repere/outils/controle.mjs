// Contrôles de la fiche repère A8 : contrastes, simulation du daltonisme (Machado 2009, sévérité 1), réduction à 50 %.
// Usage : node outils/controle.mjs   → apercus/controle_daltonisme_*.png, apercus/controle_50pc.png, contrastes en console
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
const require = createRequire(`${process.env.USERPROFILE}/Documents/video-technologie/package.json`);
const { chromium } = require("playwright");
const ici = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = pathToFileURL(path.join(ici, "fiche-repere.html")).href;

// ---------- Contrastes (WCAG) ----------
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const PAIRES = [
  ["texte encre / blanc", "#1d2433", "#ffffff", 4.5], ["texte gris / blanc", "#4a5263", "#ffffff", 4.5],
  ["texte gris / fond", "#4a5263", "#f2f4f8", 4.5], ["texte encre / fond", "#1d2433", "#f2f4f8", 4.5],
  ["texte encre / bouton ambre", "#1d2433", "#f5b700", 4.5], ["texte encre / bouton gris", "#1d2433", "#e6ebf1", 4.5],
  ["texte blanc / bandeau encre", "#ffffff", "#1d2433", 4.5], ["texte encre / relevé", "#1d2433", "#fff8e1", 4.5],
  ["texte encre / exemple", "#1d2433", "#fffbea", 4.5], ["picto bleu / blanc (non textuel)", "#2f6db3", "#ffffff", 3],
  ["nuancier métal / blanc (non textuel)", "#4F6E8F", "#ffffff", 3], ["nuancier organique / blanc", "#3C8A57", "#ffffff", 3],
  ["nuancier céramique / blanc", "#B0582F", "#ffffff", 3], ["nuancier composite / blanc", "#7656A8", "#ffffff", 3],
];
for (const [nom, a, b, min] of PAIRES) { const r = ratio(a, b); console.log(`${r >= min ? "OK " : "KO "} ${r.toFixed(2)}:1 (min ${min}) ${nom}`); }

// ---------- Daltonisme et réduction ----------
const M = {
  deuteranopie: "0.367322 0.860646 -0.227968 0 0  0.280085 0.672501 0.047413 0 0  -0.011820 0.042940 0.968881 0 0  0 0 0 1 0",
  protanopie: "0.152286 1.052583 -0.204868 0 0  0.114503 0.786281 0.099216 0 0  -0.003882 -0.048116 1.051998 0 0  0 0 0 1 0",
};
const nav = await chromium.launch();
const page = await nav.newPage({ viewport: { width: 1588, height: 1123 }, deviceScaleFactor: 1 });
await page.goto(`${source}?f=A3`);
await page.emulateMedia({ media: "print" });
await page.evaluate(() => document.fonts.ready);
const feuilles = await page.locator(".feuille:visible").all();
for (const [nom, m] of Object.entries(M)) {
  await page.evaluate(([nom, m]) => {
    document.getElementById("filtres")?.remove();
    document.body.insertAdjacentHTML("beforeend", `<svg id="filtres" width="0" height="0" style="position:absolute"><filter id="f-${nom}" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="${m}"/></filter></svg>`);
    document.querySelectorAll(".feuille").forEach((f) => { f.style.filter = `url(#f-${nom})`; });
  }, [nom, m]);
  await feuilles[0].screenshot({ path: path.join(ici, "apercus", `controle_${nom}_feuille1_recto.png`) });
  await feuilles[2].screenshot({ path: path.join(ici, "apercus", `controle_${nom}_feuille2_recto.png`) });
}
await page.evaluate(() => document.querySelectorAll(".feuille").forEach((f) => { f.style.filter = ""; }));
// Réduction à 50 % : la feuille A3 rendue à la moitié de sa taille (≈ A5), comme vue de loin.
await page.evaluate(() => { document.querySelectorAll(".feuille").forEach((f) => { f.style.zoom = "0.5"; }); });
const petites = await page.locator(".feuille:visible").all();
await petites[0].screenshot({ path: path.join(ici, "apercus", "controle_50pc_feuille1_recto.png") });
await nav.close();
console.log("images de contrôle faites");
