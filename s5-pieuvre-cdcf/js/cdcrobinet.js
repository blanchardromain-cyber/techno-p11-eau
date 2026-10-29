/* ============================================================================
   P11 · Séance 3 — Mission 1, partie 5 : le cahier des charges du robinet
   ----------------------------------------------------------------------------
   La partie 2 de la fiche papier (CDCF du robinet) n'était traitée nulle part
   dans les missions : les élèves ne pouvaient pas la compléter. Cette partie la
   reprend telle qu'elle est imprimée — fonction et critère donnés, repère et
   niveau à écrire.

   Aucune valeur n'est donnée toute faite : l'élève lit la notice du fabricant
   (modèle D-15, le même que l'activité 5-6 du site), qui dit les niveaux avec
   ses mots et les entoure de valeurs pièges. Il doit choisir la bonne valeur,
   l'écrire en chiffres et lui donner son unité.

   Barème (8 points) : 2 points par niveau. Le repère n'est pas noté : il
   dépend de l'ordre de tracé de chaque élève, il est seulement contrôlé
   contre SA pieuvre. Note fixée au 2e essai, comme les missions 1 et 2.
   ========================================================================== */

var CDCR = (function(){
  'use strict';

  /* ======================== Lecture des réponses ========================== */

  /** Minuscules, sans accents ; la virgule décimale devient un point. */
  function n(s){
    return String(s == null ? '' : s).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/(\d),(\d)/g, '$1.$2')
      .replace(/[^a-z0-9./ ]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function nombres(t){
    return (t.match(/\d+(\.\d+)?/g) || []).map(parseFloat);
  }

  /* Valeurs pièges de la notice : on dit d'où elles viennent. */
  function piege(t){
    if (/(^|[^a-z])bars?( |$)/.test(t)) return "Cette valeur est une pression (en bar) : elle ne répond pas à ce critère.";
    if (/(^|[^a-z])ans?( |$)/.test(t))  return "Cette valeur est la durée de garantie : elle ne répond pas à ce critère.";
    return '';
  }

  /* Nombre de grandeurs différentes citées : débit, distance, indice IP, arrêt. */
  var GRANDEURS = [
    /l(itres?)?( ?\/ ?| par | )?min/,
    /(^|[^a-z])(cm|mm|centimetres?|millimetres?)( |$)/,
    /(^|[^a-z])ip ?\d/,
    /(immediat|instantan|aussitot|sans (le moindre )?delai|(^|[^0-9.])0 ?(s|sec|secondes?)( |$))/
  ];
  function grandeurs(t){
    return GRANDEURS.filter(function(re){ return re.test(t); }).length;
  }

  /**
   * Évalue le niveau d'une ligne. Renvoie { pts, motif }.
   * 2 points : bonne valeur ET bonne unité. 1 point : bonne valeur, unité
   * absente ou fausse. Le point d'unité seul n'existe pas : il se devinerait
   * à partir du critère.
   */
  function evaluerNiveau(id, brut){
    var t = n(brut), v = nombres(t);
    if (!t) return { pts:0, motif:"Niveau non renseigné." };
    var p = piege(t);
    if (p) return { pts:0, motif:p };
    // Recopier toute la notice dans chaque case donnait 8/8 : une ligne qui
    // contient les niveaux de plusieurs critères vaut 0.
    if (grandeurs(t) > 1) return { pts:0, motif:"Une seule valeur par ligne : choisis celle qui répond à ce critère." };

    if (id === 'c1'){
      var unite = /l(itres?)?( ?\/ ?| par | )?min/.test(t);
      if (v.indexOf(10) !== -1 && v.indexOf(2) === -1)
        return { pts:0, motif:"Dix litres par minute, c'est le robinet classique, pas le D-15." };
      if (v.indexOf(2) === -1) return { pts:0, motif:"Ce n'est pas le débit annoncé pour le D-15." };
      return unite ? { pts:2, motif:'' }
                   : { pts:1, motif:"Bonne valeur, mais l'unité manque ou ne convient pas : un débit se mesure en litres par minute (L/min)." };
    }
    if (id === 'c2'){
      var cm = /(^|[^a-z])(cm|centimetres?)( |$)/.test(t), mm = /(^|[^a-z])(mm|millimetres?)( |$)/.test(t);
      if ((cm && v.indexOf(15) !== -1) || (mm && v.indexOf(150) !== -1)) return { pts:2, motif:'' };
      if (v.indexOf(15) !== -1) return { pts:1, motif:"Bonne valeur, mais l'unité manque ou ne convient pas : une distance de détection s'exprime ici en centimètres (cm)." };
      if (/quinzaine/.test(t)) return { pts:1, motif:"C'est la bonne idée, mais un niveau s'écrit en chiffres, avec son unité." };
      return { pts:0, motif:"Ce n'est pas la distance de détection annoncée pour le D-15." };
    }
    if (id === 'c3'){
      if (/(^|[^a-z0-9])ip ?65( |$)/.test(t)) return { pts:2, motif:'' };
      if (v.indexOf(65) !== -1) return { pts:1, motif:"Les bons chiffres, mais un indice de protection s'écrit avec les lettres IP devant." };
      return { pts:0, motif:"Ce n'est pas l'indice de protection du D-15." };
    }
    if (id === 'c4'){
      // « pas une goutte » (repris de la notice) n'est pas une négation.
      var nie = /(^|[^a-z])(pas|jamais)( |$)/.test(t.replace(/pas une goutte/g, ''));
      var arret = /(immediat|instantan|tout de suite|aussitot|sans (le moindre )?delai|des (que|le retrait)|des qu)/.test(t) ||
                  /(^|[^0-9.])0 ?(s|sec|secondes?)( |$)/.test(t);
      if (arret && !nie) return { pts:2, motif:'' };
      if (/(coupe|arret|stop|ferme)/.test(t) && !nie)
        return { pts:1, motif:"Oui, l'eau s'arrête : mais au bout de combien de temps ? Le niveau doit le dire." };
      return { pts:0, motif:"Relis ce qui se passe quand les mains s'éloignent du robinet." };
    }
    return { pts:0, motif:'' };
  }

  /* ===================== Repères, d'après la pieuvre ======================= */

  /** Repère de chaque trait tracé, dans l'ordre du tracé (comme module1). */
  function reperesTraces(){
    var m = {}, nb = { FP:0, FC:0 };
    P11.state.m1.liens.forEach(function(l){ nb[l.type]++; m[l.lid] = l.type + nb[l.type]; });
    return { parLien:m, nb:nb };
  }

  /** Repère du trait que l'élève a tracé pour la fonction `fid`, ou ''. */
  function repereAttendu(fid){
    var f = null;
    P11DATA.FONCTIONS.forEach(function(x){ if (x.id === fid) f = x; });
    if (!f) return '';
    var r = reperesTraces(), liens = P11.state.m1.liens;
    for (var i=0;i<liens.length;i++){
      var l = liens[i];
      if (f.type === 'FP' && l.type === 'FP' && f.via.indexOf(l.de) !== -1 && f.via.indexOf(l.a) !== -1) return r.parLien[l.lid];
      if (f.type === 'FC' && l.type === 'FC' && l.de === f.via[0]) return r.parLien[l.lid];
    }
    return '';
  }

  /** Options du menu Repère : les traits tracés, plus un numéro FC libre. */
  function options(){
    var nb = reperesTraces().nb, out = [];
    if (!nb.FP && !nb.FC) nb = { FP:1, FC:5 };   // pieuvre pas encore tracée
    for (var i=1;i<=Math.max(1, nb.FP);i++) out.push('FP' + i);
    for (var j=1;j<=nb.FC + 1;j++) out.push('FC' + j);
    return out;
  }

  /** Contrôle du repère (non noté). Renvoie { ok, motif }. */
  function evaluerRepere(l, rep){
    if (!rep) return { ok:false, motif:"Repère non choisi." };
    if (!P11.state.m1.liens.length) return { ok:false, motif:"Trace d'abord ta pieuvre (étape 2) : les repères viennent d'elle." };
    if (l.via){
      var att = repereAttendu(l.via);
      if (!att) return { ok:false, motif:"Le trait de cette fonction manque sur ta pieuvre : trace-le d'abord." };
      return rep === att ? { ok:true, motif:'' }
        : { ok:false, motif:"Sur ta pieuvre, " + rep + " ne désigne pas le trait de cette fonction. Remonte à ton schéma." };
    }
    // Fonction absente de la pieuvre : elle prend un numéro FC encore libre.
    var parLien = reperesTraces().parLien;
    var pris = Object.keys(parLien).map(function(k){ return parLien[k]; });
    if (/^FC/.test(rep) && pris.indexOf(rep) === -1) return { ok:true, motif:'' };
    return { ok:false, motif:"Cette fonction ne relie l'objet à aucun élément de ta pieuvre : ce n'est aucun des traits déjà tracés." };
  }

  /* ============================== Affichage =============================== */

  function construire(){
    var C = P11DATA.CDC_ROBINET;
    var box = document.getElementById('cdc-notice');
    if (box) box.innerHTML =
      '<div class="demande-entete"><span class="demande-de">Document fictif</span>' +
      '<h3 class="demande-titre">' + P11.esc(C.notice.de) + '</h3></div>' +
      C.notice.corps.map(function(p){ return '<p>' + P11.esc(p) + '</p>'; }).join('');

    var st = P11.state.cdc, opts = options();
    var h = '';
    C.lignes.forEach(function(l){
      var r = st.reponses[l.id] || {};
      h += '<tr data-id="' + l.id + '">' +
        '<td><select class="cdc-rep" aria-label="Repère : ' + P11.esc(l.fonction) + '"><option value="">…</option>' +
          opts.map(function(o){ return '<option' + (r.rep === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') +
          (r.rep && opts.indexOf(r.rep) === -1 ? '<option selected>' + P11.esc(r.rep) + '</option>' : '') +
        '</select></td>' +
        '<td class="fn">' + P11.esc(l.fonction) + '</td>' +
        '<td>' + P11.esc(l.critere) + '</td>' +
        '<td><input type="text" class="cdc-niv" placeholder="à lire dans la notice" autocomplete="off" ' +
             'aria-label="Niveau : ' + P11.esc(l.critere) + '" value="' + P11.esc(r.niveau || '') + '"></td>' +
        '<td class="cdc-retour" aria-live="polite"></td>' +
      '</tr>';
    });
    document.getElementById('cdc-lignes').innerHTML = h;

    Array.prototype.forEach.call(document.querySelectorAll('#cdc-lignes tr'), function(tr){
      var id = tr.getAttribute('data-id');
      function ranger(){
        P11.state.cdc.reponses[id] = {
          rep: tr.querySelector('.cdc-rep').value,
          niveau: tr.querySelector('.cdc-niv').value
        };
        P11.sauver();
      }
      tr.querySelector('.cdc-rep').addEventListener('change', ranger);
      tr.querySelector('.cdc-niv').addEventListener('input', ranger);
    });
    majBouton();
  }

  function majBouton(){
    var st = P11.state.cdc, b = document.getElementById('cdc-verif');
    if (!b) return;
    b.textContent = st.essais === 0 ? 'Vérifier le cahier des charges'
                  : st.essais === 1 ? 'Vérifier le cahier des charges (2ᵉ essai, note fixée)'
                  : 'Vérifier à nouveau (entraînement)';
  }

  /* ============================= Vérification ============================= */

  function verifier(){
    var st = P11.state.cdc, C = P11DATA.CDC_ROBINET, B = P11DATA.BAREME.cdc;
    var sortie = document.getElementById('cdc-sortie');

    // Un essai ne se perd pas sur un oubli : tout doit être rempli.
    var vides = C.lignes.filter(function(l){
      var r = st.reponses[l.id] || {};
      return !String(r.niveau || '').trim() || !r.rep;
    });
    if (vides.length){
      sortie.innerHTML = '<div class="fb partial"><b class="t">≈ Tableau incomplet</b>' +
        'Choisis un repère et écris un niveau sur chaque ligne avant de vérifier : ' +
        'cet essai n\'a pas été compté.</div>';
      return;
    }

    st.essais++;
    var montrer = st.essais >= 2;
    var detail = {}, total = 0, items = '';

    C.lignes.forEach(function(l){
      var r = st.reponses[l.id] || {};
      var ev = evaluerNiveau(l.id, r.niveau), rp = evaluerRepere(l, r.rep);
      detail[l.id] = ev.pts; total += ev.pts;

      var tr = document.querySelector('#cdc-lignes tr[data-id="' + l.id + '"] .cdc-retour');
      if (tr) tr.innerHTML = ev.pts === 2 ? '<span class="pill ok">✔</span>'
                                          : '<span class="pill ' + (ev.pts ? 'partial' : 'ko') + '">' + ev.pts + '/2</span>';

      var li = '<li>' + (ev.pts === 2 ? '✔ ' : '→ ') + '<b>' + P11.esc(l.fonction) + '</b> — niveau ' + ev.pts + '/2';
      if (ev.motif) li += '<br><span class="why">' + P11.esc(ev.motif) + '</span>';
      if (ev.pts < 2) li += '<br><span class="why">' + P11.esc(montrer ? 'Corrigé : ' + l.corrige + '.' : 'Aide : ' + l.aide) + '</span>';
      li += '<br><span class="why">Repère ' + P11.esc(r.rep) + (rp.ok ? ' : cohérent avec ta pieuvre.' : ' : ' + rp.motif) +
            (!rp.ok && montrer ? ' ' + corrigeRepere(l) : '') + '</span>';
      items += li + '</li>';
    });

    var entrainement = st.essais > 2 && st.score !== null && st.score !== undefined;
    if (!entrainement){ st.score = total; st.detail = detail; }

    var html = '<div class="fb ' + (total === B.total ? 'ok' : (total >= 4 ? 'partial' : 'ko')) + '">' +
               '<b class="t">Les niveaux — ' + total + ' / ' + B.total + ' points</b><ul>' + items + '</ul></div>';
    html += entrainement
      ? '<div class="score">Cahier des charges du robinet — note fixée au 2ᵉ essai : ' + P11.fmt(st.score) + ' / ' + B.total +
        ' points. Cette vérification t\'entraîne mais ne change plus ta note (tu obtiendrais ' + total + ' / ' + B.total + ' maintenant).</div>'
      : '<div class="score">Cahier des charges du robinet — ' + total + ' / ' + B.total + ' points' + (montrer ? ' · note fixée' : '') + '</div>';
    html += montrer
      ? '<div class="fb info"><b class="t">ℹ Recopie sur ta fiche</b>Reporte maintenant ton tableau corrigé dans la ' +
        '<b>partie 2 de ta fiche papier</b> : repère et niveau, avec son unité.</div>'
      : '<div class="again">Corrige tes niveaux à l\'aide des remarques, puis vérifie une seconde fois : ' +
        'le corrigé s\'affichera et ta note sera fixée.</div>';

    sortie.innerHTML = html;
    sortie.scrollIntoView({ behavior:'smooth', block:'start' });
    majBouton();
    majRappels();
    P11.sauver(true);
    CLOUD.envoyer('cdc');
    P11.majEnTete();
  }

  function corrigeRepere(l){
    if (!l.via) return "Elle prend le numéro FC suivant ceux de ta pieuvre.";
    var att = repereAttendu(l.via);
    return att ? 'Sur ta pieuvre, c\'est ' + att + '.' : '';
  }

  /* ===================== Rappel aux équipes déjà parties ==================
     Les élèves avaient commencé la séance avant l'ajout de cette partie. Une
     équipe qui a vérifié la mission 1 sans faire celle-ci voit un bandeau en
     tête des missions 2 et 3 : sinon, elle ne reviendrait jamais en arrière.
     ====================================================================== */
  function majRappels(){
    var s = P11.state;
    var montrer = !!s.badge.code && s.m1.score !== null && s.m1.score !== undefined &&
                  (s.cdc.score === null || s.cdc.score === undefined);
    Array.prototype.forEach.call(document.querySelectorAll('.cdc-rappel'), function(el){
      el.style.display = montrer ? '' : 'none';
    });
  }

  function aller(){
    P11.aller('m1');
    setTimeout(function(){
      var c = document.getElementById('cdc-carte');
      if (c) c.scrollIntoView({ behavior:'smooth', block:'start' });
    }, 80);
  }

  /* ============================ Mise en place ============================= */

  function init(){
    document.getElementById('cdc-verif').addEventListener('click', verifier);
    Array.prototype.forEach.call(document.querySelectorAll('.cdc-aller'), function(b){
      b.addEventListener('click', aller);
    });
    construire();
    majRappels();
  }

  /** Réaffiche un état rechargé, et les repères quand la pieuvre change. */
  function refletEtat(){
    construire();
    document.getElementById('cdc-sortie').innerHTML = '';
    majRappels();
  }

  return { init:init, refletEtat:refletEtat, majReperes:construire, majRappels:majRappels,
           evaluerNiveau:evaluerNiveau };
})();
