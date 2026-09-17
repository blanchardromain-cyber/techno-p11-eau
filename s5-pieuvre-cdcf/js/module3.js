/* ============================================================================
   P11 · Séance 5 — Mission 3 : le défi créatif
   ----------------------------------------------------------------------------
   L'équipe invente une solution pour économiser l'eau au collège, en rédige le
   cahier des charges, et en construit une maquette 3D à partir d'un kit de
   pièces.

   Ce qui est noté automatiquement ici, ce n'est PAS l'idée — une machine ne
   juge pas l'originalité. Ce sont les douze points de FORME, ceux que le cours
   permet de contrôler : fonctions formulées à l'infinitif, au moins une FP,
   critères mesurables, niveaux chiffrés avec unité. Les huit points restants
   sont réservés au professeur, qui seul peut apprécier la pertinence du besoin
   et la faisabilité de la solution.

   Ce partage est annoncé à l'élève : il sait d'avance ce que la machine peut
   corriger et ce qu'elle ne peut pas.
   ========================================================================== */

var M3 = (function(){
  'use strict';

  var atelier = null, holder3d;

  var AUTO = {          // répartition des 12 points automatiques
    dossier:3,          // nom, problème, principe renseignés
    structure:2,        // au moins 1 FP et 3 FC
    formulation:3,      // verbe à l'infinitif
    exigences:3,        // critère + niveau chiffré avec unité
    maquette:1          // maquette montée ou principe décrit en détail
  };

  /* ====================== Fiche d'identité de la solution ================= */

  function initFiche(){
    [['m3-nom','nom'], ['m3-probleme','probleme'], ['m3-principe','principe']].forEach(function(p){
      var el = document.getElementById(p[0]);
      el.addEventListener('input', function(){
        P11.state.m3[p[1]] = el.value;
        P11.sauver();
        P11.majEnTete();
      });
    });

    // Pistes de réflexion : elles posent un problème, jamais une solution.
    var box = document.getElementById('m3-pistes');
    box.innerHTML = '';
    P11DATA.PISTES.forEach(function(p){
      var b = document.createElement('button');
      b.className = 'btn ghost small';
      b.type = 'button';
      b.textContent = p.t;
      b.title = p.d;
      b.addEventListener('click', function(){
        var champ = document.getElementById('m3-probleme');
        champ.value = p.d;
        P11.state.m3.probleme = p.d;
        P11.sauver();
        champ.focus();
        P11.signaler('Piste reprise — à toi de trouver la solution.');
      });
      box.appendChild(b);
    });
  }

  /* ==================== Éditeur de fonctions (pieuvre libre) ============== */

  function ajouterLigne(f){
    var st = P11.state.m3;
    st.fonctions.push(f || { type:'FC', texte:'', eme:'', critere:'', valeur:'', unite:'' });
    dessinerFonctions();
    P11.sauver();
    P11.majEnTete();
  }

  function dessinerFonctions(){
    var box = document.getElementById('m3-fonctions');
    var st = P11.state.m3;
    box.innerHTML = '';

    if (!st.fonctions.length){
      box.innerHTML = '<p class="hint" style="margin:0 0 10px">Aucune fonction pour l\'instant. ' +
        'Commence par la fonction principale : quels DEUX éléments du milieu extérieur ta solution met-elle en relation ?</p>';
    }

    st.fonctions.forEach(function(f, i){
      var row = document.createElement('div');
      row.className = 'func-row';
      row.innerHTML =
        '<select class="f-type" aria-label="Type de fonction">' +
          '<option value="FP"' + (f.type==='FP'?' selected':'') + '>FP</option>' +
          '<option value="FC"' + (f.type==='FC'?' selected':'') + '>FC</option>' +
        '</select>' +
        '<input class="f-texte" type="text" placeholder="Verbe à l\'infinitif + compléments" ' +
               'value="' + P11.esc(f.texte) + '" aria-label="Énoncé de la fonction">' +
        '<input class="f-crit" type="text" placeholder="Critère mesuré" ' +
               'value="' + P11.esc(f.critere) + '" aria-label="Critère">' +
        '<div class="niv" style="display:flex;gap:6px">' +
          '<input class="f-val" type="text" placeholder="Niveau" style="flex:1;min-width:60px" ' +
                 'value="' + P11.esc(f.valeur) + '" aria-label="Valeur du niveau">' +
          '<input class="f-unit" type="text" placeholder="unité" style="width:74px" ' +
                 'value="' + P11.esc(f.unite) + '" aria-label="Unité">' +
        '</div>' +
        '<button class="rm" type="button" title="Supprimer cette fonction" ' +
                'aria-label="Supprimer la fonction ' + (i+1) + '">✕</button>';

      function lier(sel, cle){
        var el = row.querySelector(sel);
        el.addEventListener('input', function(){ f[cle] = el.value; P11.sauver(); P11.majEnTete(); });
        el.addEventListener('change', function(){ f[cle] = el.value; P11.sauver(); P11.majEnTete(); });
      }
      lier('.f-type','type'); lier('.f-texte','texte'); lier('.f-crit','critere');
      lier('.f-val','valeur'); lier('.f-unit','unite');

      row.querySelector('.rm').addEventListener('click', function(){
        st.fonctions.splice(i,1);
        dessinerFonctions();
        P11.sauver();
        P11.majEnTete();
      });

      box.appendChild(row);
    });

    var nbFP = st.fonctions.filter(function(f){ return f.type==='FP'; }).length;
    var nbFC = st.fonctions.length - nbFP;
    document.getElementById('m3-f-compte').innerHTML =
      '<b>' + nbFP + '</b> FP · <b>' + nbFC + '</b> FC' +
      (nbFP === 0 ? ' — il manque la fonction principale.' :
       nbFP > 1   ? ' — un objet technique n\'a en général qu\'une seule fonction principale.' :
       nbFC < 3   ? ' — ajoute au moins trois contraintes.' : ' — structure correcte.');
  }

  /* =========================== L'atelier 3D =============================== */

  function initAtelier(){
    holder3d = document.getElementById('m3-scene');
    if (!holder3d || atelier) return;

    atelier = SCENE3D.atelier(holder3d, function(id){
      var lignes = document.querySelectorAll('.part-row');
      for (var i=0;i<lignes.length;i++){
        lignes[i].setAttribute('aria-current', lignes[i].dataset.p === id ? 'true' : 'false');
      }
    });

    // Kit de pièces
    var kit = document.getElementById('m3-kit');
    kit.innerHTML = '';
    P11DATA.KIT3D.forEach(function(k){
      var b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = '<span class="ico" aria-hidden="true">' + k.ico + '</span>' + P11.esc(k.nom);
      b.addEventListener('click', function(){
        if (!atelier.actif){ P11.signaler("L'atelier 3D n'est pas disponible sur ce poste."); return; }
        // Les pièces se posent en spirale pour ne pas s'empiler au centre.
        var n = P11.state.m3.pieces.length;
        var a = n * 1.1, rayon = 0.55 + n * 0.16;
        atelier.ajouter(k, Math.cos(a)*rayon, Math.sin(a)*rayon, 0);
        syncPieces();
        P11.signaler(k.nom + ' ajouté — fais-le glisser pour le placer.');
      });
      kit.appendChild(b);
    });

    document.getElementById('m3-pivoter').addEventListener('click', function(){
      if (!atelier.pivoter()) P11.signaler("Sélectionne d'abord une pièce dans la maquette.");
      else syncPieces();
    });
    document.getElementById('m3-recadrer3').addEventListener('click', function(){ atelier.recadrer(); });
    document.getElementById('m3-vider').addEventListener('click', function(){
      if (!P11.state.m3.pieces.length) return;
      if (!window.confirm('Vider entièrement la maquette ?')) return;
      atelier.viderTout();
      syncPieces();
    });
  }

  /** Recopie l'état de la scène dans l'état de l'équipe, et rafraîchit la liste. */
  function syncPieces(){
    if (!atelier || !atelier.actif) return;
    P11.state.m3.pieces = atelier.lister();
    dessinerListePieces();
    P11.sauver();
    P11.majEnTete();
  }

  function dessinerListePieces(){
    var box = document.getElementById('m3-pieces');
    var pieces = P11.state.m3.pieces;
    if (!pieces.length){
      box.innerHTML = '<p class="hint" style="margin:0">Aucune pièce. Clique dans le kit pour en ajouter, ' +
                      'puis fais-les glisser sur l\'établi.</p>';
      return;
    }
    box.innerHTML = pieces.map(function(p){
      var k = kitParId(p.kit) || { nom:p.kit, couleur:0x999999, ico:'▫' };
      return '<div class="part-row" data-p="' + P11.esc(p.id) + '" aria-current="false">' +
             '<span class="sw" style="background:#' + k.couleur.toString(16).padStart(6,'0') + '"></span>' +
             '<span class="nm">' + k.ico + ' ' + P11.esc(k.nom) + '</span>' +
             '<button class="del" type="button" title="Supprimer" aria-label="Supprimer ' + P11.esc(k.nom) + '">✕</button>' +
             '</div>';
    }).join('');

    box.querySelectorAll('.part-row').forEach(function(row){
      row.addEventListener('click', function(e){
        if (e.target.classList.contains('del')){
          atelier.retirer(row.dataset.p);
          syncPieces();
          return;
        }
        atelier.selectionner(row.dataset.p);
        box.querySelectorAll('.part-row').forEach(function(r){
          r.setAttribute('aria-current', r === row ? 'true' : 'false');
        });
      });
    });
  }

  function kitParId(id){
    for (var i=0;i<P11DATA.KIT3D.length;i++){ if (P11DATA.KIT3D[i].id === id) return P11DATA.KIT3D[i]; }
    return null;
  }

  /* ========================== Vérification ================================ */

  function verifier(){
    var st = P11.state.m3;
    st.essais++;
    var pts = 0, blocs = [];

    /* --- 1. La fiche d'identité ------------------------------------------ */
    var nom = String(st.nom||'').trim();
    var pb  = String(st.probleme||'').trim();
    var pr  = String(st.principe||'').trim();
    var pDossier = 0, dMsg = [];
    if (nom.length >= 3){ pDossier++; dMsg.push("✔ La solution porte un nom."); }
    else dMsg.push("→ Donne un nom à ta solution : un dossier anonyme n'est pas recevable.");
    if (pb.length >= 40){ pDossier++; dMsg.push("✔ Le problème posé est décrit."); }
    else dMsg.push("→ Décris le problème en une ou deux phrases : à quoi sert ta solution, et pour qui ?");
    if (pr.length >= 60){ pDossier++; dMsg.push("✔ Le principe de fonctionnement est expliqué."); }
    else dMsg.push("→ Explique comment ta solution fonctionne : ce qui entre, ce qui sort, ce qui la déclenche.");
    pts += pDossier;
    blocs.push(bloc(niveau(pDossier, AUTO.dossier),
      "Fiche d'identité — " + pDossier + ' / ' + AUTO.dossier,
      '<ul>' + dMsg.map(function(m){ return '<li>' + P11.esc(m) + '</li>'; }).join('') + '</ul>'));

    /* --- 2. La structure de la pieuvre ----------------------------------- */
    var fps = st.fonctions.filter(function(f){ return f.type==='FP'; });
    var fcs = st.fonctions.filter(function(f){ return f.type==='FC'; });
    var pStruct = 0, sMsg = [];
    if (fps.length === 1){ pStruct++; sMsg.push("✔ Une fonction principale, et une seule : c'est la règle."); }
    else if (fps.length === 0) sMsg.push("→ Il manque la fonction principale. C'est elle qui donne sa raison d'être à l'objet.");
    else sMsg.push("→ Tu as déclaré " + fps.length + " fonctions principales. Un objet technique n'en a normalement qu'une : les autres sont des contraintes.");
    if (fcs.length >= 3){ pStruct++; sMsg.push("✔ Au moins trois fonctions contraintes : ton objet est situé dans son milieu."); }
    else sMsg.push("→ Ajoute des contraintes : énergie, support, résistance au milieu, budget, sécurité… (" + fcs.length + " sur 3).");
    pts += pStruct;
    blocs.push(bloc(niveau(pStruct, AUTO.structure),
      'Structure de la pieuvre — ' + pStruct + ' / ' + AUTO.structure,
      '<ul>' + sMsg.map(function(m){ return '<li>' + P11.esc(m) + '</li>'; }).join('') + '</ul>'));

    /* --- 3. La formulation des fonctions --------------------------------- */
    var mal = [], vides = 0;
    st.fonctions.forEach(function(f){
      var t = String(f.texte||'').trim();
      if (!t){ vides++; return; }
      if (!P11.verbeInfinitif(t).ok) mal.push(t);
    });
    var pForm = 0, fMsg = [];
    if (!st.fonctions.length){
      fMsg.push("→ Aucune fonction n'est écrite.");
    } else if (vides){
      fMsg.push("→ " + vides + " fonction" + (vides>1?'s sont vides':' est vide') + ".");
    }
    if (st.fonctions.length && !vides && !mal.length){
      pForm = AUTO.formulation;
      fMsg.push("✔ Toutes les fonctions commencent par un verbe à l'infinitif. C'est la formulation attendue.");
    } else if (st.fonctions.length && mal.length < st.fonctions.length){
      pForm = 1;
      fMsg.push("→ " + mal.length + " fonction" + (mal.length>1?'s ne commencent':' ne commence') +
                " pas par un verbe à l'infinitif : « " + mal.slice(0,2).map(P11.esc).join(' », « ') + " ».");
      fMsg.push("Écris « Détecter la présence des mains », pas « Le capteur détecte les mains » : " +
                "une fonction décrit un service rendu, pas une pièce en train d'agir.");
    } else if (st.fonctions.length){
      fMsg.push("Écris « Détecter la présence des mains », pas « Le capteur détecte les mains ».");
    }
    pts += pForm;
    blocs.push(bloc(niveau(pForm, AUTO.formulation),
      'Formulation des fonctions — ' + pForm + ' / ' + AUTO.formulation,
      '<ul>' + fMsg.map(function(m){ return '<li>' + m + '</li>'; }).join('') + '</ul>'));

    /* --- 4. Les exigences chiffrées -------------------------------------- */
    var completes = 0, sansUnite = 0, sansNombre = 0;
    st.fonctions.forEach(function(f){
      var aCrit  = String(f.critere||'').trim().length >= 3;
      var n      = P11.nombre(f.valeur);
      var aUnite = String(f.unite||'').trim().length >= 1;
      if (aCrit && n !== null && aUnite) completes++;
      else { if (n === null) sansNombre++; else if (!aUnite) sansUnite++; }
    });
    var pExig = 0, eMsg = [];
    var cible = Math.max(1, st.fonctions.length);
    if (st.fonctions.length && completes === st.fonctions.length){
      pExig = AUTO.exigences;
      eMsg.push("✔ Chaque fonction a son critère et son niveau chiffré : ton cahier des charges est vérifiable.");
    } else {
      pExig = st.fonctions.length ? Math.min(AUTO.exigences - 1, Math.floor(completes / cible * AUTO.exigences)) : 0;
      eMsg.push("→ " + completes + " fonction" + (completes>1?'s ont':' a') + " un critère ET un niveau complet, sur " + st.fonctions.length + ".");
      if (sansNombre) eMsg.push("→ " + sansNombre + " niveau" + (sansNombre>1?'x ne contiennent':' ne contient') +
                                " aucun nombre. « Solide », « rapide », « pas cher » ne se mesurent pas.");
      if (sansUnite)  eMsg.push("→ " + sansUnite + " niveau" + (sansUnite>1?'x sont chiffrés':' est chiffré') +
                                " sans unité. 10, c'est 10 quoi : centimètres, litres, euros ?");
    }
    pts += pExig;
    blocs.push(bloc(niveau(pExig, AUTO.exigences),
      'Critères et niveaux — ' + pExig + ' / ' + AUTO.exigences,
      '<ul>' + eMsg.map(function(m){ return '<li>' + P11.esc(m) + '</li>'; }).join('') + '</ul>'));

    /* --- 5. La maquette --------------------------------------------------
       Si l'atelier 3D n'a pas pu démarrer (réseau, poste ancien), le point se
       gagne par une description écrite détaillée : personne n'est pénalisé
       pour une bibliothèque bloquée par le filtre du collège.                */
    var nbP = st.pieces.length;
    var maquetteOK = nbP >= 3 || (!SCENE3D.dispo() && pr.length >= 200);
    var pMaq = maquetteOK ? AUTO.maquette : 0;
    pts += pMaq;
    blocs.push(bloc(niveau(pMaq, AUTO.maquette), 'Maquette — ' + pMaq + ' / ' + AUTO.maquette,
      maquetteOK
        ? (nbP >= 3 ? "✔ La maquette compte " + nbP + " pièces : la solution est représentée."
                    : "✔ L'atelier 3D n'est pas disponible ici, mais ton principe de fonctionnement est décrit avec assez de précision.")
        : (SCENE3D.dispo()
            ? "→ Monte une maquette d'au moins trois pièces dans l'atelier pour montrer ton principe."
            : "→ L'atelier 3D n'est pas disponible sur ce poste : décris ton principe de fonctionnement en détail (au moins quelques lignes) pour obtenir ce point.")));

    /* --- Bilan ------------------------------------------------------------ */
    st.score = pts;
    st.detail = { dossier:pDossier, structure:pStruct, formulation:pForm, exigences:pExig, maquette:pMaq };
    if (atelier && atelier.actif && nbP) st.snapshot = atelier.snapshot();

    var html = blocs.join('');
    html += '<div class="score">Mission 3 — partie automatique : ' + pts + ' / ' + P11DATA.BAREME.m3.auto +
            ' points.<br><span style="font-weight:600;font-size:13.5px">' +
            'Les ' + P11DATA.BAREME.m3.prof + ' points restants portent sur la pertinence du besoin, ' +
            "l'originalité et la faisabilité : ils sont attribués par le professeur.</span></div>";

    html += bloc('info', 'Ce que le professeur regardera',
      '<ul>' +
      '<li>Le problème traité concerne-t-il vraiment une économie d\'eau ?</li>' +
      '<li>La solution est-elle réalisable au collège, avec ses contraintes réelles ?</li>' +
      '<li>Les niveaux choisis sont-ils justifiés, et non pris au hasard ?</li>' +
      '<li>La maquette rend-elle le principe compréhensible sans explication ?</li>' +
      '</ul>');

    document.getElementById('m3-sortie').innerHTML = html;
    document.getElementById('m3-sortie').scrollIntoView({ behavior:'smooth', block:'start' });
    P11.sauver(true);
    P11.majEnTete();
  }

  function niveau(p, max){ return p === max ? 'ok' : (p > 0 ? 'partial' : 'ko'); }

  function bloc(cls, titre, corps){
    var ico = cls==='ok' ? '✔' : (cls==='partial' ? '≈' : (cls==='ko' ? '✘' : 'ℹ'));
    return '<div class="fb ' + cls + '"><b class="t">' + ico + ' ' + titre + '</b>' + corps + '</div>';
  }

  /* ============================ Mise en place ============================= */

  function init(){
    initFiche();
    document.getElementById('m3-ajouter').addEventListener('click', function(){ ajouterLigne(); });
    document.getElementById('m3-ajouter-fp').addEventListener('click', function(){
      ajouterLigne({ type:'FP', texte:'', eme:'', critere:'', valeur:'', unite:'' });
    });
    document.getElementById('m3-verif').addEventListener('click', verifier);
    document.getElementById('m3-photo').addEventListener('click', function(){
      if (!atelier || !atelier.actif){ P11.signaler("L'atelier 3D n'est pas disponible sur ce poste."); return; }
      P11.state.m3.snapshot = atelier.snapshot();
      P11.sauver(true);
      P11.signaler('Photo de la maquette enregistrée dans le dossier.');
    });
    dessinerFonctions();
    dessinerListePieces();
  }

  function auReveil(){
    initAtelier();
    if (atelier){
      atelier.redimensionner();
      // Les pièces sauvegardées sont remontées une seule fois, au premier
      // réveil : la scène est alors vide alors que l'état ne l'est pas.
      if (atelier.actif && atelier.lister().length === 0 && P11.state.m3.pieces.length){
        P11.state.m3.pieces.forEach(function(p){
          var k = kitParId(p.kit);
          if (k) atelier.ajouter(k, p.x, p.z, p.rot);
        });
        syncPieces();
      }
    }
  }

  function refletEtat(){
    var st = P11.state.m3;
    document.getElementById('m3-nom').value = st.nom || '';
    document.getElementById('m3-probleme').value = st.probleme || '';
    document.getElementById('m3-principe').value = st.principe || '';
    dessinerFonctions();
    dessinerListePieces();
  }

  return { init:init, auReveil:auReveil, refletEtat:refletEtat, verifier:verifier };
})();
