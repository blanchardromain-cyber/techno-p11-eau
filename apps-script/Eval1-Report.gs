/* ═══════════════════════════════════════════════════════════════════════════
   P11 — Évaluation n°1 — réception des notes du tableur (partie C)
   À coller dans le classeur « P11 — Évaluation n°1 — Report des notes » :
   Extensions › Apps Script, puis Déployer › Application web
   (Exécuter en tant que : Moi · Qui a accès : Tout le monde).
   La page evaluation-1-tableur.html envoie : classe, nom, prénom, points C1 à C3, détail.
   Le script range la note sur la ligne de l'élève, dans l'onglet de sa classe.
   ═══════════════════════════════════════════════════════════════════════════ */

var SECRET = "P11-EVAL1-2026";          // le même que dans la page du tableur
var CLASSES = ["4A", "4B", "4C", "4D", "4E", "4F", "4G"];
var PREMIERE_LIGNE = 4;                  // lignes 1 à 3 : en-têtes et barème
var COL = { nom: 1, c1: 8, c2: 9, c3: 10, date: 17, detail: 18, remarque: 19 };   // A, H, I, J, Q, R, S
var PREMIER_ENVOI_FAIT_FOI = true;       // un second envoi n'écrase pas la note (il va au Journal)

function doPost(e) {
  var verrou = LockService.getScriptLock();
  try {
    verrou.waitLock(25000);              // une classe entière valide parfois dans la même minute
    var d = JSON.parse(e.postData.contents);
    if (d.secret !== SECRET) return repondre({ ok: false, erreur: "secret" });
    var classe = String(d.classe || "").toUpperCase().trim();
    if (CLASSES.indexOf(classe) < 0) return repondre({ ok: false, erreur: "classe" });
    var nom = propre(d.nom).toUpperCase(), prenom = propre(d.prenom);
    if (!nom || !prenom) return repondre({ ok: false, erreur: "identite" });
    var pts = [nombre(d.c1, 2), nombre(d.c2, 6), nombre(d.c3, 4)];
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var feuille = ss.getSheetByName(classe);
    var ligne = trouverEleve(feuille, nom, prenom), statut, remarque = "";

    if (ligne < 0) {                     // introuvable ou ambigu : ajouté en bas, à vérifier
      ligne = premiereLigneLibre(feuille);
      feuille.getRange(ligne, COL.nom).setValue(sur(nom + " " + prenom));
      remarque = "Ajouté par l'envoi du tableur : vérifier le nom";
      feuille.getRange(ligne, COL.nom, 1, 1).setBackground("#FCE4D6");
      statut = "ajoute";
    } else statut = "note";

    var deja = feuille.getRange(ligne, COL.c1, 1, 3).getValues()[0].some(function (v) { return v !== ""; });
    if (deja && PREMIER_ENVOI_FAIT_FOI) {
      statut = "deja";
    } else {
      feuille.getRange(ligne, COL.c1, 1, 3).setValues([pts]);
      feuille.getRange(ligne, COL.date).setValue(new Date());
      feuille.getRange(ligne, COL.detail).setValue(sur(d.detail).slice(0, 4000));
      if (remarque) feuille.getRange(ligne, COL.remarque).setValue(remarque);
    }
    ss.getSheetByName("Journal").appendRow([new Date(), classe, sur(nom), sur(prenom), pts[0], pts[1], pts[2],
      pts[0] + pts[1] + pts[2], sur(d.detail).slice(0, 4000),
      statut === "deja" ? "déjà noté : envoi ignoré" : (statut === "ajoute" ? "ajouté en bas de l'onglet" : "noté")]);
    return repondre({ ok: true, statut: statut, ligne: ligne });
  } catch (err) {
    return repondre({ ok: false, erreur: String(err) });
  } finally {
    try { verrou.releaseLock(); } catch (e2) {}
  }
}

function doGet() {
  return ContentService.createTextOutput("P11 Évaluation n°1 : script de report en ligne.");
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
/* Même élève si tous les mots tapés (nom et prénom) figurent dans la cellule, quel que soit l'ordre.
   Deux lignes candidates : ambigu, on ne choisit pas (-1). */
function trouverEleve(feuille, nom, prenom) {
  var derniere = Math.max(feuille.getLastRow(), PREMIERE_LIGNE);
  var noms = feuille.getRange(PREMIERE_LIGNE, COL.nom, derniere - PREMIERE_LIGNE + 1, 1).getValues();
  var cherche = mots(nom + " " + prenom), trouve = -1, n = 0;
  for (var i = 0; i < noms.length; i++) {
    var cellule = mots(noms[i][0]);
    if (!cellule.length) continue;
    var tous = cherche.every(function (m) { return cellule.indexOf(m) >= 0; });
    if (tous) { trouve = PREMIERE_LIGNE + i; n++; }
  }
  return n === 1 ? trouve : -1;
}
function premiereLigneLibre(feuille) {
  var derniere = Math.max(feuille.getLastRow(), PREMIERE_LIGNE);
  var noms = feuille.getRange(PREMIERE_LIGNE, COL.nom, derniere - PREMIERE_LIGNE + 1, 1).getValues();
  for (var i = 0; i < noms.length; i++) if (noms[i][0] === "") return PREMIERE_LIGNE + i;
  return derniere + 1;
}

/* ═══ INSTALLATION : construit les onglets dans un classeur vierge (à lancer une seule fois) ═══
   Même organisation que la feuille de report de l'an dernier : une ligne 3 de barème,
   une colonne par question, les sous-totaux par compétence, puis la note sur 40, 20 et 30. */
function installer() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var Q = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "C1", "C2", "C3"];
  var COMP = ["CT2,5", "CT2,5", "CT2,5", "CT2,1", "CT2,1", "CT2,1", "CT5,1", "CT5,1", "CT5,1"];
  var MAX = [4, 4, 4, 4, 8, 4, 2, 6, 4];
  var LIGNES = 40;
  var mode = ss.getSheetByName("Mode d'emploi") || ss.insertSheet("Mode d'emploi", 0);
  mode.clear();
  mode.getRange(1, 1, 12, 1).setValues([
    ["P11 — Évaluation n°1 — Report des notes (4e)"], [""],
    ["Un onglet par classe. Colonne A : coller la liste des élèves (NOM Prénom, export Ecole Directe) à partir de la ligne 4."],
    ["Q1 à Q6 : points de la copie papier, saisis par le professeur (barème en ligne 3)."],
    ["C1 à C3 : remplis automatiquement quand l'élève valide la page du tableur (evaluation-1-tableur.html)."],
    ["Un élève introuvable dans la liste est ajouté en bas de son onglet (fond orangé), avec une remarque « à vérifier »."],
    ["La première validation fait foi : un second envoi n'écrase pas la note ; il est seulement noté dans l'onglet Journal."],
    ["Pour autoriser un nouvel envoi : effacer les cellules C1, C2, C3 et la date de l'élève."],
    ["K à M : totaux par compétence ; N : total sur 40 ; O : note sur 20 ; P : note sur 30 (arrondi au demi-point supérieur)."],
    ["Couleurs : bleu ≥ 80 % · vert ≥ 60 % · jaune ≥ 40 % · rouge < 40 % (niveaux TBM, MS, MF, MI)."],
    ["Les élèves qui passent toute l'évaluation dans la capsule du site Technologie sont notés dans le tableau de bord du site."],
    ["Aide : techno-p11-eau/apps-script/LISEZ-MOI-EVAL1.md"]]);
  mode.getRange(1, 1).setFontWeight("bold").setFontSize(14).setFontColor("#1F3864");
  mode.setColumnWidth(1, 900);

  CLASSES.forEach(function (classe) {
    var f = ss.getSheetByName(classe) || ss.insertSheet(classe);
    f.clear(); f.clearConditionalFormatRules();
    var entetes = [["Nom et prénom"].concat(Q, ["TOTAL", "TOTAL", "TABLEUR", "TOTAL", "NOTE", "NOTE", "Tableur envoyé le", "Détail du tableur (envoi automatique)", "Remarque"]),
                   [""].concat(COMP, ["CT2,5", "CT2,1", "CT5,1", "/40", "/20", "/30", "rempli par la page du tableur", "", ""]),
                   [""].concat(MAX, [12, 16, 12, 40, 20, 30, "", "", ""])];
    f.getRange(1, 1, 3, 19).setValues(entetes).setFontWeight("bold").setHorizontalAlignment("center").setBackground("#D8D8D8");
    f.getRange(1, 8, 3, 3).setBackground("#DEEAF6").setFontColor("#1F3864");
    f.getRange(1, 11, 3, 3).setBackground("#B6D7A8");
    f.getRange(1, 14, 3, 3).setBackground("#A4C2F4");
    f.getRange("A1:A3").merge().setVerticalAlignment("middle").setFontSize(13);
    var formules = [];
    for (var i = 4; i < 4 + LIGNES; i++) {
      var vide = "COUNT(B" + i + ":J" + i + ")=0";
      formules.push(['=IF(COUNT(B' + i + ':D' + i + ')=0;"";SUM(B' + i + ':D' + i + '))',
                     '=IF(COUNT(E' + i + ':G' + i + ')=0;"";SUM(E' + i + ':G' + i + '))',
                     '=IF(COUNT(H' + i + ':J' + i + ')=0;"";SUM(H' + i + ':J' + i + '))',
                     '=IF(' + vide + ';"";SUM(B' + i + ':J' + i + '))',
                     '=IF(N' + i + '="";"";CEILING(N' + i + '*0,5;0,5))',
                     '=IF(N' + i + '="";"";CEILING(N' + i + '*0,75;0,5))']);
    }
    /* setFormulas suit les paramètres régionaux du classeur : on écrit en anglais si le classeur l'est. */
    if (!/^fr/.test(ss.getSpreadsheetLocale())) formules = formules.map(function (l) {
      return l.map(function (x) { return x.replace(/;/g, ",").replace(/0,5\b/g, "0.5").replace(/0,75/g, "0.75"); });
    });
    f.getRange(4, 11, LIGNES, 6).setFormulas(formules).setHorizontalAlignment("center");
    f.getRange(4, 2, LIGNES, 9).setHorizontalAlignment("center");
    f.getRange(4, 15, LIGNES, 1).setFontWeight("bold").setBackground("#A4C2F4");
    f.getRange(1, 1, 3 + LIGNES, 19).setBorder(true, true, true, true, true, true, "#BFBFBF", SpreadsheetApp.BorderStyle.SOLID);
    var regles = [];
    ["K", "L", "M", "N", "O", "P"].forEach(function (col) {
      var plage = f.getRange(col + "4:" + col + (3 + LIGNES));
      [[0.8, "#92CDDC"], [0.6, "#C2D69B"], [0.4, "#FFFF00"]].forEach(function (s) {
        regles.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND(' + col + '4<>"";' + col + '4>=' + col + '$3*' + String(s[0]).replace(".", ",") + ')')
          .setBackground(s[1]).setRanges([plage]).build());
      });
      regles.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND(' + col + '4<>"";' + col + '4<' + col + '$3*0,4)')
        .setBackground("#D99594").setRanges([plage]).build());
    });
    if (!/^fr/.test(ss.getSpreadsheetLocale())) regles = regles.map(function (r) {
      var c = r.getBooleanCondition().getCriteriaValues()[0].replace(/;/g, ",").replace(/(\d),(\d)/g, "$1.$2");
      return r.copy().whenFormulaSatisfied(c).build();
    });
    f.setConditionalFormatRules(regles);
    f.setFrozenRows(3); f.setFrozenColumns(1);
    f.setColumnWidth(1, 230); for (var c = 2; c <= 16; c++) f.setColumnWidth(c, 62);
    f.setColumnWidth(17, 130); f.setColumnWidth(18, 420); f.setColumnWidth(19, 240);
  });
  var j = ss.getSheetByName("Journal") || ss.insertSheet("Journal");
  if (j.getLastRow() === 0) {
    j.appendRow(["Horodatage", "Classe", "Nom", "Prénom", "C1", "C2", "C3", "Partie C /12", "Détail", "Statut"]);
    j.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#D8D8D8");
    j.setFrozenRows(1); j.setColumnWidth(9, 480); j.setColumnWidth(10, 220);
  }
  var vide = ss.getSheetByName("Feuille 1") || ss.getSheetByName("Sheet1");
  if (vide && ss.getSheets().length > 1) ss.deleteSheet(vide);
  SpreadsheetApp.getUi().alert("Classeur prêt : 7 onglets de classe, un Journal et le mode d'emploi. Il reste à déployer le script en application web.");
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu("P11 Évaluation 1")
    .addItem("Installer les onglets (une seule fois)", "installer")
    .addItem("Tester un envoi (ligne TEST en 4A)", "testerEnvoi")
    .addToUi();
}

/* Essai sans élève réel : Exécuter › testerEnvoi (écrit « TEST Essai » dans 4A, à effacer ensuite). */
function testerEnvoi() {
  var r = doPost({ postData: { contents: JSON.stringify({ secret: SECRET, classe: "4A", nom: "TEST", prenom: "Essai",
    c1: 2, c2: 6, c3: 4, detail: "essai du script" }) } });
  Logger.log(r.getContent());
}
