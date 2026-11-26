// Écrans de la situation déclenchante A8, partagés par declencheur.html (élèves) et diaporama-a8.html (conduite).
// Une seule source pour les textes affichés : la lettre, les consignes, les 4 familles et la problématique.
import { P, ZONES, motif } from "./pictos.mjs";
import { LETTRE, FALC, PROBLEMATIQUE } from "./texte_lettre.mjs";
import { lecteurClip, CSS_CLIP } from "./clip.mjs";

export const R = "ressources/a8-declencheur";
export const RM = R + "/medias/";
export const insec = (s) => s.replace(/ ([?!:;»])/g, " $1").replace(/« /g, "« ");
export const sansCoupe = (s) => s.replace(/(\S+-\S+)/g, "<span style=\"white-space:nowrap\">$1</span>");
export const svg = (nom, px, ep = 3.4, cls = "") =>
  `<svg class="picto ${cls}" viewBox="0 0 64 64" width="${px}" height="${px}" fill="none" stroke="currentColor" stroke-width="${ep}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[nom]}</svg>`;
export const bande = (z, id) => `<svg class="motif" aria-hidden="true"><defs>${motif(z, id)}</defs><g transform="scale(2)"><rect width="2000" height="2000" fill="url(#${id})"/></g></svg>`;

export function logo(px) {
  return `<svg viewBox="0 0 120 120" width="${px}" height="${px}" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="#1F3864"/><path d="M60 18C46 42 36 56 36 70a24 24 0 0 0 48 0c0-14-10-28-24-52z" fill="#fff"/><path d="M42 78q9-8 18 0t18 0" stroke="#2E75B6" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M46 92q7-6 14 0t14 0" stroke="#2E75B6" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
}
export function minuteur(duree = 180) {
  const t = `${Math.floor(duree / 60)}:${String(duree % 60).padStart(2, "0")}`;
  return `<div class="minuteur js-min" role="timer" aria-live="off">
    <div class="chiffres js-chiffres">${t}</div>
    <div class="jauge"><div class="js-jauge"></div></div>
    <div class="etat js-etat">Entrée pour lancer</div>
    <div class="bt-min"><button type="button" class="bt-grand js-go">Lancer</button><button type="button" class="bt-grand js-raz">Remettre à ${t}</button></div>
  </div>`;
}

// La lettre tient en 3 écrans à 48 px ; chaque écran a sa part de la version facile à lire.
const P_ = (t, cls = "") => `<p${cls ? ` class="${cls}"` : ""}>${t}</p>`;
const PARTS = [
  { texte: P_(LETTRE.appel) + LETTRE.corps.slice(0, 2).map((t) => P_(t)).join(""), falc: FALC.slice(0, 2) },
  { texte: LETTRE.corps.slice(2, 4).map((t) => P_(t)).join(""), falc: FALC.slice(2, 5) },
  { texte: P_(LETTRE.corps[4]) + P_(LETTRE.fin) + P_(LETTRE.signe, "signe"), falc: FALC.slice(5) },
];
const falcHTML = (l) => `<ol class="falc">${l.map(([pi, t]) => `<li>${svg(pi, 72, 3.6)}<span>${t}</span></li>`).join("")}</ol>`;
const outilsLettre = `<div class="outils">
  <button type="button" class="bt-grand js-audio" aria-pressed="false">${svg("oreille", 40, 4)}<span class="js-audio-txt">Écouter la lettre</span></button>
  <button type="button" class="bt-grand js-falc" aria-pressed="false">${svg("question", 40, 4)}<span>Facile à lire</span></button></div>`;

// « conduite » : clé de la ligne du déroulé (outils/conduite.mjs) que l'écran illustre.
export const ECRANS = [
  ...PARTS.map((pt, i) => ({ id: "lettre" + (i + 1), titre: `La lettre (${i + 1}/3)`, conduite: "lettre", html: `
    <div class="kicker">Un message pour la classe</div>
    <div class="lettre"><div class="entete">${logo(64)}<span>FONTELAME</span>${outilsLettre}</div>
      <div class="texte js-texte">${pt.texte}</div><div class="texte-falc js-texte-falc" hidden>${falcHTML(pt.falc)}</div></div>` })),
  { id: "defi", titre: "Turbine A ou B ?", etapes: 3, conduite: ["mains", "pari", "pari"], html: `
    <div class="kicker">Le défi</div>
    <h2>Turbine A ou turbine B ?</h2>
    <div class="duo">
      <figure>${svg("turbine", 250, 3)}<figcaption>A</figcaption></figure>
      <figure>${svg("turbine", 250, 3)}<figcaption>B</figcaption></figure>
    </div>
    <p class="consigne" data-e="1">${svg("postit", 58, 4)}Faites-les passer de main en main. Observez.</p>
    <p class="consigne" data-e="2">${svg("question", 58, 4)}Pariez : laquelle va tourner sous un petit filet d'eau ? Levez la main : A… ou B ?</p>
    <p class="consigne" data-e="3">${svg("filet", 58, 4)}Regardez… et écoutez.</p>` },
  { id: "questions", titre: "Le jeu des questions", minuteur: 180, relais: 90, conduite: "questions", html: `
    <div class="kicker">Le jeu des questions</div>
    <div class="deux">
      <ol class="regles">
        <li>${svg("beaucoup", 60, 4)}<span>Le plus de questions possible.</span></li>
        <li>${svg("ouinon", 60, 4)}<span>On n'y répond pas.</span></li>
        <li>${svg("postit", 60, 4)}<span>Une question par post-it.</span></li>
        <li class="petit">${svg("ampoule", 60, 4)}<span>Écrire, dire à son binôme, ou dessiner. Les cartes vous aident.</span></li>
      </ol>
      ${minuteur(180)}
    </div>
    <p class="roles js-roles">Pilote : écrit · Copilote : propose. <b class="js-relais" hidden>Changez de rôle !</b></p>` },
  { id: "tri", titre: "Le tri", minuteur: 180, conduite: "tri", html: `
    <div class="kicker">Le tri</div>
    <div class="deux">
      <div class="tri-g">
        <p class="grand">Collez vos post-its au tableau.<br>Rassemblez les questions qui se ressemblent.</p>
        <div class="zones-vides">${[1, 2, 3, 4].map((n) => `<div>${n}</div>`).join("")}</div>
      </div>
      ${minuteur(180)}
    </div>` },
  { id: "revelation", titre: "Les 4 familles de questions", etapes: 4, conduite: "revelation", html: `
    <div class="kicker">Vos questions, rangées en 4 familles</div>
    <div class="etiquettes">${ZONES.map((z) => `<div class="etiq" data-e="${z.n}" style="--c:${z.c}">${bande(z, "z" + z.n)}<div class="etiq-in">${svg(z.picto, 92, 3.4)}<span class="q">${sansCoupe(z.q)}</span></div></div>`).join("")}</div>` },
  { id: "probleme", titre: "Notre problématique", conduite: "probleme", html: `
    <div class="kicker">Toutes vos questions, en une seule</div>
    <div class="pb"><span>Notre problématique</span>${PROBLEMATIQUE}</div>` },
  // id « video » (et non « clip ») : l'étape « clip » du diaporama a sa propre mise en page, avec minuteur et capsule.
  { id: "video", titre: "Le clip", conduite: "clip", html: `
    <div class="kicker">Pour y répondre : la méthode, en 2 minutes</div>
    ${lecteurClip({ chemin: RM, svg, liens: [[RM + "clip_A8.mp4", "Ouvrir la vidéo seule", "loupe"], [RM + "clip_A8.html#transcription", "Transcription", "postit"]] })}` },
];

// Feuille de style commune (scène 1600 × 900, texte du contenu ≥ 48 px).
export const CSS = `
@font-face{font-family:Luciole;src:url(${R}/fonts/Luciole-Regular.woff2) format("woff2");font-weight:400}
@font-face{font-family:Luciole;src:url(${R}/fonts/Luciole-Bold.woff2) format("woff2");font-weight:700}
:root{--navy:#1F3864;--blue:#2E75B6;--light:#DEEAF6;--lighter:#EAF1FA;--grey:#4d5562}
*{box-sizing:border-box}
html,body{height:100%;margin:0;overflow:hidden;background:#f4f7fb}
body{font-family:Luciole,Arial,sans-serif;color:#14213d;line-height:1.3}
.scene{position:absolute;left:0;top:0;width:1600px;height:900px;transform-origin:0 0;background:#f4f7fb;overflow:hidden;display:flex;flex-direction:column}
.band{height:64px;flex:none;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 40px;font-size:22px;font-weight:700;letter-spacing:.02em}
.band .k{color:#bcd2ee}
.ecrans{position:relative;flex:1;min-height:0}
.ecran{position:absolute;inset:0;padding:24px 70px 16px;display:flex;flex-direction:column;opacity:0;visibility:hidden;transition:opacity .25s}
.ecran.on{opacity:1;visibility:visible}
@media (prefers-reduced-motion:reduce){.ecran,.etiq,.consigne{transition:none!important}}
.kicker{font-size:48px;font-weight:700;color:var(--blue);margin-bottom:8px;line-height:1.1}
h2{margin:0 0 10px;font-size:72px;line-height:1.1;color:var(--navy)}
p{margin:0}
.picto{flex:none;color:var(--navy)}
/* Lettre */
.lettre{background:#fff;border:2px solid #dbe5f0;border-radius:18px;padding:18px 40px 20px;flex:1;min-height:0;display:flex;flex-direction:column;box-shadow:0 3px 10px rgba(31,56,100,.07)}
.entete{display:flex;align-items:center;gap:18px;font-size:48px;font-weight:700;letter-spacing:.12em;color:var(--navy);border-bottom:3px solid var(--navy);padding-bottom:10px;margin-bottom:14px}
.texte{font-size:52px;line-height:1.32}
.texte p+p{margin-top:12px}
.signe{font-weight:700;color:var(--navy)}
.falc{list-style:none;margin:0;padding:0;display:grid;gap:22px}
.falc li{display:flex;align-items:center;gap:26px;font-size:56px;font-weight:700;line-height:1.15;color:var(--navy)}
.outils{display:flex;gap:16px;margin-left:auto;letter-spacing:0}
.bt-grand{display:inline-flex;align-items:center;gap:14px;border:3px solid var(--blue);background:#fff;color:var(--navy);border-radius:14px;padding:8px 24px;font:700 36px Luciole,Arial,sans-serif;cursor:pointer;text-decoration:none}
.bt-grand:hover{background:var(--lighter)}
.bt-grand[aria-pressed="true"]{background:var(--navy);color:#fff;border-color:var(--navy)}
.bt-grand[aria-pressed="true"] .picto{color:#fff}
/* Défi */
.duo{display:flex;justify-content:center;gap:200px;margin:4px 0 6px}
.duo figure{margin:0;display:flex;flex-direction:column;align-items:center}
.duo figcaption{font-size:96px;font-weight:700;color:var(--navy);line-height:1}
.consigne{display:none;align-items:center;justify-content:center;gap:22px;font-size:52px;font-weight:700;color:var(--navy);text-align:left;background:var(--lighter);border-radius:16px;padding:14px 28px;margin-top:auto}
.consigne.on{display:flex}
/* Minuteurs */
.deux{display:grid;grid-template-columns:1fr 520px;gap:40px;flex:1;min-height:0;align-items:start}
.regles{list-style:none;margin:0;padding:0;display:grid;gap:22px}
.regles li{display:flex;align-items:center;gap:22px;font-size:54px;font-weight:700;line-height:1.12;color:var(--navy)}
.regles li.petit{font-size:48px;font-weight:400;color:#14213d}
.minuteur{background:#fff;border:3px solid var(--navy);border-radius:22px;padding:20px 24px;text-align:center}
.chiffres{font-size:190px;font-weight:700;line-height:1;color:var(--navy);font-variant-numeric:tabular-nums}
.jauge{height:30px;border:3px solid var(--navy);border-radius:15px;overflow:hidden;margin:16px 0 10px;background:repeating-linear-gradient(45deg,#fff 0 10px,#eef3f9 10px 20px)}
.jauge div{height:100%;width:100%;background:var(--blue);transition:width .25s linear}
.etat{font-size:48px;font-weight:700;color:var(--grey);min-height:62px}
.minuteur.fini .chiffres{color:#8a1c1c}
.minuteur.fini .etat{color:#8a1c1c}
.bt-min{display:flex;flex-direction:column;gap:10px;margin-top:8px}
.bt-min .bt-grand{justify-content:center;font-size:32px;padding:6px 16px}
.roles{font-size:48px;margin-top:8px;color:var(--navy)}
.roles b{display:inline-block;background:#FFF1C2;border:3px solid #8a6400;color:#5a3b00;border-radius:12px;padding:0 16px;margin-left:12px}
.grand{font-size:56px;font-weight:700;line-height:1.2;color:var(--navy)}
.zones-vides{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:26px}
.zones-vides div{height:150px;border:5px dashed #7d8a99;border-radius:16px;font-size:60px;font-weight:700;color:#5b6472;display:flex;align-items:flex-start;padding:6px 18px}
/* Révélation */
.etiquettes{display:grid;grid-template-columns:1fr 1fr;gap:24px;flex:1;min-height:0}
.etiq{position:relative;border-radius:20px;overflow:hidden;border:4px solid var(--c);opacity:.0;transform:scale(.96);transition:opacity .35s,transform .35s}
.etiq.on{opacity:1;transform:none}
.etiq .motif{position:absolute;inset:0;width:100%;height:100%}
.etiq-in{position:absolute;inset:22px;background:#fff;border-radius:12px;display:flex;align-items:center;gap:24px;padding:0 26px}
.etiq .q{font-size:56px;font-weight:700;line-height:1.08;color:var(--navy);flex:1}
.etiq .m{position:absolute;right:14px;bottom:6px;font-size:22px;color:var(--grey)}
/* Problématique */
.pb{margin:auto 0;background:var(--navy);color:#fff;border-radius:24px;padding:40px 54px 48px;font-size:64px;font-weight:700;line-height:1.18}
.pb span{display:block;font-size:48px;letter-spacing:.08em;text-transform:uppercase;color:#bcd2ee;margin-bottom:14px}
/* Barre du professeur */
.barre{height:72px;flex:none;display:flex;align-items:center;gap:14px;padding:0 40px;border-top:2px solid #dbe5f0;background:#fff}
.bt{border:2px solid var(--blue);background:#fff;color:var(--navy);border-radius:10px;min-width:58px;height:50px;padding:0 14px;font:700 22px Luciole,Arial,sans-serif;cursor:pointer}
.bt:hover{background:var(--lighter)}
.bt:disabled{opacity:.35;cursor:default}
.points{display:flex;gap:7px}
.points button{width:30px;height:20px;border-radius:10px;border:0;background:#d5e0ec;padding:0;cursor:pointer}
.points button.fait{background:#9fc0e2}
.points button[aria-current="true"]{background:var(--blue)}
.compteur{font-size:22px;font-weight:700;color:var(--navy);min-width:80px;text-align:center;font-variant-numeric:tabular-nums}
.aide{flex:1;font-size:15px;color:var(--grey);text-align:center;line-height:1.35}
.aide a{color:var(--grey)}
:focus-visible{outline:5px solid #F0B429;outline-offset:3px}
${CSS_CLIP}`;
