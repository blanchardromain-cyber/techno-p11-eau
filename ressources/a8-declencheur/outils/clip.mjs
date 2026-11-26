// Clip de méthode A8 (« Comment choisir le matériau d'une pièce ? »), partagé par declencheur.html,
// diaporama-a8.html et la page autonome medias/clip_A8.html.
// Sources : medias/clip_A8.mp4 et clip_A8_adapte.mp4 (copiés depuis video-technologie/out), leurs .srt et transcriptions.
// Les sous-titres sont injectés en JavaScript (addTextTrack + VTTCue) et non par <track src> :
// Chrome refuse de charger un fichier <track> quand la page est ouverte en file:// (partage réseau du collège).
// Les .vtt sont tout de même écrits à côté des vidéos, pour un lecteur externe (VLC…).
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const ici = path.dirname(path.dirname(fileURLToPath(import.meta.url)));   // ressources/a8-declencheur
export const MEDIAS = path.join(ici, "medias");

const enS = (h, m, s, ms) => +h * 3600 + +m * 60 + +s + +ms / 1000;
function lireSrt(nom) {
  const txt = fs.readFileSync(path.join(MEDIAS, nom), "utf8").replace(/^﻿/, "").replace(/\r/g, "");
  return txt.split(/\n\n+/).map((b) => {
    const l = b.trim().split("\n"); const i = l.findIndex((x) => x.includes("-->"));
    if (i < 0) return null;
    const m = l[i].match(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/);
    return m ? [enS(m[1], m[2], m[3], m[4]), enS(m[5], m[6], m[7], m[8]), l.slice(i + 1).join("\n").trim()] : null;
  }).filter(Boolean);
}
const vtt = (cues) => "WEBVTT\n\n" + cues.map(([a, b, t], i) => `${i + 1}\n${hms(a)} --> ${hms(b)}\n${t}`).join("\n\n") + "\n";
function hms(s) { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, ss = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`; }

// Transcription Markdown → sections [{titre, lignes:[[t, texte]]}]
function lireTranscription(nom) {
  const out = []; let cur = null;
  for (const l of fs.readFileSync(path.join(MEDIAS, nom), "utf8").replace(/\r/g, "").split("\n")) {
    const h = l.match(/^##\s+(.*)/); if (h) { cur = { titre: h[1].trim(), lignes: [] }; out.push(cur); continue; }
    const m = l.match(/^-\s*\[(\d+):(\d+)\]\s*(.*)/); if (m && cur) cur.lignes.push([+m[1] * 60 + +m[2], m[3].trim()]);
  }
  return out;
}
// Durées (s) lues dans l'en-tête MP4 (boîte mvhd), sans ffprobe
function dureeMp4(nom) {
  const b = fs.readFileSync(path.join(MEDIAS, nom)); const i = b.indexOf("mvhd");
  const v = b[i + 4]; const ts = v === 1 ? b.readUInt32BE(i + 24) : b.readUInt32BE(i + 16);
  const d = v === 1 ? Number(b.readBigUInt64BE(i + 28)) : b.readUInt32BE(i + 20);
  return Math.round((d / ts) * 1000) / 1000;
}

const VERSIONS = { std: "clip_A8", ad: "clip_A8_adapte" };
export const CLIP = Object.fromEntries(Object.entries(VERSIONS).map(([k, base]) => [k, {
  mp4: base + ".mp4", dur: dureeMp4(base + ".mp4"), cues: lireSrt(base + ".srt"), transcription: lireTranscription(base + "_transcription.md"),
}]));
export function ecrireVtt() { for (const [k, base] of Object.entries(VERSIONS)) fs.writeFileSync(path.join(MEDIAS, base + ".vtt"), vtt(CLIP[k].cues)); }

// Données transmises au navigateur ; chemin = dossier des vidéos vu depuis la page (« ressources/a8-declencheur/medias/ » ou « »)
export const donneesClip = (chemin) => JSON.stringify(Object.fromEntries(Object.entries(CLIP).map(([k, c]) => [k, { src: chemin + c.mp4, dur: c.dur, cues: c.cues }])));

// ---------------------------------------------------------------- HTML du lecteur
// liens : [[href, texte, picto?]] ajoutés à la rangée de boutons (ouverts dans un nouvel onglet)
export function lecteurClip({ chemin, liens = [], svg }) {
  const ico = (n) => (svg ? svg(n, 34, 4) : "");
  return `<div class="clip js-clip">
      <video class="js-clip-video" controls preload="metadata" playsinline src="${chemin}${CLIP.std.mp4}" aria-label="Clip : comment choisir le matériau d'une pièce ?"></video>
      <div class="clip-bt">
        <button type="button" class="bt-grand js-clip-ad" aria-pressed="false">${ico("ampoule")}<span>Version adaptée</span></button>
        <button type="button" class="bt-grand js-clip-st" aria-pressed="true">${ico("postit")}<span>Sous-titres</span></button>
        ${liens.map(([h, t, p]) => `<a class="bt-grand js-clip-lien" href="${h}" target="_blank" rel="noopener"${/\.mp4$/.test(h) ? ' data-mp4="1"' : ""}>${p ? ico(p) : ""}<span>${t}</span><span class="ext" aria-hidden="true">↗</span></a>`).join("")}
      </div>
    </div>`;
}

export const CSS_CLIP = `
/* Clip de méthode */
.clip{display:flex;flex-direction:column;gap:14px;min-height:0;flex:1}
.clip video{display:block;width:100%;flex:1;min-height:0;background:#0b1424;border-radius:16px;border:3px solid var(--navy)}
.clip video::cue{font-family:Luciole,Arial,sans-serif;font-size:110%;background:rgba(0,0,0,.82);color:#fff}
.clip-bt{display:flex;flex-wrap:wrap;gap:12px;flex:none}
.clip-bt .bt-grand{font-size:30px;padding:6px 18px}
.clip-bt .ext{font-size:26px;color:var(--blue)}
`;

// ---------------------------------------------------------------- Script du lecteur (ES5, sans dépendance)
// Expose A8CLIP.init(), A8CLIP.pauseHors(ecranActif), A8CLIP.basculer(ecran).
export const JS_CLIP = (donnees) => `
  /* ---- Clip de méthode : version standard / adaptée, sous-titres injectés (compatibles file://) ---- */
  var A8CLIP = (function(){
    var CLIPS = ${donnees};
    function remplir(piste, cle){
      if (piste.cues) while (piste.cues.length) piste.removeCue(piste.cues[0]);
      CLIPS[cle].cues.forEach(function(c){ try { piste.addCue(new VTTCue(c[0], c[1], c[2])); } catch (e) {} });
    }
    function init(){
      Array.prototype.forEach.call(document.querySelectorAll(".js-clip"), function(box){
        var v = box.querySelector("video"), btAd = box.querySelector(".js-clip-ad"), btSt = box.querySelector(".js-clip-st");
        var etat = { cle: "std", st: true }, piste = v.addTextTrack("subtitles", "Français", "fr");
        remplir(piste, "std"); piste.mode = "showing";
        box.__etat = etat;
        function majLiens(){
          Array.prototype.forEach.call(box.querySelectorAll(".js-clip-lien[data-mp4]"), function(a){ a.href = CLIPS[etat.cle].src; });
        }
        btAd.onclick = function(ev){
          var avant = etat.cle, apres = avant === "std" ? "ad" : "std";
          var t = v.currentTime || 0, jouait = !v.paused && !v.ended;
          var cible = Math.min(CLIPS[apres].dur - 0.5, t * CLIPS[apres].dur / CLIPS[avant].dur);
          etat.cle = apres;
          btAd.setAttribute("aria-pressed", String(apres === "ad"));
          v.addEventListener("loadedmetadata", function f(){
            v.removeEventListener("loadedmetadata", f);
            try { v.currentTime = Math.max(0, cible); } catch (e) {}
            if (jouait){ var p = v.play(); if (p && p.catch) p.catch(function(){}); }
          });
          v.src = CLIPS[apres].src; v.load();
          remplir(piste, apres); piste.mode = etat.st ? "showing" : "hidden";
          majLiens();
          if (ev && ev.detail) btAd.blur();
        };
        btSt.onclick = function(ev){
          etat.st = !etat.st; piste.mode = etat.st ? "showing" : "hidden";
          btSt.setAttribute("aria-pressed", String(etat.st));
          if (ev && ev.detail) btSt.blur();
        };
        majLiens();
      });
    }
    function pauseHors(actif){
      Array.prototype.forEach.call(document.querySelectorAll(".js-clip video"), function(v){ if (!actif || !actif.contains(v)) v.pause(); });
    }
    function basculer(ecran){
      var v = ecran && ecran.querySelector(".js-clip video"); if (!v) return false;
      if (v.paused || v.ended){ var p = v.play(); if (p && p.catch) p.catch(function(){}); } else v.pause();
      return true;
    }
    return { init: init, pauseHors: pauseHors, basculer: basculer };
  })();
  A8CLIP.init();
`;
