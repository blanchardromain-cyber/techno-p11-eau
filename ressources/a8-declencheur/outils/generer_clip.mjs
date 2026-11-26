// Génère ressources/a8-declencheur/medias/clip_A8.html : page autonome du clip pour un élève seul.
// Fonctionne en ligne ET ouverte depuis un partage réseau (file://) : chemins relatifs, aucun fetch,
// police Luciole incorporée (base64), sous-titres injectés en JavaScript (voir clip.mjs).
// Usage : node outils/generer_clip.mjs
import fs from "node:fs";
import path from "node:path";
import { CLIP, MEDIAS, lecteurClip, CSS_CLIP, JS_CLIP, donneesClip, ecrireVtt } from "./clip.mjs";

ecrireVtt();
const FONTS = path.join(path.dirname(MEDIAS), "fonts");
const b64 = (f) => fs.readFileSync(path.join(FONTS, f)).toString("base64");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const transcription = (cle) => CLIP[cle].transcription.map((sec) => `<h3>${esc(sec.titre)}</h3>
      <ul>${sec.lignes.map(([t, x]) => `<li><button type="button" class="t js-aller" data-t="${t}" aria-label="Aller à ${mmss(t)}">${mmss(t)}</button><span>${esc(x)}</span></li>`).join("")}</ul>`).join("\n");

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>A8 · Clip : comment choisir le matériau d'une pièce ?</title>
<!-- Page générée par ressources/a8-declencheur/outils/generer_clip.mjs : modifier le générateur, pas ce fichier.
     À copier avec clip_A8.mp4 et clip_A8_adapte.mp4 (même dossier). Voir LISEZ-MOI-RESEAU.md. -->
<style>
@font-face{font-family:Luciole;src:url(data:font/woff2;base64,${b64("Luciole-Regular.woff2")}) format("woff2");font-weight:400}
@font-face{font-family:Luciole;src:url(data:font/woff2;base64,${b64("Luciole-Bold.woff2")}) format("woff2");font-weight:700}
:root{--navy:#1F3864;--blue:#2E75B6;--lighter:#EAF1FA;--grey:#4d5562}
*{box-sizing:border-box}
html,body{margin:0;background:#f4f7fb}
body{font-family:Luciole,Arial,sans-serif;color:#14213d;line-height:1.35;font-size:20px}
header{background:var(--navy);color:#fff;padding:12px 24px;font-weight:700;font-size:18px}
header .k{color:#bcd2ee}
main{max-width:1200px;margin:0 auto;padding:18px 20px 40px}
h1{font-size:30px;color:var(--navy);margin:0 0 4px;line-height:1.15}
.sous{color:var(--grey);margin:0 0 14px}
.clip{height:min(70vh,640px)}
.bt-grand{display:inline-flex;align-items:center;gap:10px;border:3px solid var(--blue);background:#fff;color:var(--navy);border-radius:12px;padding:6px 18px;font:700 22px Luciole,Arial,sans-serif;cursor:pointer;text-decoration:none}
.bt-grand:hover{background:var(--lighter)}
.bt-grand[aria-pressed="true"]{background:var(--navy);color:#fff;border-color:var(--navy)}
.bt-grand[aria-pressed="true"] .picto{color:#fff}
${CSS_CLIP}
.clip-bt .bt-grand{font-size:22px}
.aide{color:var(--grey);font-size:17px;margin:10px 0 0}
details{margin-top:22px;background:#fff;border:2px solid #dbe5f0;border-radius:14px;padding:10px 20px}
summary{font-size:24px;font-weight:700;color:var(--navy);cursor:pointer}
details h3{font-size:21px;color:var(--blue);margin:16px 0 6px}
details ul{list-style:none;margin:0;padding:0;display:grid;gap:4px}
details li{display:flex;gap:12px;align-items:baseline;font-size:21px}
.t{flex:none;border:2px solid var(--blue);background:#fff;color:var(--navy);border-radius:8px;font:700 16px Luciole,Arial,sans-serif;padding:1px 8px;cursor:pointer;font-variant-numeric:tabular-nums}
footer{color:var(--grey);font-size:15px;margin-top:24px}
:focus-visible{outline:4px solid #F0B429;outline-offset:3px}
</style>
</head>
<body>
<header><span class="k">TECHNOLOGIE · 4ᵉ ·</span> P11 — Activité 8</header>
<main>
  <h1>Comment choisir le matériau d'une pièce ?</h1>
  <p class="sous">La méthode, étape par étape, sur l'exemple du carter d'un drone. Version standard : 2 min ; version adaptée (plus lente) : 3 min.</p>
  ${lecteurClip({ chemin: "", liens: [] })}
  <p class="aide">Espace : lecture ou pause (quand la vidéo est sélectionnée) · flèches : reculer ou avancer · « Version adaptée » : même clip, plus lent, avec plus de pauses · « Sous-titres » : les afficher ou les masquer.</p>
  <details id="transcription">
    <summary>Transcription (texte du clip)</summary>
    <div class="js-tr" data-cle="std">${transcription("std")}</div>
    <div class="js-tr" data-cle="ad" hidden>${transcription("ad")}</div>
  </details>
  <footer>Voix : Romain Blanchard, professeur de Technologie · crédits des images et de la musique à la fin du clip.</footer>
</main>
<script>
(function(){
${JS_CLIP(donneesClip(""))}
  var box = document.querySelector(".js-clip"), v = box.querySelector("video"), det = document.getElementById("transcription");
  function ouvrir(){ if (location.hash === "#transcription"){ det.open = true; det.scrollIntoView(); } }
  ouvrir(); window.addEventListener("hashchange", ouvrir);
  // La transcription suit la version choisie ; un horodatage place la vidéo à cet instant.
  box.querySelector(".js-clip-ad").addEventListener("click", function(){
    var cle = box.__etat.cle;
    Array.prototype.forEach.call(document.querySelectorAll(".js-tr"), function(d){ d.hidden = d.dataset.cle !== cle; });
  });
  Array.prototype.forEach.call(document.querySelectorAll(".js-aller"), function(b){
    b.onclick = function(){ v.currentTime = +b.dataset.t; v.focus(); };
  });
})();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(MEDIAS, "clip_A8.html"), html);
console.log("écrit :", path.join(MEDIAS, "clip_A8.html"), `(${Math.round(html.length / 1024)} Ko)`);
