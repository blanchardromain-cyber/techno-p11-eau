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

// Classeur des classes de 4e : un onglet par classe, peuplé à la main des
// identités (NOM en colonne A, Prénom en colonne B, à partir de la ligne 2).
// Chaque envoi y remplit la ligne de l'élève : note, niveau, observation.
var CLASSEUR_CLASSES_ID = '1Wqz5lFJVBpaP2BWh42BC2MnbeQaxMcPuqMXaSq-KbBE';
var CLASSES = ['4A', '4B', '4C', '4D', '4E', '4F', '4G'];
var ENTETES_CLASSE = ['NOM', 'Prénom', 'Note /20', 'Niveau', 'Observation', 'Équipe', 'Mis à jour'];
var ONGLET_A_RAPPROCHER = 'À rapprocher';

// Colonnes, dans l'ordre. Ajouter une colonne à la FIN ne casse rien ;
// en insérer une au milieu décale l'existant.
// L'ordre est pense pour la LECTURE : identite (A-I), puis immediatement la
// note, le niveau et les deux observations (J-M), qui sont ce qu'on regarde en
// premier. Le detail des missions vient ensuite, a droite, pour qui veut
// comprendre d'ou sort la note.
var COLONNES = [
  // A a I — qui, quand
  'dateISO', 'date', 'classe', 'code', 'mode',
  'nom1', 'prenom1', 'nom2', 'prenom2',

  // J a M — l'essentiel, visible sans faire defiler
  'note20', 'niveau', 'm3_appreciation', 'remarque',

  // N, O — d'ou vient la note sur 20
  'total', 'sur',

  // Mission 1 : note, detail et reperes attribues par l'eleve.
  // Les reperes suivent l'ordre de trace de chaque eleve : ils sont donc
  // propres a sa pieuvre, et listes ici dans l'ordre de reference des
  // fonctions (FP1 puis les cinq contraintes de la fiche).
  'm1', 'm1_liens', 'm1_analyse', 'm1_reperes',

  // Mission 2 : note, objet choisi, puis les quatre lignes du cahier des
  // charges telles que l'eleve les a saisies.
  'm2', 'm2_objet',
  'm2_1_rep', 'm2_1_critere', 'm2_1_niveau', 'm2_1_unite',
  'm2_2_rep', 'm2_2_critere', 'm2_2_niveau', 'm2_2_unite',
  'm2_3_rep', 'm2_3_critere', 'm2_3_niveau', 'm2_3_unite',
  'm2_4_rep', 'm2_4_critere', 'm2_4_niveau', 'm2_4_unite',

  // Mission 3 : part automatique, part professeur
  'm3_auto', 'm3_prof',

  'solution', 'probleme', 'presentation', 'aides',
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

    // Report dans le classeur des classes. Une erreur ici (classeur déplacé,
    // onglet renommé) ne doit pas faire perdre la ligne déjà écrite ci-dessus.
    var classes = 'ok';
    try { _reporterDansClasse(l, d); } catch (errClasse) { classes = String(errClasse); }
    return _json({ ok: true, cree: cree, classes: classes });
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
    _miseEnForme(f);
  } else {
    _migrerEntetes(f);
  }
  return f;
}

function _miseEnForme(f) {
  f.setFrozenRows(1);
  f.setFrozenColumns(Math.min(4, COLONNES.length));   // jusqu'au code d'equipe
  f.getRange(1, 1, 1, COLONNES.length).setFontWeight('bold');
  var large = { probleme: 320, remarque: 300, m3_appreciation: 430, m1_reperes: 170, niveau: 70 };
  Object.keys(large).forEach(function (c) {
    var i = COLONNES.indexOf(c);
    if (i >= 0) f.setColumnWidth(i + 1, large[c]);
  });
}

/**
 * Remet la feuille au format courant quand l'ordre des colonnes a change.
 *
 * Sans cela, changer COLONNES ecrirait les nouvelles lignes dans un ordre que
 * l'ancienne ligne d'en-tetes ne decrit plus : la feuille deviendrait fausse
 * sans le moindre message. On relit donc les donnees existantes PAR NOM DE
 * COLONNE, puis on les reecrit dans le nouvel ordre. Les colonnes disparues
 * sont abandonnees, les nouvelles arrivent vides.
 */
function _migrerEntetes(f) {
  var largeur = Math.max(f.getLastColumn(), 1);
  var entetes = f.getRange(1, 1, 1, largeur).getValues()[0];

  var identique = entetes.length === COLONNES.length &&
                  COLONNES.every(function (c, i) { return entetes[i] === c; });
  if (identique) return;

  var dernier = f.getLastRow();
  var anciennes = dernier > 1 ? f.getRange(2, 1, dernier - 1, largeur).getValues() : [];

  var nouvelles = anciennes.map(function (ligne) {
    var parNom = {};
    entetes.forEach(function (nom, i) { parNom[nom] = ligne[i]; });
    return COLONNES.map(function (c) {
      return (parNom[c] === undefined || parNom[c] === null) ? '' : parNom[c];
    });
  });

  f.clear();
  f.getRange(1, 1, 1, COLONNES.length).setValues([COLONNES]);
  if (nouvelles.length) {
    f.getRange(2, 1, nouvelles.length, COLONNES.length).setValues(nouvelles);
  }
  _miseEnForme(f);
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

// ============================================================================
// Classeur des classes de 4e
// ============================================================================

/** NOM ou prénom ramené à une forme comparable : sans accent, sans casse. */
function _cle(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().replace(/[^A-Z]+/g, ' ').trim();
}

/**
 * Écrit note, niveau et observation sur la ligne de chaque élève de l'équipe
 * (deux lignes pour un binôme), dans l'onglet de sa classe. Un élève qu'on ne
 * retrouve pas — faute de frappe, élève absent de la liste — part dans l'onglet
 * « À rapprocher » : rien n'est perdu, rien n'est écrit sur la mauvaise ligne.
 */
function _reporterDansClasse(l, date) {
  var ss = SpreadsheetApp.openById(CLASSEUR_CLASSES_ID);
  var quand = Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  var valeurs = {
    'Note /20': l.note20 === null || l.note20 === undefined ? '' : l.note20,
    'Niveau': l.niveau || '',
    'Observation': l.remarques_classe || '',
    'Équipe': l.code,
    'Mis à jour': quand
  };
  var eleves = [[l.nom1, l.prenom1]];
  if (l.nom2) eleves.push([l.nom2, l.prenom2]);

  var onglet = ss.getSheetByName(String(l.classe || ''));
  eleves.forEach(function (e) {
    var ligne = onglet ? _trouverEleve(onglet, e[0], e[1]) : 0;
    if (ligne) {
      var entetes = _entetesClasse(onglet);
      Object.keys(valeurs).forEach(function (nom) {
        onglet.getRange(ligne, entetes[nom]).setValue(valeurs[nom]);
      });
    } else {
      _aRapprocher(ss, l, e, valeurs);
    }
  });
}

/** Numéro de ligne de l'élève (NOM en A, Prénom en B), 0 s'il n'y est pas. */
function _trouverEleve(onglet, nom, prenom) {
  var der = onglet.getLastRow();
  if (der < 2) return 0;
  var noms = onglet.getRange(2, 1, der - 1, 2).getValues();
  var kn = _cle(nom), kp = _cle(prenom);
  for (var i = 0; i < noms.length; i++) {
    if (_cle(noms[i][0]) === kn && _cle(noms[i][1]) === kp) return i + 2;
  }
  return 0;
}

/** Colonnes par nom d'en-tête ; ajoute à droite celles qui manquent. */
function _entetesClasse(onglet) {
  var larg = Math.max(onglet.getLastColumn(), 2);
  var ligne1 = onglet.getRange(1, 1, 1, larg).getValues()[0];
  var pos = {};
  ligne1.forEach(function (v, i) { if (v) pos[String(v)] = i + 1; });
  ENTETES_CLASSE.forEach(function (nom) {
    if (!pos[nom]) {
      larg += 1;
      onglet.getRange(1, larg).setValue(nom).setFontWeight('bold');
      pos[nom] = larg;
    }
  });
  return pos;
}

function _aRapprocher(ss, l, eleve, valeurs) {
  var f = ss.getSheetByName(ONGLET_A_RAPPROCHER);
  var entetes = ['Mis à jour', 'Classe', 'NOM', 'Prénom', 'Équipe', 'Note /20', 'Niveau', 'Observation'];
  if (!f) {
    f = ss.insertSheet(ONGLET_A_RAPPROCHER);
    f.appendRow(entetes);
    f.getRange(1, 1, 1, entetes.length).setFontWeight('bold');
    f.setFrozenRows(1);
  }
  var rangee = [valeurs['Mis à jour'], l.classe || '', eleve[0] || '', eleve[1] || '', l.code,
                valeurs['Note /20'], valeurs['Niveau'], valeurs['Observation']];
  // Une ligne par élève et par équipe, mise à jour à chaque envoi.
  var der = f.getLastRow();
  if (der > 1) {
    var cles = f.getRange(2, 3, der - 1, 3).getValues();
    for (var i = 0; i < cles.length; i++) {
      if (_cle(cles[i][0]) === _cle(eleve[0]) && _cle(cles[i][1]) === _cle(eleve[1]) &&
          String(cles[i][2]) === String(l.code)) {
        f.getRange(i + 2, 1, 1, rangee.length).setValues([rangee]);
        return;
      }
    }
  }
  f.appendRow(rangee);
}

/**
 * Crée les onglets 4A à 4G dans le classeur des classes, avec leurs en-têtes.
 * Ne touche pas à un onglet qui existe déjà : on peut le relancer sans risque.
 * Il reste ensuite à coller les NOM (colonne A) et Prénom (colonne B).
 */
function preparerOngletsClasses() {
  var ss = SpreadsheetApp.openById(CLASSEUR_CLASSES_ID);
  var crees = [];
  CLASSES.forEach(function (c) {
    if (ss.getSheetByName(c)) return;
    var f = ss.insertSheet(c);
    f.getRange(1, 1, 1, ENTETES_CLASSE.length).setValues([ENTETES_CLASSE]).setFontWeight('bold');
    f.setFrozenRows(1);
    f.setColumnWidth(5, 520);
    f.getRange('E:E').setWrap(true);
    crees.push(c);
  });
  var vide = ss.getSheetByName('Feuille 1');
  if (vide && vide.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(vide);
  SpreadsheetApp.getUi().alert(crees.length
    ? 'Onglets créés : ' + crees.join(', ') + '.\n\nCollez maintenant les NOM en colonne A et les Prénom en colonne B, à partir de la ligne 2.'
    : 'Les 7 onglets existent déjà : rien n\'a été modifié.');
}

function _json(o) {
  return ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Ajoute un menu « P11 » dans le classeur.
 * Apparait au prochain rechargement de la page du classeur.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('P11')
    .addItem('Reorganiser les colonnes', 'reorganiserColonnes')
    .addItem('Preparer les onglets des classes (4A-4G)', 'preparerOngletsClasses')
    .addSeparator()
    .addItem('Tester l\'installation', 'testerInstallation')
    .addToUi();
}

/**
 * Applique tout de suite le nouvel ordre des colonnes.
 *
 * La reorganisation se declenche normalement au premier envoi qui suit un
 * changement de COLONNES -- donc pas au moment du deploiement. Tant qu'aucun
 * eleve n'a rien envoye, la feuille garde son ancien ordre et on peut croire
 * que le deploiement a echoue. Cette fonction force le passage, sans rien
 * ecrire d'autre.
 *
 * A lancer depuis le menu P11 du classeur, ou depuis l'editeur.
 */
function reorganiserColonnes() {
  var f = _feuille();          // _feuille declenche la migration si besoin
  var lignes = Math.max(0, f.getLastRow() - 1);
  SpreadsheetApp.getUi().alert(
    'Colonnes a jour dans l\'onglet « ' + NOM_FEUILLE + ' ».\n\n' +
    'Ordre applique : identite en A-I, puis note20 (J), niveau (K), ' +
    'observation generee (L) et observation du professeur (M).\n\n' +
    lignes + ' ligne(s) de donnees conservee(s) et repositionnee(s).'
  );
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
