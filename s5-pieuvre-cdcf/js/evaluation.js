/* ============================================================================
   P11 · Séance 5 — Dossier final et évaluation
   ----------------------------------------------------------------------------
   Rassemble les trois missions en un document unique :

     · le récapitulatif de ce que l'équipe a produit (pieuvre, CDCF, solution) ;
     · la note sur 20, obtenue à partir des 60 points du barème ;
     · le positionnement sur les quatre niveaux de maîtrise du cycle 4 ;
     · la part réservée au professeur, qui complète les 8 points d'appréciation.

   Le dossier est conçu pour être imprimé ou exporté en PDF (impression vers
   PDF du navigateur) : c'est le support de la notation et de la présentation
   orale. Un export JSON permet de reprendre le travail sur un autre poste.
   ========================================================================== */

var EVAL = (function(){
  'use strict';

  /* ======================== Calcul de la note ============================= */

  /**
   * Additionne les trois missions. Une mission jamais vérifiée compte 0, mais
   * elle est signalée comme « non rendue » plutôt que comme « ratée » : la
   * différence compte pour l'élève comme pour le professeur.
   */
  function bilan(){
    var s = P11.state;
    var m1 = s.m1.score, m2 = s.m2.score, m3a = s.m3.score;
    var m3p = s.m3.prof.points;

    var obtenu = (m1 || 0) + (m2 || 0) + (m3a || 0) + (m3p || 0);
    // Le total de référence exclut la part professeur tant qu'elle n'est pas
    // saisie : sinon, un dossier parfait plafonnerait à 52/60 avant correction.
    var maxi = P11DATA.BAREME.m1.total + P11DATA.BAREME.m2.total + P11DATA.BAREME.m3.auto
             + (m3p === null || m3p === undefined ? 0 : P11DATA.BAREME.m3.prof);

    var pct = maxi ? (obtenu / maxi) * 100 : 0;
    var note = maxi ? Math.round((obtenu / maxi) * 20 * 2) / 2 : 0;   // au demi-point

    var niveau = P11DATA.NIVEAUX[0];
    P11DATA.NIVEAUX.forEach(function(n){ if (pct >= n.min) niveau = n; });

    return {
      m1:m1, m2:m2, m3a:m3a, m3p:m3p,
      obtenu:obtenu, maxi:maxi, pct:Math.round(pct), note:note, niveau:niveau,
      rendues: [m1,m2,m3a].filter(function(v){ return v !== null && v !== undefined; }).length
    };
  }

  /* ====================== Construction du dossier ========================= */

  function construireDossier(){
    var s = P11.state;
    var box = document.getElementById('dossier-corps');

    if (!s.badge.code){
      box.innerHTML = '<p class="lead">Crée d\'abord ton badge de bureau d\'études.</p>';
      return;
    }

    var b = bilan();
    var h = '';

    /* --- En-tête --------------------------------------------------------- */
    h += '<h1>Dossier de conception — Économiser l\'eau</h1>' +
         '<p class="meta">' + P11.esc(P11.nomEquipe()) +
         (s.badge.classe ? ' · classe ' + P11.esc(s.badge.classe) : '') +
         ' · équipe <b>' + P11.esc(s.badge.code) + '</b>' +
         ' · ' + (s.badge.mode === 'binome' ? 'travail en binôme' : 'travail individuel') +
         ' · ' + new Date().toLocaleDateString('fr-FR') + '</p>';

    /* --- Note globale ---------------------------------------------------- */
    h += '<div class="bigscore">' +
         '<div><div class="n">' + P11.fmt(b.note) + '<small> / 20</small></div>' +
         '<div style="font-size:12px;color:#6b7280;text-align:center;margin-top:4px">' +
         b.obtenu + ' points sur ' + b.maxi + '</div></div>' +
         '<div class="lv" style="border-color:' + b.niveau.couleur + ';color:' + b.niveau.couleur + '">' +
         P11.esc(b.niveau.nom) + '</div></div>';

    if (b.rendues < 3){
      h += '<div class="fb partial" style="margin-top:12px"><b class="t">≈ Dossier incomplet</b>' +
           (3 - b.rendues) + ' mission' + (3-b.rendues>1?'s n\'ont':' n\'a') +
           ' pas encore été vérifiée' + (3-b.rendues>1?'s':'') +
           '. La note ne tient compte que de ce qui a été rendu.</div>';
    }
    h += '<p class="hint">' + P11.esc(b.niveau.texte) + '</p>';

    // L'appréciation du professeur revient à l'élève : le travail ne circule
    // pas à sens unique. Elle apparaît dans le dossier et à l'impression.
    if (String(s.m3.prof.remarque || '').trim()){
      h += '<div class="fb info" style="margin-top:12px"><b class="t">Appréciation du professeur</b>' +
           P11.esc(s.m3.prof.remarque) + '</div>';
    }

    /* --- Détail par mission ---------------------------------------------- */
    h += '<section><h2>Détail des trois missions</h2>' +
         '<table class="grille"><thead><tr><th>Mission</th><th>Ce qui est évalué</th><th style="width:96px">Points</th></tr></thead><tbody>' +
         ligneMission('1 — Décryptage de la pieuvre',
            'Tracé des liens (FP / FC) et classement des six fonctions',
            b.m1, P11DATA.BAREME.m1.total) +
         ligneMission('2 — Cahier des charges',
            (P11.ostParId(s.m2.ost) ? P11.ostParId(s.m2.ost).nom + ' — critères, niveaux et unités' : 'Aucun objet technique choisi'),
            b.m2, P11DATA.BAREME.m2.total) +
         ligneMission('3 — Défi créatif (automatique)',
            'Structure de la pieuvre, formulation, exigences chiffrées, maquette',
            b.m3a, P11DATA.BAREME.m3.auto) +
         ligneMission('3 — Défi créatif (professeur)',
            'Pertinence du besoin, originalité, faisabilité',
            b.m3p, P11DATA.BAREME.m3.prof) +
         '</tbody></table></section>';

    /* --- Mission 1 : la pieuvre produite --------------------------------- */
    h += '<section><h2>Mission 1 — La pieuvre du robinet automatique</h2>';
    if (!s.m1.liens.length && !Object.keys(s.m1.typage).length){
      h += '<p class="hint">Rien n\'a été produit pour cette mission.</p>';
    } else {
      h += '<p style="margin:0 0 8px"><b>Liens tracés</b></p><ul style="margin-top:0">';
      s.m1.liens.forEach(function(l){
        h += '<li><span class="pill ' + l.type.toLowerCase() + '">' + l.type + '</span> ' +
             (l.type === 'FP'
               ? P11.esc(nomEME(l.de)) + ' ↔ ' + P11.esc(nomEME(l.a)) + ' <em>(à travers l\'objet)</em>'
               : 'objet ↔ ' + P11.esc(nomEME(l.de))) + '</li>';
      });
      h += '</ul><p style="margin:14px 0 8px"><b>Classement des fonctions</b></p>' +
           '<table class="grille"><thead><tr><th>Fonction</th><th style="width:90px">Réponse</th><th style="width:90px">Attendu</th></tr></thead><tbody>';
      P11DATA.FONCTIONS.forEach(function(f){
        var rep = s.m1.typage[f.id];
        var juste = rep === f.type;
        h += '<tr><td>' + P11.esc(f.texte) + '</td>' +
             '<td class="lv' + (juste ? ' on' : '') + '">' + (rep || '—') + '</td>' +
             '<td class="lv">' + f.type + '</td></tr>';
      });
      h += '</tbody></table>';
    }
    h += '</section>';

    /* --- Mission 2 : le cahier des charges ------------------------------- */
    var ost = P11.ostParId(s.m2.ost);
    h += '<section><h2>Mission 2 — Cahier des charges fonctionnel</h2>';
    if (!ost){
      h += '<p class="hint">Aucun objet technique n\'a été choisi.</p>';
    } else {
      h += '<p class="meta" style="margin:0 0 10px">' + ost.emoji + ' <b>' + P11.esc(ost.nom) + '</b></p>' +
           '<table class="grille"><thead><tr><th style="width:56px">Rep.</th><th>Fonction</th>' +
           '<th>Critère</th><th>Niveau</th></tr></thead><tbody>';
      ost.lignes.forEach(function(l){
        var r = s.m2.reponses[l.rep] || {};
        h += '<tr><td><b>' + l.rep + '</b></td><td>' + P11.esc(l.fonction) + '</td>' +
             '<td>' + (P11.esc(r.critere) || '<em style="color:#9aa7b4">non renseigné</em>') + '</td>' +
             '<td>' + (String(r.valeur||'').trim()
                        ? P11.esc(r.valeur) + ' ' + P11.esc(r.unite || '')
                        : '<em style="color:#9aa7b4">non renseigné</em>') + '</td></tr>';
      });
      h += '</tbody></table>';

      // Corrigé de référence : réservé au professeur, comme sur le site principal.
      h += '<div class="prof-only"><p style="margin:16px 0 6px"><span class="prof-badge">Professeur</span> ' +
           '<b>Corrigé de référence</b></p><table class="grille"><thead><tr>' +
           '<th style="width:56px">Rep.</th><th>Critère attendu</th><th>Niveau attendu</th></tr></thead><tbody>';
      ost.lignes.forEach(function(l){
        h += '<tr><td><b>' + l.rep + '</b></td><td>' + P11.esc(l.critereAttendu) + '</td>' +
             '<td>' + P11.esc(l.niveauAttendu) + '</td></tr>';
      });
      h += '</tbody></table></div>';
    }
    h += '</section>';

    /* --- Mission 3 : la solution proposée -------------------------------- */
    h += '<section><h2>Mission 3 — La solution proposée</h2>';
    if (!String(s.m3.nom||'').trim() && !s.m3.fonctions.length){
      h += '<p class="hint">Rien n\'a été produit pour cette mission.</p>';
    } else {
      h += '<p style="margin:0 0 4px"><b style="font-size:16px;color:#1F3864">' +
           (P11.esc(s.m3.nom) || 'Solution sans nom') + '</b></p>';
      if (String(s.m3.probleme||'').trim())
        h += '<p style="margin:0 0 8px"><b>Problème traité :</b> ' + P11.esc(s.m3.probleme) + '</p>';
      if (String(s.m3.principe||'').trim())
        h += '<p style="margin:0 0 12px"><b>Principe de fonctionnement :</b> ' + P11.esc(s.m3.principe) + '</p>';

      if (s.m3.fonctions.length){
        h += '<table class="grille"><thead><tr><th style="width:56px">Type</th><th>Fonction</th>' +
             '<th>Critère</th><th>Niveau</th></tr></thead><tbody>';
        s.m3.fonctions.forEach(function(f){
          h += '<tr><td><span class="pill ' + (f.type==='FP'?'fp':'fc') + '">' + f.type + '</span></td>' +
               '<td>' + (P11.esc(f.texte) || '<em style="color:#9aa7b4">—</em>') + '</td>' +
               '<td>' + (P11.esc(f.critere) || '<em style="color:#9aa7b4">—</em>') + '</td>' +
               '<td>' + (String(f.valeur||'').trim() ? P11.esc(f.valeur) + ' ' + P11.esc(f.unite||'')
                                                     : '<em style="color:#9aa7b4">—</em>') + '</td></tr>';
        });
        h += '</tbody></table>';
      }

      if (s.m3.snapshot){
        h += '<p style="margin:16px 0 6px"><b>Maquette 3D</b></p>' +
             '<img class="snap" src="' + s.m3.snapshot + '" alt="Maquette 3D de la solution proposée">';
      } else if (s.m3.pieces.length){
        h += '<p class="hint">Maquette montée (' + s.m3.pieces.length + ' pièces) — ' +
             'clique sur « Photographier la maquette » dans la mission 3 pour l\'ajouter au dossier.</p>';
      }
    }
    h += '</section>';

    /* --- Grille de compétence -------------------------------------------- */
    h += '<section><h2>Compétence CT 2.1 — S\'approprier un cahier des charges</h2>' +
         grilleHTML(b) + '</section>';

    box.innerHTML = h;

    // Champs de notation du professeur
    var champ = document.getElementById('prof-points');
    var rem = document.getElementById('prof-remarque');
    if (champ){
      champ.value = (s.m3.prof.points === null || s.m3.prof.points === undefined) ? '' : s.m3.prof.points;
      rem.value = s.m3.prof.remarque || '';
      document.getElementById('prof-max').textContent = P11DATA.BAREME.m3.prof;
    }

    // Case « à présenter » et état de la transmission au professeur.
    var caseP = document.getElementById('dossier-presentation');
    if (caseP) caseP.checked = !!s.m3.presentation;
    if (window.CLOUD) CLOUD.majTemoin();
  }

  function ligneMission(nom, quoi, pts, max){
    var rendu = (pts !== null && pts !== undefined);
    return '<tr><td><b>' + nom + '</b></td><td>' + quoi + '</td>' +
           '<td class="lv' + (rendu && pts >= max*0.8 ? ' on' : '') + '">' +
           (rendu ? P11.fmt(pts) + ' / ' + max : '<em style="color:#9aa7b4;font-weight:600">non rendu</em>') +
           '</td></tr>';
  }

  function nomEME(id){
    if (id === 'objet') return "l'objet";
    for (var i=0;i<P11DATA.EME.length;i++){ if (P11DATA.EME[i].id === id) return P11DATA.EME[i].nom; }
    return id;
  }

  function grilleHTML(b){
    var h = '<table class="grille"><thead><tr><th style="width:74px">Niveau</th><th>Ce que cela signifie</th>' +
            '<th style="width:74px">Atteint</th></tr></thead><tbody>';
    P11DATA.NIVEAUX.forEach(function(n){
      var atteint = (n.code === b.niveau.code);
      h += '<tr><td class="lv" style="color:' + n.couleur + '">' + n.code + '</td>' +
           '<td><b>' + P11.esc(n.nom) + '</b> — ' + P11.esc(n.texte) + '</td>' +
           '<td class="lv' + (atteint ? ' on' : '') + '">' + (atteint ? '●' : '') + '</td></tr>';
    });
    return h + '</tbody></table>' +
      '<p class="hint">Positionnement calculé à partir de ' + b.obtenu + ' points sur ' + b.maxi +
      ' (' + b.pct + ' %). MI : moins de 40 % · MF : 40 à 59 % · MS : 60 à 79 % · TBM : 80 % et plus.</p>';
  }

  /* ============================== Exports ================================= */

  function exporterJSON(){
    var s = P11.state;
    if (!s.badge.code){ P11.signaler("Crée d'abord ton badge."); return; }
    var nom = 'P11-S5-' + s.badge.code + '-' +
              (s.badge.eleve1||'equipe').replace(/[^A-Za-z0-9]/g,'') + '.json';
    telecharger(nom, 'application/json',
                JSON.stringify(s, null, 2));
    P11.signaler('Dossier exporté : ' + nom, 4000);
  }

  function exporterImage(){
    var s = P11.state;
    if (!s.m3.snapshot){ P11.signaler("Aucune photo de maquette. Utilise « Photographier la maquette »."); return; }
    var a = document.createElement('a');
    a.href = s.m3.snapshot;
    a.download = 'P11-S5-' + s.badge.code + '-maquette.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  function telecharger(nom, type, contenu){
    var blob = new Blob([contenu], { type:type + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nom;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    // Libération différée : Safari annule le téléchargement si l'URL est
    // révoquée immédiatement.
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
  }

  function imprimer(){
    construireDossier();       // le dossier doit être à jour avant l'impression
    setTimeout(function(){ window.print(); }, 120);
  }

  /* ============================ Mise en place ============================= */

  function init(){
    document.getElementById('dossier-imprimer').addEventListener('click', imprimer);
    document.getElementById('dossier-json').addEventListener('click', exporterJSON);
    document.getElementById('dossier-png').addEventListener('click', exporterImage);
    document.getElementById('dossier-maj').addEventListener('click', function(){
      construireDossier(); P11.signaler('Dossier mis à jour.');
    });

    var champ = document.getElementById('prof-points');
    if (champ){
      champ.addEventListener('input', function(){
        var v = champ.value.trim();
        P11.state.m3.prof.points = v === '' ? null : Math.max(0, Math.min(P11DATA.BAREME.m3.prof, P11.nombre(v) || 0));
        P11.sauver();
      });
      // L'appréciation part vers la feuille du professeur dès qu'il quitte le
      // champ : rien à cliquer, rien à recopier.
      champ.addEventListener('change', function(){
        construireDossier();
        CLOUD.envoyer('prof');
      });
      document.getElementById('prof-remarque').addEventListener('input', function(){
        P11.state.m3.prof.remarque = this.value;
        P11.sauver();
      });
      document.getElementById('prof-remarque').addEventListener('change', function(){
        CLOUD.envoyer('prof');
      });
    }
  }

  return { init:init, construireDossier:construireDossier, bilan:bilan,
           exporterJSON:exporterJSON, imprimer:imprimer };
})();
