/* ============================================================================
   P11 · Séance 5 — Remontée automatique des résultats au professeur
   ----------------------------------------------------------------------------
   Envoie une ligne par équipe dans une feuille Google Sheets, via un script
   Apps Script déployé en application web (voir apps-script/Code.gs et son
   LISEZ-MOI). L'élève n'a rien à faire : chaque vérification de mission met la
   ligne à jour.

   Les conventions viennent du backend déjà en service sur le site principal,
   parce qu'elles règlent des problèmes réels :

   · `mode: "no-cors"` — évite la requête préliminaire CORS, qu'Apps Script ne
     sait pas satisfaire. En contrepartie la réponse est illisible : on ne peut
     pas savoir si l'écriture a réussi, d'où la file d'attente ci-dessous.

   · file d'attente locale — l'envoi est d'abord noté dans le navigateur, puis
     tenté. Le réseau du collège coupe régulièrement ; la ligne part au
     chargement suivant.

   · refus d'écrire depuis localhost — le backend fait un `upsert` sur le code
     d'équipe. Une page de test servie en local, sous le code d'un vrai élève,
     écraserait son travail dans la feuille de production, sans aucun signal.

   · neutralisation du premier caractère — Google Sheets interprète toute
     cellule commençant par `=`, `+` ou `@` comme une formule. Un nom de
     solution commençant par « + » revenait en #ERROR! côté professeur.

   Tant que l'URL n'est pas renseignée dans data.js, tout ceci est inactif et
   l'activité fonctionne normalement : le rendu se fait alors par impression.
   ========================================================================== */

var CLOUD = (function(){
  'use strict';

  var CLE_FILE = 'p11s5:file-envoi';

  /* La page est-elle servie depuis un vrai hébergement ? */
  var enLocal = (function(){
    var h = (window.location.hostname || '').toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '';
  })();

  function configure(){
    var c = P11DATA.CLOUD;
    return !!(c && c.url && c.url.indexOf('A_REMPLIR') < 0 && c.url.indexOf('http') === 0);
  }

  /** Vrai si un envoi est réellement possible depuis cette page. */
  function actif(){ return configure() && !enLocal; }

  /* ----------------------- Construction de la ligne ---------------------- */

  /**
   * Résume l'état de l'équipe en une ligne de feuille.
   * Volontairement plat et court : une cellule de tableur n'est pas un endroit
   * pour un dossier complet. La maquette (image) et le détail des réponses
   * restent dans le dossier imprimé et dans l'export JSON.
   */
  function ligne(){
    var s = P11.state;
    var b = EVAL.bilan();
    var ost = P11.ostParId(s.m2.ost);

    /* --- Mission 1 : le repère attribué à chaque fonction ----------------
       Les repères sont propres à chaque élève, puisqu'ils suivent l'ordre de
       son tracé. On les liste dans l'ordre de référence des fonctions, ce qui
       permet au professeur de lire une colonne d'un coup d'œil. */
    var reperes = P11DATA.FONCTIONS.map(function(f){
      var lid = s.m1.repere[f.id];
      var lien = null;
      for (var i=0;i<s.m1.liens.length;i++){ if (s.m1.liens[i].lid === lid) lien = s.m1.liens[i]; }
      if (!lien) return '—';
      var memeType = s.m1.liens.filter(function(l){ return l.type === lien.type; });
      return lien.type + (memeType.indexOf(lien) + 1);
    });

    /* --- Mission 2 : critère, niveau et unité de chaque ligne ------------- */
    var m2 = {};
    for (var n = 1; n <= 4; n++){
      var l = ost && ost.lignes[n-1];
      var r = l ? (s.m2.reponses[l.rep] || {}) : {};
      m2['m2_' + n + '_rep']     = l ? l.rep : '';
      m2['m2_' + n + '_critere'] = r.critere || '';
      m2['m2_' + n + '_niveau']  = r.valeur  || '';
      m2['m2_' + n + '_unite']   = r.unite   || '';
    }

    var base = {
      capsule: P11DATA.CLOUD.capsule,
      dateISO: new Date().toISOString(),
      code:    s.badge.code,
      classe:  s.badge.classe,
      mode:    s.badge.mode === 'binome' ? 'binôme' : 'seul',
      nom1:    s.badge.nom1,   prenom1: s.badge.prenom1,
      nom2:    s.badge.nom2,   prenom2: s.badge.prenom2,

      m1:          s.m1.score,
      m1_liens:    s.m1.detail ? s.m1.detail.liens  : null,
      m1_analyse:  s.m1.detail ? s.m1.detail.typage : null,
      m1_reperes:  reperes.join(' / '),
      m2:          s.m2.score,
      m2_objet:    ost ? ost.nom : '',
      m3_auto:     s.m3.score,
      m3_prof:     s.m3.prof.points,
      m3_appreciation: s.m3.score === null ? '' : EVAL.appreciationM3(),

      total:   b.obtenu,
      sur:     b.maxi,
      note20:  b.note,
      niveau:  b.niveau.code,

      solution:     s.m3.nom,
      probleme:     s.m3.probleme,
      presentation: s.m3.presentation ? 'oui' : '',
      aides:        (s.m2.aides || []).join(' '),
      remarque:     s.m3.prof.remarque
    };

    // Les seize colonnes de la mission 2 sont ajoutées à plat : dans un
    // tableur, une colonne par champ se trie et se met en forme, ce qu'une
    // chaîne unique ne permet pas.
    Object.keys(m2).forEach(function(k){ base[k] = m2[k]; });
    return base;
  }

  /** Neutralise ce que Google Sheets prendrait pour une formule. */
  function assainir(l){
    var c = {};
    Object.keys(l).forEach(function(k){
      var v = l[k];
      c[k] = (typeof v === 'string' && /^[=+@\-]/.test(v)) ? ("'" + v) : v;
    });
    return c;
  }

  /* --------------------------- File d'attente ---------------------------- */

  function file(){
    try { return JSON.parse(window.localStorage.getItem(CLE_FILE) || '[]'); }
    catch(e){ return []; }
  }
  function ecrireFile(f){
    try { window.localStorage.setItem(CLE_FILE, JSON.stringify(f)); } catch(e){}
  }
  /** Une seule ligne par code d'équipe : la plus récente remplace l'ancienne. */
  function empiler(l){
    var f = file().filter(function(x){ return x.code !== l.code; });
    f.push(l);
    ecrireFile(f);
  }
  function depiler(l){
    ecrireFile(file().filter(function(x){ return x.code !== l.code; }));
  }

  /* ------------------------------- Envoi --------------------------------- */

  function poster(l, apres){
    try {
      fetch(P11DATA.CLOUD.url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ secret: P11DATA.CLOUD.secret, ligne: l })
      }).then(function(){ if (apres) apres(true); })
        .catch(function(){ if (apres) apres(false); });
    } catch(e){ if (apres) apres(false); }
  }

  /**
   * Envoie l'état courant. Appelé après chaque vérification de mission et
   * après une saisie du professeur — l'élève n'a aucun bouton à actionner.
   */
  function envoyer(raison){
    var s = P11.state;
    if (!s.badge.code) return;
    if (!configure()) return;

    var l = assainir(ligne());
    l.raison = raison || '';
    empiler(l);

    if (enLocal){
      // Message unique en console : utile au développement, invisible en classe.
      if (!envoyer._prevenu){
        envoyer._prevenu = true;
        try { console.warn('[cloud] Page servie en local : envoi au professeur désactivé.'); } catch(e){}
      }
      return;
    }
    poster(l, function(ok){
      if (ok){
        depiler(l);
        P11.state.envoi.fait = new Date().toISOString();
        P11.state.envoi.erreur = '';
      } else {
        P11.state.envoi.erreur = 'réseau';
      }
      P11.sauver();
      majTemoin();
    });
  }

  /** Rejoue les lignes restées en attente (appelé au chargement). */
  function vider(){
    if (!actif()) return;
    file().forEach(function(l){
      poster(l, function(ok){ if (ok) depiler(l); });
    });
  }

  /* ------------------------ Témoin visible à l'écran --------------------- */

  /**
   * Un point d'état dans le dossier. L'élève doit pouvoir répondre à
   * « est-ce que mon professeur a reçu mon travail ? » sans demander.
   */
  function majTemoin(){
    var el = document.getElementById('cloud-temoin');
    if (!el) return;
    if (!configure()){
      el.innerHTML = '<span class="pill todo">Envoi non configuré</span> ' +
        'Ton travail se rend en imprimant ce dossier.';
      return;
    }
    if (enLocal){
      el.innerHTML = '<span class="pill todo">Mode local</span> ' +
        'Aucun envoi depuis une page de test.';
      return;
    }
    var reste = file().length;
    if (!reste && P11.state.envoi.fait){
      el.innerHTML = '<span class="pill ok">✓ Envoyé</span> ' +
        'Ton professeur a reçu tes résultats (' + horodatage(P11.state.envoi.fait) + ').';
    } else if (reste){
      el.innerHTML = '<span class="pill partial">En attente</span> ' +
        "L'envoi se fera dès que le réseau le permettra. Imprime ton dossier par sécurité.";
    } else {
      el.innerHTML = '<span class="pill todo">Pas encore envoyé</span> ' +
        'Vérifie au moins une mission pour transmettre tes résultats.';
    }
  }

  function horodatage(iso){
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  }

  function init(){
    vider();
    majTemoin();
  }

  return { init:init, envoyer:envoyer, actif:actif, configure:configure,
           majTemoin:majTemoin, enLocal:enLocal };
})();
