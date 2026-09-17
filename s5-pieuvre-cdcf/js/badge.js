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

  function init(){
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

    // Entrée au clavier depuis le champ « code » : reprise directe.
    document.getElementById('badge-code-repris').addEventListener('keydown', function(e){
      if (e.key === 'Enter') reprendre();
    });

    if (P11.modeProf()) preparerVueProf();
  }

  function choisirMode(m){
    mode = m;
    document.getElementById('mode-seul').setAttribute('aria-pressed', m === 'seul');
    document.getElementById('mode-binome').setAttribute('aria-pressed', m === 'binome');
    document.getElementById('champ-eleve2').style.display = (m === 'binome') ? '' : 'none';
    document.getElementById('badge-mode-aide').textContent = (m === 'binome')
      ? "Un seul poste pour deux : alternez aux commandes à chaque mission. Le dossier portera vos deux noms."
      : "Tu travailles seul : tu pourras tout de même partager ton dossier avec le code d'équipe.";
  }

  function creer(){
    var e1 = document.getElementById('badge-eleve1').value.trim();
    var e2 = document.getElementById('badge-eleve2').value.trim();
    var cl = document.getElementById('badge-classe').value.trim();

    if (!e1){
      P11.signaler('Indique au moins ton prénom et ton nom.');
      document.getElementById('badge-eleve1').focus();
      return;
    }
    if (mode === 'binome' && !e2){
      P11.signaler('En binôme, les deux noms sont nécessaires.');
      document.getElementById('badge-eleve2').focus();
      return;
    }

    // Un nouveau badge repart d'un état vierge : on ne mélange pas deux équipes.
    P11.state = P11.etatVierge();
    P11.state.badge = {
      mode: mode, eleve1: e1, eleve2: e2, classe: cl,
      code: P11.genererCode(cl),
      cree: new Date().toISOString()
    };
    P11.sauver(true);

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
    document.getElementById('badge-eleve1').value = b.eleve1 || '';
    document.getElementById('badge-eleve2').value = b.eleve2 || '';
    document.getElementById('badge-classe').value = b.classe || '';
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
        '<th>Code</th><th>Équipe</th><th>M1</th><th>M2</th><th>M3 auto</th><th>Dernière activité</th><th></th>' +
        '</tr></thead><tbody>' +
        codes.map(function(c){
          var s = c.etat;
          return '<tr><td><b>' + P11.esc(c.code) + '</b></td>' +
                 '<td>' + P11.esc(c.eleves) + '</td>' +
                 '<td>' + (s.m1.score == null ? '—' : P11.fmt(s.m1.score)) + '</td>' +
                 '<td>' + (s.m2.score == null ? '—' : P11.fmt(s.m2.score)) + '</td>' +
                 '<td>' + (s.m3.score == null ? '—' : P11.fmt(s.m3.score)) + '</td>' +
                 '<td>' + P11.esc(dateCourte(s.maj)) + '</td>' +
                 '<td><button class="btn sec small" data-open="' + P11.esc(c.code) + '">Ouvrir</button></td></tr>';
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
