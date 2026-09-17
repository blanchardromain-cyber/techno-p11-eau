/* ============================================================================
   P11 · Séance 5 — Mission 1 : Décryptage de la pieuvre
   ----------------------------------------------------------------------------
   Trois temps, du concret vers l'abstrait :

     A. Relever les EME sur la maquette 3D du robinet (ou son schéma de repli).
     B. Tracer la pieuvre : l'élève choisit d'abord le TYPE de fonction, puis
        désigne les éléments. C'est le choix du type qui fait apprendre — une
        FP relie deux EME à travers l'objet, une FC relie l'objet à un seul EME.
     C. Classer les six fonctions de la fiche papier en FP / FC.

   Le tracé est volontairement géométrique (SVG recalculé en pixels réels) :
   une pieuvre dessinée en pourcentages se déforme et les traits n'arrivent
   plus sur les nœuds.
   ========================================================================== */

var M1 = (function(){
  'use strict';

  var stage, svg, statut, scene3d = null, holder3d;
  var modeTrace = null;        // 'FP' | 'FC' | null
  var enAttente = [];          // EME déjà cliqués dans le tracé en cours
  var redessine = null;        // minuteur de recalcul après redimensionnement

  /* ======================= A. La maquette 3D ============================== */

  function initScene(){
    holder3d = document.getElementById('m1-scene');
    if (!holder3d || scene3d) return;
    scene3d = SCENE3D.robinet(holder3d);
    placerHotspots();

    // Sans 3D, ces commandes n'existent plus dans la page : on ne les câble
    // que si elles sont bien là, faute de quoi toute la mission s'arrêtait ici.
    var bRecadrer = document.getElementById('m1-recadrer');
    var bRotation = document.getElementById('m1-rotation');
    if (bRecadrer) bRecadrer.addEventListener('click', function(){
      scene3d.recadrer(); P11.signaler('Vue replacée.');
    });
    if (bRotation) bRotation.addEventListener('click', function(){
      rotationAuto = !rotationAuto;
      scene3d.setAuto(rotationAuto);
      this.textContent = rotationAuto ? '⏸' : '▶';
      this.setAttribute('aria-label', rotationAuto ? 'Arrêter la rotation' : 'Reprendre la rotation');
    });
  }
  var rotationAuto = true;

  /** Crée un repère cliquable par point chaud, puis les suit à chaque image. */
  function placerHotspots(){
    if (!scene3d.actif) {
      // Sans 3D, les points chauds deviennent une simple liste de boutons :
      // le contenu pédagogique reste accessible.
      var liste = document.getElementById('m1-hs-liste');
      liste.innerHTML = '';
      P11DATA.HOTSPOTS.forEach(function(h, i){
        var b = document.createElement('button');
        b.className = 'btn sec small';
        b.textContent = (i+1) + '. ' + h.titre;
        b.addEventListener('click', function(){ ouvrirHotspot(h); });
        liste.appendChild(b);
      });
      liste.style.display = 'flex';
      liste.style.flexWrap = 'wrap';
      liste.style.gap = '6px';
      liste.style.marginTop = '10px';
      return;
    }

    P11DATA.HOTSPOTS.forEach(function(h, i){
      var b = document.createElement('button');
      b.className = 'hotspot';
      b.textContent = String(i+1);
      b.title = h.titre;
      b.setAttribute('aria-label', 'Point ' + (i+1) + ' : ' + h.titre);
      b.dataset.hs = h.id;
      b.addEventListener('click', function(e){
        e.stopPropagation();
        ouvrirHotspot(h);
        scene3d.viser(h.pos);
        rotationAuto = false;
        var b = document.getElementById('m1-rotation');
        if (b) b.textContent = '▶';
      });
      holder3d.appendChild(b);
    });

    // Les repères HTML suivent la projection des points 3D, image par image.
    (function suivre(){
      requestAnimationFrame(suivre);
      if (!holder3d.clientWidth) return;
      var marques = holder3d.querySelectorAll('.hotspot');
      for (var i=0;i<marques.length && i<P11DATA.HOTSPOTS.length;i++){
        var p = scene3d.projeter(P11DATA.HOTSPOTS[i].pos);
        marques[i].style.left = p.x + 'px';
        marques[i].style.top  = p.y + 'px';
        marques[i].style.display = p.visible ? '' : 'none';
      }
    })();
  }

  function ouvrirHotspot(h){
    document.getElementById('m1-legende').innerHTML =
      '<b>' + P11.esc(h.titre) + '</b> — ' + P11.esc(h.texte);

    var st = P11.state.m1;
    if (st.hotspots.indexOf(h.id) === -1){
      st.hotspots.push(h.id);
      P11.sauver();
    }
    var marque = holder3d.querySelector('.hotspot[data-hs="' + h.id + '"]');
    if (marque) marque.classList.add('found');

    var reste = P11DATA.HOTSPOTS.length - st.hotspots.length;
    document.getElementById('m1-hs-compte').textContent =
      reste > 0
        ? 'Éléments repérés : ' + st.hotspots.length + ' / ' + P11DATA.HOTSPOTS.length
        : 'Les ' + P11DATA.HOTSPOTS.length + ' éléments du milieu extérieur sont repérés. Passe au tracé.';

    // Le nœud correspondant s'allume sur la pieuvre : le lien entre l'objet
    // réel et son schéma devient visible.
    var n = stage.querySelector('.eme[data-eme="' + h.id + '"]');
    if (n){
      n.style.transition = 'none';
      n.style.boxShadow = '0 0 0 6px rgba(14,165,233,.35)';
      setTimeout(function(){ n.style.transition = ''; n.style.boxShadow = ''; }, 900);
    }
  }

  /* ========================= B. Le tracé de la pieuvre ===================== */

  function construirePlateau(){
    stage = document.getElementById('m1-stage');
    stage.innerHTML =
      '<svg aria-hidden="true"><g id="m1-liens"></g></svg>' +
      '<div class="octo-core pulse" id="m1-core">Le robinet<br>automatique</div>';
    svg = stage.querySelector('svg');

    P11DATA.EME.forEach(function(e){
      var b = document.createElement('button');
      b.className = 'eme';
      b.dataset.eme = e.id;
      b.setAttribute('aria-pressed','false');
      b.title = e.desc;
      b.addEventListener('click', function(){ clicEME(e.id); });
      stage.appendChild(b);
    });
    placerEME();

    document.getElementById('m1-core').addEventListener('click', function(){
      if (modeTrace === 'FP'){
        dire("Une fonction principale ne s'arrête pas sur l'objet : elle relie DEUX éléments du milieu extérieur en le traversant. Clique sur un second élément.");
      } else if (modeTrace === 'FC' && enAttente.length === 0){
        dire("Commence par l'élément du milieu extérieur, puis le trait rejoindra l'objet tout seul.");
      }
    });

    // Un changement de largeur déplace les nœuds : on attend la stabilisation
    // avant de recalculer. Une mesure prise pendant le redimensionnement rend
    // l'ancienne largeur, et les traits arrivent alors à côté des pastilles.
    function replacer(){
      if (redessine) clearTimeout(redessine);
      redessine = setTimeout(redessinerPlateau, 140);
    }
    if (window.ResizeObserver) new ResizeObserver(replacer).observe(stage);
    else window.addEventListener('resize', replacer);
  }

  function dire(msg, etape){
    statut.innerHTML = (etape ? '<span class="step">' + etape + '</span>' : '') + '<span>' + msg + '</span>';
  }

  function clicEME(id){
    if (!modeTrace){
      dire("Choisis d'abord le type de fonction que tu veux tracer : principale ou contrainte.");
      return;
    }
    var st = P11.state.m1;

    if (modeTrace === 'FC'){
      if (dejaRelie(id, 'FC')){ dire("Cet élément est déjà relié par une fonction contrainte."); return; }
      st.liens.push({ de:id, a:'objet', type:'FC' });
      finTrace();
      dire("Fonction contrainte tracée : l'objet doit s'adapter à cet élément. Tu peux en tracer une autre.");
      return;
    }

    // Fonction principale : deux éléments, dans l'ordre de leur choix.
    if (enAttente.indexOf(id) !== -1){ enAttente = []; majSelection(); dire("Sélection annulée."); return; }
    enAttente.push(id);
    majSelection();

    if (enAttente.length === 1){
      dire("Premier élément retenu. Clique maintenant sur le SECOND élément du milieu extérieur que l'objet met en relation.", 2);
      return;
    }
    var a = enAttente[0], b = enAttente[1];
    if (dejaRelie(a,'FP') || dejaRelie(b,'FP')){
      dire("Une de ces deux extrémités est déjà utilisée par une fonction principale.");
      enAttente = []; majSelection(); return;
    }
    st.liens.push({ de:a, a:b, type:'FP' });
    finTrace();
    dire("Fonction principale tracée : le trait traverse l'objet et relie deux éléments du milieu extérieur.");
  }

  function dejaRelie(id, type){
    return P11.state.m1.liens.some(function(l){
      return l.type === type && (l.de === id || l.a === id);
    });
  }

  function finTrace(){
    enAttente = [];
    majSelection();
    dessinerLiens();
    majCompteurs();
    P11.sauver();
    P11.majEnTete();
  }

  function majSelection(){
    var n = stage.querySelectorAll('.eme');
    for (var i=0;i<n.length;i++){
      var id = n[i].dataset.eme;
      n[i].setAttribute('aria-pressed', enAttente.indexOf(id) !== -1 ? 'true' : 'false');
      n[i].classList.toggle('linked', P11.state.m1.liens.some(function(l){
        return l.de === id || l.a === id;
      }));
    }
  }

  // Positions calculées des nœuds, en pixels : renseignées par placerEME() et
  // relues par le tracé des liens, pour que les deux ne divergent jamais.
  var positions = {};

  /**
   * Place les pastilles sur un cercle, en pixels réels.
   *
   * Le rayon se déduit de trois contraintes mesurées sur la page, jamais
   * devinées : rester à l'intérieur du plateau (sinon `overflow:hidden` rogne
   * la pastille), dégager l'objet central (sinon les pastilles le recouvrent
   * sur téléphone), et garder un cercle lisible. Les libellés sont écrits
   * avant la mesure, puisque c'est leur longueur qui fixe la place nécessaire.
   */
  function placerEME(){
    if (!stage || !stage.clientWidth) return;
    var W = stage.clientWidth, H = stage.clientHeight;
    var court = W < 620;

    var noeuds = P11DATA.EME.map(function(e){
      var b = stage.querySelector('.eme[data-eme="' + e.id + '"]');
      if (b) b.innerHTML = '<span class="ico">' + e.ico + '</span>' +
                           P11.esc(court ? (e.court || e.nom) : e.nom);
      return { e:e, b:b };
    });

    var coreEl = document.getElementById('m1-core');
    var coreR = (coreEl ? coreEl.offsetWidth : 150) / 2;
    var marge = 6;

    // Le rayon est calculé pastille par pastille, d'après SA largeur : une
    // étiquette courte peut aller plus loin du centre qu'une longue. Utiliser
    // la largeur maximale pour tout le monde rapprochait les courtes de
    // l'objet central, qu'elles finissaient par mordre sur téléphone.
    positions = {};
    noeuds.forEach(function(n){
      var demiL = n.b ? n.b.offsetWidth  / 2 : 50;
      var demiH = n.b ? n.b.offsetHeight / 2 : 15;
      var Rx = Math.max(coreR + demiH + 6, Math.min(W/2 - demiL - marge, W * 0.45));
      var Ry = Math.max(coreR + demiH + 6, Math.min(H/2 - demiH - marge, H * 0.45));

      var a = n.e.angle * Math.PI / 180;
      var x = W/2 + Rx * Math.sin(a);
      var y = H/2 - Ry * Math.cos(a);
      positions[n.e.id] = { x:x, y:y };
      if (n.b){ n.b.style.left = x + 'px'; n.b.style.top = y + 'px'; }
    });
  }

  /** Position en pixels du centre d'un nœud EME (ou de l'objet). */
  function pointDe(id){
    var W = stage.clientWidth, H = stage.clientHeight;
    if (id === 'objet' || !positions[id]) return { x:W/2, y:H/2 };
    return positions[id];
  }

  function dessinerLiens(){
    if (!stage || !stage.clientWidth) return;
    var W = stage.clientWidth, H = stage.clientHeight;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    var g = svg.querySelector('#m1-liens');
    g.innerHTML = '';
    // Les étiquettes sont des éléments HTML : elles se recréent aussi.
    var vieilles = stage.querySelectorAll('.link-tag');
    for (var v=0;v<vieilles.length;v++) vieilles[v].parentNode.removeChild(vieilles[v]);

    var c = { x:W/2, y:H/2 };
    var coreEl = document.getElementById('m1-core');
    var rayon = (coreEl ? coreEl.offsetWidth : 150) / 2;

    P11.state.m1.liens.forEach(function(l, idx){
      var d, milieu;
      if (l.type === 'FC'){
        var p = pointDe(l.de);
        var b = versBord(p, c, rayon);
        d = courbe(p, b, 0.10);
        milieu = { x:(p.x + b.x)/2, y:(p.y + b.y)/2 };
      } else {
        // La FP entre d'un côté de l'objet et ressort de l'autre : le tracé
        // passe par le centre, ce qui montre qu'elle le traverse.
        var pa = pointDe(l.de), pb = pointDe(l.a);
        d = courbe(pa, c, 0.09) + ' ' + courbe(c, pb, 0.09).replace(/^M[^Q]*/, '');
        milieu = { x:c.x, y:c.y - rayon - 16 };
      }

      var path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', d);
      path.setAttribute('class', 'link ' + l.type.toLowerCase() + ' draw');
      var longueur = 0;
      try { longueur = path.getTotalLength ? 0 : 0; } catch(e){}
      g.appendChild(path);
      // L'animation de tracé a besoin de la longueur réelle, connue seulement
      // une fois le chemin dans le document.
      try {
        longueur = path.getTotalLength();
        path.style.strokeDasharray = longueur;
        path.style.setProperty('--len', longueur);
        path.style.animationDelay = (idx * 0.09) + 's';
      } catch(e){ path.classList.remove('draw'); }

      var tag = document.createElement('span');
      tag.className = 'link-tag ' + l.type.toLowerCase();
      tag.textContent = l.type;
      tag.style.left = milieu.x + 'px';
      tag.style.top  = milieu.y + 'px';
      stage.appendChild(tag);
    });
  }

  /** Point où le trait doit s'arrêter pour toucher le bord du cercle central. */
  function versBord(depuis, centre, rayon){
    var dx = centre.x - depuis.x, dy = centre.y - depuis.y;
    var l = Math.sqrt(dx*dx + dy*dy) || 1;
    return { x:centre.x - dx/l*rayon, y:centre.y - dy/l*rayon };
  }

  /** Chemin courbe entre deux points, bombé perpendiculairement. */
  function courbe(a, b, bombe){
    var mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
    var dx = b.x-a.x, dy = b.y-a.y;
    var qx = mx - dy*bombe, qy = my + dx*bombe;
    return 'M ' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) +
           ' Q ' + qx.toFixed(1) + ' ' + qy.toFixed(1) +
           ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
  }

  function majCompteurs(){
    var l = P11.state.m1.liens;
    var nbFP = l.filter(function(x){ return x.type==='FP'; }).length;
    var nbFC = l.filter(function(x){ return x.type==='FC'; }).length;
    document.getElementById('m1-compte').innerHTML =
      '<b>' + nbFP + '</b> fonction' + (nbFP>1?'s':'') + ' principale' + (nbFP>1?'s':'') +
      ' · <b>' + nbFC + '</b> fonction' + (nbFC>1?'s':'') + ' contrainte' + (nbFC>1?'s':'');
  }

  /* ================= C. Le tableau d'analyse des six fonctions =============
     L'élève attribue à chaque fonction son TYPE et son REPÈRE.

     L'ordre des six lignes est tiré au sort à chaque chargement : deux élèves
     voisins n'ont pas le même tableau, et celui qui refait l'activité ne peut
     pas rejouer une suite de réponses apprise par cœur.

     Le repère ne se compare donc pas à une liste de référence figée — après
     tirage, l'ordre attendu serait indevinable. Ce qui est vérifié, c'est la
     règle : la fonction principale porte FP1, chaque contrainte porte un FC
     numéroté différent des autres. C'est à cela que sert un repère, identifier
     une fonction sans ambiguïté dans le cahier des charges.
     ====================================================================== */

  var ordreAffichage = [];   // ids des fonctions, tirés au sort à l'ouverture

  /** Tirage de Fisher-Yates sur une copie : data.js n'est jamais modifié. */
  function melanger(liste){
    var t = liste.slice();
    for (var i = t.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = t[i]; t[i] = t[j]; t[j] = tmp;
    }
    return t;
  }

  function fonctionParId(id){
    for (var i=0;i<P11DATA.FONCTIONS.length;i++){
      if (P11DATA.FONCTIONS[i].id === id) return P11DATA.FONCTIONS[i];
    }
    return null;
  }

  /** Repère composé à partir des deux choix de l'élève : « FC » + « 2 » → FC2. */
  function repereDe(id){
    var t = P11.state.m1.typage[id], n = P11.state.m1.numeros[id];
    return (t && n) ? (t + n) : '';
  }

  function construireAnalyse(){
    ordreAffichage = melanger(P11DATA.FONCTIONS.map(function(f){ return f.id; }));

    var corps = document.getElementById('m1-analyse');
    corps.innerHTML = ordreAffichage.map(function(id){
      var f = fonctionParId(id);
      return '' +
        '<tr data-f="' + id + '">' +
          '<td><select class="a-type" aria-label="Type de la fonction : ' + P11.esc(f.texte) + '">' +
            '<option value="">—</option>' +
            '<option value="FP">FP</option>' +
            '<option value="FC">FC</option>' +
          '</select></td>' +
          '<td><select class="a-num" aria-label="Numéro de la fonction : ' + P11.esc(f.texte) + '">' +
            '<option value="">—</option>' +
            [1,2,3,4,5,6].map(function(n){
              return '<option value="' + n + '">' + n + '</option>';
            }).join('') +
          '</select></td>' +
          '<td class="a-rep"><span class="pill todo">—</span></td>' +
          '<td class="fn">' + P11.esc(f.texte) + '</td>' +
          '<td class="stat a-fb"></td>' +
        '</tr>';
    }).join('');

    corps.querySelectorAll('tr').forEach(function(tr){
      var id = tr.dataset.f;
      function noter(){
        var t = tr.querySelector('.a-type').value;
        var n = tr.querySelector('.a-num').value;
        if (t) P11.state.m1.typage[id] = t; else delete P11.state.m1.typage[id];
        if (n) P11.state.m1.numeros[id] = n; else delete P11.state.m1.numeros[id];
        P11.sauver();
        P11.majEnTete();
        rafraichirAnalyse();
      }
      tr.querySelector('.a-type').addEventListener('change', noter);
      tr.querySelector('.a-num').addEventListener('change', noter);
    });

    document.getElementById('m1-rendre').addEventListener('click', function(){
      P11.state.m1.typage = {};
      P11.state.m1.numeros = {};
      P11.state.m1.valide = false;
      refletTypage();
      P11.sauver();
      P11.majEnTete();
    });
    document.getElementById('m1-valider-analyse').addEventListener('click', function(){
      P11.state.m1.valide = true;
      rafraichirAnalyse();
      P11.sauver();
    });
  }

  /**
   * Évalue le tableau. Renvoie, par fonction, les points obtenus et le motif.
   * Séparé de l'affichage : la même fonction sert au retour en direct, à la
   * note de la mission et au dossier final.
   *
   * Barème d'une ligne, sur 2 points : le TYPE vaut 1,5 — c'est la notion de
   * la séance — et le REPÈRE 0,5, qui récompense la rigueur sans écraser le
   * reste si l'élève se trompe de numéro.
   */
  function evaluerAnalyse(){
    var st = P11.state.m1;
    // Un même repère porté par deux fonctions ne désigne plus rien : on
    // repère les doublons avant de juger les lignes.
    var comptes = {};
    P11DATA.FONCTIONS.forEach(function(f){
      var r = repereDe(f.id);
      if (r) comptes[r] = (comptes[r] || 0) + 1;
    });

    return P11DATA.FONCTIONS.map(function(f){
      var type = st.typage[f.id] || '';
      var num  = st.numeros[f.id] || '';
      var rep  = repereDe(f.id);
      var typeOk = type === f.type;
      var res = { f:f, type:type, num:num, rep:rep, typeOk:typeOk, repOk:false, pts:0, motif:'' };

      if (!type && !num){ res.motif = "Ligne non renseignée."; return res; }
      if (!typeOk){
        res.motif = type
          ? "Type incorrect. Compte les éléments du milieu extérieur reliés par cette fonction."
          : "Choisis d'abord le type.";
        return res;
      }
      res.pts = 1.5;

      if (!num){ res.motif = "Type correct. Il manque le numéro."; return res; }
      if (comptes[rep] > 1){
        res.motif = "Le repère " + rep + " est utilisé deux fois : un repère doit désigner une seule fonction.";
        return res;
      }
      if (f.type === 'FP' && num !== '1'){
        res.motif = "L'objet n'a qu'une seule fonction principale : elle porte le repère FP1.";
        return res;
      }
      res.repOk = true;
      res.pts = 2;
      res.motif = "Type et repère corrects.";
      return res;
    });
  }

  /** Met à jour les pastilles de repère et la colonne de retour. */
  function rafraichirAnalyse(){
    var st = P11.state.m1;
    var res = evaluerAnalyse();
    var parId = {};
    res.forEach(function(r){ parId[r.f.id] = r; });

    document.querySelectorAll('#m1-analyse tr').forEach(function(tr){
      var r = parId[tr.dataset.f];
      if (!r) return;
      var cellRep = tr.querySelector('.a-rep');
      cellRep.innerHTML = r.rep
        ? '<span class="pill ' + (r.type === 'FP' ? 'fp' : 'fc') + '">' + r.rep + '</span>'
        : '<span class="pill todo">—</span>';

      // Le retour ne s'affiche qu'après la première validation : avant, l'élève
      // essaierait les combinaisons jusqu'à voir un ✓ sans jamais réfléchir.
      // Une fois validé, il se met à jour en direct pendant la correction.
      var cellFb = tr.querySelector('.a-fb');
      if (!st.valide){ cellFb.innerHTML = ''; tr.title = ''; return; }
      cellFb.innerHTML = r.pts === 2
        ? '<span class="pill ok">✓</span>'
        : (r.pts > 0 ? '<span class="pill partial">≈</span>' : '<span class="pill ko">✗</span>');
      tr.title = r.motif;
    });

    var remplies = res.filter(function(r){ return r.type; }).length;
    var justes = res.filter(function(r){ return r.pts === 2; }).length;
    document.getElementById('m1-tri-aide').innerHTML = !st.valide
      ? (remplies === P11DATA.FONCTIONS.length
          ? "Les six lignes sont renseignées. Clique sur <b>Valider le tableau</b> pour voir tes erreurs."
          : "Renseigne le type et le numéro de chaque fonction. Restant : <b>" +
            (P11DATA.FONCTIONS.length - remplies) + "</b>.")
      : (justes === P11DATA.FONCTIONS.length
          ? "<b>Les six lignes sont justes.</b> Tu peux passer à la vérification de la mission."
          : "<b>" + justes + " / " + P11DATA.FONCTIONS.length + "</b> lignes justes. " +
            "Survole une ligne pour lire la remarque, corrige, le retour se met à jour aussitôt.");
  }

  /** Réaffiche les choix enregistrés dans les listes déroulantes. */
  function refletTypage(){
    var st = P11.state.m1;
    document.querySelectorAll('#m1-analyse tr').forEach(function(tr){
      var id = tr.dataset.f;
      tr.querySelector('.a-type').value = st.typage[id] || '';
      tr.querySelector('.a-num').value  = st.numeros[id] || '';
    });
    rafraichirAnalyse();
  }

  /* ========================= Vérification ================================= */

  function verifier(){
    var st = P11.state.m1;
    st.essais++;
    var montrer = st.essais >= 2;   // le corrigé n'apparaît qu'au second essai
    var html = '';

    /* --- 1. Les liens tracés --------------------------------------------- */
    var attenduFP = ['util','eau'];
    var attenduFC = ['mains','humide','energie','lavabo','budget'];

    var fps = st.liens.filter(function(l){ return l.type==='FP'; });
    var fpJuste = fps.some(function(l){
      return attenduFP.indexOf(l.de) !== -1 && attenduFP.indexOf(l.a) !== -1;
    });
    var ptsLiens = 0, remarques = [];

    if (fpJuste){
      ptsLiens += 3;
      remarques.push({ ok:true, t:"La fonction principale relie bien l'utilisateur et l'eau à travers le robinet." });
    } else if (fps.length === 0){
      remarques.push({ ok:false, t:"Aucune fonction principale n'est tracée. Demande-toi quels DEUX éléments l'objet met en relation." });
    } else {
      remarques.push({ ok:false, t:"La fonction principale tracée ne relie pas les bons éléments. Un robinet met en relation la personne qui l'utilise et l'eau du réseau." });
    }

    var fcJustes = [], fcEnTrop = [];
    st.liens.filter(function(l){ return l.type==='FC'; }).forEach(function(l){
      if (attenduFC.indexOf(l.de) !== -1) fcJustes.push(l.de); else fcEnTrop.push(l.de);
    });
    // Doublons éventuels comptés une seule fois.
    fcJustes = fcJustes.filter(function(v,i,a){ return a.indexOf(v) === i; });
    ptsLiens += fcJustes.length;

    var manquants = attenduFC.filter(function(id){ return fcJustes.indexOf(id) === -1; });
    if (fcJustes.length === attenduFC.length){
      remarques.push({ ok:true, t:"Les cinq fonctions contraintes sont tracées : chacune relie l'objet à un seul élément." });
    } else {
      remarques.push({ ok:false, t:"Il manque " + manquants.length + " fonction" + (manquants.length>1?'s':'') +
        " contrainte" + (manquants.length>1?'s':'') + "." +
        (montrer ? " À relier : " + manquants.map(nomEME).join(', ') + "." :
                   " Passe en revue chaque élément du plateau : l'objet doit-il s'adapter à lui ?") });
    }
    if (fcEnTrop.length){
      remarques.push({ ok:false, t:"Un élément est relié comme contrainte alors qu'il fait partie de la fonction principale : "
        + fcEnTrop.map(nomEME).join(', ') + ". L'utilisateur et l'eau sont les deux extrémités de la FP." });
    }
    ptsLiens = Math.min(P11DATA.BAREME.m1.liens, ptsLiens);

    html += bloc(ptsLiens === P11DATA.BAREME.m1.liens ? 'ok' : (ptsLiens >= 4 ? 'partial' : 'ko'),
      'Le tracé de la pieuvre — ' + ptsLiens + ' / ' + P11DATA.BAREME.m1.liens + ' points',
      '<ul>' + remarques.map(function(r){
        return '<li>' + (r.ok ? '✔ ' : '→ ') + P11.esc(r.t) + '</li>';
      }).join('') + '</ul>');

    /* --- 2. Le tableau d'analyse : type et repère ------------------------ */
    st.valide = true;          // la vérification vaut validation du tableau
    var analyse = evaluerAnalyse();
    var ptsType = analyse.reduce(function(s, r){ return s + r.pts; }, 0);
    rafraichirAnalyse();

    var nonRemplies = analyse.filter(function(r){ return !r.type; }).length;
    var texteType = nonRemplies
      ? '<p style="margin:0 0 8px">' + nonRemplies + ' ligne' + (nonRemplies>1?'s ne sont':' n\'est') +
        ' pas renseignée' + (nonRemplies>1?'s':'') + '.</p>'
      : '';
    texteType += '<ul>' + analyse.map(function(r){
        var icone = r.pts === 2 ? '✔' : (r.pts > 0 ? '≈' : (r.type ? '✘' : '·'));
        var ligne = '<li>' + icone + ' ' + P11.esc(r.f.texte);
        if (r.type){
          ligne += ' <span class="pill ' + (r.pts === 2 ? 'ok' : (r.pts > 0 ? 'partial' : 'ko')) + '">' +
                   P11.esc(r.rep || r.type) + '</span>';
        }
        // Le « pourquoi » complet est donné dès le premier essai quand la
        // réponse est juste — on consolide — et seulement au second quand elle
        // est fausse, pour laisser d'abord l'élève chercher.
        if (r.typeOk)          ligne += '<br><span class="why">' + P11.esc(r.f.pourquoi) + '</span>';
        else if (montrer)      ligne += '<br><span class="why">Attendu : <b>' + r.f.rep + '</b>. ' +
                                        P11.esc(r.f.pourquoi) + '</span>';
        else if (r.motif)      ligne += '<br><span class="why">' + P11.esc(r.motif) + '</span>';
        return ligne + '</li>';
      }).join('') + '</ul>';

    html += bloc(ptsType === P11DATA.BAREME.m1.typage ? 'ok' : (ptsType >= 6 ? 'partial' : 'ko'),
      'Le tableau d\'analyse — ' + P11.fmt(ptsType) + ' / ' + P11DATA.BAREME.m1.typage + ' points', texteType);
    /* --- 3. Score et suite ----------------------------------------------- */
    var total = ptsLiens + ptsType;
    st.score = total;
    st.detail = { liens:ptsLiens, typage:ptsType };

    var appreciation =
      total >= 18 ? "La pieuvre du robinet automatique n'a plus de secret pour toi."
    : total >= 13 ? "Bon travail. Revois surtout la différence entre « relier deux éléments » et « s'adapter à un élément »."
    : total >= 8  ? "Les bases sont là, mais le critère FP / FC n'est pas encore automatique. Relis le mémo."
    :               "Reprends la pieuvre de la fiche papier avec le mémo sous les yeux, puis recommence.";
    html += '<div class="score">Mission 1 — ' + total + ' / ' + P11DATA.BAREME.m1.total + ' points · ' + appreciation + '</div>';

    if (!montrer){
      html += '<div class="again">Corrige tes réponses à l\'aide des remarques, puis clique une seconde fois sur ' +
              '<b>Vérifier la mission 1</b> : le corrigé complet s\'affichera.</div>';
      document.getElementById('m1-verif').textContent = 'Vérifier la mission 1 (2ᵉ essai)';
    } else {
      html += bloc('info', 'Corrigé complet', corrigeHTML());
      document.getElementById('m1-verif').textContent = 'Vérifier à nouveau';
    }

    document.getElementById('m1-sortie').innerHTML = html;
    document.getElementById('m1-sortie').scrollIntoView({ behavior:'smooth', block:'start' });
    P11.sauver(true);
    CLOUD.envoyer('m1');
    P11.majEnTete();
  }

  function corrigeHTML(){
    var h = '<p style="margin:0 0 8px"><b>La pieuvre du robinet automatique</b></p><ul>';
    h += '<li><b>FP1</b> (fonction principale) : <i>utilisateur ↔ eau</i> — permettre à l\'utilisateur de se laver les mains avec de l\'eau.</li>';
    P11DATA.FONCTIONS.filter(function(f){ return f.type==='FC'; }).forEach(function(f){
      h += '<li><b>' + f.rep + '</b> : objet ↔ <i>' + nomEME(f.via[0]) + '</i> — ' + P11.esc(f.texte.toLowerCase()) + '.</li>';
    });
    h += '</ul><div class="corr">Le repère est toujours le même : <b>deux</b> éléments du milieu extérieur reliés ' +
         'à travers l\'objet → fonction principale ; <b>un seul</b> élément relié à l\'objet → fonction contrainte.</div>';
    return h;
  }

  function nomEME(id){
    for (var i=0;i<P11DATA.EME.length;i++){ if (P11DATA.EME[i].id === id) return P11DATA.EME[i].nom.toLowerCase(); }
    return id;
  }

  function bloc(cls, titre, corps){
    var ico = cls==='ok' ? '✔' : (cls==='partial' ? '≈' : (cls==='ko' ? '✘' : 'ℹ'));
    return '<div class="fb ' + cls + '"><b class="t">' + ico + ' ' + titre + '</b>' + corps + '</div>';
  }

  /* ============================ Mise en place ============================= */

  function init(){
    statut = document.getElementById('m1-statut');
    construirePlateau();
    construireAnalyse();

    ['FP','FC'].forEach(function(t){
      document.getElementById('m1-mode-' + t).addEventListener('click', function(){
        modeTrace = (modeTrace === t) ? null : t;
        enAttente = [];
        majSelection();
        document.getElementById('m1-mode-FP').setAttribute('aria-pressed', modeTrace==='FP');
        document.getElementById('m1-mode-FC').setAttribute('aria-pressed', modeTrace==='FC');
        if (modeTrace === 'FP') dire("Clique sur les DEUX éléments du milieu extérieur que l'objet met en relation. Le trait passera à travers lui.", 1);
        else if (modeTrace === 'FC') dire("Clique sur l'élément auquel l'objet doit s'adapter. Le trait le reliera à l'objet.", 1);
        else dire("Choisis le type de fonction à tracer.");
      });
    });

    document.getElementById('m1-annuler').addEventListener('click', function(){
      P11.state.m1.liens.pop();
      finTrace();
      dire("Dernier trait effacé.");
    });
    document.getElementById('m1-effacer').addEventListener('click', function(){
      P11.state.m1.liens = [];
      finTrace();
      dire("Plateau effacé. Choisis un type de fonction pour recommencer.");
    });
    document.getElementById('m1-verif').addEventListener('click', verifier);
    document.getElementById('m1-memo').addEventListener('click', function(){
      P11.modale('Mémo — pieuvre et fonctions',
        P11DATA.MEMO.slice(0,3).map(function(m){
          return '<p><b>' + m.t + '</b><br>' + m.d + '</p>';
        }).join(''));
    });

    dire("Choisis le type de fonction à tracer.");
    majCompteurs();
  }

  /** Appelé à chaque affichage de l'écran : la 3D a besoin d'une taille réelle. */
  /**
   * Replace les pastilles et redessine les traits.
   *
   * Volontairement sur `setTimeout` et non sur `requestAnimationFrame` :
   * un onglet en arrière-plan ne reçoit aucune frame d'animation, et la
   * pieuvre resterait vide jusqu'au retour de l'élève sur l'onglet. Le second
   * passage rattrape la largeur définitive des libellés une fois la police
   * Inter chargée — avant cela, les mesures sont faites en police de repli.
   */
  function redessinerPlateau(){
    placerEME();
    dessinerLiens();
  }
  function replacerBientot(){
    redessinerPlateau();
    setTimeout(redessinerPlateau, 60);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redessinerPlateau);
  }

  function auReveil(){
    initScene();
    if (scene3d) scene3d.redimensionner();
    // Le plateau vient d'être démasqué : sa largeur est lisible dès maintenant,
    // la lecture de clientWidth déclenchant elle-même le calcul de mise en page.
    replacerBientot();
  }

  /** Réaffiche un état rechargé depuis la sauvegarde. */
  function refletEtat(){
    // Changer de dossier (reprise, import, nouveau badge) remet aussi l'outil
    // de tracé au repos : sans cela, le mode choisi par l'équipe précédente
    // restait actif et le premier clic de la suivante traçait un trait.
    modeTrace = null;
    enAttente = [];
    var bFP = document.getElementById('m1-mode-FP'), bFC = document.getElementById('m1-mode-FC');
    if (bFP) bFP.setAttribute('aria-pressed','false');
    if (bFC) bFC.setAttribute('aria-pressed','false');
    if (statut) dire("Choisis le type de fonction à tracer.");

    majSelection();
    refletTypage();
    majCompteurs();
    var st = P11.state.m1;
    if (st.hotspots.length){
      document.getElementById('m1-hs-compte').textContent =
        'Éléments repérés : ' + st.hotspots.length + ' / ' + P11DATA.HOTSPOTS.length;
    }
    replacerBientot();
  }

  return { init:init, auReveil:auReveil, refletEtat:refletEtat, verifier:verifier };
})();
