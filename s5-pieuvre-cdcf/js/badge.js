/* ============================================================================
   P11 · Séance 5 — Le badge de bureau d'études
   ----------------------------------------------------------------------------
   Écran d'entrée. Il remplit trois rôles :

     · identifier l'équipe (seul ou binôme) pour que le professeur sache à qui
       appartient le dossier rendu ;
     · produire un CODE d'équipe, qui sert de clé de sauvegarde locale et de
       moyen de reprise — y compris sur un autre poste, via le fichier exporté ;
     · rappeler la consigne de la séance sous forme d'appel d'offres.

   Le code est volontairement court et dictable à l'oral (ni O ni 0, ni I ni 1) :
   en salle informatique, il est recopié à la main sur le cahier.
   ========================================================================== */

var BADGE = (function(){
  'use strict';

  var mode = 'seul';
  var CLE_IDENTITE = 'p11s5:identite';   // brouillon d'identité, portée session

  /* Champs d'identité : quel formateur s'applique à chacun. */
  var CHAMPS = [
    { id:'badge-nom1',    cle:'nom1',    fmt:'nom'    },
    { id:'badge-prenom1', cle:'prenom1', fmt:'prenom' },
    { id:'badge-nom2',    cle:'nom2',    fmt:'nom'    },
    { id:'badge-prenom2', cle:'prenom2', fmt:'prenom' }
  ];

  /**
   * Applique un formatage à la frappe sans faire sauter le curseur.
   * Une conversion de casse ne change pas la longueur du texte : la position
   * du curseur reste donc valable. Elle n'est abandonnée que si la longueur a
   * bougé — c'est-à-dire quand deux espaces consécutifs viennent d'être réduits.
   */
  function brancherFormatage(el, formateur, apres){
    function appliquer(){
      var pos = el.selectionStart;
      var avant = el.value;
      var net = formateur(avant);
      if (net !== avant){
        el.value = net;
        if (net.length === avant.length){
          try { el.setSelectionRange(pos, pos); } catch(e){}
        }
      }
      if (apres) apres();
    }
    el.addEventListener('input', appliquer);
    el.addEventListener('blur', appliquer);
  }

  /**
   * Mémorise le formulaire en cours de saisie.
   *
   * Uniquement un BROUILLON, effacé dès que le badge est créé : il ne sert qu'à
   * rattraper un rechargement survenu au milieu de la saisie. Le conserver
   * au-delà repeuplerait le formulaire pour l'élève suivant, qui écraserait le
   * seul nom qu'il corrige et rendrait son travail sous un binôme fantôme.
   * Une fois le badge créé, c'est le dossier lui-même qui remplit les champs.
   */
  function noterIdentite(){
    if (P11.state.badge.code) return;      // badge actif : plus de brouillon
    var d = { mode:mode, classe:valeur('badge-classe') };
    CHAMPS.forEach(function(c){ d[c.cle] = valeur(c.id); });
    P11.ssSet(CLE_IDENTITE, JSON.stringify(d));
  }

  function relireIdentite(){
    if (P11.state.badge.code) return;      // le dossier ouvert fait foi
    try {
      var d = JSON.parse(P11.ssGet(CLE_IDENTITE) || 'null');
      if (!d) return;
      CHAMPS.forEach(function(c){
        var el = document.getElementById(c.id);
        if (el && d[c.cle]) el.value = d[c.cle];
      });
      if (d.classe) document.getElementById('badge-classe').value = d.classe;
      choisirMode(d.mode === 'binome' ? 'binome' : 'seul');
    } catch(e){ /* brouillon illisible : on repart d'un formulaire vide */ }
  }

  function valeur(id){
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function init(){
    // Le menu des classes vient de data.js : une classe qui change d'intitulé
    // ne se corrige qu'à un seul endroit.
    var sel = document.getElementById('badge-classe');
    sel.innerHTML = '<option value="">Choisir…</option>' +
      P11DATA.CLASSES.map(function(c){
        return '<option value="' + P11.esc(c) + '">' + P11.esc(c) + '</option>';
      }).join('');
    sel.addEventListener('change', noterIdentite);

    CHAMPS.forEach(function(c){
      var el = document.getElementById(c.id);
      if (!el) return;
      brancherFormatage(el, c.fmt === 'nom' ? P11.formaterNom : P11.formaterPrenom, noterIdentite);
    });

    // Texte de l'appel d'offres, tiré de data.js
    document.getElementById('brief-de').textContent = P11DATA.BRIEF.de;
    document.getElementById('brief-titre').textContent = P11DATA.BRIEF.titre;
    document.getElementById('brief-corps').innerHTML =
      P11DATA.BRIEF.corps.map(function(p){ return '<p>' + P11.esc(p) + '</p>'; }).join('');

    // Choix seul / binôme
    ['seul','binome'].forEach(function(m){
      document.getElementById('mode-' + m).addEventListener('click', function(){ choisirMode(m); });
    });
    choisirMode('seul');

    document.getElementById('badge-creer').addEventListener('click', creer);
    document.getElementById('badge-reprendre').addEventListener('click', reprendre);
    document.getElementById('badge-importer').addEventListener('change', importer);
    document.getElementById('badge-copier').addEventListener('click', copierCode);
    document.getElementById('badge-fermer').addEventListener('click', fermer);

    // Entrée au clavier depuis le champ « code » : reprise directe.
    document.getElementById('badge-code-repris').addEventListener('keydown', function(e){
      if (e.key === 'Enter') reprendre();
    });

    relireIdentite();
    if (P11.modeProf()) preparerVueProf();
  }

  function choisirMode(m){
    mode = m;
    document.getElementById('mode-seul').setAttribute('aria-pressed', m === 'seul');
    document.getElementById('mode-binome').setAttribute('aria-pressed', m === 'binome');
    document.getElementById('champs-eleve2').style.display = (m === 'binome') ? '' : 'none';
    document.getElementById('badge-mode-aide').textContent = (m === 'binome')
      ? "Un seul poste pour deux : alternez aux commandes à chaque mission. Le dossier portera vos deux noms."
      : "Tu travailles seul : tu pourras tout de même partager ton dossier avec le code d'équipe.";
  }

  function creer(){
    var n1 = valeur('badge-nom1'),    p1 = valeur('badge-prenom1');
    var n2 = valeur('badge-nom2'),    p2 = valeur('badge-prenom2');
    var cl = valeur('badge-classe');

    // Contrôles dans l'ordre où l'élève lit le formulaire, un message à la fois.
    var manque =
        !n1 ? ['badge-nom1',    'Indique ton nom de famille.']
      : !p1 ? ['badge-prenom1', 'Indique ton prénom.']
      : (mode === 'binome' && !n2) ? ['badge-nom2',    'En binôme, le nom du second élève est nécessaire.']
      : (mode === 'binome' && !p2) ? ['badge-prenom2', 'En binôme, le prénom du second élève est nécessaire.']
      : !cl ? ['badge-classe',  'Choisis ta classe dans la liste.']
      : null;
    if (manque){
      P11.signaler(manque[1]);
      var el = document.getElementById(manque[0]);
      el.classList.add('f-ko');
      el.focus();
      setTimeout(function(){ el.classList.remove('f-ko'); }, 2500);
      return;
    }

    // Un nouveau badge repart d'un état vierge : on ne mélange pas deux équipes.
    P11.state = P11.etatVierge();
    P11.state.badge = {
      mode: mode,
      nom1: n1, prenom1: p1,
      nom2: mode === 'binome' ? n2 : '',
      prenom2: mode === 'binome' ? p2 : '',
      classe: cl,
      code: P11.genererCode(cl),
      cree: new Date().toISOString()
    };
    P11.sauver(true);
    P11.ssRemove(CLE_IDENTITE);   // le brouillon a rempli son office

    M1.refletEtat(); M2.refletEtat(); M3.refletEtat();
    refletEtat();
    P11.signaler('Badge créé — note ton code : ' + P11.state.badge.code, 5000);
    document.getElementById('badge-resultat').scrollIntoView({ behavior:'smooth', block:'center' });
  }

  function reprendre(){
    var code = document.getElementById('badge-code-repris').value.trim().toUpperCase();
    if (!code){ P11.signaler("Saisis le code de ton équipe."); return; }
    if (!P11.charger(code)){
      P11.signaler("Aucun dossier « " + code + " » sur ce poste. Utilise le fichier exporté.", 4200);
      return;
    }
    M1.refletEtat(); M2.refletEtat(); M3.refletEtat();
    refletEtat();
    P11.majEnTete();
    P11.signaler('Dossier ' + code + ' rouvert.');
  }

  /** Reprise sur un autre poste : on relit le fichier .json exporté. */
  function importer(e){
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var lecteur = new FileReader();
    lecteur.onload = function(){
      try {
        var obj = JSON.parse(lecteur.result);
        if (!obj || !obj.badge || !obj.badge.code) throw new Error('format');
        P11.state = P11.etatVierge();
        // fusionner() est dans core : on passe par charger() après écriture.
        window.localStorage.setItem('p11s5:' + obj.badge.code, JSON.stringify(obj));
        P11.charger(obj.badge.code);
        M1.refletEtat(); M2.refletEtat(); M3.refletEtat();
        refletEtat();
        P11.majEnTete();
        P11.signaler('Dossier ' + obj.badge.code + ' importé.');
      } catch(err){
        P11.signaler("Ce fichier n'est pas un dossier P11 valide.", 4000);
      }
      e.target.value = '';   // permet de réimporter le même fichier
    };
    lecteur.readAsText(f);
  }

  /**
   * Libère le poste pour l'élève suivant.
   * Le dossier n'est pas supprimé : seule la session en cours est oubliée, si
   * bien qu'un rechargement ne le rouvre plus. Il reste accessible par son code
   * et dans la liste du mode professeur.
   */
  function fermer(){
    var code = P11.state.badge.code;
    if (!code) return;
    P11.sauver(true);
    P11.ssRemove(P11.CLE_SESSION);
    P11.ssRemove(CLE_IDENTITE);
    P11.state = P11.etatVierge();
    CHAMPS.forEach(function(c){
      var el = document.getElementById(c.id); if (el) el.value = '';
    });
    document.getElementById('badge-classe').value = '';
    choisirMode('seul');
    M1.refletEtat(); M2.refletEtat(); M3.refletEtat();
    refletEtat();
    P11.majEnTete();
    P11.aller('accueil');
    P11.signaler('Dossier ' + code + ' fermé. Note bien ce code pour le rouvrir.', 5000);
  }

  function copierCode(){
    var code = P11.state.badge.code;
    if (!code) return;
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(code).then(
        function(){ P11.signaler('Code copié : ' + code); },
        function(){ P11.signaler('Code : ' + code); }
      );
    } else {
      P11.signaler('Code : ' + code);
    }
  }

  /** Affiche (ou masque) le bloc « badge créé » selon l'état courant. */
  function refletEtat(){
    var b = P11.state.badge;
    var res = document.getElementById('badge-resultat');
    var form = document.getElementById('badge-form');

    if (!b.code){
      res.style.display = 'none';
      form.style.display = '';
      return;
    }
    form.style.display = 'none';
    res.style.display = '';
    document.getElementById('badge-code-affiche').textContent = b.code;
    document.getElementById('badge-identite').innerHTML =
      '<b>' + P11.esc(P11.nomEquipe()) + '</b>' +
      (b.classe ? ' · ' + P11.esc(b.classe) : '') +
      ' · ' + (b.mode === 'binome' ? 'binôme' : 'seul');

    // Les champs sont repeuplés pour qu'un changement de nom reste possible.
    document.getElementById('badge-nom1').value    = b.nom1 || '';
    document.getElementById('badge-prenom1').value = b.prenom1 || '';
    document.getElementById('badge-nom2').value    = b.nom2 || '';
    document.getElementById('badge-prenom2').value = b.prenom2 || '';
    document.getElementById('badge-classe').value  = b.classe || '';
    choisirMode(b.mode || 'seul');
  }

  /* ---------------------------------------------------------------------
     Vue professeur : liste des dossiers enregistrés sur ce poste.
     Elle n'apparaît qu'avec ?prof dans l'adresse (bloc .prof-only).
     --------------------------------------------------------------------- */
  function preparerVueProf(){
    var box = document.getElementById('prof-dossiers');
    if (!box) return;

    function rafraichir(){
      var codes = P11.listerCodes();
      if (!codes.length){
        box.innerHTML = '<p class="hint" style="margin:0">Aucun dossier enregistré sur ce poste.</p>';
        return;
      }
      box.innerHTML =
        '<div class="table-scroll"><table class="grille"><thead><tr>' +
        '<th>Code</th><th>Classe</th><th>Équipe</th><th>M1</th><th>M2</th><th>M3 auto</th>' +
        '<th>Projeter</th><th>Dernière activité</th><th></th>' +
        '</tr></thead><tbody>' +
        codes.map(function(c){
          var s = c.etat;
          return '<tr><td><b>' + P11.esc(c.code) + '</b></td>' +
                 '<td>' + P11.esc(c.classe || '—') + '</td>' +
                 '<td>' + P11.esc(c.eleves) + '</td>' +
                 '<td>' + (s.m1.score == null ? '—' : P11.fmt(s.m1.score)) + '</td>' +
                 '<td>' + (s.m2.score == null ? '—' : P11.fmt(s.m2.score)) + '</td>' +
                 '<td>' + (s.m3.score == null ? '—' : P11.fmt(s.m3.score)) + '</td>' +
                 '<td class="lv' + (s.m3.presentation ? ' on' : '') + '">' +
                   (s.m3.presentation ? '★' : '') + '</td>' +
                 '<td>' + P11.esc(dateCourte(s.maj)) + '</td>' +
                 '<td><button class="btn sec small" data-open="' + P11.esc(c.code) + '">Ouvrir</button>' +
                 (s.m3.presentation
                   ? ' <button class="btn gold small" data-projeter="' + P11.esc(c.code) + '">Projeter</button>'
                   : '') +
                 '</td></tr>';
        }).join('') +
        '</tbody></table></div>';

      box.querySelectorAll('[data-open]').forEach(function(b){
        b.addEventListener('click', function(){
          if (P11.charger(b.dataset.open)){
            M1.refletEtat(); M2.refletEtat(); M3.refletEtat();
            refletEtat(); P11.majEnTete();
            P11.aller('dossier');
          }
        });
      });
      box.querySelectorAll('[data-projeter]').forEach(function(b){
        b.addEventListener('click', function(){
          if (P11.charger(b.dataset.projeter)){
            M1.refletEtat(); M2.refletEtat(); M3.refletEtat();
            refletEtat(); P11.majEnTete();
            PRESENTATION.ouvrir();
          }
        });
      });
    }

    document.getElementById('prof-rafraichir').addEventListener('click', rafraichir);
    rafraichir();
  }

  function dateCourte(iso){
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('fr-FR') + ' ' +
           d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  }

  return { init:init, refletEtat:refletEtat };
})();
