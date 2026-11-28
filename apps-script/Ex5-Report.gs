/* ═══════════════════════════════════════════════════════════════════════════
   P11 — Exercice n°5 (Énergie Grise) — script du classeur du même nom
   Fichier GÉNÉRÉ par _sources/build_gs.py : ne pas le modifier à la main.

   Installation (une seule fois) :
     1. Dans le classeur : Extensions › Apps Script, coller tout ce fichier, enregistrer.
     2. Exécuter « installer » (autoriser l'accès au classeur et au classeur de l'exercice n°4, qui porte l'onglet Attributions) : en-têtes,
        liste des élèves (lue dans l'onglet Attributions), Journal, Compétences ; puis vérification.
     3. Déployer › Nouveau déploiement › Application web
        (Exécuter en tant que : Moi · Qui a accès : Tout le monde), copier l'URL /exec
        et la donner à Claude (elle va dans la capsule et dans le site).

   Ce que fait le script :
     - GET ?action=sujet&eid=… : renvoie le sujet attribué à l'élève (onglet « Attributions »
       du classeur de l'exercice n°4). Rien de secret : système, pièce, volume, quantité.
     - POST source « eleve » : la capsule envoie les réponses brutes ; le script les corrige
       avec la clé de l'onglet masqué « Clé » et le sujet de l'onglet « Attributions »,
       puis écrit réponses, points, sous-totaux et note auto sur la ligne de l'élève.
       La première copie fait foi ; le script ne renvoie jamais les points à l'élève.
     - POST source « ajustement » : le professeur a validé ou ajusté la note dans le site.
   ═══════════════════════════════════════════════════════════════════════════ */

var SECRET = "P11-EX5-2026";            // le même que dans la capsule et le site (jeton public, pas un mot de passe)
var EXERCICE = 5;          // 4 ou 5
var CLASSEUR_ATTRIBUTIONS = "1zQEMakRoidDdSYeXi1SgldUkJ7Acb73p4aHGDEeM4a8";
var CLASSES = ["4A", "4B", "4C", "4D", "4E", "4F", "4G"];
var PREMIERE_LIGNE = 4;
var QUESTIONS = [["Q1", "1.3", 1.5, "Définition de l'énergie grise"], ["Q2", "1.2", 2.0, "Étapes du cycle de vie comptées"], ["Q3", "1.3", 1.0, "Masse volumique du matériau"], ["Q4", "1.3", 1.0, "Énergie grise du matériau"], ["Q5", "1.3", 2.5, "Masse de la pièce"], ["Q6", "1.3", 2.5, "Énergie grise de la pièce"], ["Q7", "1.3", 2.5, "Énergie grise de la série (MJ)"], ["Q8", "1.3", 2.0, "La pièce dans le second matériau"], ["Q9", "1.3", 1.0, "Combien de fois plus (ou moins)"], ["Q10", "1.2", 2.0, "Conclusion pour l'environnement"], ["Q11", "1.2", 2.0, "Recyclable ou recyclé"]];        // [id, compétence, points, intitulé]
var COL = {"nom": 1, "eid": 2, "sujet": 3, "envoi": 4, "r1": 5, "p1": 16, "c12": 27, "auto": 29, "bonus": 0, "ajustee": 30, "finale": 31, "duree": 32, "adapt": 33, "statut": 34, "appr": 35, "libre": 0, "remarque": 36};                    // colonnes (1 = A)

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === "sujet") {
    var a = attributionDe(String(p.eid || ""));
    return repondre(a ? { ok: true, s: a.s, v: a.v, q: a.q, a: a.a } : { ok: false, erreur: "inconnu" });
  }
  return ContentService.createTextOutput("P11 Exercice n°" + EXERCICE + " : script de report en ligne.");
}

function doPost(e) {
  var verrou = LockService.getScriptLock();
  try {
    verrou.waitLock(25000);              // une classe entière envoie parfois dans la même minute
    var d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) return repondre({ ok: false, erreur: "secret" });
    if (d.source === "ajustement") return ajuster(d);
    return recevoirCopie(d);
  } catch (err) {
    return repondre({ ok: false, erreur: String(err) });
  } finally {
    try { verrou.releaseLock(); } catch (e2) {}
  }
}

function lireCle() {
  /* Une seule clé, dans l'onglet masqué « Clé » du classeur de l'exercice n°4 (l'exercice n°5 la lit là). */
  var ss = EXERCICE === 4 ? SpreadsheetApp.getActiveSpreadsheet() : SpreadsheetApp.openById(CLASSEUR_ATTRIBUTIONS);
  var t = ss.getSheetByName("Clé").getRange("A2").getValue();
  return JSON.parse(String(t));
}

/* Onglet « Attributions » (classeur de l'exercice n°4) : identifiant, classe, élève, sujet,
   système — pièce, volume, quantité, origine, modifié le, aides imposées (« 2 candidats », « calculs guidés »,
   « coups de pouce »). Le professeur peut changer un sujet ou imposer une aide à la main. */
function feuilleAttributions() {
  var ss = EXERCICE === 4 ? SpreadsheetApp.getActiveSpreadsheet() : SpreadsheetApp.openById(CLASSEUR_ATTRIBUTIONS);
  return ss.getSheetByName("Attributions");
}
function attributionDe(eid) {
  if (!eid) return null;
  var f = feuilleAttributions(), n = f.getLastRow();
  if (n < 2) return null;
  var v = f.getRange(2, 1, n - 1, 10).getValues();
  for (var i = 0; i < v.length; i++) {
    if (String(v[i][0]) === eid) return normaliser({ s: String(v[i][3]).trim(), v: Number(v[i][5]), q: Number(v[i][6]), a: String(v[i][9] || "") });
  }
  return null;
}
/* Sujet changé à la main dans « Attributions » sans toucher au volume : un volume hors de la plage
   du nouveau sujet (± 20 % de sa valeur de référence) est remplacé par la valeur de référence. */
function normaliser(a) {
  try {
    var ref = lireCle().ex5[a.s];
    if (ref && !(a.v >= ref.vref * 0.8 - 1e-9 && a.v <= ref.vref * 1.2 + 1e-9)) a.v = ref.vref;
  } catch (e) {}
  if (!(a.q > 0)) a.q = 10000;
  return a;
}

function classeDe(d) { return (String(d.classe || "").toUpperCase().match(/4[A-G]/) || [""])[0]; }
function classeTest(d) { return /^\s*4\s*T\s*$/i.test(String(d.classe || "")); }
function tracer(d, source, evenement, detail) {
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Journal").appendRow([new Date(), sur(String(d.classe || "(vide)")),
    sur(propre(d.eleve) || "(sans nom)"), source, evenement, sur(detail || "")]);
}

function corriger(f, cle, att) {
  return EXERCICE === 4 ? P11X45.corrigerEx4(f, cle, att) : P11X45.corrigerEx5(f, cle, att);
}

/* Réponse lisible d'une question, pour la colonne « réponse » du classeur. */
function reponseLisible(f, id) {
  var k = id.toLowerCase(), v;
  if (EXERCICE === 4 && id === "Q5") {
    v = f.q5 || {}; if (typeof v === "string") { try { v = JSON.parse(v); } catch (e) { v = {}; } }
    return Object.keys(v).map(function (c) { return c + " = " + v[c]; }).join(" ; ");
  }
  if (EXERCICE === 4 && id === "Q7") return [f.q7f, f.q7s].filter(String).join(" / ");
  if (EXERCICE === 5 && id === "Q8") return "masse " + (f.q8m || "") + " ; énergie " + (f.q8e || "");
  if (EXERCICE === 5 && id === "Q9") return (f.q9 || "") + " fois " + (f.q9s || "");
  v = f[k];
  if (f[k + "u"]) v = (v || "") + " " + f[k + "u"];
  return String(v == null ? "" : v).replace(/\|/g, " ; ").slice(0, 400);
}

function recevoirCopie(d) {
  var classe = classeDe(d), eleve = propre(d.eleve), f = d.fields || {}, eid = String(d.eid || "");
  var att = attributionDe(eid), origine = "Attributions";
  if (!att) { att = { s: String(f._sujet || ""), v: Number(f._v), q: Number(f._q) }; origine = "capsule (élève absent de l'onglet Attributions)"; }
  else if (String(f._sujet || "") && String(f._sujet) !== att.s) origine = "Attributions (la capsule affichait " + f._sujet + ")";
  var K = lireCle(), r = corriger(f, K, att);
  if (!r.points) { tracer(d, "capsule", "refusé : sujet inconnu (" + att.s + ")", ""); return repondre({ ok: false, erreur: "sujet" }); }
  var pts = QUESTIONS.map(function (q) { return nombre(r.points[q[0]], q[2]); });
  var total = Math.round(pts.reduce(function (s, p) { return s + p; }, 0) * 100) / 100;
  var resume = "auto " + QUESTIONS.map(function (q, i) { return q[0] + " " + virgule(pts[i]); }).join(" · ");
  if (classeTest(d)) {
    tracer(d, "capsule", "compte de test (4T) : copie corrigée, " + virgule(total) + "/20, non rangée", resume);
    return repondre({ ok: true, statut: "test" });
  }
  if (CLASSES.indexOf(classe) < 0) { tracer(d, "capsule", "refusé : classe non reconnue", resume); return repondre({ ok: false, erreur: "classe" }); }
  if (!eleve) { tracer(d, "capsule", "refusé : nom de l'élève vide", resume); return repondre({ ok: false, erreur: "identite" }); }
  var ss = SpreadsheetApp.getActiveSpreadsheet(), feuille = ss.getSheetByName(classe);
  var L = ligneEleve(feuille, eleve, eid), statut = L.ajoute ? "ajoute" : "note";
  var deja = feuille.getRange(L.ligne, COL.p1, 1, pts.length).getValues()[0].some(function (v) { return v !== ""; });
  if (deja) statut = "deja";
  else {
    var comp = P11X45.parCompetence(r.points, QUESTIONS);
    feuille.getRange(L.ligne, COL.eid).setValue(sur(eid));
    feuille.getRange(L.ligne, COL.sujet).setValue(sur(att.s + (EXERCICE === 5 ? " · V = " + virgule(att.v) + " cm³ · " + att.q + " pièces" : "")));
    feuille.getRange(L.ligne, COL.envoi).setValue(new Date());
    feuille.getRange(L.ligne, COL.r1, 1, QUESTIONS.length).setValues([QUESTIONS.map(function (q) { return sur(reponseLisible(f, q[0])); })]);
    feuille.getRange(L.ligne, COL.p1, 1, pts.length).setValues([pts]);
    feuille.getRange(L.ligne, COL.c12, 1, 3).setValues([[comp["1.2"] || 0, comp["1.3"] || 0, total]]);
    feuille.getRange(L.ligne, COL.finale).setValue(total);
    feuille.getRange(L.ligne, COL.duree).setValue(Math.round((Number(d.duree) || 0) / 60000));
    feuille.getRange(L.ligne, COL.adapt).setValue(sur(String(d.adaptations || "aucune")));
    feuille.getRange(L.ligne, COL.statut).setValue("envoyée");
    if (EXERCICE === 4 && f.libre) feuille.getRange(L.ligne, COL.libre).setValue(sur(String(f.libre).slice(0, 600)));
    feuille.getRange(L.ligne, COL.remarque).setValue(sur((L.ajoute ? "Ajouté par l'envoi de la capsule : vérifier le nom. " : "") +
      (origine === "Attributions" ? "" : "Sujet pris dans : " + origine)));
  }
  ss.getSheetByName("Journal").appendRow([new Date(), classe, sur(eleve), "capsule",
    statut === "deja" ? "déjà noté : envoi ignoré (la première copie fait foi)" : (statut === "ajoute" ? "noté, élève ajouté en bas" : "noté"),
    sur(resume + " · sujet " + att.s + " (" + origine + ")")]);
  return repondre({ ok: true, statut: statut });   // jamais les points : le script n'est pas un oracle de réponses
}

function ajuster(d) {
  var classe = classeDe(d), eleve = propre(d.eleve), p = d.pts || {};
  var pts = QUESTIONS.map(function (q) { return nombre(p[q[0]], q[2]); });
  var detail = QUESTIONS.map(function (q, i) { return q[0] + " " + virgule(pts[i]); }).join(" · ");
  if (classeTest(d)) { tracer(d, "professeur", "compte de test (4T) : ajustement non rangé", detail); return repondre({ ok: true, statut: "test" }); }
  if (CLASSES.indexOf(classe) < 0) { tracer(d, "professeur", "refusé : classe non reconnue", detail); return repondre({ ok: false, erreur: "classe" }); }
  if (!eleve) { tracer(d, "professeur", "refusé : nom de l'élève vide", detail); return repondre({ ok: false, erreur: "identite" }); }
  var ss = SpreadsheetApp.getActiveSpreadsheet(), feuille = ss.getSheetByName(classe);
  var L = ligneEleve(feuille, eleve, String(d.eid || ""));
  var bonus = Math.max(0, Math.min(Number(d.bonus) || 0, 0));
  var note = Math.max(0, Math.min(20, Math.round(Number(d.note) * 100) / 100));
  if (isNaN(note)) note = Math.min(20, pts.reduce(function (s, x) { return s + x; }, 0) + bonus);
  feuille.getRange(L.ligne, COL.p1, 1, pts.length).setValues([pts]);
  if (COL.bonus) feuille.getRange(L.ligne, COL.bonus).setValue(bonus);
  feuille.getRange(L.ligne, COL.ajustee).setValue(note);
  feuille.getRange(L.ligne, COL.finale).setValue(note);
  feuille.getRange(L.ligne, COL.statut).setValue("validée");
  feuille.getRange(L.ligne, COL.appr).setValue(sur(String(d.appreciation || "").slice(0, 1000)));
  if (!feuille.getRange(L.ligne, COL.envoi).getValue()) feuille.getRange(L.ligne, COL.envoi).setValue(new Date());
  ss.getSheetByName("Journal").appendRow([new Date(), classe, sur(eleve), "professeur",
    "validée " + virgule(note) + "/20" + (bonus ? " (bonus " + virgule(bonus) + ")" : ""), sur(detail)]);
  return repondre({ ok: true, statut: "ajuste", ligne: L.ligne });
}

/* ── outils (repris des scripts de l'évaluation n°2) ── */
function repondre(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function propre(s) { return String(s || "").replace(/\s+/g, " ").trim().slice(0, 60); }
function sur(s) { s = String(s == null ? "" : s); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function virgule(x) { return String(Math.round(Number(x) * 100) / 100).replace(".", ","); }
function nombre(v, max) { var x = Number(v); return isNaN(x) ? 0 : Math.max(0, Math.min(max, Math.round(x * 100) / 100)); }
function sansAccents(s) {
  return s.normalize("NFD").split("").filter(function (c) { var k = c.charCodeAt(0); return k < 768 || k > 879; }).join("");
}
function mots(s) {
  return sansAccents(String(s || "").toLowerCase()).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(function (m) { return m; });
}
/* L'identifiant du compte (colonne B) fait foi ; à défaut, tous les mots du nom (deux candidats : ambigu). */
function ligneEleve(feuille, eleve, eid) {
  var derniere = Math.max(feuille.getLastRow(), PREMIERE_LIGNE);
  var v = feuille.getRange(PREMIERE_LIGNE, 1, derniere - PREMIERE_LIGNE + 1, 2).getValues();
  for (var i = 0; i < v.length; i++) if (eid && String(v[i][1]) === eid) return { ligne: PREMIERE_LIGNE + i, ajoute: false };
  var cherche = mots(eleve), trouve = -1, n = 0, libre = -1;
  for (i = 0; i < v.length; i++) {
    var cellule = mots(v[i][0]);
    if (!cellule.length) { if (libre < 0) libre = PREMIERE_LIGNE + i; continue; }
    if (cherche.every(function (m) { return cellule.indexOf(m) >= 0; })) { trouve = PREMIERE_LIGNE + i; n++; }
  }
  if (n === 1) return { ligne: trouve, ajoute: false };
  var ligne = libre > 0 ? libre : derniere + 1;
  feuille.getRange(ligne, COL.nom).setValue(sur(eleve)).setBackground("#FCE4D6");
  return { ligne: ligne, ajoute: true };
}

/* ── installation ── */
var ENTETE = [["P11 — Exercice n°5 (Énergie Grise) — 1.2 : Décrire les interactions entre un objet ou un système technique, son environnement et les utilisateurs · 1.3 : Caractériser et choisir un objet ou un système technique selon différents critères", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["Élève", "Identifiant", "Sujet", "Envoi", "Rép. Q1", "Rép. Q2", "Rép. Q3", "Rép. Q4", "Rép. Q5", "Rép. Q6", "Rép. Q7", "Rép. Q8", "Rép. Q9", "Rép. Q10", "Rép. Q11", "Pts Q1", "Pts Q2", "Pts Q3", "Pts Q4", "Pts Q5", "Pts Q6", "Pts Q7", "Pts Q8", "Pts Q9", "Pts Q10", "Pts Q11", "Sous-total 1.2", "Sous-total 1.3", "Note auto /20", "Note ajustée /20", "Note finale /20", "Durée (min)", "Adaptations", "Statut", "Appréciation", "Remarque"], ["Barème →", "", "", "", "Définition de l'énergie grise", "Étapes du cycle de vie comptées", "Masse volumique du matériau", "Énergie grise du matériau", "Masse de la pièce", "Énergie grise de la pièce", "Énergie grise de la série (MJ)", "La pièce dans le second matériau", "Combien de fois plus (ou moins)", "Conclusion pour l'environnement", "Recyclable ou recyclé", "/1,5 (1.3)", "/2 (1.2)", "/1 (1.3)", "/1 (1.3)", "/2,5 (1.3)", "/2,5 (1.3)", "/2,5 (1.3)", "/2 (1.3)", "/1 (1.3)", "/2 (1.2)", "/2 (1.2)", "/6", "/14", "/20", "", "", "", "", "", "", ""]];             // lignes 1 à 3 de chaque onglet de classe
var COMPETENCES = [["Code", "Compétence (BO n°9 du 29/02/2024)", "Questions", "Points"], ["1.3", "Caractériser et choisir un objet ou un système technique selon différents critères", "Q1, Q3, Q4, Q5, Q6, Q7, Q8, Q9", 14.0], ["1.2", "Décrire les interactions entre un objet ou un système technique, son environnement et les utilisateurs", "Q2, Q10, Q11", 6.0]];
/* Prépare le classeur : en-têtes des onglets de classe, liste des élèves (lue dans « Attributions »),
   Journal et Compétences. Ne touche jamais à une ligne d'élève déjà présente. Relançable sans risque. */
function installer() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), A = feuilleAttributions();
  var att = A.getRange(2, 1, Math.max(A.getLastRow() - 1, 1), 3).getValues().filter(function (l) { return l[0]; });
  CLASSES.forEach(function (c) {
    var f = ss.getSheetByName(c) || ss.insertSheet(c);
    if (f.getMaxColumns() < ENTETE[1].length) f.insertColumnsAfter(f.getMaxColumns(), ENTETE[1].length - f.getMaxColumns());
    f.getRange(1, 1, 3, ENTETE[1].length).setValues(ENTETE);
    f.getRange(1, 1, 1, ENTETE[1].length).setFontWeight("bold");
    f.getRange(2, 1, 1, ENTETE[1].length).setFontWeight("bold").setBackground("#DEEAF6").setWrap(true);
    f.getRange(3, 1, 1, ENTETE[1].length).setFontStyle("italic").setFontColor("#5b6472").setWrap(true);
    f.setFrozenRows(3); f.setFrozenColumns(1);
    var deja = f.getLastRow() >= PREMIERE_LIGNE ? f.getRange(PREMIERE_LIGNE, 2, f.getLastRow() - PREMIERE_LIGNE + 1, 1).getValues().map(function (l) { return String(l[0]); }) : [];
    var nouveaux = att.filter(function (l) { return l[1] === c && deja.indexOf(String(l[0])) < 0; }).map(function (l) { return [l[2], l[0]]; });
    if (nouveaux.length) f.getRange(Math.max(f.getLastRow() + 1, PREMIERE_LIGNE), 1, nouveaux.length, 2).setValues(nouveaux);
  });
  var j = ss.getSheetByName("Journal") || ss.insertSheet("Journal");
  if (!j.getRange(1, 1).getValue()) j.getRange(1, 1, 1, 6).setValues([["Date", "Classe", "Élève", "Source", "Événement", "Détail"]]).setFontWeight("bold");
  var k = ss.getSheetByName("Compétences") || ss.insertSheet("Compétences");
  k.getRange(1, 1, COMPETENCES.length, COMPETENCES[0].length).setValues(COMPETENCES);
  k.getRange(1, 1, 1, COMPETENCES[0].length).setFontWeight("bold");
  verifierInstallation();
}
function verifierInstallation() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), manque = [];
  CLASSES.concat(["Journal", "Compétences"]).forEach(function (n) { if (!ss.getSheetByName(n)) manque.push(n); });
  var K = null; try { K = lireCle(); } catch (e) { manque.push("clé illisible (onglet Clé, cellule A2)"); }
  var A = null; try { A = feuilleAttributions(); } catch (e) { manque.push("onglet Attributions introuvable"); }
  if (A === null) manque.push("onglet Attributions introuvable");
  var msg = manque.length ? "Manque : " + manque.join(", ")
    : "Classeur, clé et attributions en place (" + (A.getLastRow() - 1) + " élèves ; copie vide = " +
      P11X45.total(corriger({}, K, attributionDe(String(A.getRange(2, 1).getValue()))).points) + " point).";
  ss.toast(msg, "Exercice n°" + EXERCICE, 10); Logger.log(msg);
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu("P11 Exercice " + EXERCICE)
    .addItem("Préparer le classeur (en-têtes, élèves)", "installer")
    .addItem("Vérifier l'installation", "verifierInstallation")
    .addToUi();
}

/* P11 4e — Exercices n°4 (choix du matériau) et n°5 (énergie grise) : CORRECTION (module commun).
   Recopié tel quel par les générateurs dans index.html (tableau de bord du professeur) et dans
   Ex4-Report.gs / Ex5-Report.gs (scripts des classeurs). Ce module ne contient QUE des règles :
   les réponses attendues sont dans la clé (onglet masqué « Clé » du classeur, corrigé chiffré).
   ES5, sans dépendance.
   f   : champs envoyés par la capsule (fields) ;  cle : clé complète (voir build_cle dans contenu) ;
   att : { s: identifiant du sujet, v: volume (cm³), q: quantité } — l'attribution qui fait foi. */
var P11X45 = (function () {
  function nombre(x) {
    if (x === null || x === undefined) return NaN;
    var t = String(x).replace(/\s| | /g, "").replace(",", ".");
    if (!/^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(t)) return NaN;
    return parseFloat(t);
  }
  function proche(x, attendu, tol) {
    x = nombre(x);
    if (isNaN(x) || !isFinite(attendu)) return false;
    if (attendu === 0) return Math.abs(x) < 1e-9;
    return Math.abs(x - attendu) <= Math.abs(attendu) * tol + 1e-9;
  }
  function liste(v) {
    if (Array.isArray(v)) return v.map(String);
    if (v === undefined || v === null || v === "") return [];
    return String(v).split("|").filter(function (x) { return x !== ""; });
  }
  function r2(x) { return Math.round(x * 100) / 100; }
  function somme(pts, ids) { return ids.reduce(function (t, k) { return t + (Number(pts[k]) || 0); }, 0); }

  /* ─────────────────────────── exercice n°4 ─────────────────────────── */
  function corrigerEx4(f, cle, att) {
    f = f || {};
    var pts = {}, detail = {};
    if (!cle || !cle.ex4 || !att || !cle.ex4[att.s]) return { points: null, detail: { erreur: "cle" } };
    var K = cle.ex4[att.s], MAT = cle.materiaux;
    var b = cle.bareme4;
    pts.Q1 = f.q1 === K.q1 ? b.Q1 : 0;
    pts.Q2 = f.q2 === K.q2 ? b.Q2 : 0;
    pts.Q3 = f.q3 === K.q3 ? b.Q3 : 0;
    var coches = liste(f.q4), vp = 0, fp = 0;
    coches.forEach(function (id) { if (K.q4.indexOf(id) >= 0) vp++; else fp++; });
    pts.Q4 = Math.max(0, Math.min(b.Q4, (vp - fp) * b.Q4 / K.q4.length));
    detail.Q4 = { justes: vp, fausses: fp };
    /* Q5 : relevé, case par case, sur les candidats que l'élève a vus (2 en mode adapté). */
    var cand = liste(f._candidats).filter(function (id) { return K.candidats.indexOf(id) >= 0; });
    if (!cand.length) cand = K.candidats.slice();
    var cases = 0, bonnes = 0, rel = f.q5 || {};
    if (typeof rel === "string") { try { rel = JSON.parse(rel); } catch (e) { rel = {}; } }
    cand.forEach(function (id) {
      K.proprietes.forEach(function (p) {
        cases++;
        var v = rel[id + "." + p], m = MAT[id];
        var ok = p === "masseVolumique" ? proche(v, m.masseVolumique, 0.02 / m.masseVolumique + 1e-9)
          : p === "tempMax" ? String(v) === String(m.tempMaxTexte)
          : p === "elec" ? String(v) === String(m.elec)
          : nombre(v) === Number(m.notes[p.replace("notes.", "")]);
        if (ok) bonnes++;
      });
    });
    pts.Q5 = r2(bonnes * b.Q5 / cases);
    detail.Q5 = { bonnes: bonnes, cases: cases };
    pts.Q6 = f.q6 === K.q6 ? b.Q6 : 0;
    /* Q7 : famille et sous-famille DU MATÉRIAU CHOISI (pas de double sanction). */
    var choisi = MAT[f.q6] || MAT[K.q6];
    pts.Q7 = (f.q7f === choisi.famille ? 1 : 0) * (b.Q7 * 2 / 3) + (f.q7s === choisi.sousFamille ? 1 : 0) * (b.Q7 / 3);
    var args = liste(f.q8).slice(0, 2), justes = args.filter(function (a) { return K.q8.indexOf(a) >= 0; }).length;
    pts.Q8 = justes * b.Q8 / 2;
    Object.keys(pts).forEach(function (k) { pts[k] = r2(pts[k]); });
    return { points: pts, detail: detail };
  }

  /* ─────────────────────────── exercice n°5 ─────────────────────────── */
  function attenduEx5(cle, att) {
    var K = cle.ex5[att.s], M = cle.materiaux[K.m], N = cle.materiaux[K.n];
    var mM = att.v * M.masseVolumique, eM = mM * M.energieGrise;
    var mN = att.v * N.masseVolumique, eN = mN * N.energieGrise;
    return { m: K.m, n: K.n, rhoM: M.masseVolumique, egM: M.energieGrise, rhoN: N.masseVolumique, egN: N.energieGrise,
             masseM: mM, energieM: eM, serieMJ: eM * att.q / 1000, masseN: mN, energieN: eN,
             rapport: eN >= eM ? eN / eM : eM / eN, sens: eN >= eM ? "plus" : "moins",
             favorable: eN < eM ? K.n : K.m };
  }
  function corrigerEx5(f, cle, att) {
    f = f || {};
    if (!cle || !cle.ex5 || !att || !cle.ex5[att.s]) return { points: null, detail: { erreur: "cle" } };
    var b = cle.bareme5, A = attenduEx5(cle, att), tol = cle.tolerance, tolR = cle.toleranceRapport, pts = {};
    pts.Q1 = f.q1 === cle.ex5def ? b.Q1 : 0;
    /* Q2 : chaque étape comptée vaut sa part ; cocher « utiliser l'objet » (l'idée fausse visée) annule tout. */
    var et = liste(f.q2), vraies = cle.ex5etapes.filter(function (e) { return e[1]; }), vp = 0, fp = 0;
    cle.ex5etapes.forEach(function (e) { if (et.indexOf(e[0]) >= 0) { if (e[1]) vp++; else fp++; } });
    pts.Q2 = Math.max(0, vp * b.Q2 / vraies.length - fp * b.Q2);
    pts.Q3 = proche(f.q3, A.rhoM, 0.02 / A.rhoM + 1e-9) ? b.Q3 : 0;
    pts.Q4 = proche(f.q4, A.egM, 1e-9) ? b.Q4 : 0;
    var u = b.unite;
    /* Erreur reportée : un calcul juste fait sur la valeur fausse de l'élève garde ses points. */
    var masse = nombre(f.q5), energie = nombre(f.q6);
    pts.Q5 = (proche(f.q5, A.masseM, tol) ? b.Q5 - u : 0) + (f.q5u === "g" ? u : 0);
    var eRef = isNaN(masse) ? A.energieM : masse * A.egM;
    pts.Q6 = (proche(f.q6, A.energieM, tol) || proche(f.q6, eRef, tol) ? b.Q6 - u : 0) + (f.q6u === "kJ" ? u : 0);
    var sRef = isNaN(energie) ? A.serieMJ : energie * att.q / 1000;
    pts.Q7 = (proche(f.q7, A.serieMJ, tol) || proche(f.q7, sRef, tol) ? b.Q7 - u : 0) + (f.q7u === "MJ" ? u : 0);
    var masseN = nombre(f.q8m);
    pts.Q8 = (proche(f.q8m, A.masseN, tol) ? b.Q8 / 2 : 0)
           + (proche(f.q8e, A.energieN, tol) || (!isNaN(masseN) && proche(f.q8e, masseN * A.egN, tol)) ? b.Q8 / 2 : 0);
    var eNeleve = nombre(f.q8e), eMeleve = energie;
    var rEleve = (eNeleve > 0 && eMeleve > 0) ? (eNeleve >= eMeleve ? eNeleve / eMeleve : eMeleve / eNeleve) : NaN;
    var sensEleve = (eNeleve > 0 && eMeleve > 0) ? (eNeleve >= eMeleve ? "plus" : "moins") : A.sens;
    var okNombre = proche(f.q9, A.rapport, tolR) || (!isNaN(rEleve) && proche(f.q9, rEleve, tolR));
    var okSens = f.q9s === A.sens || f.q9s === sensEleve;
    pts.Q9 = okNombre && okSens ? b.Q9 : okNombre ? b.Q9 / 2 : 0;
    pts.Q10 = f.q10 === cle.ex5[att.s].conclusion ? b.Q10 : 0;
    pts.Q11 = f.q11 === (cle.ex5vf ? "vrai" : "faux") ? b.Q11 : 0;
    Object.keys(pts).forEach(function (k) { pts[k] = r2(pts[k]); });
    return { points: pts, detail: { attendu: A } };
  }

  function total(pts) { return r2(Object.keys(pts || {}).reduce(function (t, k) { return t + (Number(pts[k]) || 0); }, 0)); }
  function parCompetence(pts, bareme) {
    var o = {};
    bareme.forEach(function (q) { o[q[1]] = r2((o[q[1]] || 0) + (Number(pts[q[0]]) || 0)); });
    return o;
  }
  return { nombre: nombre, proche: proche, corrigerEx4: corrigerEx4, corrigerEx5: corrigerEx5,
           attenduEx5: attenduEx5, total: total, parCompetence: parCompetence, somme: somme };
})();
if (typeof module !== "undefined") module.exports = P11X45;
