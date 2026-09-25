/* ═══════════════════════════════════════════════════════════════════════════
   P11 — Exercice n°2 (Le diagramme FAST) — report des notes validées
   À coller dans le classeur « P11 — Exercice n°2 (Le diagramme FAST) » :
   Extensions › Apps Script, exécuter installer(), puis Déployer › Application web
   (Exécuter en tant que : Moi · Qui a accès : Tout le monde).
   Le site Technologie envoie, quand le professeur valide une copie dans le modal :
   classe, élève (« Prénom NOM » du compte du site), points des 7 parties (sur 30), note et barème.
   C'est la dernière validation qui compte : la ligne est mise à jour à chaque validation.
   Protection : une ligne dont les points ont été saisis à la main n'est jamais écrasée
   (envoi refusé et noté au Journal).
   ═══════════════════════════════════════════════════════════════════════════ */

var SECRET = "P11-EX2-2026";             // le même que dans index.html du site
var CLASSES = ["4A", "4B", "4C", "4D", "4E", "4F", "4G"];
var PREMIERE_LIGNE = 4;                  // lignes 1 à 3 : en-têtes et barème
var PARTIES = ["regles", "scAssoc", "scHier", "feAssoc", "feHier", "caAssoc", "caHier"];   // colonnes B à H
var TITRES = ["A Lire un FAST", "B Scooter associations", "B Scooter hiérarchie", "C Feutre associations",
              "C Feutre hiérarchie", "D Casque associations", "D Casque hiérarchie"];
var MAX = [5, 4, 3, 4, 3, 6, 5];
var COL = { nom: 1, pts: 2, note: 11, date: 12, appr: 13, remarque: 14 };           // A, B-H, K, L, M, N
var MARQUE = "Site Techno";

function doPost(e) {
  var verrou = LockService.getScriptLock();
  try {
    verrou.waitLock(25000);
    var d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) return repondre({ ok: false, erreur: "secret" });
    var classe = (String(d.classe || "").toUpperCase().match(/4[A-G]/) || [""])[0];
    if (CLASSES.indexOf(classe) < 0) return repondre({ ok: false, erreur: "classe" });
    var eleve = propre(d.eleve);
    if (!eleve) return repondre({ ok: false, erreur: "identite" });
    var p = d.pts || {};
    var pts = PARTIES.map(function (k, i) { return nombre(p[k], MAX[i]); });
    var total = pts.reduce(function (a, b) { return a + b; }, 0);
    var note = propre(d.note) + "/" + (Number(d.bareme) === 30 ? 30 : 20);
    var ss = SpreadsheetApp.getActiveSpreadsheet(), feuille = ss.getSheetByName(classe);
    var ligne = trouverEleve(feuille, eleve), statut, remarque = MARQUE + " — validée le " +
        Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Europe/Paris", "dd/MM/yyyy HH:mm");
    if (ligne < 0) {
      ligne = premiereLigneLibre(feuille);
      feuille.getRange(ligne, COL.nom).setValue(sur(eleve));
      feuille.getRange(ligne, COL.nom, 1, 1).setBackground("#FCE4D6");
      remarque += " · ajouté : vérifier le nom";
      statut = "ajoute";
    } else {
      var saisie = feuille.getRange(ligne, COL.pts, 1, PARTIES.length).getValues()[0].some(function (v) { return v !== ""; });
      var dejaSite = String(feuille.getRange(ligne, COL.remarque).getValue()).indexOf(MARQUE) === 0;
      statut = (saisie && !dejaSite) ? "manuel" : "note";
    }
    if (statut !== "manuel") {
      feuille.getRange(ligne, COL.pts, 1, PARTIES.length).setValues([pts]);
      feuille.getRange(ligne, COL.note).setValue(note);
      feuille.getRange(ligne, COL.date).setValue(new Date());
      feuille.getRange(ligne, COL.appr).setValue(sur(String(d.appreciation || "").slice(0, 1000)));
      feuille.getRange(ligne, COL.remarque).setValue(remarque);
    }
    ss.getSheetByName("Journal").appendRow([new Date(), classe, sur(eleve), total, note, sur(pts.join(" ; ")),
      statut === "manuel" ? "refusé : points déjà saisis à la main" : (statut === "ajoute" ? "ajouté en bas de l'onglet" : "noté")]);
    return repondre({ ok: true, statut: statut, ligne: ligne });
  } catch (err) {
    return repondre({ ok: false, erreur: String(err) });
  } finally {
    try { verrou.releaseLock(); } catch (e2) {}
  }
}

function doGet() {
  return ContentService.createTextOutput("P11 Exercice n°2 : script de report en ligne.");
}

/* ── outils ── */
function repondre(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function propre(s) { return String(s || "").replace(/\s+/g, " ").trim().slice(0, 60); }
/* Une cellule qui commence par = + - @ deviendrait une formule : on la neutralise. */
function sur(s) { s = String(s == null ? "" : s); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function nombre(v, max) { var x = Number(v); return isNaN(x) ? 0 : Math.max(0, Math.min(max, Math.round(x * 4) / 4)); }
function mots(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(function (m) { return m; });
}
/* Même élève si tous les mots du nom figurent dans la cellule, quel que soit l'ordre.
   Deux lignes candidates : ambigu, on ne choisit pas (-1 : l'élève est ajouté en bas). */
function trouverEleve(feuille, nom) {
  var derniere = Math.max(feuille.getLastRow(), PREMIERE_LIGNE);
  var noms = feuille.getRange(PREMIERE_LIGNE, COL.nom, derniere - PREMIERE_LIGNE + 1, 1).getValues();
  var cherche = mots(nom), trouve = -1, n = 0;
  for (var i = 0; i < noms.length; i++) {
    var cellule = mots(noms[i][0]);
    if (!cellule.length) continue;
    if (cherche.every(function (m) { return cellule.indexOf(m) >= 0; })) { trouve = PREMIERE_LIGNE + i; n++; }
  }
  return n === 1 ? trouve : -1;
}
function premiereLigneLibre(feuille) {
  var derniere = Math.max(feuille.getLastRow(), PREMIERE_LIGNE);
  var noms = feuille.getRange(PREMIERE_LIGNE, COL.nom, derniere - PREMIERE_LIGNE + 1, 1).getValues();
  for (var i = 0; i < noms.length; i++) if (noms[i][0] === "") return PREMIERE_LIGNE + i;
  return derniere + 1;
}

/* ═══ INSTALLATION : construit les onglets dans le classeur vierge (rejouable, efface les onglets de classe) ═══ */
function installer() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var LIGNES = 40;
  var mode = ss.getSheetByName("Mode d'emploi") || ss.insertSheet("Mode d'emploi", 0);
  mode.clear();
  mode.getRange(1, 1, 9, 1).setValues([
    ["P11 — Exercice n°2 (Le diagramme FAST) — Report des notes (4e)"], [""],
    ["Un onglet par classe. Colonne A : coller la liste des élèves (NOM Prénom, export Ecole Directe) à partir de la ligne 4."],
    ["B à H : points de chaque partie, remplis automatiquement quand le professeur valide la copie dans le modal du site Technologie."],
    ["Revalider une copie met la ligne à jour. Une ligne dont les points ont été saisis à la main n'est jamais écrasée (refus noté au Journal)."],
    ["Un élève introuvable dans la liste est ajouté en bas de son onglet (fond orangé), avec une remarque « à vérifier »."],
    ["I : total sur 30 ; J : note sur 20 (demi-point le plus proche, comme le site) ; K : note validée sur le site, avec le barème choisi."],
    ["Couleurs : bleu > 88 % · vert > 64 % · jaune > 30 % · rouge ≤ 30 %."],
    ["Aide : techno-p11-eau/apps-script/LISEZ-MOI-EX2.md"]]);
  mode.getRange(1, 1).setFontWeight("bold").setFontSize(14).setFontColor("#1F3864");
  mode.setColumnWidth(1, 900);

  CLASSES.forEach(function (classe) {
    var f = ss.getSheetByName(classe) || ss.insertSheet(classe);
    f.clear(); f.clearConditionalFormatRules();
    var entetes = [["Nom et prénom"].concat(TITRES, ["TOTAL", "NOTE", "Note validée", "Validée le", "Appréciation", "Remarque"]),
                   [""].concat(PARTIES.map(function () { return "pts"; }), ["/30", "/20", "site", "", "", ""]),
                   [""].concat(MAX, [30, 20, "", "", "", ""])];
    f.getRange(1, 1, 3, 14).setValues(entetes).setFontWeight("bold").setHorizontalAlignment("center")
      .setVerticalAlignment("middle").setWrap(true).setBackground("#D8D8D8");
    f.getRange(1, 9, 3, 2).setBackground("#A4C2F4");
    f.getRange("A1:A3").merge().setFontSize(13);
    var formules = [];
    for (var i = 4; i < 4 + LIGNES; i++) {
      formules.push(['=IF(COUNT(B' + i + ':H' + i + ')=0;"";SUM(B' + i + ':H' + i + '))',
                     '=IF(I' + i + '="";"";ROUND(I' + i + '*20/30*2;0)/2)']);
    }
    if (!/^fr/.test(ss.getSpreadsheetLocale())) formules = formules.map(function (l) {
      return l.map(function (x) { return x.replace(/;/g, ","); });
    });
    f.getRange(4, 9, LIGNES, 2).setFormulas(formules).setFontWeight("bold");
    f.getRange(4, 2, LIGNES, 10).setHorizontalAlignment("center");
    f.getRange(1, 1, 3 + LIGNES, 14).setBorder(true, true, true, true, true, true, "#BFBFBF", SpreadsheetApp.BorderStyle.SOLID);
    var regles = [];
    ["I", "J"].forEach(function (col) {
      var plage = f.getRange(col + "4:" + col + (3 + LIGNES));
      [[0.88, "#92CDDC"], [0.64, "#C2D69B"], [0.3, "#FFFF00"]].forEach(function (s) {
        regles.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND(' + col + '4<>"";' + col + '4>' + col + '$3*' + String(s[0]).replace(".", ",") + ')')
          .setBackground(s[1]).setRanges([plage]).build());
      });
      regles.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND(' + col + '4<>"";' + col + '4<=' + col + '$3*0,3)')
        .setBackground("#D99594").setRanges([plage]).build());
    });
    if (!/^fr/.test(ss.getSpreadsheetLocale())) regles = regles.map(function (r) {
      var c = r.getBooleanCondition().getCriteriaValues()[0].replace(/;/g, ",").replace(/(\d),(\d)/g, "$1.$2");
      return r.copy().whenFormulaSatisfied(c).build();
    });
    f.setConditionalFormatRules(regles);
    f.setFrozenRows(3); f.setFrozenColumns(1);
    f.setColumnWidth(1, 230); for (var c = 2; c <= 11; c++) f.setColumnWidth(c, 78);
    f.setColumnWidth(12, 130); f.setColumnWidth(13, 380); f.setColumnWidth(14, 260);
  });
  var j = ss.getSheetByName("Journal") || ss.insertSheet("Journal");
  if (j.getLastRow() === 0) {
    j.appendRow(["Horodatage", "Classe", "Élève", "Total /30", "Note validée", "Points A à D", "Statut"]);
    j.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#D8D8D8");
    j.setFrozenRows(1); j.setColumnWidth(6, 260); j.setColumnWidth(7, 260);
  }
  var vide = ss.getSheetByName("Feuille 1") || ss.getSheetByName("Sheet1");
  if (vide && ss.getSheets().length > 1) ss.deleteSheet(vide);
  /* Pas de fenêtre alert() : elle bloquerait l'exécution lancée depuis l'éditeur. */
  ss.toast("7 onglets de classe, un Journal et le mode d'emploi. Il reste à déployer le script en application web.", "Classeur prêt", 10);
  Logger.log("Installation terminée.");
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu("P11 Exercice 2")
    .addItem("Installer les onglets (efface les onglets de classe)", "installer")
    .addItem("Tester un envoi (ligne TEST Essai en 4A)", "testerEnvoi")
    .addToUi();
}

/* Essai sans élève réel : Exécuter › testerEnvoi (écrit « Essai TEST » dans 4A, à effacer ensuite). */
function testerEnvoi() {
  var r = doPost({ postData: { contents: JSON.stringify({ secret: SECRET, classe: "4A", eleve: "Essai TEST",
    pts: { regles: 5, scAssoc: 4, scHier: 2, feAssoc: 3, feHier: 3, caAssoc: 5, caHier: 3 }, note: "16,5", bareme: 20,
    appreciation: "essai du script" }) } });
  Logger.log(r.getContent());
}
