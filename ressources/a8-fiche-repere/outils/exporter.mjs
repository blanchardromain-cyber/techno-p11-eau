// Exporte la fiche repère A8 en PDF (Chrome sans interface, via Playwright) et en aperçus PNG,
// et vérifie qu'aucun élément ne sort de la zone utile (15 mm des bords).
// Usage : node outils/exporter.mjs   (depuis n'importe où ; Playwright est pris dans video-technologie)
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
const require = createRequire(`${process.env.USERPROFILE}/Documents/video-technologie/package.json`);
const { chromium } = require("playwright");

const ici = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = pathToFileURL(path.join(ici, "fiche-repere.html")).href;
const FORMATS = [
  { f: "A3", pdf: "fiche-repere_A3.pdf", mm: [420, 297] },
  { f: "A4", pdf: "fiche-repere_A4.pdf", mm: [297, 210] },
  { f: "adaptee", pdf: "fiche-repere_adaptee_A4.pdf", mm: [297, 210] },
];
const PX = 96 / 25.4;

const nav = await chromium.launch();
let alertes = 0;
for (const F of FORMATS) {
  const page = await nav.newPage({ viewport: { width: Math.round(F.mm[0] * PX), height: Math.round(F.mm[1] * PX) }, deviceScaleFactor: 2 });
  await page.goto(`${source}?f=${F.f}`);
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => document.fonts.ready);
  // Zone utile : tout élément visible doit rester à 15 mm des bords (mesure dans l'espace de la feuille, zoom compris).
  const sorties = await page.evaluate(() => {
    const mm = 96 / 25.4, res = [];
    document.querySelectorAll(".feuille").forEach((fe, k) => {
      if (getComputedStyle(fe).display === "none") return;
      const z = parseFloat(getComputedStyle(fe).zoom) || 1;
      const r0 = fe.getBoundingClientRect();
      const W = r0.width, H = r0.height, marge = 15 * mm * z - 0.5;
      fe.querySelectorAll("*").forEach((el) => {
        if (el.classList.contains("reperage")) return;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const g = r.left - r0.left, d = r0.right - r.right, h = r.top - r0.top, b = r0.bottom - r.bottom;
        if (Math.min(g, d, h, b) < marge) res.push(`feuille ${k + 1} : <${el.tagName.toLowerCase()} class="${el.className}"> à ${(Math.min(g, d, h, b) / mm / z).toFixed(1)} mm du bord (« ${(el.textContent || "").trim().slice(0, 40)} »)`);
      });
      const pleine = fe.scrollHeight > fe.clientHeight + 1;
      if (pleine) res.push(`feuille ${k + 1} : le contenu déborde de ${((fe.scrollHeight - fe.clientHeight) / mm).toFixed(1)} mm`);
      // Police la plus petite (pt), zoom compris
      let min = 99;
      fe.querySelectorAll("*").forEach((el) => {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
        min = Math.min(min, parseFloat(getComputedStyle(el).fontSize) * 0.75 * z);
      });
      res.push(`feuille ${k + 1} : plus petit texte ${min.toFixed(1)} pt`);
    });
    return res;
  });
  for (const s of sorties) { console.log(`[${F.f}] ${s}`); if (!s.includes("plus petit texte")) alertes++; }
  await page.pdf({ path: path.join(ici, F.pdf), preferCSSPageSize: true, printBackground: true });
  // Aperçus PNG : une image par feuille, à la taille de la page (150 dpi environ).
  const feuilles = await page.locator(".feuille:visible").all();
  const noms = F.f === "adaptee" ? ["recto", "verso"] : ["feuille1_recto", "feuille1_verso", "feuille2_recto", "feuille2_verso"];
  for (let k = 0; k < feuilles.length; k++) {
    await feuilles[k].screenshot({ path: path.join(ici, "apercus", `${F.pdf.replace(".pdf", "")}_${noms[k]}.png`) });
  }
  await page.close();
}
await nav.close();
console.log(alertes ? `${alertes} alerte(s)` : "aucune sortie de la zone utile");
