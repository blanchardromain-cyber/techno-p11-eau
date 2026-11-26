// Déroulé du professeur (2 pages A4) et grille de relevé des questions (7 classes), en PDF.
// Usage : node outils/generer_deroule.mjs
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { picto, ZONES, bandeMotif } from "./pictos.mjs";
import { PROBLEMATIQUE } from "./texte_lettre.mjs";
import { CONDUITE, ANTICIPATION, IMPREVUS } from "./conduite.mjs";
const require = createRequire(`${process.env.USERPROFILE}/Documents/video-technologie/package.json`);
const { chromium } = require("playwright");
const ici = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.join(ici, "sources"), APE = path.join(ici, "apercus");
const NAVY = "#1F3864", GRIS = "#4d5562", SIG = "R.Blanchard, professeur de Technologie";
// Mots composés et nombres jamais coupés en fin de ligne
const sansCoupe = (s) => s.replace(/(\S+-\S+)/g, '<span style="white-space:nowrap">$1</span>');
const nombres = (s) => s.replace(/(\d) (\d{3})/g, "$1 $2");
const insec = (s) => s.replace(/ ([?!:;»])/g, " $1").replace(/« /g, "« ");

const CSS = (W, H) => `
@font-face{font-family:Luciole;src:url(../fonts/Luciole-Regular.woff2) format("woff2");font-weight:400}
@font-face{font-family:Luciole;src:url(../fonts/Luciole-Bold.woff2) format("woff2");font-weight:700}
@page{size:${W}mm ${H}mm;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:#fff}
body{font-family:Luciole,Arial,sans-serif;color:#14213d;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.feuille{width:${W}mm;height:${H}mm;position:relative;overflow:hidden;padding:9mm 10mm 11mm;page-break-after:always;break-after:page}
.feuille:last-child{page-break-after:auto;break-after:auto}
.pied{position:absolute;left:10mm;right:10mm;bottom:5.5mm;display:flex;justify-content:space-between;font-size:7pt;color:${GRIS}}
h1{font-size:14pt;margin:0 0 1mm;color:${NAVY}}
h2{font-size:10.5pt;margin:2.6mm 0 1.2mm;color:${NAVY};display:flex;align-items:center;gap:2mm}
.sous{font-size:8.6pt;color:${GRIS};margin:0 0 1.5mm}
p,li{font-size:8.6pt;line-height:1.32;margin:0}
ul{margin:0;padding-left:4mm}
table{border-collapse:collapse;width:100%}
th,td{border:.25mm solid #b8c3d1;padding:1.1mm 1.6mm;font-size:8.3pt;line-height:1.28;vertical-align:top;text-align:left}
th{background:${NAVY};color:#fff;font-size:8.3pt}
td.t{white-space:nowrap;font-weight:700;color:${NAVY}}
q{quotes:"« " " »";font-style:italic;color:#0d2b5e}
.cadre{border:.5mm solid ${NAVY};border-radius:2mm;padding:1.8mm 2.5mm}
.vig{border:.6mm solid #8a1c1c;background:#fdf3f3;border-radius:2mm;padding:1.6mm 2.5mm}
.vig h2{color:#8a1c1c;margin-top:0}
.deuxcol{display:grid;grid-template-columns:1fr 1fr;gap:3mm}
.zone{display:flex;align-items:center;gap:1.5mm;font-weight:700}
.pastille{width:9mm;height:4mm;border-radius:1mm;overflow:hidden;flex:none;display:inline-block}
.pastille svg{display:block;width:100%;height:100%}
.case{display:inline-block;width:3mm;height:3mm;border:.3mm solid #333;margin-right:1mm;vertical-align:-.4mm}
`;
const page = (t, W, H, css, corps) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${t}</title><style>${CSS(W, H)}${css}</style></head><body>${nombres(insec(corps))}</body></html>`;
const pastille = (z, id) => `<span class="pastille">${bandeMotif(z, id)}</span>`;
const zl = (n, id) => { const z = ZONES[n - 1]; return `<span class="zone">${pastille(z, id)}<span>${n} · ${sansCoupe(z.q)}</span></span>`; };

// ------------------------------------------------------------------ Déroulé

const deroule = page("Déroulé professeur", 210, 297, `
.p1-entete{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:.6mm solid ${NAVY};padding-bottom:1.5mm;margin-bottom:2mm}
.duree{font-size:9pt;font-weight:700;color:#fff;background:${NAVY};border-radius:1.5mm;padding:1mm 2.5mm}
.materiel{display:grid;grid-template-columns:1fr 1fr;gap:0 5mm}
.pb{font-weight:700;color:${NAVY}}
`, `<div class="feuille">
  <div class="p1-entete"><div><h1>A8 · Situation déclenchante « Le choix de la matière »</h1>
    <p class="sous">P11 L'eau, ressource essentielle · 4ᵉ · conduite de la séance · document professeur</p></div><span class="duree">10 min au plus</span></div>
  <p><b>But :</b> les élèves ressentent le problème et posent eux-mêmes les questions de l'A8. La problématique n'arrive qu'à la fin, comme la traduction de leurs questions. Ensuite : clip de méthode → fiche repère → Matériauthèque en binôme.</p>
  <h2>${picto("postit", 5.5, 4, NAVY)}Matériel</h2>
  <div class="materiel"><ul>
    <li>Turbines <b>A</b> et <b>B</b>, chacune sur son axe ; support à main</li>
    <li>Point d'eau réglé (repère au ruban) ; torchon ; sèche-cheveux (plan B)</li>
    <li>Post-its grand format (76 × 76) de <b>2 couleurs</b> : couleur 1 = questions spontanées, couleur 2 = questions après une relance</li>
    <li>Feutres ; 9 aimants (4 étiquettes, problématique, réserve)</li></ul><ul>
    <li>15 jeux de cartes d'amorce ; 3 ou 4 jeux adaptés ; 4 plateaux A5</li>
    <li>Lettre (1 + 3 ou 4 « facile à lire ») ; audio dans la page</li>
    <li>Sachet « D'où vient la matière ? » (granulés, bobine de fil, étiquette) ; 4 cartes de relance</li>
    <li>Vidéoprojecteur : <code>declencheur.html</code></li></ul></div>
  <h2>${picto("barres", 5.5, 4, NAVY)}Conduite minute par minute</h2>
  <table><tr><th style="width:11mm">Temps</th><th style="width:13mm">Écran</th><th style="width:62mm">Ce que fait le professeur</th><th>Phrases exactes</th></tr>
  ${CONDUITE.map(({ t, ecran: e, fait: f, dit: d }) => `<tr><td class="t">${t}</td><td>${e}</td><td>${f}</td><td>${d}</td></tr>`).join("")}</table>
  <p class="sous" style="margin-top:1.5mm">Clavier : espace ou → = étape suivante · ← = retour · Entrée = lancer / mettre en pause le minuteur · R = remise à 3:00 · A = audio · L = facile à lire · F = plein écran. L'étape est dans l'adresse (<code>#1</code> à <code>#13</code>).</p>
  <h2>${picto("ampoule", 5.5, 4, NAVY)}Pour tous, au choix (CUA)</h2>
  <ul><li>La lettre existe écrite, lue par le professeur, en audio et en version facile à lire. Le phénomène se voit, se touche (turbines en main) et s'entend (l'eau).</li>
  <li>Une question peut s'écrire, se dire à son binôme qui l'écrit, ou se dessiner. Rôles : pilote (écrit) et copilote (propose), inversés à 1 min 30.</li>
  <li>Cartes et plateau adaptés proposés à qui veut, sans désigner personne.</li></ul>
  <div class="pied"><span>Fontelame est une entreprise imaginaire.</span><span>${SIG} · 1/2</span></div>
</div>
<div class="feuille">
  <h2 style="margin-top:0">${picto("question", 5.5, 4, NAVY)}Tableau d'anticipation : questions probables et relance si la zone reste vide</h2>
  <table><tr><th style="width:44mm">Zone</th><th>Questions probables des élèves</th><th style="width:62mm">Relance si la zone reste vide</th></tr>
  ${ANTICIPATION.map(([n, qs, r]) => `<tr><td>${zl(n, "a" + n)}</td><td><ul>${qs.map((q) => `<li>${q}</li>`).join("")}</ul></td><td>${r}</td></tr>`).join("")}</table>
  <p class="sous" style="margin-top:1mm">Les questions des élèves peuvent citer un matériau ou dire « lourde » : ce sont leurs mots. Le professeur les accepte sans les confirmer ni les corriger.</p>
  <h2>${picto("dominos", 5.5, 4, NAVY)}Gestion des imprévus</h2>
  <table>${IMPREVUS.map(([s, r]) => `<tr><td style="width:44mm;font-weight:700;color:${NAVY}">${s}</td><td>${r}</td></tr>`).join("")}</table>
  <h2>${picto("echantillons", 5.5, 4, NAVY)}La problématique (dernier écran, bande aimantée)</h2>
  <p class="pb cadre">${PROBLEMATIQUE}</p>
  <h2>${picto("etapes", 5.5, 4, NAVY)}Diaporama de conduite (au choix, à la place de <code>declencheur.html</code>)</h2>
  <p><code>diaporama-a8.html</code> reprend les mêmes écrans et cette même conduite, puis enchaîne sur le lancement de l'A8 : capsule de méthode, fiche repère, partie A (20 min) et partie B (10 min) minutées, bilan. Notes du professeur à l'écran (touche N : heure prévue, gestes et phrases exactes de ce document) ; horloge de séance avec l'avance ou le retard ; minuteurs lancés automatiquement ; écran « Vos questions » pour saisir les questions de la classe (relevé copiable) et les cocher au bilan.</p>
  <div class="vig" style="margin-top:3mm"><h2>${picto("ouinon", 5.5, 4, "#8a1c1c")}Points de vigilance</h2><ul>
    <li><b>Ne jamais nommer les matériaux</b> de A et B, ni dire « lourde » ou « légère ». Le phénomène suffit.</li>
    <li><b>Ne jamais répondre pendant la phase des questions</b>, même à une question juste : <q>Bonne question. Écris-la.</q></li>
    <li>Ne pas révéler les étiquettes avant que la classe ait regroupé ses questions. Ne rien conclure après la démonstration.</li>
    <li>Ne citer ni critère, ni procédé, ni valeur de l'A8 : la Matériauthèque et la fiche s'en chargent.</li>
    <li>Photographier le tableau avant d'effacer : la photo sert au relevé de la classe.</li></ul></div>
  <div class="pied"><span>Document professeur · à ne pas distribuer</span><span>${SIG} · 2/2</span></div>
</div>`);

// ------------------------------------------------------------------ Relevé (A4 paysage, recto verso)
const ligne = (k) => `<tr><td class="cl"><b>Classe</b> 4ᵉ ……<br><b>Date</b> ……/……<br><b>Post-its</b> ……<br><span class="petit">couleur 2 : ……</span></td>
  ${ZONES.map(() => `<td></td>`).join("")}
  <td class="rel"><span class="case"></span>Sachet<br><span class="case"></span>Transformer<br><span class="case"></span>10 000<br><span class="case"></span>Une seule<br><span class="case"></span>Parking : ……</td></tr>`;
const entete = (p) => `<tr><th style="width:30mm">Classe</th>${ZONES.map((z) => `<th class="zh"><span class="pastille">${bandeMotif(z, `h${p}${z.n}`)}</span>${z.n} · ${sansCoupe(z.q)}</th>`).join("")}<th style="width:29mm">Relances utilisées</th></tr>`;
const releve = page("Relevé des questions", 297, 210, `
.entete{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:.6mm solid ${NAVY};padding-bottom:1.2mm;margin-bottom:2mm}
th.zh{background:#fff;color:${NAVY};border-bottom:.6mm solid ${NAVY};font-size:9pt}
th.zh .pastille{margin-right:1.5mm;vertical-align:-.6mm}
td{height:38mm}
td.cl{font-size:8.3pt;line-height:1.9}
td.rel{font-size:8pt;line-height:1.9}
.petit{font-size:7.5pt;color:${GRIS}}
.p2 td{height:44mm}
.releve-t{table-layout:fixed}
.compare{margin-top:3mm;height:30mm}
`, `<div class="feuille">
  <div class="entete"><div><h1>A8 · Relevé des questions, classe par classe</h1><p class="sous">À remplir d'après la photo du tableau : 2 ou 3 questions marquantes par zone, recopiées telles quelles. Recto : classes 1 à 4 · verso : classes 5 à 7 et comparaison.</p></div></div>
  <table class="releve-t">${entete(1)}${[1, 2, 3, 4].map(ligne).join("")}</table>
  <div class="pied"><span>Document professeur</span><span>${SIG} · 1/2</span></div>
</div>
<div class="feuille p2">
  <table class="releve-t">${entete(2)}${[5, 6, 7].map(ligne).join("")}</table>
  <div class="cadre compare"><b>Comparaison des 7 classes</b> <span class="petit">· zone la plus fournie, zone qui a demandé une relance, question à reprendre en fin d'activité :</span></div>
  <div class="pied"><span>Document professeur</span><span>${SIG} · 2/2</span></div>
</div>`);

// ------------------------------------------------------------------ Export + contrôles
fs.mkdirSync(SRC, { recursive: true });
const DOCS = [{ nom: "deroule_professeur", html: deroule, mm: [210, 297] }, { nom: "releve_questions", html: releve, mm: [297, 210] }];
const PX = 96 / 25.4, nav = await chromium.launch();
let alertes = 0;
for (const D of DOCS) {
  const f = path.join(SRC, D.nom + ".html"); fs.writeFileSync(f, D.html);
  const p = await nav.newPage({ viewport: { width: Math.round(D.mm[0] * PX), height: Math.round(D.mm[1] * PX) }, deviceScaleFactor: 2 });
  await p.goto(pathToFileURL(f).href); await p.emulateMedia({ media: "print" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
  const r = await p.evaluate(() => {
    const mm = 96 / 25.4, res = [];
    document.querySelectorAll(".feuille").forEach((fe, k) => {
      const r0 = fe.getBoundingClientRect();
      // le contenu (hors pied) doit s'arrêter au-dessus du pied de page
      const pied = fe.querySelector(".pied").getBoundingClientRect();
      [...fe.children].filter((c) => !c.classList.contains("pied")).forEach((c) => {
        const r = c.getBoundingClientRect();
        if (r.bottom > pied.top - 1) res.push(`feuille ${k + 1} : « ${c.textContent.trim().slice(0, 40)} » descend jusqu'au pied (${((r.bottom - pied.top) / mm).toFixed(1)} mm de trop)`);
        if (r.right > r0.right - 6 * mm) res.push(`feuille ${k + 1} : bloc trop à droite`);
      });
      let min = 99; fe.querySelectorAll("*").forEach((el) => { if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) min = Math.min(min, parseFloat(getComputedStyle(el).fontSize) * 0.75); });
      res.push(`INFO feuille ${k + 1} : plus petit texte ${min.toFixed(1)} pt ; bas du contenu à ${((r0.bottom - Math.max(...[...fe.children].filter((c) => !c.classList.contains("pied")).map((c) => c.getBoundingClientRect().bottom))) / mm).toFixed(1)} mm du bord`);
    });
    return res;
  });
  r.forEach((s) => { console.log(`[${D.nom}] ${s}`); if (!s.startsWith("INFO")) alertes++; });
  await p.pdf({ path: path.join(ici, D.nom + ".pdf"), preferCSSPageSize: true, printBackground: true });
  const fs_ = await p.locator(".feuille").all();
  for (let k = 0; k < fs_.length; k++) await fs_[k].screenshot({ path: path.join(APE, `${D.nom}_${k + 1}.png`) });
  await p.close();
}
await nav.close();
console.log(alertes ? `${alertes} alerte(s)` : "aucune alerte");
