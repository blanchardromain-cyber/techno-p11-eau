// Banc d'essai de diaporama-a8.html (Chrome sans interface, Playwright de video-technologie).
// Chaque étape : erreurs, débordements (écran, cadre, chevauchements), plus petit texte ; captures.
// Puis : minuteurs automatiques, relais de la partie A, notes, saisie des questions → bilan, clavier dans un champ, 50 %.
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";
const require = createRequire(`${process.env.USERPROFILE}/Documents/video-technologie/package.json`);
const { chromium } = require("playwright");
const ici = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const URL_ = pathToFileURL(path.resolve(ici, "..", "..", "diaporama-a8.html")).href;
const APE = path.join(ici, "apercus", "diaporama"); fs.rmSync(APE, { recursive: true, force: true }); fs.mkdirSync(APE, { recursive: true });
// Écrans où un texte plus petit est admis (professeur, listes saisies) : seuil propre
const SEUIL = { conduite: 18, vosquestions: 24, bilan: 24, tables: 34, repere: 34, clip: 34, partieA: 44, partieB: 44 };

const nav = await chromium.launch();
let alertes = 0; const ko = (s) => { alertes++; console.log("ALERTE", s); };
const ctx = await nav.newContext({ viewport: { width: 1600, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
const p = await ctx.newPage();
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message)); p.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
const requetes = []; p.on("request", (r) => requetes.push(r.url()));
p.on("requestfailed", (r) => { if (!r.url().endsWith(".wav")) erreurs.push("requête échouée " + r.url()); });
await p.goto(URL_ + "#1"); await p.evaluate(() => document.fonts.ready);
const n = await p.evaluate(() => document.querySelectorAll("#points button").length);

const mesure = () => p.evaluate(() => {
  const ec = document.querySelector(".ecran.on"), r0 = ec.getBoundingClientRect(), res = [];
  let min = 999, minTxt = "";
  const vis = (el) => { const cs = getComputedStyle(el); return cs.display !== "none" && cs.visibility !== "hidden" && !el.closest("[hidden]"); };
  ec.querySelectorAll("*").forEach((el) => {
    if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") return;
    if (!vis(el)) return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    if (r.bottom > r0.bottom + 1 || r.right > r0.right + 1 || r.left < r0.left - 1) res.push(`déborde de l'écran : <${el.tagName.toLowerCase()}> « ${(el.textContent || "").trim().slice(0, 30)} »`);
    if (!el.closest("button,a,input,label,datalist,.info") && [...el.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim())) {
      const f = parseFloat(getComputedStyle(el).fontSize); if (f < min) { min = f; minTxt = el.textContent.trim().slice(0, 30); }
    }
  });
  ec.querySelectorAll(".lettre,.minuteur,.etiq,.pb,.consigne.on,.regles,.zones-vides,.duo,.deux,.docs,.relances,.col,.pile,.tl,.pile-d,figure").forEach((c) => {
    if (!vis(c)) return;
    const rc = c.getBoundingClientRect();
    c.querySelectorAll("*").forEach((el) => {
      if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") return;
      if (!vis(el) || el.closest("ul")?.scrollHeight > el.closest("ul")?.clientHeight) return; // listes défilantes : voir plus bas
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
      if (r.bottom > rc.bottom + 1 || r.right > rc.right + 1 || r.top < rc.top - 1 || r.left < rc.left - 1)
        res.push(`sort de .${String(c.className).split(" ")[0] || c.tagName} : « ${(el.textContent || el.tagName).trim().slice(0, 30)} »`);
    });
  });
  const blocs = [...ec.children].filter(vis);
  for (let i = 0; i < blocs.length; i++) for (let j = i + 1; j < blocs.length; j++) {
    const a = blocs[i].getBoundingClientRect(), b = blocs[j].getBoundingClientRect();
    if (a.width && b.width && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1)
      res.push(`chevauchement : .${blocs[i].className} / .${blocs[j].className}`);
  }
  const imgs = [...ec.querySelectorAll("img")].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.getAttribute("src"));
  if (imgs.length) res.push("image absente : " + imgs.join(", "));
  return { id: ec.id, titre: ec.dataset.titre, res, min, minTxt };
});

for (let k = 1; k <= n; k++) {
  await p.goto(URL_ + "#" + k); await p.reload(); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(450);
  const m = await mesure();
  const seuil = SEUIL[m.id] ?? 48;
  console.log(`étape ${k} (${m.id}) : plus petit texte ${m.min}px « ${m.minTxt} »${m.min < seuil ? "  < seuil " + seuil : ""}`);
  m.res.forEach((s) => ko(`étape ${k} : ${s}`)); if (m.min < seuil) ko(`étape ${k} : texte de ${m.min}px`);
  await p.screenshot({ path: path.join(APE, `etape_${String(k).padStart(2, "0")}_${m.id}.png`) });
}
const idx = (id) => p.evaluate((id) => [...document.querySelectorAll("#points button")].findIndex((b) => b.title.startsWith(document.getElementById(id).dataset.titre)) + 1, id);

// Minuteur automatique (questions) et relais de la partie A, horloge simulée
await p.addInitScript(() => { const vrai = Date.now; window.__d = 0; Date.now = () => vrai() + window.__d; });
const iQ = await idx("questions"), iA = await idx("partieA");
await p.goto(URL_ + "#" + iQ); await p.reload(); await p.waitForTimeout(600);
const auto = await p.evaluate(() => document.querySelector("#questions .js-etat").textContent);
console.log("arrivée sur le jeu des questions :", auto); if (!/En cours/.test(auto)) ko("minuteur non lancé automatiquement");
await p.keyboard.press("Enter"); await p.waitForTimeout(300);
const pause = await p.evaluate(() => document.querySelector("#questions .js-etat").textContent); if (pause !== "En pause") ko("Entrée ne met pas en pause : " + pause);
await p.goto(URL_ + "#" + iA); await p.waitForTimeout(400);
await p.evaluate(() => { window.__d = 601000; }); await p.waitForTimeout(500);
const rA = await p.evaluate(() => ({ c: document.querySelector("#partieA .js-chiffres").textContent, relais: !document.querySelector("#partieA .js-relais").hidden, h: document.getElementById("horloge").textContent }));
console.log("partie A après 10 min :", JSON.stringify(rA)); if (!rA.relais) ko("relais de la partie A absent");
await p.screenshot({ path: path.join(APE, "partieA_relais.png") });
await p.evaluate(() => { window.__d = 1201000; }); await p.waitForTimeout(500);
const finA = await p.evaluate(() => document.querySelector("#partieA .js-etat").textContent); if (!/écoulé/.test(finA)) ko("fin de la partie A : " + finA);

// Notes du professeur
await p.keyboard.press("n"); await p.waitForTimeout(200);
const nt = await p.evaluate(() => { const e = document.querySelector(".note-e.on"); return e ? e.textContent : ""; });
console.log("notes :", nt.replace(/\s+/g, " ")); if (!/Partie A/.test(nt) || !/20 minutes/.test(nt)) ko("notes de la partie A incorrectes");
await p.screenshot({ path: path.join(APE, "notes_partieA.png") }); await p.keyboard.press("n");

// Saisie des questions → bilan ; une touche tapée dans un champ ne change pas d'écran
const iV = await idx("vosquestions"), iB = await idx("bilan");
await p.goto(URL_ + "#" + iV); await p.waitForTimeout(400);
await p.fill("#vosquestions .js-classe", "4Z-test"); await p.press("#vosquestions .js-classe", "Tab");
const qs = [[1, "En quoi sont faites les turbines ?"], [1, "Est-ce la même matière ?"], [2, "Pourquoi B tourne et pas A ?"], [3, "Avec quelle machine ?"], [4, "Ça coûte combien ?"]];
for (const [z, t] of qs) { const s = `#vosquestions .col[data-z="${z}"] .js-ajout`; await p.fill(s, t); await p.press(s, "Enter"); }
await p.press(`#vosquestions .col[data-z="2"] .js-ajout`, " ");
const reste = await p.evaluate(() => location.hash); if (reste !== "#" + iV) ko("espace dans un champ a changé d'écran");
const nb = await p.evaluate(() => document.querySelectorAll("#vosquestions .js-liste li").length); if (nb !== 5) ko("questions saisies : " + nb);
await p.screenshot({ path: path.join(APE, "vosquestions_saisie.png") });
await p.click("#vosquestions .js-copier"); await p.waitForTimeout(200);
const presse = await p.evaluate(() => navigator.clipboard.readText().catch(() => "")); console.log("relevé copié :", presse.split("\n").slice(0, 4).join(" | "));
if (!presse.includes("4Z-test") || !presse.includes("Pourquoi B tourne")) ko("relevé copié incomplet");
await p.goto(URL_ + "#" + iB); await p.waitForTimeout(400);
await p.click(`#bilan .col[data-z="1"] li >> nth=0`); await p.click(`#bilan .col[data-z="2"] li >> nth=0`);
const cpt = await p.evaluate(() => document.querySelector("#bilan .js-compte").textContent); console.log("bilan :", cpt); if (cpt !== "2 / 5 ont une réponse") ko("compte du bilan : " + cpt);
await p.screenshot({ path: path.join(APE, "bilan.png") });
// Nouvel onglet : aucune classe reprise (pas de questions d'un autre groupe affichées)
const p2 = await ctx.newPage(); await p2.goto(URL_ + "#" + iB); await p2.waitForTimeout(400);
const vide = await p2.evaluate(() => document.querySelectorAll("#bilan .js-liste li").length); if (vide !== 0) ko("nouvel onglet : questions d'une classe reprises");
await p2.close();
// nettoyage de la classe de test
p.once("dialog", (d) => d.accept()); await p.goto(URL_ + "#" + iV); await p.waitForTimeout(300); await p.click("#vosquestions .js-effacer"); await p.waitForTimeout(200);

// Réduction à 50 %
const p3 = await nav.newPage({ viewport: { width: 800, height: 450 } });
for (const id of ["lettre1", "questions", "partieA", "bilan"]) {
  const k = await p3.goto(URL_ + "#1").then(() => p3.evaluate((id) => [...document.querySelectorAll("#points button")].findIndex((b) => b.title.startsWith(document.getElementById(id).dataset.titre)) + 1, id));
  await p3.goto(URL_ + "#" + k); await p3.reload(); await p3.evaluate(() => document.fonts.ready); await p3.waitForTimeout(400);
  await p3.screenshot({ path: path.join(APE, `reduit50_${id}.png`) });
}
await nav.close();
const ext = requetes.filter((u) => !u.startsWith("file:") && !u.startsWith("data:"));
if (ext.length) ko("requêtes externes : " + [...new Set(ext)].join(", "));
erreurs.forEach((e) => ko("console : " + e));
console.log(alertes ? `${alertes} alerte(s)` : "aucune alerte");
