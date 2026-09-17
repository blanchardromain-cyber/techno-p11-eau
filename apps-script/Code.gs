/**
 * P11 · Séance 5 — Collecte des résultats « Pieuvre et cahier des charges »
 * ----------------------------------------------------------------------------
 * Reçoit une ligne par équipe depuis l'activité et l'écrit dans la feuille
 * Google Sheets à laquelle ce script est attaché.
 *
 * Script INDÉPENDANT du backend du site principal, volontairement : celui-ci
 * sert toutes les capsules du site et un redéploiement raté y coupe tout.
 * Ici, au pire, la séance 5 cesse de remonter ses résultats et le rendu se fait
 * par impression, comme prévu.
 *
 * Installation : voir LISEZ-MOI.md, à côté de ce fichier.
 * ============================================================================
 */

// === Configuration ==========================================================

// Doit être identique à P11DATA.CLOUD.secret dans js/data.js.
// Ce n'est pas un chiffrement : cela écarte les requêtes parasites.
var SECRET_PARTAGE = 'P11-S5-RB-2026';

// Onglet où sont écrits les résultats. Créé au premier envoi s'il n'existe pas.
var NOM_FEUILLE = 'P11-S5';

// Colonnes, dans l'ordre. Ajouter une colonne à la FIN ne casse rien ;
// en insérer une au milieu décale l'existant.
var COLONNES = [
  'dateISO', 'date', 'classe', 'code', 'mode',
  'nom1', 'prenom1', 'nom2', 'prenom2',
  'm1', 'm1_liens', 'm1_analyse',
  'm2', 'm2_objet',
  'm3_auto', 'm3_prof',
  'total', 'sur', 'note20', 'niveau',
  'solution', 'probleme', 'presentation', 'aides', 'remarque',
  'capsule', 'raison'
];

// ============================================================================
// Réception d'une ligne
// ============================================================================
function doPost(e) {
  try {
    var corps = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (corps.secret !== SECRET_PARTAGE) {
      return _json({ ok: false, erreur: 'secret_invalide' });
    }
    var l = corps.ligne;
    if (!l || !l.code) {
      return _json({ ok: false, erreur: 'ligne_vide' });
    }

    var feuille = _feuille();
    var d = l.dateISO ? new Date(l.dateISO) : new Date();
    l.date = Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');

    var rangee = COLONNES.map(function (c) {
      var v = l[c];
      return (v === undefined || v === null) ? '' : v;
    });

    var cree = _upsert(feuille, String(l.code), rangee);
    return _json({ ok: true, cree: cree });
  } catch (err) {
    return _json({ ok: false, erreur: String(err) });
  }
}

/**
 * Lecture : sert le tableau au professeur.
 * Appelée par l'activité en mode ?prof pour afficher la classe entière, tous
 * postes confondus — ce que le stockage local d'un seul poste ne permet pas.
 */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.secret !== SECRET_PARTAGE) {
      return _json({ ok: false, erreur: 'secret_invalide' });
    }
    var feuille = _feuille();
    var dernier = feuille.getLastRow();
    if (dernier < 2) return _json({ ok: true, lignes: [] });

    var valeurs = feuille.getRange(2, 1, dernier - 1, COLONNES.length).getValues();
    var lignes = valeurs.map(function (r) {
      var o = {};
      COLONNES.forEach(function (c, i) { o[c] = r[i]; });
      return o;
    });
    // Filtre facultatif par classe : ?classe=4B
    if (p.classe) {
      lignes = lignes.filter(function (o) { return String(o.classe) === String(p.classe); });
    }
    return _json({ ok: true, lignes: lignes });
  } catch (err) {
    return _json({ ok: false, erreur: String(err) });
  }
}

// ============================================================================
// Utilitaires
// ============================================================================

function _feuille() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var f = ss.getSheetByName(NOM_FEUILLE);
  if (!f) {
    f = ss.insertSheet(NOM_FEUILLE);
  }
  if (f.getLastRow() === 0) {
    f.appendRow(COLONNES);
    f.setFrozenRows(1);
    f.getRange(1, 1, 1, COLONNES.length).setFontWeight('bold');
    f.setColumnWidth(COLONNES.indexOf('probleme') + 1, 320);
    f.setColumnWidth(COLONNES.indexOf('remarque') + 1, 260);
  }
  return f;
}

/**
 * Écrit la ligne de cette équipe, en remplaçant la précédente s'il y en a une.
 *
 * L'activité renvoie l'état complet à chaque vérification de mission : sans
 * remplacement, une équipe produirait cinq ou six lignes au fil de l'heure et
 * la feuille deviendrait illisible. La clé est le code d'équipe, qui est unique.
 *
 * Renvoie true si la ligne est nouvelle, false si elle en a remplacé une.
 */
function _upsert(feuille, code, rangee) {
  var dernier = feuille.getLastRow();
  if (dernier < 2) {
    feuille.appendRow(rangee);
    return true;
  }
  var colCode = COLONNES.indexOf('code');
  var codes = feuille.getRange(2, colCode + 1, dernier - 1, 1).getValues();
  for (var i = 0; i < codes.length; i++) {
    if (String(codes[i][0]) === code) {
      feuille.getRange(i + 2, 1, 1, COLONNES.length).setValues([rangee]);
      return false;
    }
  }
  feuille.appendRow(rangee);
  return true;
}

function _json(o) {
  return ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * À lancer une fois depuis l'éditeur, pour vérifier l'installation sans
 * attendre qu'un élève envoie quelque chose. Écrit une ligne de test que l'on
 * supprime ensuite à la main.
 */
function testerInstallation() {
  var feuille = _feuille();
  _upsert(feuille, 'TEST-0000', COLONNES.map(function (c) {
    if (c === 'code') return 'TEST-0000';
    if (c === 'date') return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
    if (c === 'nom1') return 'LIGNE DE TEST';
    if (c === 'classe') return '4Z';
    return '';
  }));
  SpreadsheetApp.getUi().alert(
    'Installation correcte : une ligne TEST-0000 a été écrite dans l\'onglet « ' +
    NOM_FEUILLE + ' ». Supprime-la avant la séance.'
  );
}
