// Banc d'essai de declencheur.html (Chrome sans interface, Playwright de video-technologie).
// Pour chaque étape : erreurs console, débordements dans la scène, plus petit texte du contenu, capture.
// Puis : clavier (espace, flèches, deux appuis rapides), minuteur accéléré, FALC, audio, réduction à 50 %.
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";
const require = createRequire(`${process.env.USERPROFILE}/Documents/video-technologie/package.json`);
const { chromium } = require("playwright");
import { lancerChrome, testerClip } from "./tester_clip_commun.mjs";
const ici = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const page_ = pathToFileURL(path.resolve(ici, "..", "..", "declencheur.html")).href;
const APE = path.join(ici, "apercus", "declencheur"); fs.mkdirSync(APE, { recursive: true });

const nav = await chromium.launch();
let alertes = 0; const ko = (s) => { alertes++; console.log("ALERTE", s); };
const p = await nav.newPage({ viewport: { width: 1600, height: 900 } });
const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message)); p.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
p.on("requestfailed", (r) => { if (!/\.(mp4|wav)$/.test(r.url())) erreurs.push("requête échouée " + r.url()); });   // mp4 : le Chromium de Playwright ne lit pas le H.264 (essai du clip dans Chrome, plus bas)
const requetes = []; p.on("request", (r) => requetes.push(r.url()));
await p.goto(page_ + "#1"); await p.evaluate(() => document.fonts.ready);
const n = await p.evaluate(() => document.querySelectorAll("#points button").length);

const mesure = () => p.evaluate(() => {
  const ec = document.querySelector(".ecran.on"), r0 = ec.getBoundingClientRect(), res = [];
  let min = 999, minTxt = "";
  ec.querySelectorAll("*").forEach((el) => {
    if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") return;
    const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden" || el.closest("[hidden]")) return;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    if (r.bottom > r0.bottom + 1 || r.right > r0.right + 1 || r.left < r0.left - 1) res.push(`déborde de l'écran : <${el.tagName.toLowerCase()} ${el.className.baseVal ?? el.className}> « ${(el.textContent || "").trim().slice(0, 30)} »`);
    if (!el.closest("button,a.bt-grand,video") && [...el.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim())) {
      const f = parseFloat(cs.fontSize); if (f < min) { min = f; minTxt = el.textContent.trim().slice(0, 30); }
    }
  });
  // Chaque bloc garde son contenu à l'intérieur (débordement dans un cadre, chevauchement d'un voisin)
  ec.querySelectorAll(".lettre,.minuteur,.etiq,.pb,.consigne.on,.regles,.zones-vides,.duo,.deux").forEach((c) => {
    if (getComputedStyle(c).display === "none") return;
    const rc = c.getBoundingClientRect();
    c.querySelectorAll("*").forEach((el) => {
      if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") return;
      if (el.closest("[hidden]") || getComputedStyle(el).display === "none") return;
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
      if (r.bottom > rc.bottom + 1 || r.right > rc.right + 1 || r.top < rc.top - 1 || r.left < rc.left - 1)
        res.push(`sort de .${c.className.split(" ")[0]} : « ${(el.textContent || el.tagName).trim().slice(0, 30)} »`);
    });
  });
  // Blocs frères qui se chevauchent
  const blocs = [...ec.children].filter((x) => getComputedStyle(x).display !== "none");
  for (let i = 0; i < blocs.length; i++) for (let j = i + 1; j < blocs.length; j++) {
    const a = blocs[i].getBoundingClientRect(), b = blocs[j].getBoundingClientRect();
    if (a.width && b.width && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1)
      res.push(`chevauchement : .${blocs[i].className} / .${blocs[j].className}`);
  }
  return { titre: ec.dataset.titre, res, min, minTxt, hash: location.hash };
});

for (let k = 1; k <= n; k++) {
  await p.goto(page_ + "#" + k); await p.reload(); await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(450);
  const m = await mesure();
  console.log(`étape ${k} (${m.titre}) : plus petit texte du contenu ${m.min}px « ${m.minTxt} »`);
  m.res.forEach(ko); if (m.min < 48) ko(`étape ${k} : texte de ${m.min}px`);
  await p.screenshot({ path: path.join(APE, `etape_${String(k).padStart(2, "0")}.png`) });
}
// FALC sur la lettre
await p.goto(page_ + "#1"); await p.reload(); await p.waitForTimeout(400);
await p.keyboard.press("l"); await p.waitForTimeout(300);
for (const k of [1, 2, 3]) { await p.goto(page_ + "#" + k); await p.waitForTimeout(350); const mf = await mesure(); mf.res.forEach((s) => ko("FALC " + k + " : " + s)); console.log(`FALC écran ${k} : plus petit texte ${mf.min}px`); await p.screenshot({ path: path.join(APE, `lettre_falc_${k}.png`) }); } await p.goto(page_ + "#1"); await p.waitForTimeout(300);
await p.keyboard.press("l");
// Audio : la source répond et lit
await p.keyboard.press("a"); await p.waitForTimeout(800);
const au = await p.evaluate(() => { const a = document.getElementById("audio"); return { t: a.currentTime, err: a.error && a.error.code, dur: a.duration, bouton: document.querySelector(".js-audio-txt").textContent }; });
console.log("audio :", JSON.stringify(au)); if (au.err || !(au.dur > 30)) ko("audio non lu");
await p.keyboard.press("a");
// Clavier : espace ×3 rapides depuis #1 → #4 ; flèche gauche → #3
await p.keyboard.press(" "); await p.keyboard.press(" "); await p.keyboard.press(" ");
let h = await p.evaluate(() => location.hash); console.log("après 3 espaces rapides :", h); if (h !== "#4") ko("navigation espace");
await p.keyboard.press("ArrowLeft"); h = await p.evaluate(() => location.hash); if (h !== "#3") ko("flèche gauche");
// Minuteur : aller aux questions, lancer, avancer l'horloge de 95 s (relais), puis 181 s (fin)
const iQ = await p.evaluate(() => { const b = [...document.querySelectorAll("#points button")]; return b.findIndex((x) => x.title.startsWith("Le jeu")) + 1; });
await p.goto(page_ + "#" + iQ); await p.reload(); await p.waitForTimeout(300);
await p.evaluate(() => { const vrai = Date.now; window.__d = 0; Date.now = () => vrai() + window.__d; });
await p.keyboard.press("Enter"); await p.waitForTimeout(400);
await p.evaluate(() => { window.__d = 95000; }); await p.waitForTimeout(500);
const relais = await p.evaluate(() => ({ chiffres: document.querySelector("#questions .js-chiffres").textContent, relais: !document.querySelector("#questions .js-relais").hidden }));
console.log("à 1:35 écoulées :", JSON.stringify(relais)); if (!relais.relais) ko("bandeau « Changez de rôle » absent");
await p.screenshot({ path: path.join(APE, "minuteur_relais.png") });
await p.evaluate(() => { window.__d = 181000; }); await p.waitForTimeout(500);
const fin = await p.evaluate(() => ({ chiffres: document.querySelector("#questions .js-chiffres").textContent, etat: document.querySelector("#questions .js-etat").textContent }));
console.log("à 3:01 :", JSON.stringify(fin)); if (fin.chiffres !== "0:00" || !/écoulé/.test(fin.etat)) ko("fin du minuteur");
await p.screenshot({ path: path.join(APE, "minuteur_fini.png") });
await p.keyboard.press("r"); const raz = await p.evaluate(() => document.querySelector("#questions .js-chiffres").textContent); if (raz !== "3:00") ko("remise à zéro");
// Réduction à 50 % : fenêtre 800 × 450 → plus petit texte réel du contenu
const p2 = await nav.newPage({ viewport: { width: 800, height: 450 } });
for (const k of [1, 2, iQ, n]) {
  await p2.goto(page_ + "#" + k); await p2.evaluate(() => document.fonts.ready); await p2.waitForTimeout(400);
  await p2.screenshot({ path: path.join(APE, `reduit50_etape_${k}.png`) });
}
const echelle = await p2.evaluate(() => document.getElementById("scene").getBoundingClientRect().width / 1600);
console.log(`50 % : échelle ${echelle.toFixed(2)} → texte du contenu ≥ ${(48 * echelle).toFixed(0)} px à l'écran`);
await nav.close();
// Clip (écran « Le clip ») et page autonome medias/clip_A8.html, dans Chrome (H.264)
const chrome = await lancerChrome(chromium);
await testerClip(chrome, page_ + "#1", "video", ko, APE, "declencheur");
await testerClip(chrome, pathToFileURL(path.join(ici, "medias", "clip_A8.html")).href, null, ko, APE, "page_autonome");
await chrome.close();
const ext = requetes.filter((u) => !u.startsWith("file:") && !u.startsWith("data:"));
if (ext.length) ko("requêtes externes : " + ext.join(", "));
erreurs.forEach((e) => ko("console : " + e));
console.log(alertes ? `${alertes} alerte(s)` : "aucune alerte");
