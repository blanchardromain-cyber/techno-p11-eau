/* ============================================================================
   P11 · Séance 5 — Rendus 3D
   ----------------------------------------------------------------------------
   Deux scènes :
     · `robinet(...)`  — le robinet automatique du module 1, tournant, avec des
                         points chauds qui désignent les éléments du milieu
                         extérieur directement sur la maquette ;
     · `atelier(...)`  — l'établi du module 3 : l'équipe assemble sa solution à
                         partir d'un kit de pièces, puis en exporte une image.

   Three.js est chargé depuis un CDN. **Le réseau d'un collège filtre souvent
   les CDN** : si `window.THREE` est absent, chaque constructeur renvoie un
   objet de remplacement qui affiche une illustration SVG équivalente et expose
   la même interface. L'activité reste donc entièrement utilisable sans 3D —
   aucun module ne dépend de la réussite du chargement.

   Les contrôles d'orbite sont écrits ici (une quarantaine de lignes) plutôt
   qu'importés : OrbitControls n'existe plus en version « script global » dans
   les three.js récents, et une dépendance de moins est une panne de moins.
   ========================================================================== */

var SCENE3D = (function(){
  'use strict';

  /**
   * La 3D est-elle utilisable ?
   * `?no3d` dans l'adresse force le mode sans 3D : il sert à vérifier le repli,
   * et il rend l'activité utilisable sur un poste trop ancien pour WebGL sans
   * attendre que la page peine à l'afficher.
   */
  function dispo(){
    if (/[?&]no3d(&|=|$)/.test(window.location.search)) return false;
    return typeof window.THREE !== 'undefined';
  }

  /* ===================== Utilitaires communs aux deux scènes =============== */

  /**
   * Petite carte d'environnement fabriquée à la volée : un dégradé ciel/sol.
   * Sans elle, un matériau métallique n'a rien à refléter et rend noir.
   */
  function envDegrade(renderer){
    var c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    var g = c.getContext('2d').createLinearGradient(0,0,0,64);
    g.addColorStop(0.00, '#ffffff');
    g.addColorStop(0.45, '#cfe4f5');
    g.addColorStop(0.55, '#9fb3c6');
    g.addColorStop(1.00, '#5b6b7a');
    var ctx = c.getContext('2d');
    ctx.fillStyle = g; ctx.fillRect(0,0,64,64);

    var tex = new THREE.CanvasTexture(c);
    // Le nom du mode de projection a changé au fil des versions de three.js.
    tex.mapping = THREE.EquirectangularReflectionMapping || THREE.EquirectangularRefractionMapping;
    if (THREE.PMREMGenerator){
      try {
        var pmrem = new THREE.PMREMGenerator(renderer);
        var cible = pmrem.fromEquirectangular(tex);
        pmrem.dispose();
        return cible.texture;
      } catch(e){ /* repli sur la texture brute */ }
    }
    return tex;
  }

  function creerRenderer(holder, avecSnapshot){
    var r = new THREE.WebGLRenderer({
      antialias:true,
      alpha:true,
      // Obligatoire pour pouvoir exporter la maquette en PNG : sans cela, le
      // tampon est vidé après chaque image et toDataURL renvoie du vide.
      preserveDrawingBuffer: !!avecSnapshot
    });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    r.setSize(holder.clientWidth, holder.clientHeight);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    // Sans compression des hautes lumières, la carte d'environnement délave les
    // surfaces claires : la vasque blanche se confondait avec le plan.
    if (THREE.ACESFilmicToneMapping){
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 0.92;
    }
    // Gestion de l'espace colorimétrique : le nom diffère selon la version.
    if ('outputColorSpace' in r && THREE.SRGBColorSpace) r.outputColorSpace = THREE.SRGBColorSpace;
    else if ('outputEncoding' in r && THREE.sRGBEncoding) r.outputEncoding = THREE.sRGBEncoding;
    holder.appendChild(r.domElement);
    return r;
  }

  /**
   * Contrôles d'orbite minimalistes : rotation au glisser, zoom à la molette
   * ou au pincement. `cible` est le point regardé, `etat` porte les angles.
   */
  function orbite(dom, camera, cible, etat){
    var drag = false, lx = 0, ly = 0, pinch = 0;

    function place(){
      var s = Math.sin(etat.phi), c = Math.cos(etat.phi);
      camera.position.set(
        cible.x + etat.r * s * Math.sin(etat.theta),
        cible.y + etat.r * c,
        cible.z + etat.r * s * Math.cos(etat.theta)
      );
      camera.lookAt(cible);
    }

    function down(e){
      drag = true; etat.auto = false;
      var p = e.touches ? e.touches[0] : e;
      lx = p.clientX; ly = p.clientY;
      if (e.touches && e.touches.length === 2) pinch = ecart(e.touches);
    }
    function move(e){
      if (e.touches && e.touches.length === 2){
        var d = ecart(e.touches);
        if (pinch) { etat.r = borne(etat.r * (pinch/d), etat.rmin, etat.rmax); place(); }
        pinch = d;
        e.preventDefault();
        return;
      }
      if (!drag) return;
      var p = e.touches ? e.touches[0] : e;
      etat.theta -= (p.clientX - lx) * 0.008;
      etat.phi    = borne(etat.phi - (p.clientY - ly) * 0.006, 0.18, Math.PI * 0.86);
      lx = p.clientX; ly = p.clientY;
      place();
      if (e.touches) e.preventDefault();
    }
    function up(){ drag = false; pinch = 0; }
    function wheel(e){
      etat.auto = false;
      etat.r = borne(etat.r * (e.deltaY > 0 ? 1.12 : 0.89), etat.rmin, etat.rmax);
      place();
      e.preventDefault();
    }
    function ecart(t){
      var dx = t[0].clientX - t[1].clientX, dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx*dx + dy*dy);
    }
    function borne(v,a,b){ return Math.max(a, Math.min(b, v)); }

    dom.addEventListener('mousedown', down);
    dom.addEventListener('touchstart', down, {passive:true});
    window.addEventListener('mousemove', move);
    dom.addEventListener('touchmove', move, {passive:false});
    window.addEventListener('mouseup', up);
    dom.addEventListener('touchend', up);
    dom.addEventListener('wheel', wheel, {passive:false});

    place();
    return {
      place: place,
      detruire: function(){
        dom.removeEventListener('mousedown', down);
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        dom.removeEventListener('wheel', wheel);
      }
    };
  }

  /* ======================== Repli sans WebGL / sans CDN ==================== */

  /** Illustration SVG du robinet, affichée si Three.js n'a pas pu se charger. */
  function robinetSVG(){
    return '' +
    '<svg viewBox="0 0 420 300" width="100%" height="100%" role="img" ' +
    '     aria-label="Schéma du robinet automatique au-dessus d\'un lavabo">' +
    '  <defs>' +
    '    <linearGradient id="chr" x1="0" y1="0" x2="1" y2="0">' +
    '      <stop offset="0"   stop-color="#8a97a5"/><stop offset=".35" stop-color="#eef3f8"/>' +
    '      <stop offset=".6"  stop-color="#b8c4d0"/><stop offset="1"   stop-color="#6d7a88"/>' +
    '    </linearGradient>' +
    '    <linearGradient id="eau" x1="0" y1="0" x2="0" y2="1">' +
    '      <stop offset="0" stop-color="#9fdcff" stop-opacity=".95"/>' +
    '      <stop offset="1" stop-color="#2E75B6" stop-opacity=".35"/>' +
    '    </linearGradient>' +
    '  </defs>' +
    '  <ellipse cx="210" cy="245" rx="132" ry="30" fill="#dfe9f3"/>' +
    '  <path d="M78 232 h264 a10 10 0 0 1 -10 14 H88 a10 10 0 0 1 -10 -14z" fill="#eef4fa"/>' +
    '  <ellipse cx="210" cy="232" rx="132" ry="26" fill="#f7fbff" stroke="#cdddea"/>' +
    '  <ellipse cx="210" cy="234" rx="26" ry="7" fill="#cddced"/>' +
    '  <rect x="196" y="112" width="28" height="112" rx="9" fill="url(#chr)"/>' +
    '  <path d="M210 118 q0 -46 46 -46 h6" stroke="url(#chr)" stroke-width="20" ' +
    '        fill="none" stroke-linecap="round"/>' +
    '  <rect x="248" y="86" width="20" height="16" rx="5" fill="#2b3440"/>' +
    '  <circle cx="258" cy="94" r="4" fill="#C0392B"/>' +
    '  <path d="M258 104 q4 50 0 110" stroke="url(#eau)" stroke-width="13" ' +
    '        fill="none" stroke-linecap="round"/>' +
    '  <ellipse cx="258" cy="206" rx="30" ry="9" fill="#f1c6a8"/>' +
    '  <ellipse cx="258" cy="200" rx="26" ry="8" fill="#f8dac2"/>' +
    '  <text x="16" y="28" font-family="Inter,Arial" font-size="13" font-weight="700" ' +
    '        fill="#1F3864">Le robinet automatique</text>' +
    '  <text x="16" y="48" font-family="Inter,Arial" font-size="11.5" fill="#6b7280">' +
    '        Vue 3D indisponible sur ce réseau — schéma équivalent.</text>' +
    '</svg>';
  }

  /**
   * Objet de remplacement : même interface, aucune 3D.
   *
   * Le contenu est AJOUTÉ au conteneur, jamais substitué : une première
   * version écrasait son innerHTML et supprimait du même coup les boutons
   * d'outils que le module allait câbler juste après. Résultat, sur le réseau
   * qui bloquait la bibliothèque 3D — le seul cas où ce repli sert — la
   * mission entière cessait de fonctionner.
   */
  function repli(holder, svg){
    var boite = document.createElement('div');
    boite.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;' +
                          'justify-content:center;padding:14px';
    boite.innerHTML = svg;
    holder.appendChild(boite);
    // Les commandes de vue n'ont plus d'objet : on les retire proprement.
    var outils = holder.querySelector('.scene-tools');
    if (outils) outils.style.display = 'none';
    return {
      actif:false,
      projeter:function(){ return { visible:false, x:0, y:0 }; },
      viser:function(){}, setAuto:function(){}, redimensionner:function(){},
      ajouter:function(){ return null; }, retirer:function(){}, selectionner:function(){},
      pivoter:function(){}, snapshot:function(){ return ''; },
      recadrer:function(){}, detruire:function(){}
    };
  }

  /* ========================================================================
     Scène 1 — le robinet automatique (module 1)
     ===================================================================== */
  function robinet(holder){
    if (!dispo()) return repli(holder, robinetSVG());

    var renderer, scene, camera, ctrl, anim = null;
    try { renderer = creerRenderer(holder, false); }
    catch(e){ return repli(holder, robinetSVG()); }

    scene = new THREE.Scene();
    scene.environment = envDegrade(renderer);

    camera = new THREE.PerspectiveCamera(38, holder.clientWidth/holder.clientHeight, 0.1, 100);
    var cible = new THREE.Vector3(0, 0.72, 0);
    var etat = { theta:0.38, phi:1.05, r:3.05, rmin:1.8, rmax:6.0, auto:true };
    ctrl = orbite(renderer.domElement, camera, cible, etat);

    /* --- Lumières : une dominante douce, une clé qui porte l'ombre ------- */
    scene.add(new THREE.HemisphereLight(0xdcefff, 0x8b9aa8, 0.45));
    var cle = new THREE.DirectionalLight(0xffffff, 0.95);
    cle.position.set(3.2, 5.4, 3.0);
    cle.castShadow = true;
    cle.shadow.mapSize.set(1024,1024);
    cle.shadow.camera.near = 1; cle.shadow.camera.far = 16;
    cle.shadow.camera.left = -3; cle.shadow.camera.right = 3;
    cle.shadow.camera.top = 3;   cle.shadow.camera.bottom = -3;
    cle.shadow.bias = -0.0016;
    scene.add(cle);
    var appoint = new THREE.DirectionalLight(0xbfe0ff, 0.28);
    appoint.position.set(-3.5, 2.2, -2.4);
    scene.add(appoint);

    /* --- Matériaux ------------------------------------------------------- */
    var chrome    = new THREE.MeshStandardMaterial({ color:0xdfe6ee, metalness:0.94, roughness:0.16, envMapIntensity:1.15 });
    var ceramique = new THREE.MeshStandardMaterial({ color:0xfdfefe, metalness:0.02, roughness:0.26, envMapIntensity:0.35 });
    var plan      = new THREE.MeshStandardMaterial({ color:0x7d93ab, metalness:0.08, roughness:0.62, envMapIntensity:0.30 });
    var noir      = new THREE.MeshStandardMaterial({ color:0x24303c, metalness:0.35, roughness:0.45, envMapIntensity:0.5 });
    var rouge     = new THREE.MeshStandardMaterial({ color:0xC0392B, emissive:0x5c120c, roughness:0.4 });
    var peau      = new THREE.MeshStandardMaterial({ color:0xe8b894, roughness:0.85, metalness:0, envMapIntensity:0.3 });
    var matEau    = new THREE.MeshStandardMaterial({
      color:0x8fd4ff, transparent:true, opacity:0.55, roughness:0.05,
      metalness:0.1, depthWrite:false
    });

    function ajout(geo, mat, x,y,z){
      var m = new THREE.Mesh(geo, mat);
      m.position.set(x||0, y||0, z||0);
      m.castShadow = true; m.receiveShadow = true;
      scene.add(m);
      return m;
    }

    /* --- Le meuble : plan de vasque et mur carrelé -----------------------
       Le plan est posé à y = 0,10. Tout ce qui suit s'appuie sur cette cote :
       la vasque est POSÉE dessus (vasque à poser), ce qui évite d'avoir à
       percer le plan — une découpe booléenne coûterait cher pour rien et
       cacherait justement ce que l'élève doit voir.                          */
    ajout(new THREE.BoxGeometry(2.30, 0.10, 1.50), plan, 0, 0.05, 0).castShadow = false;
    var mur = ajout(
      new THREE.BoxGeometry(2.30, 1.9, 0.07),
      new THREE.MeshStandardMaterial({ color:0xcfe0ee, roughness:0.62, metalness:0.02, envMapIntensity:0.25 }),
      0, 0.95, -0.76
    );
    mur.castShadow = false;

    /* --- La vasque ------------------------------------------------------- */
    var vasque = ajout(
      new THREE.CylinderGeometry(0.56, 0.36, 0.32, 48, 1, true),
      new THREE.MeshStandardMaterial({ color:0xfdfefe, roughness:0.22, metalness:0.02, side:THREE.DoubleSide, envMapIntensity:0.35 }),
      0, 0.26, 0.14
    );
    vasque.receiveShadow = true;
    ajout(new THREE.CircleGeometry(0.36, 40), ceramique, 0, 0.105, 0.14).rotation.x = -Math.PI/2;
    ajout(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 20), chrome, 0, 0.115, 0.14);  // bonde
    // Jonc de bord : sans lui, la vasque blanche n'a aucun contour lisible.
    ajout(new THREE.TorusGeometry(0.56, 0.015, 10, 56),
          new THREE.MeshStandardMaterial({ color:0xb9c9d8, roughness:0.4, metalness:0.2, envMapIntensity:0.4 }),
          0, 0.42, 0.14).rotation.x = Math.PI/2;

    /* --- Le corps du robinet et son bec ---------------------------------- */
    ajout(new THREE.CylinderGeometry(0.16, 0.19, 0.05, 32), chrome, 0, 0.125, -0.52);  // embase
    ajout(new THREE.CylinderGeometry(0.10, 0.11, 0.95, 32), chrome, 0, 0.62, -0.52);   // colonne

    // Bec : un tube le long d'une courbe de Bézier, du sommet de la colonne
    // jusqu'au-dessus du centre de la vasque.
    var courbe = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 1.06, -0.52),
      new THREE.Vector3(0, 1.44, -0.52),
      new THREE.Vector3(0, 1.30,  0.10)
    );
    ajout(new THREE.TubeGeometry(courbe, 28, 0.092, 18, false), chrome, 0,0,0);
    ajout(new THREE.CylinderGeometry(0.105, 0.10, 0.06, 24), chrome, 0, 1.26, 0.10);   // mousseur

    /* --- Le capteur infrarouge et son cône de détection ------------------ */
    ajout(new THREE.BoxGeometry(0.17, 0.12, 0.06), noir, 0, 1.14, 0.145);
    ajout(new THREE.SphereGeometry(0.025, 14, 12), rouge, 0, 1.14, 0.178);

    var cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.26, 0.52, 26, 1, true),
      new THREE.MeshBasicMaterial({ color:0xC0392B, transparent:true, opacity:0.05,
                                    side:THREE.DoubleSide, depthWrite:false })
    );
    // Le cône par défaut a sa pointe en HAUT : c'est exactement ce qu'il faut
    // ici, la pointe au capteur et l'ouverture vers les mains. Le faire pivoter
    // le retournerait et donnerait un faisceau qui s'élargit vers le plafond.
    cone.position.set(0, 0.87, 0.17);
    scene.add(cone);

    /* --- Le boîtier de pile, posé derrière le robinet -------------------- */
    ajout(new THREE.BoxGeometry(0.30, 0.22, 0.17), noir, 0.72, 0.21, -0.50);

    /* --- Le jet d'eau et les mains, animés ------------------------------- */
    var jet = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.050, 0.78, 16), matEau);
    jet.position.set(0, 0.84, 0.12);
    jet.visible = false;
    scene.add(jet);

    var mains = new THREE.Group();
    [-0.14, 0.14].forEach(function(dx){
      var m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), peau);
      m.scale.set(1, 0.34, 1.2);
      m.position.set(dx, 0, 0);
      m.castShadow = true;
      mains.add(m);
    });
    mains.position.set(0, 0.92, 0.16);
    mains.visible = false;
    scene.add(mains);

    /* --- Boucle d'animation ---------------------------------------------- */
    // Cycle de démonstration : les mains s'approchent, le capteur déclenche,
    // l'eau coule, les mains repartent. L'élève voit la fonction principale.
    var t0 = performance.now(), horloge = 0, enPause = false;

    function boucle(now){
      anim = requestAnimationFrame(boucle);
      // dt borné : le premier horodatage rAF peut précéder performance.now(),
      // ce qui produirait un pas négatif et des positions aberrantes.
      var dt = Math.max(0, Math.min(0.05, (now - t0)/1000));
      t0 = now;
      if (enPause){ renderer.render(scene, camera); return; }
      horloge += dt;

      if (etat.auto){ etat.theta += dt * 0.22; ctrl.place(); }

      var cycle = horloge % 6;                       // 6 s par cycle
      var approche = cycle < 1.4 ? cycle/1.4 : (cycle < 4.2 ? 1 : Math.max(0, 1 - (cycle-4.2)/1.2));
      mains.visible = approche > 0.02;
      mains.position.y = 0.92 - approche * 0.26;     // de 0,92 à 0,66 : sous le bec

      var ouvert = cycle > 1.3 && cycle < 4.4;
      jet.visible = ouvert;
      if (ouvert){
        // Le jet « tombe » : on fait défiler son échelle pour suggérer le débit.
        jet.scale.y = 1;
        matEau.opacity = 0.42 + 0.16 * Math.sin(horloge * 22);
      }
      rouge.emissive.setHex(ouvert ? 0xC0392B : 0x5c120c);
      cone.material.opacity = ouvert ? 0.16 : 0.05;

      renderer.render(scene, camera);
    }
    anim = requestAnimationFrame(boucle);

    // Économie de batterie sur tablette : on gèle la scène onglet masqué.
    function visibilite(){ enPause = document.hidden; }
    document.addEventListener('visibilitychange', visibilite);

    /* --- Interface publique ---------------------------------------------- */
    var vecteur = new THREE.Vector3();
    return {
      actif:true,
      /** Projette un point 3D en coordonnées pixel dans le conteneur. */
      projeter:function(pos){
        vecteur.set(pos[0], pos[1], pos[2]).project(camera);
        var derriere = vecteur.z > 1;
        return {
          x: (vecteur.x * 0.5 + 0.5) * holder.clientWidth,
          y: (-vecteur.y * 0.5 + 0.5) * holder.clientHeight,
          visible: !derriere
        };
      },
      setAuto:function(v){ etat.auto = !!v; },
      /** Ramène la caméra sur un point chaud précis. */
      viser:function(pos){
        etat.auto = false;
        etat.theta = Math.atan2(pos[0], pos[2]) + 0.45;
        etat.phi = 1.08;
        etat.r = 3.4;
        ctrl.place();
      },
      recadrer:function(){ etat.theta = 0.55; etat.phi = 1.15; etat.r = 4.6; etat.auto = true; ctrl.place(); },
      redimensionner:function(){
        if (!holder.clientWidth) return;
        camera.aspect = holder.clientWidth / holder.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(holder.clientWidth, holder.clientHeight);
      },
      detruire:function(){
        if (anim) cancelAnimationFrame(anim);
        document.removeEventListener('visibilitychange', visibilite);
        ctrl.detruire();
        renderer.dispose();
      }
    };
  }

  /* ========================================================================
     Scène 2 — l'établi de maquette (module 3)
     ===================================================================== */
  function atelier(holder, onSelection){
    if (!dispo()){
      return repli(holder,
        '<div style="text-align:center;color:#6b7280;font-size:13px;max-width:320px">' +
        '<div style="font-size:34px">🧰</div>' +
        "<b style='color:#1F3864'>Atelier 3D indisponible</b><br>" +
        "La bibliothèque 3D n'a pas pu être chargée sur ce réseau. " +
        "Décris ta maquette par écrit dans le champ « Principe de fonctionnement » : " +
        "le reste de la mission est noté normalement.</div>");
    }

    var renderer, scene, camera, ctrl, anim = null;
    try { renderer = creerRenderer(holder, true); }
    catch(e){ return repli(holder, '<div style="color:#6b7280">Atelier 3D indisponible.</div>'); }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeaf3fb);
    scene.environment = envDegrade(renderer);

    camera = new THREE.PerspectiveCamera(42, holder.clientWidth/holder.clientHeight, 0.1, 100);
    var cible = new THREE.Vector3(0, 0.35, 0);
    var etat = { theta:0.8, phi:1.02, r:6.2, rmin:2.5, rmax:14, auto:false };
    ctrl = orbite(renderer.domElement, camera, cible, etat);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa9b6, 0.9));
    var cle = new THREE.DirectionalLight(0xffffff, 1.05);
    cle.position.set(3.5, 6, 3.5);
    cle.castShadow = true;
    cle.shadow.mapSize.set(1024,1024);
    cle.shadow.camera.left = -5; cle.shadow.camera.right = 5;
    cle.shadow.camera.top = 5;   cle.shadow.camera.bottom = -5;
    cle.shadow.bias = -0.0015;
    scene.add(cle);

    // Établi : un sol mat + une grille d'aide au placement.
    var sol = new THREE.Mesh(
      new THREE.CircleGeometry(4.6, 56),
      new THREE.MeshStandardMaterial({ color:0xf3f8fd, roughness:0.95, metalness:0 })
    );
    sol.rotation.x = -Math.PI/2;
    sol.receiveShadow = true;
    scene.add(sol);
    var grille = new THREE.GridHelper(9, 18, 0x9ec0dd, 0xd6e4f0);
    grille.position.y = 0.002;
    scene.add(grille);

    var pieces = [];                       // {mesh, kit, id}
    var selection = null;
    var rayon = new THREE.Raycaster();
    var souris = new THREE.Vector2();
    var planSol = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
    var pointSol = new THREE.Vector3();

    /** Construit la géométrie d'une pièce du kit. */
    function geometrie(kit){
      var t = kit.taille;
      switch (kit.forme){
        case 'cylindre': return new THREE.CylinderGeometry(t[0], t[1], t[2], 28);
        case 'tube':     return new THREE.CylinderGeometry(t[0], t[1], t[2], 18);
        case 'cone':     return new THREE.ConeGeometry(t[0], t[1], 22);
        case 'plaque':   return new THREE.BoxGeometry(t[0], t[1], t[2]);
        default:         return new THREE.BoxGeometry(t[0], t[1], t[2]);
      }
    }

    function ajouterPiece(kit, x, z, rot){
      var geo = geometrie(kit);
      geo.computeBoundingBox();
      var mat = new THREE.MeshStandardMaterial({ color:kit.couleur, metalness:0.15,
                                                roughness:0.52, envMapIntensity:0.35 });
      var m = new THREE.Mesh(geo, mat);
      // Pose la pièce sur l'établi, quelle que soit sa forme.
      m.position.set(x || 0, -geo.boundingBox.min.y, z || 0);
      m.rotation.y = rot || 0;
      // Un tuyau est couché : c'est ce qui le distingue d'une colonne.
      if (kit.forme === 'tube'){ m.rotation.z = Math.PI/2; m.position.y = kit.taille[0]; }
      m.castShadow = true; m.receiveShadow = true;
      m.userData.kit = kit.id;
      scene.add(m);
      var p = { mesh:m, kit:kit.id, id:'p' + Date.now() + Math.floor(Math.random()*1000) };
      pieces.push(p);
      return p;
    }

    function surbrillance(){
      pieces.forEach(function(p){
        var choisi = selection && p.id === selection.id;
        p.mesh.material.emissive = new THREE.Color(choisi ? 0x1b3f66 : 0x000000);
        p.mesh.material.emissiveIntensity = choisi ? 0.45 : 0;
      });
    }

    /* --- Sélection et déplacement à la souris / au doigt ------------------ */
    var glisse = false;

    function coords(e){
      var r = renderer.domElement.getBoundingClientRect();
      var p = e.touches ? e.touches[0] : e;
      souris.x = ((p.clientX - r.left) / r.width) * 2 - 1;
      souris.y = -((p.clientY - r.top) / r.height) * 2 + 1;
    }

    function clicScene(e){
      coords(e);
      rayon.setFromCamera(souris, camera);
      var touches = rayon.intersectObjects(pieces.map(function(p){ return p.mesh; }), false);
      if (touches.length){
        var m = touches[0].object;
        selection = pieces.filter(function(p){ return p.mesh === m; })[0] || null;
        glisse = true;
        surbrillance();
        if (onSelection) onSelection(selection ? selection.id : null);
      } else {
        selection = null; surbrillance();
        if (onSelection) onSelection(null);
      }
    }

    function glisser(e){
      if (!glisse || !selection) return;
      coords(e);
      rayon.setFromCamera(souris, camera);
      if (rayon.ray.intersectPlane(planSol, pointSol)){
        // Aimantation sur la demi-case de la grille : la maquette reste nette.
        selection.mesh.position.x = Math.round(Math.max(-4, Math.min(4, pointSol.x)) * 4) / 4;
        selection.mesh.position.z = Math.round(Math.max(-4, Math.min(4, pointSol.z)) * 4) / 4;
      }
      e.preventDefault();
    }
    function lacher(){ glisse = false; }

    renderer.domElement.addEventListener('mousedown', clicScene);
    renderer.domElement.addEventListener('touchstart', clicScene, {passive:true});
    // La rotation d'orbite et le déplacement d'une pièce se partagent le
    // glisser : dès qu'une pièce est saisie, elle prend la main.
    window.addEventListener('mousemove', glisser);
    renderer.domElement.addEventListener('touchmove', glisser, {passive:false});
    window.addEventListener('mouseup', lacher);
    renderer.domElement.addEventListener('touchend', lacher);

    var enPause = false;
    function boucle(){
      anim = requestAnimationFrame(boucle);
      if (enPause) return;
      renderer.render(scene, camera);
    }
    anim = requestAnimationFrame(boucle);
    function visibilite(){ enPause = document.hidden; }
    document.addEventListener('visibilitychange', visibilite);

    return {
      actif:true,
      ajouter:function(kit, x, z, rot){ var p = ajouterPiece(kit, x, z, rot); surbrillance(); return p; },
      retirer:function(id){
        for (var i=0;i<pieces.length;i++){
          if (pieces[i].id === id){
            scene.remove(pieces[i].mesh);
            pieces[i].mesh.geometry.dispose();
            pieces[i].mesh.material.dispose();
            pieces.splice(i,1);
            break;
          }
        }
        if (selection && selection.id === id) selection = null;
        surbrillance();
      },
      viderTout:function(){
        pieces.slice().forEach(function(p){ this.retirer(p.id); }, this);
      },
      selectionner:function(id){
        selection = pieces.filter(function(p){ return p.id === id; })[0] || null;
        surbrillance();
      },
      pivoter:function(){
        if (!selection) return false;
        selection.mesh.rotation.y += Math.PI/8;
        return true;
      },
      /** Liste sérialisable, rangée dans l'état de l'équipe. */
      lister:function(){
        return pieces.map(function(p){
          return { id:p.id, kit:p.kit,
                   x:+p.mesh.position.x.toFixed(2),
                   z:+p.mesh.position.z.toFixed(2),
                   rot:+p.mesh.rotation.y.toFixed(3) };
        });
      },
      /** Image PNG de la maquette, insérée dans le dossier final. */
      snapshot:function(){
        try {
          renderer.render(scene, camera);
          return renderer.domElement.toDataURL('image/png');
        } catch(e){ return ''; }
      },
      recadrer:function(){ etat.theta = 0.8; etat.phi = 1.02; etat.r = 6.2; ctrl.place(); },
      redimensionner:function(){
        if (!holder.clientWidth) return;
        camera.aspect = holder.clientWidth / holder.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(holder.clientWidth, holder.clientHeight);
      },
      detruire:function(){
        if (anim) cancelAnimationFrame(anim);
        document.removeEventListener('visibilitychange', visibilite);
        window.removeEventListener('mousemove', glisser);
        window.removeEventListener('mouseup', lacher);
        ctrl.detruire();
        renderer.dispose();
      }
    };
  }

  return { dispo:dispo, robinet:robinet, atelier:atelier };
})();
