// Génère techno-p11-eau/diaporama-a8.html : diaporama de conduite de la séance A8 (situation déclenchante + lancement de l'activité).
// Sources partagées : écrans (ecrans_declencheur.mjs), conduite et phrases (conduite.mjs, aussi utilisées par le déroulé PDF),
// pictogrammes (pictos.mjs). Usage : node outils/generer_diaporama.mjs
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { ECRANS, CSS, R, insec, sansCoupe, svg, bande, minuteur } from "./ecrans_declencheur.mjs";
import { CONDUITE, LANCEMENT, ANTICIPATION, IMPREVUS } from "./conduite.mjs";
import { ZONES } from "./pictos.mjs";
import { PROBLEMATIQUE } from "./texte_lettre.mjs";

const ici = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const racine = path.resolve(ici, "..", "..");
const RF = "ressources/a8-fiche-repere";
const MATERIAUTHEQUE = "https://blanchardromain-cyber.github.io/materiautheque/?niveau=4";
const E = Object.fromEntries(ECRANS.map((e) => [e.id, e]));
const lien = (href, texte, ico = "loupe") => `<a class="bt-grand lien" href="${href}" target="_blank" rel="noopener">${svg(ico, 40, 4)}<span>${texte}</span><span class="ext" aria-hidden="true">↗</span></a>`;
const zonesEntete = (pref) => ZONES.map((z) => `<div class="zt" style="--c:${z.c}"><span class="pastille">${bande(z, pref + z.n)}</span><span>${z.n} · ${sansCoupe(z.q)}</span></div>`);

// ---------------------------------------------------------------- Diapositives
// prof : écran destiné au professeur (avant la classe) ; conduite : clé(s) dans conduite.mjs ; t : heure prévue.
const DIAPOS = [
  { id: "conduite", titre: "Conduite de la séance", prof: true, conduite: "avant", html: "" /* rempli plus bas */ },
  { ...E.lettre1, t: "0:00" }, { ...E.lettre2, t: "0:00" }, { ...E.lettre3, t: "0:00" },
  { ...E.defi, t: ["1:00", "1:30", "1:30"] },
  { id: "tables", titre: "Sur vos tables", t: "2:00", conduite: "questions", html: `
    <div class="kicker">Sur vos tables</div>
    <div class="docs">
      <figure><img src="${R}/apercus/cartes_amorce_1.png" alt="Planche de 8 cartes d'amorce : Pourquoi, Quel, Comment, Combien, Et si, Qu'est-ce qui, D'où, Est-ce que"><figcaption>Les cartes pour commencer vos questions</figcaption></figure>
      <figure><img src="${R}/apercus/plateau_A5_1.png" alt="Mini-plateau de 4 cases colorées pour ranger ses post-its"><figcaption>Un plateau pour ranger, si vous voulez</figcaption></figure>
      <div class="postits">${svg("postit", 120, 3.4)}<p>Des post-its :<br>une question par post-it</p></div>
    </div>` },
  { ...E.questions, t: "2:00", auto: true },
  { ...E.tri, t: "5:00", auto: true },
  { ...E.revelation, t: "7:00" },
  { id: "relances", titre: "Si une famille reste vide", t: "7:00", conduite: "revelation", anticipation: true, html: `
    <div class="kicker">Et si on se demandait…</div>
    <div class="relances">
      <div class="rel">${svg("origine", 70, 3.6)}<span>D'où vient la matière ?</span></div>
      <div class="rel">${svg("flamme", 70, 3.6)}<span>Qu'a-t-il fallu pour la transformer ?</span></div>
      <div class="rel">${svg("usine", 70, 3.6)}<span>Et pour en fabriquer 10 000 ?</span></div>
      <div class="rel">${svg("ecole", 70, 3.6)}<span>Et pour en fabriquer une seule, ici, au collège ?</span></div>
    </div>` },
  { ...E.probleme, t: "8:00" },
  { id: "vosquestions", titre: "Vos questions", t: "9:00", conduite: "transition", anticipation: true, html: `
    <div class="kicker">Vos questions <span class="js-nom-classe"></span></div>
    <div class="classe-bar">
      <label>Classe <input class="js-classe" list="classes-a8" placeholder="4ᵉ …" autocomplete="off"></label>
      <datalist id="classes-a8"></datalist>
      <button type="button" class="bt js-copier">Copier le relevé</button>
      <button type="button" class="bt js-effacer">Effacer cette classe</button>
      <span class="js-info info"></span>
    </div>
    <div class="colonnes js-colonnes" data-mode="saisie">${zonesEntete("q").map((h, i) => `<section class="col" data-z="${i + 1}" style="--c:${ZONES[i].c}">${h}<ul class="js-liste"></ul><input class="ajout js-ajout" placeholder="Ajouter… (Entrée)" aria-label="Ajouter une question dans la famille ${i + 1}"></section>`).join("")}</div>` },
  { id: "clip", titre: "La méthode", t: "10:00", conduite: "clip", minuteur: LANCEMENT[0].duree * 60, auto: true, html: `
    <div class="kicker">Pour répondre : la méthode</div>
    <div class="deux">
      <div class="pile">
        <p class="grand">Une capsule de 8 écrans : ce que vous allez produire, et comment vous y prendre.</p>
        ${lien("capsule-a8.html#1", "Ouvrir la capsule de méthode", "etapes")}
        <p class="note">Elle s'ouvre dans un nouvel onglet. Revenez ici à la fin.</p>
      </div>
      ${minuteur(LANCEMENT[0].duree * 60)}
    </div>` },
  { id: "repere", titre: "Fiche élève et fiche repère", t: "14:00", conduite: "repere", html: `
    <div class="kicker">Vos documents</div>
    <div class="deux deux-l">
      <div class="pile">
        <p class="grand">La fiche élève A8, et la fiche repère à côté de l'écran.</p>
        <ul class="roles-l">
          <li>${svg("loupe", 60, 4)}<span><b>Pilote</b> : tient la souris.</span></li>
          <li>${svg("ouinon", 60, 4)}<span><b>Vérificateur</b> : lit la fiche repère, vérifie chaque étape.</span></li>
          <li>${svg("dominos", 60, 4)}<span>On échange à mi-parcours.</span></li>
        </ul>
      </div>
      <figure class="apercu"><img src="${RF}/apercus/fiche-repere_A4_feuille1_recto.png" alt="Aperçu de la fiche repère de la Matériauthèque"><figcaption><a href="${RF}/fiche-repere_A4.pdf" target="_blank" rel="noopener">Fiche repère (PDF)</a></figcaption></figure>
    </div>` },
  { id: "partieA", titre: "Partie A · Matériauthèque", t: "16:00", conduite: "partieA", minuteur: LANCEMENT[2].duree * 60, relais: 600, auto: true, html: `
    <div class="kicker">Partie A · Je choisis le matériau de la turbine</div>
    <div class="deux">
      <div class="pile">
        <ol class="questions-fiche" start="1">
          <li>Deux critères, justifiés</li>
          <li>Mon choix : matériau, famille, sous-famille</li>
          <li>Une élimination expliquée</li>
          <li>Deux procédés : 10 000 turbines, une turbine d'essai au collège</li>
        </ol>
        ${lien(MATERIAUTHEQUE, "Ouvrir la Matériauthèque · niveau 4ᵉ", "echantillons")}
      </div>
      ${minuteur(LANCEMENT[2].duree * 60)}
    </div>
    <p class="roles js-roles">Questions 1 à 4 de la fiche. <b class="js-relais" hidden>Changez de rôle !</b></p>` },
  { id: "partieB", titre: "Partie B · mini-tableur", t: "36:00", conduite: "partieB", minuteur: LANCEMENT[3].duree * 60, auto: true, html: `
    <div class="kicker">Partie B · L'énergie grise de ma turbine</div>
    <div class="deux">
      <div class="pile">
        <ol class="questions-fiche" start="5">
          <li>La bonne définition, à cocher</li>
          <li>Masse et énergie grise, avec les unités</li>
          <li>« Combien de fois plus ? », puis l'explication</li>
        </ol>
        ${lien("energie-grise.html", "Ouvrir le mini-tableur", "barres")}
      </div>
      ${minuteur(LANCEMENT[3].duree * 60)}
    </div>` },
  { id: "bilan", titre: "Bilan : vos questions", t: "46:00", conduite: "bilan", html: `
    <div class="kicker">Vos questions ont-elles une réponse ? <span class="js-compte compte"></span></div>
    <div class="colonnes js-colonnes" data-mode="bilan">${zonesEntete("b").map((h, i) => `<section class="col" data-z="${i + 1}" style="--c:${ZONES[i].c}">${h}<ul class="js-liste"></ul></section>`).join("")}</div>
    <p class="pb-rappel"><b>Notre problématique :</b> ${PROBLEMATIQUE}</p>` },
];

// ---------------------------------------------------------------- Étapes, conduite, notes
const ETAPES = [];
DIAPOS.forEach((d, i) => { for (let s = 1; s <= (d.etapes || 1); s++) ETAPES.push([i, s]); });
const TOUT = Object.fromEntries([...CONDUITE, ...LANCEMENT].map((c) => [c.cle, c]));
const cle = (d, s) => (Array.isArray(d.conduite) ? d.conduite[s - 1] : d.conduite);
const heure = (d, s) => (Array.isArray(d.t) ? d.t[s - 1] : d.t);
// numéros d'étape du diaporama où apparaît chaque ligne de la conduite
const OU = {};
ETAPES.forEach(([i, s], k) => { const c = cle(DIAPOS[i], s); (OU[c] ||= []).push(k + 1); });
const plage = (l) => (!l ? "—" : l.length === 1 ? `${l[0]}` : `${l[0]} à ${l[l.length - 1]}`);

const tableAnticipation = `<table class="n-table"><tr><th>Famille</th><th>Questions probables</th><th>Relance si elle reste vide</th></tr>${ANTICIPATION.map(([n, qs, r]) => `<tr><td>${n} · ${ZONES[n - 1].q}</td><td>${qs.join(" · ")}</td><td>${r}</td></tr>`).join("")}</table>`;
const imprevus = (noms) => `<table class="n-table">${IMPREVUS.filter(([s]) => noms.includes(s)).map(([s, r]) => `<tr><td><b>${s}</b></td><td>${r}</td></tr>`).join("")}</table>`;
const IMPREVUS_PAR = { pari: ["A tourne quand même"], questions: ["Une classe muette", "Un binôme répond au lieu de questionner"], tri: ["Une question hors sujet"] };
const notes = ETAPES.map(([i, s], k) => {
  const d = DIAPOS[i], c = TOUT[cle(d, s)] || {};
  return `<div class="note-e" data-k="${k}"><div class="n-tete"><span class="n-t">Prévu ${heure(d, s) || "avant la classe"}${c.duree ? ` · ${c.duree} min` : ""}</span><span class="n-titre">Étape ${k + 1} · ${d.titre}</span></div>
    <div class="n-cols"><div><h4>Ce que fait le professeur</h4><p>${c.fait || ""}</p></div><div><h4>Phrases exactes</h4><p>${c.dit || ""}</p></div></div>
    ${d.anticipation ? tableAnticipation : ""}${IMPREVUS_PAR[c.cle] ? imprevus(IMPREVUS_PAR[c.cle]) : ""}</div>`;
}).join("");

// Écran 0 : la conduite complète, reliée aux étapes du diaporama et aux documents
const lignes = [...CONDUITE.filter((c) => c.cle !== "avant"), ...LANCEMENT];
DIAPOS[0].html = `
    <div class="kicker">Conduite de la séance A8 · avant la classe</div>
    <div class="conduite-g">
      <table class="tl"><tr><th>Prévu</th><th>Moment</th><th>Étapes</th></tr>
        ${lignes.map((c) => `<tr><td class="t">${c.t}</td><td>${{ lettre: "La lettre du fabricant", mains: "Les turbines passent de main en main", pari: "Le pari, puis la démonstration", questions: "Le jeu des questions (3 min)", tri: "Le tri au tableau (3 min)", revelation: "Les 4 familles, relances si besoin", probleme: "La problématique", transition: "Photo du tableau, saisie des questions", clip: "La capsule de méthode", repere: "Fiche élève, fiche repère, rôles", partieA: "Partie A · Matériauthèque (20 min)", partieB: "Partie B · mini-tableur (10 min)", bilan: "Bilan : vos questions" }[c.cle]}</td><td><button type="button" class="aller" data-aller="${(OU[c.cle] || [1])[0]}">${plage(OU[c.cle])}</button></td></tr>`).join("")}
      </table>
      <div class="pile-d">
        <h3>Avant la classe</h3>
        <p>${CONDUITE[0].fait}</p>
        <h3>Documents</h3>
        <p class="docs-l"><a href="${R}/deroule_professeur.pdf" target="_blank" rel="noopener">Déroulé (2 p.)</a> · <a href="${R}/lettre_fabricant.pdf" target="_blank" rel="noopener">Lettre</a> · <a href="${R}/lettre_fabricant_FALC.pdf" target="_blank" rel="noopener">Lettre facile à lire</a> · <a href="${R}/cartes_amorce.pdf" target="_blank" rel="noopener">Cartes d'amorce</a> · <a href="${R}/cartes_amorce_adaptees.pdf" target="_blank" rel="noopener">Cartes adaptées</a> · <a href="${R}/plateau_A5.pdf" target="_blank" rel="noopener">Plateau A5</a> · <a href="${R}/etiquettes_tableau.pdf" target="_blank" rel="noopener">Étiquettes du tableau</a> · <a href="${R}/cartes_relance.pdf" target="_blank" rel="noopener">Relances et sachet</a> · <a href="${R}/releve_questions.pdf" target="_blank" rel="noopener">Relevé</a> · <a href="${RF}/fiche-repere_A4.pdf" target="_blank" rel="noopener">Fiche repère</a> · <a href="${R}/03_fabrication_et_test.md" target="_blank" rel="noopener">Turbines : fabrication et test</a></p>
        <h3>Réglages</h3>
        <p><label class="case"><input type="checkbox" class="js-auto" checked> Minuteurs lancés automatiquement à l'arrivée sur leur écran</label></p>
        <p><button type="button" class="bt js-seance-raz">Remettre l'horloge de séance à zéro</button> <span class="info">L'horloge démarre à la première page de la lettre.</span></p>
      </div>
    </div>`;

// ---------------------------------------------------------------- Page
const CSS_DIAPO = `
.band{gap:24px}
.band .phase{flex:1;text-align:center;color:#fff;font-weight:700}
.barre .points{gap:5px}
.barre .points button{width:22px}
.band .horloge{font-variant-numeric:tabular-nums;color:#bcd2ee;min-width:270px;text-align:right}
.band .horloge b{color:#fff}
.ecran.prof{background:#fffdf5}
/* Écran de conduite */
.conduite-g{display:grid;grid-template-columns:780px 1fr;gap:36px;flex:1;min-height:0}
.tl{border-collapse:collapse;width:100%;font-size:20px}
.tl th{background:var(--navy);color:#fff;text-align:left;padding:4px 8px;font-size:18px}
.tl td{border-bottom:2px solid #dbe5f0;padding:3px 8px;line-height:1.15}
.tl td.t{font-weight:700;color:var(--navy);font-variant-numeric:tabular-nums;width:90px}
.aller{border:2px solid var(--blue);background:#fff;color:var(--navy);border-radius:8px;font:700 18px Luciole,Arial,sans-serif;padding:0 8px;cursor:pointer}
.pile-d h3{font-size:22px;color:var(--navy);margin:0 0 2px}
.pile-d p{font-size:18px;line-height:1.3;margin:0 0 10px}
.docs-l a{color:var(--blue);font-weight:700}
.case{display:inline-flex;gap:10px;align-items:center}
.case input{width:24px;height:24px}
.info{font-size:18px;color:var(--grey)}
/* Documents en diapositive */
.docs{display:grid;grid-template-columns:1fr 1fr 300px;gap:30px;flex:1;min-height:0;align-items:start}
.docs figure,.apercu{margin:0;display:flex;flex-direction:column;align-items:center;gap:10px;min-height:0}
.docs img{max-width:100%;max-height:560px;border:2px solid #c9d3df;border-radius:8px;background:#fff;box-shadow:0 3px 10px rgba(31,56,100,.1)}
.docs figcaption,.apercu figcaption{font-size:34px;font-weight:700;color:var(--navy);text-align:center;line-height:1.15}
.postits{display:flex;flex-direction:column;align-items:center;gap:14px;font-size:40px;font-weight:700;color:var(--navy);text-align:center;align-self:center}
.deux-l{grid-template-columns:1fr 470px}
.apercu img{max-height:520px;max-width:100%;border:2px solid #c9d3df;border-radius:8px;background:#fff}
.apercu figcaption a{color:var(--blue)}
.apercu figcaption{padding-bottom:10px}
.pile{display:flex;flex-direction:column;gap:26px;align-items:flex-start}
.note{font-size:34px;color:var(--grey)}
.roles-l{list-style:none;margin:0;padding:0;display:grid;gap:18px}
.roles-l li{display:flex;align-items:center;gap:20px;font-size:44px;line-height:1.15;color:var(--navy)}
.questions-fiche{margin:0;padding-left:64px;font-size:46px;font-weight:700;line-height:1.15;color:var(--navy);display:grid;gap:12px}
.questions-fiche li::marker{color:var(--blue)}
.lien{font-size:34px}
.lien .ext{font-size:30px;color:var(--blue)}
/* Relances */
.relances{display:grid;grid-template-columns:1fr 1fr;gap:24px;flex:1;min-height:0}
.rel{display:flex;align-items:center;gap:26px;background:#fff;border:4px solid var(--navy);border-radius:20px;padding:0 30px;font-size:52px;font-weight:700;line-height:1.12;color:var(--navy)}
/* Vos questions / bilan */
.classe-bar{display:flex;align-items:center;gap:16px;margin-bottom:10px;font-size:28px;font-weight:700;color:var(--navy)}
.classe-bar input{font:700 28px Luciole,Arial,sans-serif;width:180px;padding:4px 10px;border:3px solid var(--blue);border-radius:10px}
.colonnes{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;flex:1;min-height:0}
.col{display:flex;flex-direction:column;background:#fff;border:4px solid var(--c);border-radius:16px;padding:10px 12px;min-height:0;min-width:0}
.zt{display:flex;align-items:flex-start;gap:10px;font-size:28px;font-weight:700;line-height:1.1;color:var(--navy);padding-bottom:8px;border-bottom:3px solid var(--c);margin-bottom:8px}
.pastille{flex:none;width:46px;height:26px;border-radius:6px;overflow:hidden;margin-top:2px}
.pastille svg{display:block;width:100%;height:100%}
.col ul{list-style:none;margin:0;padding:0;flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:8px}
.col li{font-size:var(--fq,32px);line-height:1.18;background:var(--lighter);border-radius:10px;padding:6px 10px;display:flex;gap:8px;align-items:flex-start}
.col li span{flex:1;min-width:0;overflow-wrap:anywhere}
.col li button{flex:none;border:0;background:transparent;font:700 26px Luciole,Arial,sans-serif;color:#8a1c1c;cursor:pointer;padding:0 4px}
.col li.ok{background:#e6f4ea}
.col li .marque{flex:none;width:34px;text-align:center;font-weight:700;color:#1E6B3A;font-size:1.1em}
.ajout{font:400 24px Luciole,Arial,sans-serif;border:2px dashed #7d8a99;border-radius:10px;padding:6px 10px;margin-top:8px}
.compte{font-size:36px;color:var(--grey);margin-left:16px}
.pb-rappel{font-size:28px;color:var(--navy);margin-top:10px}
[data-mode="bilan"] li{cursor:pointer}
/* Notes du professeur (touche N) */
.notes{position:absolute;left:0;right:0;bottom:72px;max-height:62%;overflow:auto;background:#fffdf0;border-top:4px solid #8a6400;box-shadow:0 -6px 18px rgba(0,0,0,.18);padding:14px 40px 18px;display:none;z-index:5}
.notes.on{display:block}
.note-e{display:none}.note-e.on{display:block}
.n-tete{display:flex;gap:24px;align-items:baseline;margin-bottom:6px}
.n-t{font-size:24px;font-weight:700;color:#5a3b00;background:#FFF1C2;border-radius:8px;padding:2px 12px}
.n-titre{font-size:22px;color:var(--grey);font-weight:700}
.n-cols{display:grid;grid-template-columns:1fr 1fr;gap:30px}
.n-cols h4{margin:0 0 4px;font-size:20px;color:var(--navy)}
.n-cols p{font-size:21px;line-height:1.35}
.notes q{font-style:italic;color:#0d2b5e}
.n-table{border-collapse:collapse;width:100%;margin-top:10px;font-size:19px}
.n-table td,.n-table th{border:1px solid #d9c98f;padding:4px 8px;text-align:left;vertical-align:top}
.n-table th{background:#f5ecc8}
`;

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>P11 — Activité 8 : diaporama de conduite</title>
<!-- Page générée par ${R}/outils/generer_diaporama.mjs : modifier le générateur, pas ce fichier. -->
<style>
/* Diaporama de conduite : scène 1600 × 900. Écrans des élèves repris de declencheur.html (texte ≥ 48 px) ;
   notes du professeur (touche N) tirées de la même conduite que le déroulé PDF. Aucune dépendance externe. */
${CSS}${CSS_DIAPO}
</style>
</head>
<body>
<div class="scene" id="scene">
  <div class="band"><span><span class="k">TECHNOLOGIE · 4ᵉ ·</span> P11 · Activité 8</span><span class="phase" id="phase"></span><span class="horloge" id="horloge">Séance <b>—</b></span></div>
  <main class="ecrans">
${DIAPOS.map((d) => `    <section class="ecran${d.prof ? " prof" : ""}" id="${d.id}" data-titre="${d.titre}" data-etapes="${d.etapes || 1}"${d.minuteur ? ` data-minuteur="${d.minuteur}"` : ""}${d.relais ? ` data-relais="${d.relais}"` : ""}${d.auto ? ` data-auto="1"` : ""} aria-label="${d.titre}">${insec(d.html)}
    </section>`).join("\n")}
  </main>
  <aside class="notes" id="notes" aria-label="Notes du professeur">${insec(notes)}</aside>
  <nav class="barre" aria-label="Navigation du professeur">
    <button class="bt" id="btPrec" type="button" aria-label="Étape précédente" title="Étape précédente (flèche gauche)">◀</button>
    <div class="points" id="points"></div>
    <span class="compteur" id="compteur" aria-live="polite"></span>
    <button class="bt" id="btSuiv" type="button" aria-label="Étape suivante" title="Étape suivante (espace ou flèche droite)">▶</button>
    <button class="bt" id="btNotes" type="button" aria-pressed="false" title="Notes du professeur (touche N)">Notes</button>
    <span class="aide" title="Espace ou → : suivant · ← : précédent · N : notes · Entrée : minuteur · R : remise à zéro · A : audio · L : facile à lire · F : plein écran · Début : conduite">Espace → suivant · N notes · Entrée minuteur · F plein écran<br>
      R.Blanchard · <a href="./">accueil</a></span>
    <button class="bt" id="btPlein" type="button" title="Plein écran (touche F)">⛶</button>
  </nav>
</div>
<audio id="audio" preload="none" src="${R}/lettre_fabricant.wav"></audio>
<script>
/* ==========================================================================
   P11 · Activité 8 — Diaporama de conduite
   L'étape est dans l'adresse (#1 à #${ETAPES.length}). Minuteurs sur l'horloge (Date.now), affichés par setInterval.
   Minuteurs automatiques : lancés une seule fois, à la première arrivée sur leur écran (réglage sur l'écran 1).
   Horloge de séance : démarre à la première page de la lettre, gardée pour l'onglet (sessionStorage).
   Questions de la classe : localStorage de ce poste, par nom de classe ; la classe affichée n'est gardée que pour l'onglet,
   un nouvel onglet repart vide (pas de reprise de la classe précédente). Rien n'est envoyé.
   ========================================================================== */
(function(){
  var L = 1600, H = 900;
  var ETAPES = ${JSON.stringify(ETAPES)};
  var HEURES = ${JSON.stringify(ETAPES.map(([i, s]) => heure(DIAPOS[i], s) || ""))};
  var PHASES = ${JSON.stringify(ETAPES.map(([i, s]) => { const d = DIAPOS[i]; return d.prof ? "Écran du professeur" : `Prévu ${heure(d, s)} · ${d.titre}`; }))};
  var IDX_LETTRE = ${ETAPES.findIndex(([i]) => DIAPOS[i].id === "lettre1")};
  var ZONES = ${JSON.stringify(ZONES.map((z) => z.q))};
  var scene = document.getElementById("scene");
  var ecrans = Array.prototype.slice.call(document.querySelectorAll(".ecran"));
  var points = document.getElementById("points");
  var btPrec = document.getElementById("btPrec"), btSuiv = document.getElementById("btSuiv");
  var audio = document.getElementById("audio");
  var notes = document.getElementById("notes"), btNotes = document.getElementById("btNotes");
  var courant = -1, falcOn = false;
  var SS = window.sessionStorage, LS = window.localStorage;
  function lire(st, k, def){ try { var v = st.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } }
  function ecrire(st, k, v){ try { st.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function ajuster(){
    var w = window.innerWidth, h = window.innerHeight, s = Math.min(w / L, h / H);
    scene.style.transform = "translate(" + ((w - L * s) / 2) + "px," + ((h - H * s) / 2) + "px) scale(" + s + ")";
  }
  function mmss(ms){ var s = Math.round(Math.abs(ms) / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function enMs(t){ var p = String(t).split(":"); return p.length === 2 ? (+p[0] * 60 + +p[1]) * 1000 : null; }

  /* ---- Horloge de séance ---- */
  function majHorloge(){
    var debut = lire(SS, "a8-seance-debut", null), el = document.getElementById("horloge");
    if (!debut){ el.innerHTML = "Séance <b>—</b>"; return; }
    var ecoule = Date.now() - debut, prevu = enMs(HEURES[courant] || "");
    var txt = "Séance <b>" + mmss(ecoule) + "</b>";
    if (prevu !== null){ var d = ecoule - prevu; txt += Math.abs(d) < 30000 ? " · à l'heure" : (d > 0 ? " · retard " : " · avance ") + (Math.abs(d) < 30000 ? "" : mmss(d)); }
    el.innerHTML = txt;
  }
  document.querySelector(".js-seance-raz").onclick = function(){ try { SS.removeItem("a8-seance-debut"); } catch (e) {} majHorloge(); };
  var autoBox = document.querySelector(".js-auto");
  autoBox.checked = lire(SS, "a8-auto", true);
  autoBox.onchange = function(){ ecrire(SS, "a8-auto", autoBox.checked); };

  /* ---- Minuteurs ---- */
  var minuteurs = ecrans.map(function(ec){
    if (!ec.dataset.minuteur) return null;
    var d = +ec.dataset.minuteur * 1000;
    var m = { ec: ec, duree: d, relais: ec.dataset.relais ? +ec.dataset.relais * 1000 : 0, reste: d, fin: 0, marche: false, sonne: false, lance: false };
    ec.querySelector(".js-go").onclick = function(ev){ basculer(m); if (ev.detail) this.blur(); };
    ec.querySelector(".js-raz").onclick = function(ev){ raz(m); if (ev.detail) this.blur(); };
    afficher(m);
    return m;
  });
  function restant(m){ return m.marche ? Math.max(0, m.fin - Date.now()) : m.reste; }
  function basculer(m){
    if (restant(m) === 0) raz(m);
    if (m.marche){ m.reste = restant(m); m.marche = false; }
    else { m.fin = Date.now() + m.reste; m.marche = true; m.lance = true; }
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
  setInterval(function(){ minuteurs.forEach(function(m){ if (m && m.marche) afficher(m); }); majHorloge(); }, 250);
  function bip(){
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

  /* ---- Questions de la classe (saisie et bilan) ---- */
  var BASE = "a8-questions";
  function toutes(){ return lire(LS, BASE, {}); }
  function classe(){ return lire(SS, "a8-classe", ""); }
  function donnees(){ var c = classe(), t = toutes(); return c && t[c] ? t[c] : {1: [], 2: [], 3: [], 4: []}; }
  function sauver(d){ var c = classe(); if (!c) return false; var t = toutes(); t[c] = d; ecrire(LS, BASE, t); return true; }
  function info(t){ document.querySelectorAll(".js-info").forEach(function(e){ e.textContent = t; }); }
  function rendre(){
    var d = donnees(), c = classe(), total = 0, ok = 0;
    document.querySelectorAll(".js-nom-classe").forEach(function(e){ e.textContent = c ? "· " + c : ""; });
    document.querySelectorAll(".js-classe").forEach(function(e){ if (document.activeElement !== e) e.value = c; });
    var dl = document.getElementById("classes-a8"); dl.innerHTML = "";
    Object.keys(toutes()).sort().forEach(function(n){ var o = document.createElement("option"); o.value = n; dl.appendChild(o); });
    document.querySelectorAll(".js-colonnes").forEach(function(cols){
      var bilan = cols.dataset.mode === "bilan";
      cols.querySelectorAll(".col").forEach(function(col){
        var z = col.dataset.z, ul = col.querySelector(".js-liste"), l = d[z] || [];
        ul.innerHTML = "";
        ul.style.setProperty("--fq", l.length > 6 ? "26px" : l.length > 4 ? "29px" : "32px");
        l.forEach(function(q, i){
          if (bilan){ total++; if (q.ok) ok++; }
          var li = document.createElement("li"), s = document.createElement("span");
          s.textContent = q.t; if (bilan && q.ok) li.className = "ok";
          if (bilan){
            var mq = document.createElement("span"); mq.className = "marque"; mq.textContent = q.ok ? "✓" : "?"; mq.title = q.ok ? "Réponse trouvée" : "Pas encore de réponse";
            li.appendChild(s); li.appendChild(mq); li.tabIndex = 0; li.setAttribute("role", "button");
            li.setAttribute("aria-pressed", String(!!q.ok)); li.setAttribute("aria-label", q.t + (q.ok ? " : réponse trouvée" : " : pas encore de réponse"));
            li.onclick = function(){ var dd = donnees(); dd[z][i].ok = !dd[z][i].ok; sauver(dd); rendre(); };
            li.onkeydown = function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); e.stopPropagation(); li.onclick(); } };
          } else {
            var x = document.createElement("button"); x.type = "button"; x.textContent = "×"; x.title = "Retirer cette question";
            x.setAttribute("aria-label", "Retirer : " + q.t);
            x.onclick = function(){ var dd = donnees(); dd[z].splice(i, 1); sauver(dd); rendre(); };
            li.appendChild(s); li.appendChild(x);
          }
          ul.appendChild(li);
        });
      });
    });
    document.querySelectorAll(".js-compte").forEach(function(e){ e.textContent = total ? ok + " / " + total + " ont une réponse" : (c ? "" : "(choisir la classe sur l'écran « Vos questions »)"); });
  }
  document.querySelectorAll(".js-classe").forEach(function(inp){
    inp.addEventListener("change", function(){ ecrire(SS, "a8-classe", inp.value.trim()); info(inp.value.trim() ? "" : "Indiquez la classe pour enregistrer."); rendre(); });
  });
  document.querySelectorAll(".js-ajout").forEach(function(inp){
    inp.addEventListener("keydown", function(e){
      if (e.key !== "Enter") return;
      e.preventDefault(); e.stopPropagation();
      var t = inp.value.trim(); if (!t) return;
      if (!classe()){ info("Indiquez d'abord la classe."); return; }
      var d = donnees(), z = inp.closest(".col").dataset.z; (d[z] = d[z] || []).push({ t: t, ok: false });
      sauver(d); inp.value = ""; rendre();
    });
  });
  document.querySelector(".js-copier").onclick = function(){
    var c = classe(), d = donnees(); if (!c){ info("Indiquez d'abord la classe."); return; }
    var lignes = ["A8 · questions de la classe " + c + " · " + new Date().toLocaleDateString("fr-FR")];
    ZONES.forEach(function(q, i){ lignes.push("", (i + 1) + " · " + q); (d[i + 1] || []).forEach(function(x){ lignes.push("- " + x.t + (x.ok ? " (réponse trouvée)" : "")); }); });
    var txt = lignes.join("\\n");
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function(){ info("Relevé copié."); }, function(){ info("Copie impossible ici."); });
  };
  document.querySelector(".js-effacer").onclick = function(){
    var c = classe(); if (!c) return;
    if (!confirm("Effacer toutes les questions de la classe " + c + " sur ce poste ?")) return;
    var t = toutes(); delete t[c]; ecrire(LS, BASE, t); rendre(); info("Classe " + c + " effacée.");
  };

  /* ---- Notes du professeur ---- */
  function basculerNotes(){ var on = !notes.classList.contains("on"); notes.classList.toggle("on", on); btNotes.setAttribute("aria-pressed", String(on)); }
  btNotes.onclick = function(ev){ basculerNotes(); if (ev.detail) btNotes.blur(); };

  /* ---- Navigation ---- */
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
        x.classList.toggle("on", ec.id === "defi" ? v === s : v <= s);
      });
    });
    document.querySelectorAll(".note-e").forEach(function(x){ x.classList.toggle("on", +x.dataset.k === n); });
    document.getElementById("phase").textContent = PHASES[n];
    if (n >= IDX_LETTRE && IDX_LETTRE >= 0 && !lire(SS, "a8-seance-debut", null)) ecrire(SS, "a8-seance-debut", Date.now());
    var m = minuteurs[e];
    if (m && ecrans[e].dataset.auto && autoBox.checked && !m.lance) basculer(m);
    Array.prototype.forEach.call(points.children, function(p, k){ p.className = k < n ? "fait" : ""; p.setAttribute("aria-current", String(k === n)); });
    document.getElementById("compteur").textContent = (n + 1) + " / " + ETAPES.length;
    btPrec.disabled = n === 0; btSuiv.disabled = n === ETAPES.length - 1;
    majHorloge(); rendre();
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
  document.querySelectorAll("[data-aller]").forEach(function(b){ b.onclick = function(ev){ aller(+b.dataset.aller - 1); if (ev.detail) b.blur(); }; });
  btPrec.onclick = function(ev){ aller(courant - 1); if (ev.detail) btPrec.blur(); };
  btSuiv.onclick = function(ev){ aller(courant + 1); if (ev.detail) btSuiv.blur(); };
  document.getElementById("btPlein").onclick = function(ev){ pleinEcran(); if (ev.detail) this.blur(); };

  document.addEventListener("keydown", function(e){
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    var t = e.target, k = e.key;
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) { if (k === "Escape") t.blur(); return; }   // saisie : pas de raccourci
    var surBouton = t && (/^(A|BUTTON)$/.test(t.tagName) || t.getAttribute("role") === "button");
    if ((k === " " || k === "Enter") && surBouton) return;
    var m = minuteurCourant();
    if (k === " " || k === "ArrowRight" || k === "ArrowDown" || k === "PageDown") aller(courant + 1);
    else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || k === "Backspace") aller(courant - 1);
    else if (k === "Enter") { if (m) basculer(m); else aller(courant + 1); }
    else if ((k === "r" || k === "R") && m) raz(m);
    else if (k === "a" || k === "A") basculerAudio();
    else if (k === "l" || k === "L") basculerFalc();
    else if (k === "n" || k === "N") basculerNotes();
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
fs.writeFileSync(path.join(racine, "diaporama-a8.html"), html);
console.log("écrit :", path.join(racine, "diaporama-a8.html"), `(${ETAPES.length} étapes)`);
// Table de correspondance conduite → étapes (contrôle de cohérence)
for (const c of [...CONDUITE, ...LANCEMENT]) if (c.cle !== "avant" && !OU[c.cle]) console.log("ATTENTION : la ligne de conduite", c.cle, "n'a pas d'écran");
