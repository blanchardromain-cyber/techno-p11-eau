// Génère techno-p11-eau/declencheur.html : page projetée de la situation déclenchante A8.
// Textes et pictogrammes repris des modules partagés (mêmes mots que les supports papier).
// Usage : node outils/generer_declencheur.mjs
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { ECRANS, CSS, R, RM, insec, AUDIO_LETTRE } from "./ecrans_declencheur.mjs";
import { JS_CLIP, donneesClip, ecrireVtt } from "./clip.mjs";
ecrireVtt();

const ici = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const racine = path.resolve(ici, "..", "..");            // techno-p11-eau

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
${CSS}
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
    <span class="aide">Espace ou → suivant · ← précédent · Entrée minuteur · R remise à 3:00 · A audio · L facile à lire · V clip · F plein écran<br>
      R.Blanchard, professeur de Technologie · aucune donnée enregistrée · <a href="./">accueil</a></span>
    <button class="bt" id="btPlein" type="button" title="Plein écran (touche F)">⛶</button>
  </nav>
</div>
<audio id="audio" preload="none" src="${AUDIO_LETTRE}"></audio>
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
    A8CLIP.pauseHors(ecrans[e]);   // une vidéo s'arrête quand on quitte son écran
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
    if (e.target && e.target.tagName === "VIDEO") return;     // lecteur actif : espace et flèches pilotent la vidéo
    if ((k === " " || k === "Enter") && surBouton) return;   // le bouton qui a le focus fait son travail
    if (k === "v" || k === "V") { if (A8CLIP.basculer(ecrans[ETAPES[courant][0]])) e.preventDefault(); return; }
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
${JS_CLIP(donneesClip(RM))}
  ajuster();
  aller(depuisAdresse());
})();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(racine, "declencheur.html"), html);
console.log("écrit :", path.join(racine, "declencheur.html"), `(${ETAPES.length} étapes)`);
