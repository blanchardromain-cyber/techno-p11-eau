// Génère techno-p11-eau/declencheur.html : page projetée de la situation déclenchante A8.
// Textes et pictogrammes repris des modules partagés (mêmes mots que les supports papier).
// Usage : node outils/generer_declencheur.mjs
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { P, ZONES, motif } from "./pictos.mjs";
import { LETTRE, FALC, PROBLEMATIQUE } from "./texte_lettre.mjs";

const ici = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const racine = path.resolve(ici, "..", "..");            // techno-p11-eau
const R = "ressources/a8-declencheur";
const insec = (s) => s.replace(/ ([?!:;»])/g, " $1").replace(/« /g, "« ");
const svg = (nom, px, ep = 3.4, cls = "") =>
  `<svg class="picto ${cls}" viewBox="0 0 64 64" width="${px}" height="${px}" fill="none" stroke="currentColor" stroke-width="${ep}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[nom]}</svg>`;
const bande = (z, id) => `<svg class="motif" aria-hidden="true"><defs>${motif(z, id)}</defs><g transform="scale(2)"><rect width="2000" height="2000" fill="url(#${id})"/></g></svg>`;

// --- Écrans (un écran peut avoir plusieurs étapes : data-etapes) ---
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

const ECRANS = [
  ...PARTS.map((pt, i) => ({ id: "lettre" + (i + 1), titre: `La lettre (${i + 1}/3)`, html: `
    <div class="kicker">Un message pour la classe</div>
    <div class="lettre"><div class="entete">${logo(64)}<span>FONTELAME</span>${outilsLettre}</div>
      <div class="texte js-texte">${pt.texte}</div><div class="texte-falc js-texte-falc" hidden>${falcHTML(pt.falc)}</div></div>` })),
  { id: "defi", titre: "Turbine A ou B ?", etapes: 3, html: `
    <div class="kicker">Le défi</div>
    <h2>Turbine A ou turbine B ?</h2>
    <div class="duo">
      <figure>${svg("turbine", 250, 3)}<figcaption>A</figcaption></figure>
      <figure>${svg("turbine", 250, 3)}<figcaption>B</figcaption></figure>
    </div>
    <p class="consigne" data-e="1">${svg("postit", 58, 4)}Faites-les passer de main en main. Observez.</p>
    <p class="consigne" data-e="2">${svg("question", 58, 4)}Pariez : laquelle va tourner sous un petit filet d'eau ? Levez la main : A… ou B ?</p>
    <p class="consigne" data-e="3">${svg("filet", 58, 4)}Regardez… et écoutez.</p>` },
  { id: "questions", titre: "Le jeu des questions", minuteur: 180, relais: 90, html: `
    <div class="kicker">Le jeu des questions</div>
    <div class="deux">
      <ol class="regles">
        <li>${svg("beaucoup", 60, 4)}<span>Le plus de questions possible.</span></li>
        <li>${svg("ouinon", 60, 4)}<span>On n'y répond pas.</span></li>
        <li>${svg("postit", 60, 4)}<span>Une question par post-it.</span></li>
        <li class="petit">${svg("ampoule", 60, 4)}<span>Écrire, dire à son binôme, ou dessiner. Les cartes vous aident.</span></li>
      </ol>
      ${minuteur()}
    </div>
    <p class="roles js-roles">Pilote : écrit · Copilote : propose. <b class="js-relais" hidden>Changez de rôle !</b></p>` },
  { id: "tri", titre: "Le tri", minuteur: 180, html: `
    <div class="kicker">Le tri</div>
    <div class="deux">
      <div class="tri-g">
        <p class="grand">Collez vos post-its au tableau.<br>Rassemblez les questions qui se ressemblent.</p>
        <div class="zones-vides">${[1, 2, 3, 4].map((n) => `<div>${n}</div>`).join("")}</div>
      </div>
      ${minuteur()}
    </div>` },
  { id: "revelation", titre: "Les 4 familles de questions", etapes: 4, html: `
    <div class="kicker">Vos questions, rangées en 4 familles</div>
    <div class="etiquettes">${ZONES.map((z) => `<div class="etiq" data-e="${z.n}" style="--c:${z.c}">${bande(z, "z" + z.n)}<div class="etiq-in">${svg(z.picto, 92, 3.4)}<span class="q">${z.q.replace(/(\S+-\S+)/g,"<span style=\"white-space:nowrap\">$1</span>")}</span></div></div>`).join("")}</div>` },
  { id: "probleme", titre: "Notre problématique", html: `
    <div class="kicker">Toutes vos questions, en une seule</div>
    <div class="pb"><span>Notre problématique</span>${PROBLEMATIQUE}</div>` },
];

function logo(px) {
  return `<svg viewBox="0 0 120 120" width="${px}" height="${px}" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="#1F3864"/><path d="M60 18C46 42 36 56 36 70a24 24 0 0 0 48 0c0-14-10-28-24-52z" fill="#fff"/><path d="M42 78q9-8 18 0t18 0" stroke="#2E75B6" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M46 92q7-6 14 0t14 0" stroke="#2E75B6" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
}
function minuteur() {
  return `<div class="minuteur js-min" role="timer" aria-live="off">
    <div class="chiffres js-chiffres">3:00</div>
    <div class="jauge"><div class="js-jauge"></div></div>
    <div class="etat js-etat">Entrée pour lancer</div>
    <div class="bt-min"><button type="button" class="bt-grand js-go">Lancer</button><button type="button" class="bt-grand js-raz">Remettre à 3:00</button></div>
  </div>`;
}

// Étapes à plat : [indexÉcran, sousÉtape]
const ETAPES = [];
ECRANS.forEach((e, i) => { for (let s = 1; s <= (e.etapes || 1); s++) ETAPES.push([i, s]); });

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>P11 — Activité 8 : situation déclenchante</title>
<!-- Page générée par ${R}/outils/generer_declencheur.mjs : modifier le générateur, pas ce fichier. -->
<style>
/* Page projetée (salle de 15 m) : scène 1600 × 900 mise à l'échelle de la fenêtre ; texte du contenu ≥ 48 px.
   Aucune dépendance externe : police Luciole locale, audio local, pictogrammes en SVG. */
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
.bt-grand{display:inline-flex;align-items:center;gap:14px;border:3px solid var(--blue);background:#fff;color:var(--navy);border-radius:14px;padding:8px 24px;font:700 36px Luciole,Arial,sans-serif;cursor:pointer}
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
</style>
</head>
<body>
<div class="scene" id="scene">
  <div class="band"><span><span class="k">TECHNOLOGIE · 4ᵉ ·</span> P11 — L'eau, ressource essentielle</span><span>Activité 8 · Situation déclenchante</span></div>
  <main class="ecrans">
${ECRANS.map((e) => `    <section class="ecran" id="${e.id}" data-titre="${e.titre}" data-etapes="${e.etapes || 1}"${e.minuteur ? ` data-minuteur="${e.minuteur}"` : ""}${e.relais ? ` data-relais="${e.relais}"` : ""} aria-label="${e.titre}">${insec(e.html)}
    </section>`).join("\n")}
  </main>
  <nav class="barre" aria-label="Navigation du professeur">
    <button class="bt" id="btPrec" type="button" aria-label="Étape précédente" title="Étape précédente (flèche gauche)">◀</button>
    <div class="points" id="points"></div>
    <span class="compteur" id="compteur" aria-live="polite"></span>
    <button class="bt" id="btSuiv" type="button" aria-label="Étape suivante" title="Étape suivante (espace ou flèche droite)">▶</button>
    <span class="aide">Espace ou → suivant · ← précédent · Entrée minuteur · R remise à 3:00 · A audio · L facile à lire · F plein écran<br>
      R.Blanchard, professeur de Technologie · aucune donnée enregistrée · <a href="./">accueil</a></span>
    <button class="bt" id="btPlein" type="button" title="Plein écran (touche F)">⛶</button>
  </nav>
</div>
<audio id="audio" preload="none" src="${R}/lettre_fabricant.wav"></audio>
<script>
/* ==========================================================================
   P11 · Activité 8 — Situation déclenchante (page projetée)
   L'étape affichée est dans l'adresse (#1 à #${ETAPES.length}) : rien n'est enregistré sur le poste,
   un rechargement repart de l'étape de l'adresse (pas de reprise d'un groupe précédent).
   Changement d'étape synchrone : deux appuis rapides s'appliquent dans l'ordre.
   Minuteurs calculés sur l'horloge (Date.now), affichés par setInterval : rien ne dépend de requestAnimationFrame.
   ========================================================================== */
(function(){
  var L = 1600, H = 900;
  var ETAPES = ${JSON.stringify(ETAPES)};
  var scene = document.getElementById("scene");
  var ecrans = Array.prototype.slice.call(document.querySelectorAll(".ecran"));
  var points = document.getElementById("points");
  var btPrec = document.getElementById("btPrec"), btSuiv = document.getElementById("btSuiv");
  var audio = document.getElementById("audio");
  var courant = -1, falcOn = false;

  function ajuster(){
    var w = window.innerWidth, h = window.innerHeight, s = Math.min(w / L, h / H);
    scene.style.transform = "translate(" + ((w - L * s) / 2) + "px," + ((h - H * s) / 2) + "px) scale(" + s + ")";
  }

  /* ---- Minuteurs : un par écran qui en a un ; ils continuent si l'on change d'écran ---- */
  var minuteurs = ecrans.map(function(ec){
    if (!ec.dataset.minuteur) return null;
    var m = { ec: ec, duree: +ec.dataset.minuteur * 1000, relais: ec.dataset.relais ? +ec.dataset.relais * 1000 : 0,
              reste: +ec.dataset.minuteur * 1000, fin: 0, marche: false, sonne: false };
    ec.querySelector(".js-go").onclick = function(ev){ basculer(m); if (ev.detail) this.blur(); };
    ec.querySelector(".js-raz").onclick = function(ev){ raz(m); if (ev.detail) this.blur(); };
    afficher(m);
    return m;
  });
  function restant(m){ return m.marche ? Math.max(0, m.fin - Date.now()) : m.reste; }
  function basculer(m){
    if (restant(m) === 0) raz(m);
    if (m.marche){ m.reste = restant(m); m.marche = false; }
    else { m.fin = Date.now() + m.reste; m.marche = true; }
    afficher(m);
  }
  function raz(m){ m.marche = false; m.reste = m.duree; m.sonne = false; afficher(m); }
  function afficher(m){
    var r = restant(m), s = Math.ceil(r / 1000), ec = m.ec;
    ec.querySelector(".js-chiffres").textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    ec.querySelector(".js-jauge").style.width = (100 * r / m.duree) + "%";
    var fini = r === 0;
    ec.querySelector(".js-min").classList.toggle("fini", fini);
    ec.querySelector(".js-etat").textContent = fini ? "Temps écoulé !" : m.marche ? "En cours…" : (r === m.duree ? "Entrée pour lancer" : "En pause");
    ec.querySelector(".js-go").textContent = m.marche ? "Pause" : (r === m.duree ? "Lancer" : "Reprendre");
    var relais = ec.querySelector(".js-relais");
    if (relais) relais.hidden = !(m.relais && r <= m.duree - m.relais && r > m.duree - m.relais - 15000);
    if (fini && m.marche){ m.marche = false; m.reste = 0; if (!m.sonne){ m.sonne = true; bip(); } afficher(m); }
  }
  setInterval(function(){ minuteurs.forEach(function(m){ if (m && m.marche) afficher(m); }); }, 250);
  function bip(){   // trois notes douces en fin de minuteur (aucun fichier)
    try {
      var C = window.AudioContext || window.webkitAudioContext, c = new C();
      [0, .35, .7].forEach(function(t, k){
        var o = c.createOscillator(), g = c.createGain();
        o.frequency.value = [660, 660, 880][k]; o.connect(g); g.connect(c.destination);
        g.gain.setValueAtTime(0.0001, c.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + t + .03);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t + .3);
        o.start(c.currentTime + t); o.stop(c.currentTime + t + .32);
      });
    } catch (e) {}
  }

  /* ---- Lettre : audio et version facile à lire ---- */
  function majAudio(){
    var lit = !audio.paused && !audio.ended;
    document.querySelectorAll(".js-audio").forEach(function(b){ b.setAttribute("aria-pressed", String(lit)); });
    document.querySelectorAll(".js-audio-txt").forEach(function(t){ t.textContent = lit ? "Arrêter la lecture" : "Écouter la lettre"; });
  }
  function basculerAudio(){
    if (!audio.paused && !audio.ended){ audio.pause(); audio.currentTime = 0; }
    else { audio.currentTime = 0; var p = audio.play(); if (p && p.catch) p.catch(function(){}); }
    majAudio();
  }
  ["play", "pause", "ended"].forEach(function(ev){ audio.addEventListener(ev, majAudio); });
  function basculerFalc(){
    falcOn = !falcOn;
    document.querySelectorAll(".js-falc").forEach(function(b){ b.setAttribute("aria-pressed", String(falcOn)); });
    document.querySelectorAll(".js-texte").forEach(function(t){ t.hidden = falcOn; });
    document.querySelectorAll(".js-texte-falc").forEach(function(t){ t.hidden = !falcOn; });
  }
  document.querySelectorAll(".js-audio").forEach(function(b){ b.onclick = function(ev){ basculerAudio(); if (ev.detail) b.blur(); }; });
  document.querySelectorAll(".js-falc").forEach(function(b){ b.onclick = function(ev){ basculerFalc(); if (ev.detail) b.blur(); }; });

  /* ---- Navigation par étapes ---- */
  function depuisAdresse(){ var n = parseInt(location.hash.replace("#", ""), 10); return isNaN(n) ? 0 : n - 1; }
  function aller(n){
    n = Math.max(0, Math.min(ETAPES.length - 1, n));
    courant = n;
    var e = ETAPES[n][0], s = ETAPES[n][1];
    ecrans.forEach(function(ec, k){
      ec.classList.toggle("on", k === e);
      ec.setAttribute("aria-hidden", String(k !== e));
      ec.inert = k !== e;
      if (k === e) ec.querySelectorAll("[data-e]").forEach(function(x){
        var v = +x.dataset.e;
        x.classList.toggle("on", ec.id === "defi" ? v === s : v <= s);   // défi : une consigne ; révélation : cumul
      });
    });
    Array.prototype.forEach.call(points.children, function(p, k){ p.className = k < n ? "fait" : ""; p.setAttribute("aria-current", String(k === n)); });
    document.getElementById("compteur").textContent = (n + 1) + " / " + ETAPES.length;
    btPrec.disabled = n === 0; btSuiv.disabled = n === ETAPES.length - 1;
    if (location.hash !== "#" + (n + 1)) { try { history.replaceState(null, "", "#" + (n + 1)); } catch (x) { location.hash = "#" + (n + 1); } }
  }
  function minuteurCourant(){ return courant < 0 ? null : minuteurs[ETAPES[courant][0]]; }
  function pleinEcran(){ var d = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (d.requestFullscreen) d.requestFullscreen(); }

  ETAPES.forEach(function(et, k){
    var b = document.createElement("button"); b.type = "button";
    var t = ecrans[et[0]].dataset.titre + (+ecrans[et[0]].dataset.etapes > 1 ? " · " + et[1] : "");
    b.title = t; b.setAttribute("aria-label", "Étape " + (k + 1) + " : " + t);
    b.onclick = function(ev){ aller(k); if (ev.detail) b.blur(); };
    points.appendChild(b);
  });
  btPrec.onclick = function(ev){ aller(courant - 1); if (ev.detail) btPrec.blur(); };
  btSuiv.onclick = function(ev){ aller(courant + 1); if (ev.detail) btSuiv.blur(); };
  document.getElementById("btPlein").onclick = function(ev){ pleinEcran(); if (ev.detail) this.blur(); };

  document.addEventListener("keydown", function(e){
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    var surBouton = e.target && /^(A|BUTTON)$/.test(e.target.tagName), k = e.key;
    if ((k === " " || k === "Enter") && surBouton) return;   // le bouton qui a le focus fait son travail
    var m = minuteurCourant();
    if (k === " " || k === "ArrowRight" || k === "ArrowDown" || k === "PageDown") aller(courant + 1);
    else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || k === "Backspace") aller(courant - 1);
    else if (k === "Enter") { if (m) basculer(m); else aller(courant + 1); }
    else if ((k === "r" || k === "R") && m) raz(m);
    else if (k === "a" || k === "A") basculerAudio();
    else if (k === "l" || k === "L") basculerFalc();
    else if (k === "Home") aller(0);
    else if (k === "End") aller(ETAPES.length - 1);
    else if (k === "f" || k === "F") pleinEcran();
    else return;
    e.preventDefault();
  });
  window.addEventListener("hashchange", function(){ if (depuisAdresse() !== courant) aller(depuisAdresse()); });
  window.addEventListener("resize", ajuster);
  document.addEventListener("fullscreenchange", ajuster);
  ajuster();
  aller(depuisAdresse());
})();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(racine, "declencheur.html"), html);
console.log("écrit :", path.join(racine, "declencheur.html"), `(${ETAPES.length} étapes)`);
