// Lot 2 du kit déclencheur A8 : génère les supports papier (HTML → PDF A4 via Chrome sans interface) et leurs aperçus PNG.
// Usage : node outils/generer_papier.mjs   (Playwright est pris dans Documents/video-technologie)
// Contrôles automatiques : rien ne sort de la zone imprimable (6 mm), aucun contenu ne déborde de son cadre.
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { picto, ZONES, bandeMotif } from "./pictos.mjs";
const require = createRequire(`${process.env.USERPROFILE}/Documents/video-technologie/package.json`);
const { chromium } = require("playwright");

const ici = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(ici, "sources"), APE = path.join(ici, "apercus");
fs.mkdirSync(SRC, { recursive: true }); fs.mkdirSync(APE, { recursive: true });

const NAVY = "#1F3864", BLEU = "#2E75B6", GRIS = "#4d5562";
const SIG = "R.Blanchard, professeur de Technologie";

const CSS = (W, H) => `
@font-face{font-family:Luciole;src:url(../fonts/Luciole-Regular.woff2) format("woff2");font-weight:400}
@font-face{font-family:Luciole;src:url(../fonts/Luciole-Bold.woff2) format("woff2");font-weight:700}
@page{size:${W}mm ${H}mm;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff}
body{font-family:Luciole,Arial,sans-serif;color:#14213d;line-height:1.35;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.feuille{width:${W}mm;height:${H}mm;position:relative;overflow:hidden;page-break-after:always;break-after:page}
.feuille:last-child{page-break-after:auto;break-after:auto}
.sig{font-size:7pt;color:${GRIS};letter-spacing:.01em}
.picto{flex:none;display:block}
svg.bande{display:block;width:100%;height:100%}
.trait{position:absolute;background:#9aa3ad}
.coupe-h{position:absolute;height:0;border-top:.25mm dashed #9aa3ad}
.coupe-v{position:absolute;width:0;border-left:.25mm dashed #9aa3ad}
.ciseaux{position:absolute;font-size:8pt;color:${GRIS}}
`;
// Typographie française : espace insécable avant ? ! : ; » et après « (le « ? » ne part jamais seul à la ligne).
export const insec = (s) => s.replace(/ ([?!:;»])/g, " $1").replace(/« /g, "« ");
const page = (titre, W, H, css, corps) =>
  `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${titre}</title><style>${CSS(W, H)}${css}</style></head><body>${insec(corps)}</body></html>`;

// Repères de coupe (traits fins dans la marge, entre 4 et 8,5 mm du bord) pour une grille de cartes jointives.
function reperes(W, H, xs, ys) {
  let s = "";
  for (const y of ys) {
    s += `<div class="trait" style="left:4mm;top:${y - 0.1}mm;width:4.5mm;height:.2mm"></div>`;
    s += `<div class="trait" style="left:${W - 8.5}mm;top:${y - 0.1}mm;width:4.5mm;height:.2mm"></div>`;
  }
  for (const x of xs) {
    s += `<div class="trait" style="top:4mm;left:${x - 0.1}mm;height:4.5mm;width:.2mm"></div>`;
    s += `<div class="trait" style="top:${H - 8.5}mm;left:${x - 0.1}mm;height:4.5mm;width:.2mm"></div>`;
  }
  return s;
}

// =====================================================================
// 4. Lettre du fabricant + version FALC
// =====================================================================
const LOGO = (mm) => `<svg viewBox="0 0 120 120" style="width:${mm}mm;height:${mm}mm" aria-hidden="true">
  <circle cx="60" cy="60" r="56" fill="${NAVY}"/>
  <path d="M60 18C46 42 36 56 36 70a24 24 0 0 0 48 0c0-14-10-28-24-52z" fill="#fff"/>
  <path d="M42 78q9-8 18 0t18 0" stroke="${BLEU}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M46 92q7-6 14 0t14 0" stroke="${BLEU}" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;

import { LETTRE, FALC, PROBLEMATIQUE } from "./texte_lettre.mjs";
const lettreHTML = page("Lettre du fabricant", 210, 297, `
.entete{position:absolute;left:20mm;top:16mm;right:20mm;display:flex;align-items:center;gap:5mm;border-bottom:.6mm solid ${NAVY};padding-bottom:5mm}
.nom{font-size:24pt;font-weight:700;color:${NAVY};letter-spacing:.12em}
.slogan{font-size:11pt;color:${GRIS}}
.dest{position:absolute;right:20mm;top:52mm;text-align:right;font-size:12pt}
.corps{position:absolute;left:24mm;right:24mm;top:72mm;font-size:15pt;line-height:1.6}
.corps p{margin:0 0 5mm}
.signe{margin-top:9mm;font-weight:700;color:${NAVY}}
.pied{position:absolute;left:20mm;right:20mm;bottom:12mm;display:flex;justify-content:space-between;border-top:.3mm solid #c9d3df;padding-top:2.5mm;font-size:8pt;color:${GRIS}}
`, `<div class="feuille">
  <div class="entete">${LOGO(24)}<div><div class="nom">FONTELAME</div><div class="slogan">Robinets sans contact · bureau d'études</div></div></div>
  <div class="dest">À la classe de 4ᵉ<br>Technologie</div>
  <div class="corps"><p>${LETTRE.appel}</p>${LETTRE.corps.map((p) => `<p>${p}</p>`).join("")}<p>${LETTRE.fin}</p><div class="signe">${LETTRE.signe}</div></div>
  <div class="pied"><span>Fontelame est une entreprise imaginaire, inventée pour la classe.</span><span>${SIG}</span></div>
</div>`);

const falcHTML = page("Lettre du fabricant — facile à lire", 210, 297, `
.entete{position:absolute;left:18mm;top:14mm;right:18mm;display:flex;align-items:center;gap:5mm;border-bottom:.6mm solid ${NAVY};padding-bottom:4mm}
.nom{font-size:22pt;font-weight:700;color:${NAVY};letter-spacing:.12em}
.slogan{font-size:12pt;color:${GRIS}}
.lignes{position:absolute;left:18mm;right:18mm;top:48mm;display:grid;gap:5mm}
.ligne{display:flex;align-items:center;gap:8mm;border:.4mm solid #c9d3df;border-radius:4mm;padding:3mm 6mm;min-height:33mm}
.ligne p{margin:0;font-size:21pt;line-height:1.3;font-weight:700;color:${NAVY}}
.num{font-size:13pt;color:${GRIS};font-weight:700;width:7mm}
.pied{position:absolute;left:18mm;right:18mm;bottom:12mm;display:flex;justify-content:space-between;font-size:8pt;color:${GRIS}}
`, `<div class="feuille">
  <div class="entete">${LOGO(20)}<div><div class="nom">FONTELAME</div><div class="slogan">Une lettre pour la classe · facile à lire</div></div></div>
  <div class="lignes">${FALC.map(([pi, t], i) => `<div class="ligne"><span class="num">${i + 1}</span>${picto(pi, 24, 3.4, NAVY)}<p>${t}</p></div>`).join("")}</div>
  <div class="pied"><span>Fontelame est une entreprise imaginaire, inventée pour la classe.</span><span>${SIG}</span></div>
</div>`);

// =====================================================================
// 5. Cartes d'amorce (8 par A4) et version adaptée (4 par A4)
// =====================================================================
export const AMORCES = [
  { a: "Pourquoi… ?", p: "question", o: "casque", ex: "Pourquoi le casque a-t-il des trous ?" },
  { a: "Quel… ?", p: "loupe", o: "velo", ex: "Quel est le rôle de la sonnette du vélo ?" },
  { a: "Comment… ?", p: "etapes", o: "gourde", ex: "Comment le bouchon de la gourde reste-t-il fermé ?" },
  { a: "Combien… ?", p: "barres", o: "velo", ex: "Combien de vitesses a ce vélo ?" },
  { a: "Et si… ?", p: "ampoule", o: "velo", ex: "Et si le vélo n'avait pas de chaîne ?" },
  { a: "Qu'est-ce qui… ?", p: "dominos", o: "casque", ex: "Qu'est-ce qui fait tenir le casque sur la tête ?" },
  { a: "D'où… ?", p: "origine", o: "velo", ex: "D'où vient le bruit du vélo quand il freine ?" },
  { a: "Est-ce que… ?", p: "ouinon", o: "gourde", ex: "Est-ce que la gourde existe en plus petit ?" },
];
const OBJ = { velo: "le vélo", gourde: "la gourde", casque: "le casque" };
const cartesCSS = `
.carte{position:absolute;width:95mm;height:69mm;border:.25mm dashed #b3bcc6;padding:5mm 6mm 4mm;display:flex;flex-direction:column}
.haut{display:flex;align-items:center;gap:4mm}
.amorce{font-size:23pt;font-weight:700;color:${NAVY};line-height:1.1}
.ex{margin-top:auto;display:flex;gap:3mm;align-items:flex-start;background:#eef3f9;border-radius:3mm;padding:2.5mm 3.5mm}
.ex .t{font-size:11.5pt;line-height:1.3}
.ex .l{font-size:9pt;color:${GRIS};font-weight:700;display:block;margin-bottom:.6mm}
.carte .sig{position:absolute;right:5mm;bottom:1.2mm;font-size:6pt}
.consigne{position:absolute;left:10mm;right:10mm;top:${297 - 9.5}mm;text-align:center;font-size:7.5pt;color:${GRIS}}
`;
const xsC = [10, 105, 200], ysC = [10.5, 79.5, 148.5, 217.5, 286.5];
const cartesHTML = page("Cartes d'amorce", 210, 297, cartesCSS, `<div class="feuille">
${AMORCES.map((c, i) => `<div class="carte" style="left:${xsC[i % 2]}mm;top:${ysC[Math.floor(i / 2)]}mm">
  <div class="haut">${picto(c.p, 16, 3.8, NAVY)}<div class="amorce">${c.a}</div></div>
  <div class="ex">${picto(c.o, 10, 3.8, GRIS)}<div class="t"><span class="l">Exemple, sur ${OBJ[c.o]} :</span>${c.ex}</div></div>
  <span class="sig">${SIG}</span></div>`).join("")}
${reperes(210, 297, xsC, ysC)}
</div>`);

const ADAPT = AMORCES.slice(0, 4);
const xsA = [10, 105, 200], ysA = [10, 148.5, 287];
const adaptHTML = page("Cartes d'amorce — version adaptée", 210, 297, `
.carte{position:absolute;width:95mm;height:138.5mm;border:.25mm dashed #b3bcc6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9mm;padding:0 6mm}
.amorce{font-size:34pt;font-weight:700;color:${NAVY};white-space:nowrap}
.carte .sig{position:absolute;right:5mm;bottom:2mm}
`, `<div class="feuille">
${ADAPT.map((c, i) => `<div class="carte" style="left:${xsA[i % 2]}mm;top:${ysA[Math.floor(i / 2)]}mm">
  ${picto(c.p, 50, 3.4, NAVY)}<div class="amorce">${c.a}</div><span class="sig">${SIG}</span></div>`).join("")}
${reperes(210, 297, xsA, ysA)}
</div>`);

// =====================================================================
// 6. Étiquettes du tableau (A4 paysage) + bande de la problématique
// =====================================================================
const etiqCSS = `
.cadre{position:absolute;left:10mm;right:10mm;top:10mm;bottom:10mm;border:1.2mm solid var(--c);border-radius:5mm;overflow:hidden;display:flex;flex-direction:column}
.bh{height:30mm;flex:none}
.bb{height:14mm;flex:none}
.milieu{flex:1;display:flex;align-items:center;gap:12mm;padding:0 14mm}
.q{font-size:64pt;font-weight:700;line-height:1.08;color:${NAVY}}
.motif{position:absolute;left:14mm;top:13mm;background:#fff;border-radius:2.5mm;padding:1.2mm 4mm;font-size:12pt;font-weight:700;color:${NAVY}}
.feuille .sig{position:absolute;right:14mm;bottom:6.5mm}
.pb .cadre{border-color:${NAVY}}
.pb .titre{font-size:20pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#cfe0f3}
.pb .bh{background:${NAVY};display:flex;align-items:center;padding:0 14mm;height:26mm}
.pb .txt{font-size:42pt;font-weight:700;line-height:1.2;color:${NAVY};padding:0 14mm}
.pb .milieu{display:block;padding-top:16mm}
.pb .sous{font-size:15pt;color:${GRIS};padding:6mm 14mm 0}
`;
const etiqHTML = page("Étiquettes du tableau", 297, 210, etiqCSS,
  ZONES.map((z) => `<div class="feuille" style="--c:${z.c}">
  <div class="cadre"><div class="bh">${bandeMotif(z, "mh" + z.n, "", 2.2)}</div>
    <div class="milieu">${picto(z.picto, 72, 3.4, NAVY)}<div class="q">${z.q}</div></div>
    <div class="bb">${bandeMotif(z, "mb" + z.n, "", 2.2)}</div></div>
  <span class="motif">${z.nomMotif}</span>
  <span class="sig">${SIG}</span></div>`).join("") +
  `<div class="feuille pb"><div class="cadre"><div class="bh"><span class="titre">Notre problématique</span></div>
    <div class="milieu"><div class="txt">${PROBLEMATIQUE}</div><div class="sous">Elle rassemble les questions de la classe.</div></div></div>
  <span class="sig">${SIG}</span></div>`);

// Mini-plateau A5 (version adaptée) : 2 plateaux par feuille A4, à couper au milieu.
const plateau = (k) => `<div class="plat" style="top:${k * 148.5}mm">
  <div class="tete">${picto("postit", 11, 3.6, NAVY)}<p>Posez ensemble les questions qui se ressemblent.<br><span>Une case par groupe. On peut empiler les post-its.</span></p></div>
  <div class="cases">${ZONES.map((z) => `<div class="case" style="--c:${z.c}"><div class="bord">${bandeMotif(z, `p${k}${z.n}`, "", 1.4)}</div><div class="int"><span class="n">${z.n}</span><span class="m">${z.nomMotif}</span></div></div>`).join("")}</div>
  <span class="sig">${SIG}</span></div>`;
const plateauHTML = page("Mini-plateau A5", 210, 297, `
.plat{position:absolute;left:0;width:210mm;height:148.5mm;padding:9mm 10mm 8mm}
.tete{display:flex;align-items:center;gap:4mm;height:16mm}
.tete p{margin:0;font-size:14pt;font-weight:700;color:${NAVY};line-height:1.25}
.tete span{font-size:10.5pt;font-weight:400;color:${GRIS}}
.cases{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:4mm;height:110mm;margin-top:2mm}
.case{position:relative;border-radius:4mm;overflow:hidden}
.bord{position:absolute;inset:0}
.int{position:absolute;inset:5mm;background:#fff;border-radius:2mm}
.n{position:absolute;left:3mm;top:1.5mm;font-size:16pt;font-weight:700;color:${NAVY}}
.m{position:absolute;right:3mm;bottom:1.5mm;font-size:9pt;color:${GRIS}}
.plat .sig{position:absolute;right:10mm;bottom:6.5mm}
`, `<div class="feuille">${plateau(0)}${plateau(1)}
<div class="coupe-h" style="left:4mm;right:4mm;top:148.5mm"></div><span class="ciseaux" style="left:7mm;top:145mm">couper ✂</span></div>`);

// =====================================================================
// 7. Cartes de relance du professeur + étiquette du sachet
// =====================================================================
export const RELANCES = [
  { t: "D'où vient la matière ?", p: "origine", z: 4 },
  { t: "Qu'a-t-il fallu pour la transformer ?", p: "flamme", z: 4 },
  { t: "Et pour en fabriquer 10 000 ?", p: "usine", z: 3 },
  { t: "Et pour en fabriquer une seule, ici, au collège ?", p: "ecole", z: 3 },
];
const relance = (r, k) => {
  const z = ZONES[r.z - 1];
  return `<div class="rel" style="top:${k * 148.5}mm">
  <div class="cadre">${picto(r.p, 46, 3.4, NAVY)}<div class="t">${r.t}</div></div>
  <div class="aide"><span class="pastille">${bandeMotif(z, `r${r.z}${k}${r.p}`, "", 1)}</span>Relance du professeur si la zone « ${z.q} » (${z.nomMotif}) reste vide</div>
  <span class="sig">${SIG}</span></div>`;
};
const SACHET = [
  { t: "Roche du <span style=\"white-space:nowrap\">sous-sol</span>", img: true },
  { t: "Pétrole ou plante", p: "petrole_plante" },
  { t: "Matière prête à mettre en forme", p: "granules" },
];
const relanceHTML = page("Cartes de relance et étiquette du sachet", 210, 297, `
.rel{position:absolute;left:0;width:210mm;height:148.5mm;padding:12mm 14mm}
.rel .cadre{height:108mm;border:1mm solid ${NAVY};border-radius:5mm;display:flex;align-items:center;gap:10mm;padding:0 12mm}
.rel .t{font-size:32pt;font-weight:700;line-height:1.15;color:${NAVY}}
.aide{display:flex;align-items:center;gap:3mm;margin-top:3.5mm;font-size:10pt;color:${GRIS}}
.pastille{width:14mm;height:6mm;border-radius:1.5mm;overflow:hidden;flex:none}
.rel .sig{position:absolute;right:14mm;bottom:6.5mm}
@page paysage{size:297mm 210mm;margin:0}
.sach{page:paysage}
.s-titre{position:absolute;left:12mm;top:12mm;right:12mm;display:flex;align-items:center;gap:5mm;font-size:30pt;font-weight:700;color:${NAVY}}
.cols{position:absolute;left:12mm;right:12mm;top:42mm;bottom:20mm;display:grid;grid-template-columns:repeat(3,1fr)}
.col{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:6mm;padding:6mm 6mm 0;border:.8mm solid ${NAVY};border-radius:4mm;margin:0 3.5mm}
.vis{height:78mm;width:100%;display:flex;align-items:center;justify-content:center}
.photo{width:100%;height:78mm;object-fit:cover;object-position:46% 50%;border-radius:3mm}
.col .l{font-size:22pt;font-weight:700;text-align:center;line-height:1.2;color:${NAVY}}
.col .num{font-size:14pt;font-weight:700;color:${GRIS}}
.credit{position:absolute;left:15mm;bottom:9mm;font-size:7pt;color:${GRIS};max-width:150mm}
.sach .sig{position:absolute;right:14mm;bottom:9mm}
`, `<div class="feuille">${relance(RELANCES[0], 0)}${relance(RELANCES[1], 1)}<div class="coupe-h" style="left:4mm;right:4mm;top:148.5mm"></div></div>
<div class="feuille">${relance(RELANCES[2], 0)}${relance(RELANCES[3], 1)}<div class="coupe-h" style="left:4mm;right:4mm;top:148.5mm"></div></div>
<div class="feuille sach" style="width:297mm;height:210mm">
  <div class="s-titre">${picto("origine", 18, 3.6, NAVY)}D'où vient la matière ?</div>
  <div class="cols">${SACHET.map((s, i) => `<div class="col"><span class="num">${i + 1}</span><div class="vis">${s.img ? `<img class="photo" src="../medias/minerai.jpg" alt="Photo d'une roche extraite du sous-sol">` : picto(s.p, 66, 3, NAVY)}</div><div class="l">${s.t}</div></div>`).join("")}</div>
  <div class="credit">Photo n° 1 : Daderot, Natural History Museum (Londres), Wikimedia Commons, domaine public (CC0).</div>
  <span class="sig">${SIG}</span></div>`);

// =====================================================================
const DOCS = [
  { nom: "lettre_fabricant", html: lettreHTML, mm: [210, 297] },
  { nom: "lettre_fabricant_FALC", html: falcHTML, mm: [210, 297] },
  { nom: "cartes_amorce", html: cartesHTML, mm: [210, 297] },
  { nom: "cartes_amorce_adaptees", html: adaptHTML, mm: [210, 297] },
  { nom: "etiquettes_tableau", html: etiqHTML, mm: [297, 210] },
  { nom: "plateau_A5", html: plateauHTML, mm: [210, 297] },
  { nom: "cartes_relance", html: relanceHTML, mm: [210, 297] },
];

const PX = 96 / 25.4;
const nav = await chromium.launch();
let alertes = 0;
for (const D of DOCS) {
  const f = path.join(SRC, D.nom + ".html");
  fs.writeFileSync(f, D.html);
  const pg = await nav.newPage({ viewport: { width: Math.round(D.mm[0] * PX), height: Math.round(D.mm[1] * PX) }, deviceScaleFactor: 2 });
  await pg.goto(pathToFileURL(f).href);
  await pg.emulateMedia({ media: "print" });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(200);
  const rap = await pg.evaluate(() => {
    const mm = 96 / 25.4, res = [];
    document.querySelectorAll(".feuille").forEach((fe, k) => {
      const r0 = fe.getBoundingClientRect();
      fe.querySelectorAll("*").forEach((el) => {
        if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") return;
        if (el.classList.contains("trait")) return;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const m = Math.min(r.left - r0.left, r0.right - r.right, r.top - r0.top, r0.bottom - r.bottom) / mm;
        if (m < 6 && !el.matches(".coupe-h,.plat,.rel") && !el.classList.contains("coupe-v")) res.push(`feuille ${k + 1} : <${el.tagName.toLowerCase()} ${el.className.baseVal ?? el.className}> à ${m.toFixed(1)} mm du bord`);
        // débordement d'un texte hors de son parent direct
      });
      // cadres : un enfant ne doit pas dépasser du cadre .carte / .cadre / .ligne / .col / .case
      fe.querySelectorAll(".carte,.cadre,.ligne,.col,.case,.plat,.rel").forEach((c) => {
        const rc = c.getBoundingClientRect();
        c.querySelectorAll("*").forEach((e) => {
          if (e.closest("svg") && e.tagName.toLowerCase() !== "svg") return;
          const r = e.getBoundingClientRect();
          if (!r.width) return;
          if (r.right > rc.right + 1 || r.bottom > rc.bottom + 1 || r.left < rc.left - 1 || r.top < rc.top - 1)
            res.push(`feuille ${k + 1} : « ${(e.textContent || e.tagName).trim().slice(0, 30)} » dépasse de son cadre`);
        });
      });
      let min = 99;
      fe.querySelectorAll("*").forEach((el) => {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
        if (el.classList.contains("sig")) return;
        min = Math.min(min, parseFloat(getComputedStyle(el).fontSize) * 0.75);
      });
      res.push(`INFO feuille ${k + 1} : plus petit texte (hors signature) ${min.toFixed(1)} pt`);
    });
    return res;
  });
  for (const s of rap) { console.log(`[${D.nom}] ${s}`); if (!s.startsWith("INFO")) alertes++; }
  await pg.pdf({ path: path.join(ici, D.nom + ".pdf"), preferCSSPageSize: true, printBackground: true });
  const fs_ = await pg.locator(".feuille").all();
  for (let k = 0; k < fs_.length; k++) await fs_[k].screenshot({ path: path.join(APE, `${D.nom}_${k + 1}.png`) });
  await pg.close();
}
await nav.close();
console.log(alertes ? `${alertes} alerte(s)` : "aucune alerte");
