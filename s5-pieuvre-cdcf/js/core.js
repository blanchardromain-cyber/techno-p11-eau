/* ============================================================================
   P11 · Séance 5 — Noyau de l'application
   ----------------------------------------------------------------------------
   Contient tout ce qui ne relève ni du cours (data.js) ni d'une mission
   particulière (module1/2/3.js) :

     · l'état de l'équipe et sa sauvegarde locale ;
     · le badge de bureau d'études (mode seul / binôme, code de reprise) ;
     · la navigation entre les écrans ;
     · les outils de comparaison de texte utilisés par tous les correcteurs ;
     · les notifications et la fenêtre modale.

   Écrit en JavaScript « classique » (pas de module ES) pour que la page reste
   ouvrable par un simple double-clic depuis une clé USB, sans serveur : c'est
   la convention des autres outils du dépôt.
   ========================================================================== */

var P11 = (function(){
  'use strict';

  var CLE_PREFIXE = 'p11s5:';   // préfixe des entrées localStorage
  var CLE_DERNIER = 'p11s5:dernier';
  // sessionStorage : ce que la SESSION de navigation en cours travaille.
  // Voir « Deux stockages, deux rôles » plus bas.
  var CLE_SESSION = 'p11s5:session';
  var VERSION_ETAT = 2;         // incrémenté si la forme de l'état change

  /* =========================== 1. État ==================================== */

  // Forme de référence d'un état vierge. Toute nouvelle clé doit être ajoutée
  // ici, sinon la reprise d'un ancien code laisserait la valeur indéfinie.
  function etatVierge(){
    return {
      v: VERSION_ETAT,
      badge: {
        mode:'seul',
        nom1:'', prenom1:'',      // nom en majuscules, prénom capitalisé
        nom2:'', prenom2:'',      // second élève, en binôme
        classe:'', code:'', cree:''
      },
      m1: {
        liens: [],        // liens tracés : {de, a, type}
        typage: {},       // idFonction -> 'FP' | 'FC'
        numeros: {},      // idFonction -> '1' … '6' (le repère est type + numéro)
        valide: false,    // vrai dès la première validation du tableau d'analyse
        hotspots: [],     // identifiants des points chauds déjà ouverts
        essais: 0,
        score: null,      // rempli à la vérification
        detail: null
      },
      m2: {
        ost: '',          // identifiant de l'objet technique choisi
        reponses: {},     // 'rep' -> {critere, valeur, unite}
        aides: [],        // coups de pouce ouverts, pour information du professeur
        essais: 0,
        score: null,
        detail: null
      },
      m3: {
        nom:'', probleme:'', principe:'',
        fonctions: [],    // {type, texte, eme, critere, valeur, unite}
        pieces: [],       // maquette 3D : {kit, x, z, rot}
        snapshot: '',     // image PNG (dataURL) de la maquette
        essais: 0,
        score: null,
        detail: null,
        prof: { points:null, remarque:'' },  // part évaluée par le professeur
        presentation: false                  // retenue pour la projection en classe
      },
      envoi: { fait:'', erreur:'' },         // trace du dernier envoi au professeur
      maj: ''
    };
  }

  var state = etatVierge();

  /* ======================= 2. Sauvegarde locale ============================
     Le travail vit dans le localStorage du navigateur, sous une clé dérivée du
     code d'équipe. Une équipe peut donc reprendre son dossier sur le même poste
     sans rien saisir, ou sur un autre poste via son code + son export JSON.

     Tous les accès sont protégés : en navigation privée, sur certains postes du
     collège, localStorage lève une exception au lieu de renvoyer null.
     ====================================================================== */

  function lsGet(k){
    try { return window.localStorage.getItem(k); } catch(e){ return null; }
  }
  function lsSet(k,v){
    try { window.localStorage.setItem(k,v); return true; } catch(e){ return false; }
  }

  /* --- Deux stockages, deux rôles ---------------------------------------
     `localStorage` garde LE TRAVAIL, indexé par code d'équipe. Il survit à la
     fermeture du navigateur : une équipe retrouve son dossier la semaine
     suivante sur le même poste, et le professeur peut lister les dossiers du
     poste en mode ?prof.

     `sessionStorage` garde SEULEMENT ce que cette session de navigation est en
     train de faire. Il s'efface à la fermeture du navigateur. C'est lui qui
     décide de la réouverture automatique.

     Sans cette séparation, la classe suivante qui s'assoit devant le poste
     rouvrait le dossier de la classe précédente, sous son nom. Le travail n'est
     pas perdu pour autant : il reste dans localStorage, accessible par son code.
     --------------------------------------------------------------------- */
  function ssGet(k){
    try { return window.sessionStorage.getItem(k); } catch(e){ return null; }
  }
  function ssSet(k,v){
    try { window.sessionStorage.setItem(k,v); return true; } catch(e){ return false; }
  }
  function ssRemove(k){
    try { window.sessionStorage.removeItem(k); } catch(e){}
  }

  var sauveEnAttente = null;
  /** Sauvegarde différée : évite d'écrire à chaque frappe clavier. */
  function sauver(immediat){
    if (sauveEnAttente) { clearTimeout(sauveEnAttente); sauveEnAttente = null; }
    var faire = function(){
      if (!state.badge.code) return;          // pas de badge, rien à ranger
      state.maj = new Date().toISOString();
      var ok = lsSet(CLE_PREFIXE + state.badge.code, JSON.stringify(state));
      lsSet(CLE_DERNIER, state.badge.code);
      ssSet(CLE_SESSION, state.badge.code);
      if (!ok) signaler("Sauvegarde impossible sur ce poste — pense à exporter ton dossier.", 5000);
      majEnTete();
    };
    if (immediat) faire(); else sauveEnAttente = setTimeout(faire, 400);
  }

  /** Recharge un état depuis un code d'équipe. Renvoie true si trouvé. */
  function charger(code){
    var brut = lsGet(CLE_PREFIXE + code.toUpperCase());
    if (!brut) return false;
    try {
      var obj = JSON.parse(brut);
      state = migrer(fusionner(etatVierge(), obj));
      return true;
    } catch(e){ return false; }
  }

  /**
   * Adapte un dossier enregistré par une version antérieure.
   * La v1 stockait un seul champ `eleve1` du type « Dupont Camille ». On le
   * reventile en nom et prénom sur le premier espace, et l'élève corrige au
   * besoin : mieux vaut un nom à retoucher qu'un dossier vide.
   */
  function migrer(s){
    if (!s.badge.nom1 && s.badge.eleve1){
      var d = decouperNom(s.badge.eleve1);
      s.badge.nom1 = d.nom; s.badge.prenom1 = d.prenom;
    }
    if (!s.badge.nom2 && s.badge.eleve2){
      var d2 = decouperNom(s.badge.eleve2);
      s.badge.nom2 = d2.nom; s.badge.prenom2 = d2.prenom;
    }
    delete s.badge.eleve1; delete s.badge.eleve2;
    s.v = VERSION_ETAT;
    return s;
  }

  function decouperNom(complet){
    var t = String(complet || '').trim().replace(/\s+/g, ' ');
    var i = t.indexOf(' ');
    if (i < 0) return { nom: formaterNom(t), prenom: '' };
    return { nom: formaterNom(t.slice(0, i)), prenom: formaterPrenom(t.slice(i + 1)) };
  }

  /**
   * Recopie l'état enregistré par-dessus le modèle vierge.
   *
   * Le parcours se fait sur les clés REÇUES, pas sur celles du modèle : une
   * première version parcourait le modèle et perdait silencieusement tous les
   * dictionnaires à clés dynamiques — le classement FP/FC (`m1.typage`) et les
   * lignes du cahier des charges (`m2.reponses`), dont le modèle vierge ne
   * contient aucune clé. Les clés absentes du fichier gardent leur valeur par
   * défaut, ce qui permet de rouvrir un dossier créé par une version antérieure.
   */
  function fusionner(base, recu){
    if (!recu || typeof recu !== 'object') return base;
    Object.keys(recu).forEach(function(k){
      // Un fichier importé vient de l'extérieur : on n'écrit jamais sur la
      // chaîne de prototypes.
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') return;
      var v = recu[k];
      if (v === undefined || v === null) return;
      if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) &&
          typeof v === 'object' && !Array.isArray(v)){
        base[k] = fusionner(base[k], v);
      } else {
        base[k] = v;
      }
    });
    return base;
  }

  /** Liste des codes présents sur ce poste (utile au professeur en salle info). */
  function listerCodes(){
    var out = [];
    try {
      for (var i=0;i<window.localStorage.length;i++){
        var k = window.localStorage.key(i);
        if (k && k.indexOf(CLE_PREFIXE) === 0 && k !== CLE_DERNIER){
          try {
            var s = JSON.parse(window.localStorage.getItem(k));
            s = migrer(fusionner(etatVierge(), s));
          out.push({ code:s.badge.code, eleves:nomEquipe(s), classe:s.badge.classe,
                     maj:s.maj, etat:s });
          } catch(e){ /* entrée illisible : ignorée */ }
        }
      }
    } catch(e){ /* stockage indisponible */ }
    out.sort(function(a,b){ return (b.maj||'').localeCompare(a.maj||''); });
    return out;
  }

  /* ========================= 3. Le badge d'équipe ========================== */

  /** Code lisible à l'oral, sans caractères ambigus (0/O, 1/I). */
  function genererCode(classe){
    var lettres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var s = '';
    for (var i=0;i<4;i++) s += lettres.charAt(Math.floor(Math.random()*lettres.length));
    var cl = (classe||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3) || 'EAU';
    return cl + '-' + s;
  }

  /* --- Formatage des noms -----------------------------------------------
     Appliqué à la frappe : le cahier de textes et la feuille du professeur
     restent lisibles sans reprise manuelle, et deux élèves qui écrivent
     « dupont » et « DUPONT » produisent la même entrée.
     --------------------------------------------------------------------- */

  /** Nom de famille : tout en majuscules, accents conservés. */
  function formaterNom(v){
    return String(v == null ? '' : v).replace(/\s+/g, ' ').replace(/^ /, '').toLocaleUpperCase('fr-FR');
  }

  /**
   * Prénom : une majuscule après chaque séparateur, le reste en minuscules.
   * Les séparateurs sont l'espace, le trait d'union et l'apostrophe, pour que
   * « jean-luc » devienne « Jean-Luc » et « n'guyen » « N'Guyen ».
   */
  function formaterPrenom(v){
    var t = String(v == null ? '' : v).replace(/\s+/g, ' ').replace(/^ /, '').toLocaleLowerCase('fr-FR');
    return t.replace(/(^|[\s\-'’])([^\s\-'’])/g, function(_, sep, c){
      return sep + c.toLocaleUpperCase('fr-FR');
    });
  }

  /** « DUPONT Camille », ou chaîne vide si rien n'est saisi. */
  function nomComplet(nom, prenom){
    return [String(nom||'').trim(), String(prenom||'').trim()].filter(Boolean).join(' ');
  }

  function nomEquipe(s){
    s = s || state;
    var a = nomComplet(s.badge.nom1, s.badge.prenom1);
    var b = nomComplet(s.badge.nom2, s.badge.prenom2);
    if (s.badge.mode === 'binome' && b) return a + ' & ' + b;
    return a || 'Équipe sans nom';
  }

  /* ====================== 4. Navigation entre écrans ======================= */

  var ecranCourant = 'accueil';

  function aller(id){
    var cibles = document.querySelectorAll('.screen');
    for (var i=0;i<cibles.length;i++) cibles[i].classList.remove('active');
    var el = document.getElementById('ecran-' + id);
    if (!el) return;
    el.classList.add('active');
    ecranCourant = id;

    // Onglet de mission mis en évidence
    var tabs = document.querySelectorAll('.mission-tab');
    for (var j=0;j<tabs.length;j++){
      tabs[j].setAttribute('aria-current', tabs[j].getAttribute('data-go') === id ? 'true' : 'false');
    }
    // L'ancre permet de revenir sur un écran précis (utile en classe : le
    // professeur peut projeter directement la mission 2).
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    window.scrollTo({ top:0, behavior:'smooth' });

    // Chaque module se redessine à l'affichage : ses dimensions dépendent de
    // la largeur réelle, inconnue tant que l'écran est masqué (display:none).
    if (id === 'm1' && window.M1) M1.auReveil();
    if (id === 'm2' && window.M2) M2.auReveil();
    if (id === 'm3' && window.M3) M3.auReveil();
    if (id === 'dossier' && window.EVAL) EVAL.construireDossier();
    majEnTete();
  }

  /* ======================== 5. Outils de texte =============================
     Mêmes conventions que le site principal (`_p11match`) : on tolère les
     fautes d'orthographe sans tolérer les à-peu-près de sens.
     ====================================================================== */

  /** Minuscules, sans accents ni ponctuation, espaces normalisés. */
  function norm(s){
    return String(s == null ? '' : s)
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g,'')
      .replace(/[^a-z0-9 ]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  /** Distance de Levenshtein, bornée : sert à accepter une faute de frappe. */
  function distance(a,b){
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    var prev = [], cur = [], i, j;
    for (j=0;j<=b.length;j++) prev[j] = j;
    for (i=1;i<=a.length;i++){
      cur[0] = i;
      for (j=1;j<=b.length;j++){
        cur[j] = Math.min(prev[j]+1, cur[j-1]+1, prev[j-1] + (a.charAt(i-1)===b.charAt(j-1) ? 0 : 1));
      }
      for (j=0;j<=b.length;j++) prev[j] = cur[j];
    }
    return prev[b.length];
  }

  /**
   * Compare une réponse à une liste de clés attendues.
   * Renvoie 1 (mot attendu présent), 0,5 (présent mais mal orthographié) ou 0.
   *
   * Convention des clés, reprise du site principal :
   *   'debit'   → le mot entier doit être présent (pluriel toléré) ;
   *   'econom*' → un radical suffit, « économiser » comme « économie » ;
   *   'indice ip' → une expression de plusieurs mots est cherchée telle quelle.
   *
   * L'exigence du mot entier évite qu'une réponse contenant par hasard la
   * suite de lettres attendue décroche le point plein.
   */
  function match(reponse, cles){
    var t = norm(reponse);
    if (!t) return 0;
    var mots = t.split(' ');
    var meilleur = 0;

    for (var i=0;i<cles.length;i++){
      var cle = norm(cles[i]);
      var radical = cles[i].slice(-1) === '*';
      if (radical) cle = norm(cles[i].slice(0,-1));
      if (!cle) continue;

      if (cle.indexOf(' ') !== -1){
        // Expression : on la cherche telle quelle dans la phrase.
        if (t.indexOf(cle) !== -1) return 1;
        continue;
      }
      for (var k=0;k<mots.length;k++){
        var m = mots[k];
        if (radical){
          if (m.indexOf(cle) === 0) return 1;                 // bon radical
          if (distance(m.slice(0,cle.length), cle) === 1) meilleur = Math.max(meilleur, 0.5);
        } else {
          if (m === cle || m === cle + 's' || m === cle + 'x') return 1;   // mot entier
          // Faute d'orthographe : 1 erreur pour un mot court, 2 au-delà.
          var tol = cle.length >= 7 ? 2 : 1;
          if (Math.abs(m.length - cle.length) <= tol && distance(m, cle) <= tol){
            meilleur = Math.max(meilleur, 0.5);
          }
        }
      }
    }
    return meilleur;
  }

  /** Vrai si l'un des fragments apparaît dans le texte (test large, non noté). */
  function contient(texte, liste){
    var t = norm(texte);
    for (var i=0;i<liste.length;i++){ if (t.indexOf(norm(liste[i])) !== -1) return true; }
    return false;
  }

  /**
   * Lit un nombre écrit à la française : « 0,5 », « 1 000 », « ~5 », « ≤ 0,5 ».
   * Renvoie null si aucun nombre n'est présent.
   */
  function nombre(v){
    if (v === null || v === undefined) return null;
    var t = String(v).replace(/ /g,' ').replace(/,/g,'.').replace(/\s/g,'');
    var m = t.match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  }

  /** Affichage à la française : séparateur décimal virgule. */
  function fmt(n){
    if (n === null || n === undefined || isNaN(n)) return '—';
    return String(Math.round(n*100)/100).replace('.', ',');
  }

  /** Échappe le texte saisi par l'élève avant toute insertion en HTML. */
  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  /**
   * Contrôle « verbe à l'infinitif » : une fonction se formule toujours ainsi.
   * Renvoie {ok, verbe} — `ok` est faux pour « le robinet détecte les mains ».
   */
  function verbeInfinitif(texte){
    var t = norm(texte);
    if (!t) return { ok:false, verbe:'' };
    var mots = t.split(' ');
    // « se » ou « s' » précède parfois le verbe : « se fixer », « s'adapter ».
    var tete = (mots[0] === 'se' || mots[0] === 's') ? (mots[0] + ' ' + (mots[1]||'')) : mots[0];
    var seul = (mots[0] === 'se' || mots[0] === 's') ? (mots[1]||'') : mots[0];

    for (var i=0;i<P11DATA.VERBES.length;i++){
      var v = norm(P11DATA.VERBES[i]);
      if (tete === v || seul === v) return { ok:true, verbe:tete };
    }
    // Repli sur la terminaison, pour les verbes absents de la liste.
    // Les formes conjuguées fréquentes en 4e sont écartées explicitement :
    // « permet », « détecte », « sert » ne finissent pas en -er/-ir/-re.
    if (seul.length >= 4 && /(er|ir|re|oir)$/.test(seul)) return { ok:true, verbe:tete };
    return { ok:false, verbe:tete };
  }

  /* ===================== 6. Notifications et modale ======================== */

  var minuteurToast = null;
  function signaler(msg, duree){
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    if (minuteurToast) clearTimeout(minuteurToast);
    minuteurToast = setTimeout(function(){ el.classList.remove('show'); }, duree || 2600);
  }

  function modale(titre, html){
    var back = document.getElementById('modal-back');
    document.getElementById('modal-titre').textContent = titre;
    document.getElementById('modal-corps').innerHTML = html;
    back.classList.add('show');
  }
  function fermerModale(){ document.getElementById('modal-back').classList.remove('show'); }

  /* ==================== 7. En-tête et barre de progression ================= */

  /** Met à jour la pastille d'équipe et les jauges des trois missions. */
  function majEnTete(){
    var chip = document.getElementById('team-chip');
    if (chip){
      if (state.badge.code){
        chip.style.display = '';
        chip.innerHTML = '<b>' + esc(nomEquipe()) + '</b>' +
          (state.badge.classe ? esc(state.badge.classe) + ' · ' : '') +
          '<span class="code">' + esc(state.badge.code) + '</span>';
      } else {
        chip.style.display = 'none';
      }
    }
    ['m1','m2','m3'].forEach(function(m){
      var bar = document.querySelector('.mission-tab[data-go="'+m+'"] .bar > i');
      var tab = document.querySelector('.mission-tab[data-go="'+m+'"]');
      if (!bar) return;
      var p = avancement(m);
      bar.style.width = p + '%';
      if (tab) tab.classList.toggle('done', p >= 100);
    });
  }

  /** Avancement d'une mission, en %. Sert aux jauges, pas à la note. */
  function avancement(m){
    if (m === 'm1'){
      var nbT = Object.keys(state.m1.typage).length;
      var nbL = state.m1.liens.length;
      return Math.min(100, Math.round(((Math.min(nbL,6)/6)*40 + (nbT/P11DATA.FONCTIONS.length)*60)));
    }
    if (m === 'm2'){
      if (!state.m2.ost) return 0;
      var ost = ostParId(state.m2.ost);
      if (!ost) return 0;
      var remplies = 0;
      ost.lignes.forEach(function(l){
        var r = state.m2.reponses[l.rep];
        if (r && String(r.critere||'').trim() && String(r.valeur||'').trim()) remplies++;
      });
      return Math.round(10 + (remplies/ost.lignes.length)*90);
    }
    if (m === 'm3'){
      var pts = 0;
      if (String(state.m3.nom||'').trim()) pts += 15;
      if (String(state.m3.probleme||'').trim()) pts += 15;
      if (String(state.m3.principe||'').trim()) pts += 10;
      pts += Math.min(40, state.m3.fonctions.length * 10);
      if (state.m3.pieces.length >= 2) pts += 20;
      return Math.min(100, pts);
    }
    return 0;
  }

  function ostParId(id){
    for (var i=0;i<P11DATA.OST.length;i++){ if (P11DATA.OST[i].id === id) return P11DATA.OST[i]; }
    return null;
  }

  /* ========================= 8. Mode professeur ============================
     Activé par ?prof dans l'URL. Révèle les corrigés complets, la grille
     d'évaluation et la liste des dossiers présents sur le poste.
     Comme sur le site principal, aucun bloc `.prof-only` ne s'affiche à l'élève.
     ====================================================================== */
  function modeProf(){
    return /(\?|&)prof\b/.test(window.location.search);
  }

  /* ======================= 9. Démarrage de la page ========================= */

  function init(){
    if (modeProf()) document.body.classList.add('est-prof');

    // Fermeture de la modale : croix, fond, touche Échap.
    document.getElementById('modal-fermer').addEventListener('click', fermerModale);
    document.getElementById('modal-back').addEventListener('click', function(e){
      if (e.target === this) fermerModale();
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') fermerModale();
    });

    // Onglets de mission
    var tabs = document.querySelectorAll('.mission-tab');
    for (var i=0;i<tabs.length;i++){
      tabs[i].addEventListener('click', function(){
        var go = this.getAttribute('data-go');
        if (!state.badge.code && go !== 'accueil'){
          signaler("Crée d'abord ton badge de bureau d'études.");
          aller('accueil');
          return;
        }
        aller(go);
      });
    }

    BADGE.init();
    M1.init(); M2.init(); M3.init(); EVAL.init();
    PRESENTATION.init();
    CLOUD.init();

    // Réouverture automatique : seulement le dossier de CETTE session de
    // navigation. Après un simple rechargement, l'équipe retrouve son travail ;
    // après la fermeture du navigateur, le poste repart sur l'écran de badge et
    // la classe suivante ne reprend pas le dossier de la précédente à son nom.
    var enCours = ssGet(CLE_SESSION);
    if (enCours && charger(enCours)){
      BADGE.refletEtat();
      M1.refletEtat(); M2.refletEtat(); M3.refletEtat();
      signaler('Dossier ' + state.badge.code + ' rouvert.');
      var cible = (window.location.hash || '').replace('#','');
      aller(['m1','m2','m3','dossier'].indexOf(cible) !== -1 ? cible : 'accueil');
    } else {
      BADGE.refletEtat();
      aller('accueil');
    }
    majEnTete();

    // Filet de sécurité : on écrit avant que l'onglet ne se ferme.
    window.addEventListener('beforeunload', function(){ if (state.badge.code) sauver(true); });
  }

  return {
    // état
    get state(){ return state; },
    set state(v){ state = v; },
    etatVierge:etatVierge, sauver:sauver, charger:charger, listerCodes:listerCodes,
    genererCode:genererCode, nomEquipe:nomEquipe, nomComplet:nomComplet,
    formaterNom:formaterNom, formaterPrenom:formaterPrenom, ostParId:ostParId,
    ssGet:ssGet, ssSet:ssSet, ssRemove:ssRemove, CLE_SESSION:CLE_SESSION,
    // navigation et interface
    aller:aller, signaler:signaler, modale:modale, fermerModale:fermerModale,
    majEnTete:majEnTete, avancement:avancement, modeProf:modeProf,
    // texte
    norm:norm, match:match, contient:contient, nombre:nombre, fmt:fmt, esc:esc,
    verbeInfinitif:verbeInfinitif, distance:distance,
    init:init
  };
})();
