/* ============================================================================
   P11 · Séance 5 — Mission 2 : le cahier des charges fonctionnel
   ----------------------------------------------------------------------------
   L'équipe choisit un objet technique lié à l'eau, puis complète, pour chaque
   fonction, le CRITÈRE (la grandeur mesurée) et le NIVEAU (la valeur à
   atteindre, avec son unité).

   La validation est progressive : chaque ligne se vérifie séparément, avec une
   aide au premier essai et le corrigé au second. C'est ce découpage qui permet
   un retour utile — « ton critère est bon mais ton unité mesure autre chose »
   n'a de sens que ligne par ligne.

   Trois choses sont contrôlées, et notées séparément (5 points par ligne) :
     · le critère      (2 pts) — comparaison souple, fautes d'orthographe tolérées ;
     · la valeur       (2 pts) — plausible dans une plage, pas une valeur unique ;
     · l'unité         (1 pt)  — c'est elle qui trahit une confusion de grandeur.
   ========================================================================== */

var M2 = (function(){
  'use strict';

  var PTS = { critere:2, valeur:2, unite:1 };   // 5 points par ligne

  /* ========================= Choix de l'objet ============================= */

  function construirePicker(){
    var box = document.getElementById('m2-picker');
    box.innerHTML = '';
    P11DATA.OST.forEach(function(o){
      var b = document.createElement('button');
      b.className = 'ost-card';
      b.dataset.ost = o.id;
      b.setAttribute('aria-pressed','false');
      b.innerHTML = '<span class="emoji" aria-hidden="true">' + o.emoji + '</span>' +
                    '<span><h4>' + P11.esc(o.nom) + '</h4><p>' + P11.esc(o.resume) + '</p></span>';
      b.addEventListener('click', function(){ choisir(o.id); });
      box.appendChild(b);
    });
  }

  function choisir(id){
    var st = P11.state.m2;
    if (st.ost && st.ost !== id && Object.keys(st.reponses).length){
      if (!window.confirm("Changer d'objet technique effacera le cahier des charges déjà commencé. Continuer ?")) return;
      st.reponses = {}; st.essais = 0; st.score = null; st.detail = null;
    }
    st.ost = id;
    P11.sauver();
    refletEtat();
    P11.majEnTete();
    document.getElementById('m2-table-zone').scrollIntoView({ behavior:'smooth', block:'start' });
  }

  /* ================= La demande du client et son exemple =================
     Le texte du client contient TOUTES les valeurs attendues, mais dites comme
     un client les dit : « une dizaine de centimètres », « un demi-litre », « un
     quart d'heure ». Le travail de l'élève n'est donc pas de recopier une
     cellule, c'est de traduire une formulation en grandeur, nombre et unité —
     ce que demande exactement la compétence CT 2.1.
     ====================================================================== */

  function construireDemande(ost){
    var box = document.getElementById('m2-demande');
    if (!box) return;
    if (!ost.demande){ box.innerHTML = ''; return; }
    box.innerHTML =
      '<div class="demande-entete">' +
        '<span class="demande-de">' + P11.esc(ost.demande.de) + '</span>' +
        '<h3 class="demande-titre">' + P11.esc(ost.demande.titre) + '</h3>' +
      '</div>' +
      ost.demande.corps.map(function(p){ return '<p>' + P11.esc(p) + '</p>'; }).join('');
  }

  function construireModele(ost){
    var box = document.getElementById('m2-modele');
    if (!box) return;
    var m = ost.modele;
    if (!m){ box.innerHTML = ''; return; }
    box.innerHTML =
      '<figure class="modele">' +
        '<blockquote class="modele-phrase">« ' + P11.esc(m.phrase) + ' »</blockquote>' +
        '<div class="modele-fleche" aria-hidden="true">↓</div>' +
        '<div class="modele-ligne">' +
          '<div><span class="modele-cle">Fonction</span>' + P11.esc(m.fonction) + '</div>' +
          '<div><span class="modele-cle">Critère</span>' + P11.esc(m.critere) + '</div>' +
          '<div><span class="modele-cle">Niveau</span><b>' + P11.esc(m.niveau) + '</b></div>' +
          '<div><span class="modele-cle">Unité</span><b>' + P11.esc(m.unite) + '</b></div>' +
        '</div>' +
        '<figcaption class="modele-pourquoi">' + P11.esc(m.pourquoi) + '</figcaption>' +
      '</figure>';
  }

  /* ====================== Construction du tableau ========================= */

  function construireTable(){
    var ost = P11.ostParId(P11.state.m2.ost);
    var zone = document.getElementById('m2-table-zone');
    if (!ost){ zone.style.display = 'none'; return; }
    zone.style.display = '';

    document.getElementById('m2-contexte').innerHTML =
      '<b>' + P11.esc(ost.nom) + '</b> — ' + P11.esc(ost.contexte);

    construireDemande(ost);
    construireModele(ost);

    var html =
      '<div class="table-scroll"><table class="cdcf"><thead><tr>' +
      '<th>Rep.</th><th>Fonction</th><th>Critère</th><th>Niveau</th><th></th><th></th>' +
      '</tr></thead><tbody>';

    ost.lignes.forEach(function(l){
      var r = P11.state.m2.reponses[l.rep] || {};
      html +=
        '<tr data-rep="' + l.rep + '">' +
          '<td class="rep">' + l.rep + '</td>' +
          '<td class="fn">' + P11.esc(l.fonction) + '</td>' +
          '<td><input type="text" class="in-crit" placeholder="Que mesure-t-on ?" ' +
              'value="' + P11.esc(r.critere || '') + '" autocomplete="off"></td>' +
          '<td><div class="niv">' +
              '<input type="text" class="in-val" placeholder="Valeur" ' +
                     'value="' + P11.esc(r.valeur || '') + '" autocomplete="off" inputmode="decimal">' +
              '<select class="in-unit"><option value="">unité…</option>' +
                l.unites.map(function(u){
                  return '<option value="' + P11.esc(u) + '"' + (r.unite === u ? ' selected' : '') + '>' + P11.esc(u) + '</option>';
                }).join('') +
              '</select>' +
          '</div></td>' +
          '<td class="stat"><span class="pill todo">—</span></td>' +
          '<td><button class="btn sec small btn-ligne" type="button">Vérifier</button></td>' +
        '</tr>' +
        '<tr class="ligne-fb" data-fb="' + l.rep + '"><td colspan="6" style="padding:0 12px 10px"></td></tr>';
    });

    html += '</tbody></table></div>';
    document.getElementById('m2-table').innerHTML = html;

    // Câblage des champs : sauvegarde à la frappe, vérification à la demande.
    ost.lignes.forEach(function(l){
      var tr = document.querySelector('tr[data-rep="' + l.rep + '"]');
      var crit = tr.querySelector('.in-crit');
      var val  = tr.querySelector('.in-val');
      var uni  = tr.querySelector('.in-unit');

      function noter(){
        P11.state.m2.reponses[l.rep] = {
          critere: crit.value, valeur: val.value, unite: uni.value
        };
        P11.sauver();
        P11.majEnTete();
        majJauge();
      }
      crit.addEventListener('input', noter);
      val.addEventListener('input', noter);
      uni.addEventListener('change', noter);

      tr.querySelector('.btn-ligne').addEventListener('click', function(){
        verifierLigne(l, true);
      });
    });

    majJauge();
  }

  /* ==================== Correction d'une ligne ============================ */

  /**
   * Évalue une ligne du cahier des charges.
   * Renvoie { pts, max, critere:{n,msg}, valeur:{n,msg}, unite:{n,msg} }.
   * Aucun effet de bord : l'affichage est traité à part, ce qui permet de
   * réutiliser la même fonction pour la note finale et pour le dossier.
   */
  function evaluerLigne(l){
    var r = P11.state.m2.reponses[l.rep] || {};
    var res = { rep:l.rep, pts:0, max:PTS.critere+PTS.valeur+PTS.unite };

    /* --- Le critère ------------------------------------------------------ */
    var m = P11.match(r.critere, l.critere);
    if (m === 1){
      res.critere = { n:PTS.critere, msg:"Critère juste : c'est bien la grandeur que l'on mesure pour vérifier cette fonction." };
    } else if (m === 0.5){
      res.critere = { n:PTS.critere/2, msg:"Le bon mot y est, mais mal orthographié. L'idée est juste — relis l'écriture." };
    } else if (!String(r.critere||'').trim()){
      res.critere = { n:0, msg:"Le critère est vide. Un critère répond à : « qu'est-ce que je mesure pour savoir si la fonction est remplie ? »" };
    } else {
      res.critere = { n:0, msg:"Ce n'est pas la grandeur attendue. " + l.aide };
    }
    res.pts += res.critere.n;

    /* --- L'unité --------------------------------------------------------- */
    var u = String(r.unite || '');
    if (!u){
      res.unite = { n:0, msg:"Aucune unité choisie. Un niveau sans unité ne veut rien dire : 10, c'est 10 quoi ?" };
    } else if (l.uniteOk.indexOf(u) !== -1){
      res.unite = { n:PTS.unite, msg:"Unité cohérente avec le critère." };
    } else {
      res.unite = { n:0, msg:"L'unité « " + u + " » ne mesure pas cette grandeur : elle ne correspond pas au critère attendu." };
    }
    res.pts += res.unite.n;

    /* --- La valeur ------------------------------------------------------- */
    if (l.special === 'ip'){
      res.valeur = evaluerIP(r.valeur);
    } else {
      // Certaines fonctions admettent deux réponses correctes (un volume OU
      // une durée) : la plage dépend alors de l'unité choisie.
      var plage = l.plage;
      if (l.plageParUnite) plage = l.plageParUnite[u] || null;

      var n = P11.nombre(r.valeur);
      if (n === null){
        res.valeur = { n:0, msg:"Il manque un nombre. Un niveau est toujours chiffré : c'est ce qui rend l'exigence vérifiable." };
      } else if (!plage){
        res.valeur = { n:0, msg:"Impossible de juger cette valeur tant que l'unité choisie ne correspond pas au critère." };
      } else if (n >= plage[0] && n <= plage[1]){
        res.valeur = { n:PTS.valeur, msg:"Valeur plausible. " + l.commentaire };
      } else if (n >= plage[0]/3 && n <= plage[1]*3){
        res.valeur = { n:PTS.valeur/2, msg:"L'ordre de grandeur est proche mais la valeur reste discutable. " + l.commentaire };
      } else {
        res.valeur = { n:0, msg:"Cette valeur n'est pas réaliste pour cet objet. " + l.commentaire };
      }
    }
    res.pts += res.valeur.n;
    return res;
  }

  /** Contrôle d'un indice de protection : deux chiffres, le second ≥ 4. */
  function evaluerIP(v){
    var t = String(v||'').toUpperCase().replace(/\s/g,'');
    var m = t.match(/(?:IP)?(\d)(\d)/);
    if (!m) return { n:0, msg:"Un indice de protection s'écrit avec deux chiffres, par exemple IP65 : le premier pour les poussières, le second pour l'eau." };
    var poussiere = parseInt(m[1],10), eau = parseInt(m[2],10);
    if (eau >= 4 && poussiere >= 4)
      return { n:PTS.valeur, msg:"Indice correct : IP" + poussiere + eau + " protège à la fois des poussières et des projections d'eau." };
    if (eau >= 4)
      return { n:PTS.valeur/2, msg:"Le second chiffre (" + eau + ") convient pour l'eau, mais le premier (" + poussiere + ") protège mal des poussières du local technique." };
    return { n:0, msg:"Le second chiffre vaut " + eau + " : il ne protège pas des projections d'eau. Dans des sanitaires, il faut au moins 4." };
  }

  /** Affiche le retour d'une ligne et met à jour sa pastille de statut. */
  function verifierLigne(l, compterEssai){
    var st = P11.state.m2;
    if (compterEssai) st.essais++;
    var montrer = st.essais >= 2;

    var res = evaluerLigne(l);
    var cls = res.pts === res.max ? 'ok' : (res.pts > 0 ? 'partial' : 'ko');
    var tr = document.querySelector('tr[data-rep="' + l.rep + '"]');
    var fb = document.querySelector('tr[data-fb="' + l.rep + '"] td');

    tr.querySelector('.stat').innerHTML =
      '<span class="pill ' + cls + '">' + P11.fmt(res.pts) + '/' + res.max + '</span>';
    tr.querySelector('.in-crit').className = 'in-crit f-' + etatChamp(res.critere.n, PTS.critere);
    tr.querySelector('.in-val').className  = 'in-val f-'  + etatChamp(res.valeur.n,  PTS.valeur);
    tr.querySelector('.in-unit').className = 'in-unit f-' + etatChamp(res.unite.n,   PTS.unite);

    var html = '<div class="fb ' + cls + '" style="margin-top:0">' +
      '<b class="t">' + (cls==='ok'?'✔':(cls==='partial'?'≈':'✘')) + ' ' + l.rep + ' — ' + P11.esc(l.fonction) + '</b>' +
      '<ul>' +
        '<li><b>Critère</b> (' + P11.fmt(res.critere.n) + '/' + PTS.critere + ') — ' + P11.esc(res.critere.msg) + '</li>' +
        '<li><b>Valeur</b> (' + P11.fmt(res.valeur.n) + '/' + PTS.valeur + ') — ' + P11.esc(res.valeur.msg) + '</li>' +
        '<li><b>Unité</b> (' + P11.fmt(res.unite.n) + '/' + PTS.unite + ') — ' + P11.esc(res.unite.msg) + '</li>' +
      '</ul>';
    if (montrer && res.pts < res.max){
      html += '<div class="corr">Corrigé : critère <b>' + P11.esc(l.critereAttendu) + '</b> · niveau <b>' +
              P11.esc(l.niveauAttendu) + '</b></div>';
    } else if (!montrer && res.pts < res.max){
      html += '<div class="corr"><em>Reprends cette ligne, puis vérifie une seconde fois : le corrigé s\'affichera.</em></div>';
    }
    html += '</div>';
    fb.innerHTML = html;

    P11.sauver();
    return res;
  }

  function etatChamp(n, max){ return n === max ? 'ok' : (n > 0 ? 'partial' : 'ko'); }

  /* ==================== Vérification d'ensemble =========================== */

  function verifierTout(){
    var ost = P11.ostParId(P11.state.m2.ost);
    if (!ost){ P11.signaler("Choisis d'abord un objet technique."); return; }

    var st = P11.state.m2;
    st.essais++;
    var montrer = st.essais >= 2;

    var total = 0, max = 0, detail = [];
    ost.lignes.forEach(function(l){
      var res = verifierLigne(l, false);
      total += res.pts; max += res.max;
      detail.push({ rep:l.rep, pts:res.pts, max:res.max });
    });

    // Le barème de la mission vaut 20 points quel que soit le nombre de lignes
    // de l'objet choisi : les quatre objets sont donc équitables.
    var note = Math.round((total / max) * P11DATA.BAREME.m2.total * 10) / 10;
    st.score = note;
    st.detail = detail;

    var cls = note >= max*0.9 ? 'ok' : (note >= P11DATA.BAREME.m2.total/2 ? 'partial' : 'ko');
    var appreciation =
      note >= 18 ? "Cahier des charges recevable : chaque exigence est mesurable et chiffrée."
    : note >= 13 ? "Bon dossier. Quelques niveaux restent à préciser avant de pouvoir engager un fabricant."
    : note >= 8  ? "Les fonctions sont comprises, mais les critères et les niveaux manquent de précision."
    :              "Reprends ligne par ligne : un critère est une grandeur mesurable, un niveau est un nombre avec son unité.";

    var html = bloc(cls, 'Cahier des charges — ' + P11.fmt(note) + ' / ' + P11DATA.BAREME.m2.total + ' points',
      '<p style="margin:0 0 8px">Le détail de chaque ligne est affiché dans le tableau ci-dessus.</p>' +
      '<ul>' + detail.map(function(d){
        return '<li><b>' + d.rep + '</b> : ' + P11.fmt(d.pts) + ' / ' + d.max + '</li>';
      }).join('') + '</ul>');

    html += '<div class="score">Mission 2 — ' + P11.fmt(note) + ' / ' + P11DATA.BAREME.m2.total +
            ' points · ' + appreciation + '</div>';

    if (total === max){
      html += '<p style="margin-top:14px;text-align:center"><span class="seal">✓ Dossier validé par le bureau d\'études</span></p>';
    } else if (!montrer){
      html += '<div class="again">Corrige les lignes signalées, puis vérifie une seconde fois : ' +
              'le corrigé complet apparaîtra sous chaque ligne.</div>';
      document.getElementById('m2-verif').textContent = 'Vérifier le cahier des charges (2ᵉ essai)';
    } else {
      document.getElementById('m2-verif').textContent = 'Vérifier à nouveau';
    }

    document.getElementById('m2-sortie').innerHTML = html;
    document.getElementById('m2-sortie').scrollIntoView({ behavior:'smooth', block:'start' });
    P11.sauver(true);
    CLOUD.envoyer('m2');
    P11.majEnTete();
  }

  function bloc(cls, titre, corps){
    var ico = cls==='ok' ? '✔' : (cls==='partial' ? '≈' : (cls==='ko' ? '✘' : 'ℹ'));
    return '<div class="fb ' + cls + '"><b class="t">' + ico + ' ' + titre + '</b>' + corps + '</div>';
  }

  /** Jauge du bandeau « avancement du dossier ». */
  function majJauge(){
    var p = P11.avancement('m2');
    var bar = document.querySelector('#m2-jauge .bar > i');
    if (bar) bar.style.width = p + '%';
    var pct = document.querySelector('#m2-jauge .pct');
    if (pct) pct.textContent = p + ' %';
  }

  /* ============================ Mise en place ============================= */

  /* ========================= Coup de pouce ===============================
     Trois aides repliées, ouvertes une par une. L'élément <details> natif fait
     le travail : il fonctionne sans JavaScript, se déplie au clavier, et est
     annoncé correctement par un lecteur d'écran.
     ====================================================================== */
  function construirePouce(){
    var box = document.getElementById('m2-pouce-liste');
    box.innerHTML = P11DATA.COUPS_DE_POUCE.map(function(p){
      return '<details class="pouce-item" data-p="' + P11.esc(p.id) + '">' +
               '<summary>' + P11.esc(p.titre) + '</summary>' +
               '<div class="pouce-corps">' + p.html + (p.svg || '') + '</div>' +
             '</details>';
    }).join('');

    // Les aides consultées sont notées dans le dossier : si un élève rend un
    // travail juste sans jamais ouvrir d'aide, ce n'est pas la même chose que
    // s'il a eu besoin des trois. Le professeur le voit, l'élève n'est pas
    // pénalisé pour autant — aucune aide n'enlève de point.
    box.querySelectorAll('details').forEach(function(d){
      d.addEventListener('toggle', function(){
        if (!d.open) return;
        var id = d.dataset.p;
        var st = P11.state.m2;
        if (!st.aides) st.aides = [];
        if (st.aides.indexOf(id) === -1){ st.aides.push(id); P11.sauver(); }
      });
    });
  }

  function init(){
    construirePicker();
    construirePouce();
    document.getElementById('m2-verif').addEventListener('click', verifierTout);
    document.getElementById('m2-memo').addEventListener('click', function(){
      P11.modale('Mémo — critère et niveau',
        P11DATA.MEMO.slice(3).map(function(m){ return '<p><b>' + m.t + '</b><br>' + m.d + '</p>'; }).join('') +
        '<div class="corr">Exemple lu sur une fiche produit : <b>Débit : 5 L/min</b>. ' +
        '« Débit » est le critère, « 5 L/min » est le niveau.</div>');
    });
    document.getElementById('m2-changer').addEventListener('click', function(){
      document.getElementById('m2-picker').scrollIntoView({ behavior:'smooth', block:'center' });
    });
  }

  function auReveil(){ majJauge(); }

  /** Réaffiche l'objet choisi et les réponses déjà saisies. */
  function refletEtat(){
    var st = P11.state.m2;
    var cartes = document.querySelectorAll('.ost-card');
    for (var i=0;i<cartes.length;i++){
      cartes[i].setAttribute('aria-pressed', cartes[i].dataset.ost === st.ost ? 'true' : 'false');
    }
    construireTable();
  }

  return { init:init, auReveil:auReveil, refletEtat:refletEtat,
           evaluerLigne:evaluerLigne, verifierTout:verifierTout };
})();
