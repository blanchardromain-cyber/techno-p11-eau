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

  /**
   * Carte d'environnement « studio » : une salle aux murs gris éclairée par
   * des panneaux lumineux, rendue une fois puis filtrée par PMREM.
   *
   * C'est ce qui donne aux pièces du kit des reflets crédibles — un liseré
   * clair sur l'arête d'une vanne en laiton, un éclat sur le plastique d'une
   * cuve — là où le simple dégradé ciel/sol rendait tout mat et délavé.
   * Reprend la disposition de RoomEnvironment (exemples three.js, licence
   * MIT), qui n'existe qu'en module ES et ne se charge donc pas ici.
   */
  function envStudio(renderer){
    if (!THREE.PMREMGenerator) return envDegrade(renderer);
    try {
      var salle = new THREE.Scene();
      var geo = new THREE.BoxGeometry();
      var murs = new THREE.MeshStandardMaterial({ side:THREE.BackSide });
      var meuble = new THREE.MeshStandardMaterial();
      var lampe = new THREE.PointLight(0xffffff, 5.0, 28, 2);
      lampe.position.set(0.418, 16.199, 0.300);
      salle.add(lampe);

      function bloc(mat, p, r, s){
        var m = new THREE.Mesh(geo, mat);
        m.position.set(p[0], p[1], p[2]);
        m.rotation.set(0, r, 0);
        m.scale.set(s[0], s[1], s[2]);
        salle.add(m);
      }
      function panneau(intensite, p, s){
        var mat = new THREE.MeshBasicMaterial();
        mat.color.setScalar(intensite);
        bloc(mat, p, 0, s);
      }
      bloc(murs,   [-0.757, 13.219,  0.717], 0,      [31.713, 28.305, 28.591]);
      bloc(meuble, [-10.906, 2.009,  1.846], -0.195, [2.328, 7.905, 4.651]);
      bloc(meuble, [-5.607, -0.754, -0.758], 0.994,  [1.970, 1.534, 3.955]);
      bloc(meuble, [ 6.167,  0.857,  7.803], 0.561,  [3.927, 6.285, 3.687]);
      bloc(meuble, [-2.017,  0.018,  6.124], 0.333,  [2.002, 4.566, 2.064]);
      bloc(meuble, [ 2.291, -0.756, -2.621], -0.286, [1.546, 1.552, 1.496]);
      bloc(meuble, [-2.193, -0.369, -5.547], 0.516,  [3.875, 3.487, 2.986]);
      panneau(50,  [-16.116, 14.37,   8.208], [0.1, 2.428, 2.739]);
      panneau(50,  [-16.109, 18.021, -8.207], [0.1, 2.425, 2.751]);
      panneau(17,  [ 14.904, 12.198, -1.832], [0.15, 4.265, 6.331]);
      panneau(43,  [ -0.462,  8.89,  14.520], [4.38, 5.441, 0.088]);
      panneau(20,  [  3.235, 11.486,-12.541], [2.5, 2.0, 0.1]);
      panneau(100, [  0.0,   20.0,    0.0  ], [1.0, 0.1, 1.0]);

      var pmrem = new THREE.PMREMGenerator(renderer);
      var cible = pmrem.fromScene(salle, 0.04);
      pmrem.dispose();
      salle.traverse(function(o){ if (o.material) o.material.dispose(); });
      geo.dispose();
      return cible.texture;
    } catch(e){
      return envDegrade(renderer);
    }
  }

  /**
   * Passe en linéaire les couleurs unies des matériaux d'un objet.
   *
   * En r150, three.js est encore en « legacyMode » : une couleur donnée en
   * hexadécimal est prise telle quelle comme valeur linéaire, alors que
   * l'image finale est encodée en sRGB. Toutes les teintes sortaient délavées
   * (le capteur rouge #C0392B s'affichait saumon). Les textures, elles, sont
   * déjà décodées correctement. Sans effet dans une version qui convertit
   * d'elle-même ; un matériau partagé n'est converti qu'une fois.
   */
  function versLineaire(racine){
    var cm = THREE.ColorManagement;
    if (cm && (cm.enabled === true || cm.legacyMode === false)) return;
    racine.traverse(function(o){
      var mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      mats.forEach(function(m){
        if (m.userData.lineaire) return;
        if (m.color) m.color.convertSRGBToLinear();
        if (m.emissive) m.emissive.convertSRGBToLinear();
        m.userData.lineaire = true;
      });
    });
  }

  /** Règle l'espace colorimétrique d'une texture dessinée, selon la version. */
  function enSRGB(tex){
    if (THREE.SRGBColorSpace && 'colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  /* ------------------------- Textures procédurales -------------------------
     Dessinées sur un canvas plutôt que chargées en image : rien à télécharger,
     donc rien à bloquer pour le filtre du réseau, et le dépôt reste léger.
     ---------------------------------------------------------------------- */

  /** Carrelage mural : un damier de faïence avec ses joints. */
  function textureCarrelage(repetitions){
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var g = c.getContext('2d');
    g.fillStyle = '#c3d7e6'; g.fillRect(0, 0, 256, 256);          // joint
    var t = 124;                                                   // carreau
    for (var y = 0; y < 2; y++){
      for (var x = 0; x < 2; x++){
        // Chaque carreau prend une nuance légèrement différente : un carrelage
        // parfaitement uniforme sonne faux.
        var n = 236 + Math.floor(Math.random() * 12);
        g.fillStyle = 'rgb(' + n + ',' + (n + 2) + ',' + (n + 4) + ')';
        g.fillRect(x * 128 + 2, y * 128 + 2, t, t);
      }
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repetitions || 6, repetitions || 6);
    if (THREE.SRGBColorSpace && 'colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  /** Plan de vasque : un grain fin, pour que la surface accroche la lumière. */
  function textureGrain(teinte){
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var g = c.getContext('2d');
    g.fillStyle = teinte; g.fillRect(0, 0, 128, 128);
    for (var i = 0; i < 2600; i++){
      g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.11).toFixed(3) + ')';
      g.fillRect(Math.random() * 128, Math.random() * 128, 1.4, 1.4);
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 3);
    if (THREE.SRGBColorSpace && 'colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    else if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  /** Fond de l'atelier : dégradé vertical, clair, sans ligne d'horizon. */
  function textureDegradeFond(){
    var c = document.createElement('canvas');
    c.width = 4; c.height = 256;
    var g = c.getContext('2d');
    var d = g.createLinearGradient(0, 0, 0, 256);
    d.addColorStop(0, '#d7e3ef');
    d.addColorStop(0.55, '#eef3f8');
    d.addColorStop(1, '#f7f9fb');
    g.fillStyle = d; g.fillRect(0, 0, 4, 256);
    return enSRGB(new THREE.CanvasTexture(c));
  }

  /**
   * Plateau de l'établi : contreplaqué clair et quadrillage au crayon.
   * Une seule image couvre tout le plateau (9,2 unités) : le quadrillage tombe
   * juste sur le pas de l'aimantation — un trait tous les demi-mètres, un
   * trait plus marqué tous les mètres.
   */
  function texturePlateau(anisotropie){
    var N = 1024, L = 9.2, px = N / L;
    var c = document.createElement('canvas');
    c.width = c.height = N;
    var g = c.getContext('2d');
    g.fillStyle = '#e8d2aa'; g.fillRect(0, 0, N, N);

    // Veinage : de longues ondulations à peine plus sombres, puis un grain fin.
    for (var i = 0; i < 70; i++){
      var y0 = Math.random() * N, amp = 3 + Math.random() * 9, per = 180 + Math.random() * 260;
      g.strokeStyle = 'rgba(150,105,55,' + (0.04 + Math.random() * 0.08).toFixed(3) + ')';
      g.lineWidth = 1 + Math.random() * 3;
      g.beginPath();
      for (var x = 0; x <= N; x += 16){
        var y = y0 + Math.sin(x / per * Math.PI * 2 + i) * amp;
        if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
    for (var k = 0; k < 9000; k++){
      g.fillStyle = 'rgba(120,85,45,' + (Math.random() * 0.06).toFixed(3) + ')';
      g.fillRect(Math.random() * N, Math.random() * N, 2, 1);
    }

    // Quadrillage, limité à la zone où les pièces peuvent être posées (±4).
    var bord = (L / 2 - 4) * px;
    for (var q = -8; q <= 8; q++){
      var p = (q * 0.5 + L / 2) * px;
      var fort = (q % 2 === 0);
      g.strokeStyle = fort ? 'rgba(70,80,95,.34)' : 'rgba(70,80,95,.17)';
      g.lineWidth = fort ? 2 : 1.3;
      g.beginPath(); g.moveTo(p, bord); g.lineTo(p, N - bord); g.stroke();
      g.beginPath(); g.moveTo(bord, p); g.lineTo(N - bord, p); g.stroke();
    }
    var tex = enSRGB(new THREE.CanvasTexture(c));
    tex.anisotropy = anisotropie || 1;
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
      pivoter:function(){}, elever:function(){}, lister:function(){ return []; },
      viderTout:function(){}, snapshot:function(){ return ''; },
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
    var plan      = new THREE.MeshStandardMaterial({ color:0x8fa3b8, metalness:0.08, roughness:0.58,
                                                     envMapIntensity:0.30, map:textureGrain('#8fa3b8') });
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
      new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.35, metalness:0.02,
                                       envMapIntensity:0.35, map:textureCarrelage(5) }),
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
    // Fond en dégradé plutôt qu'uni : la maquette se détache comme sur une
    // photo de studio. Il reste clair, la photo étant imprimée dans le dossier.
    scene.background = textureDegradeFond();
    scene.environment = envStudio(renderer);
    renderer.toneMappingExposure = 0.9;

    camera = new THREE.PerspectiveCamera(40, holder.clientWidth/holder.clientHeight, 0.1, 100);
    var cible = new THREE.Vector3(0, 0.35, 0);
    var etat = { theta:0.8, phi:1.02, r:6.2, rmin:1.6, rmax:14, auto:false };
    ctrl = orbite(renderer.domElement, camera, cible, etat);

    // La carte d'environnement éclaire déjà l'ensemble, ombres comprises : pas
    // de lumière hémisphérique en plus, elle délavait toutes les teintes (le
    // capteur rouge virait au rose). Le projecteur ne sert qu'à poser les ombres.
    var cle = new THREE.DirectionalLight(0xfff6ea, 1.0);
    cle.position.set(3.5, 6.5, 3.0);
    cle.castShadow = true;
    // 2048 : les petites pièces (goutteur, sonde, bouton) portent enfin une
    // ombre nette, qui les pose sur l'établi au lieu de les faire flotter.
    cle.shadow.mapSize.set(2048, 2048);
    cle.shadow.camera.left = -5.5; cle.shadow.camera.right = 5.5;
    cle.shadow.camera.top = 5.5;   cle.shadow.camera.bottom = -5.5;
    cle.shadow.camera.near = 1;    cle.shadow.camera.far = 18;
    cle.shadow.bias = -0.0004;
    cle.shadow.normalBias = 0.02;
    scene.add(cle);
    var contre = new THREE.DirectionalLight(0xdbe8ff, 0.25);   // contre-jour froid
    contre.position.set(-4, 3, -3.5);
    scene.add(contre);

    // L'établi : un plateau de contreplaqué, avec son quadrillage tracé au
    // crayon tous les demi-mètres — le pas de l'aimantation des pièces.
    var anis = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
    var dessus = new THREE.MeshStandardMaterial({ map:texturePlateau(anis), roughness:0.78,
                                                  metalness:0, envMapIntensity:0.6 });
    var chant = new THREE.MeshStandardMaterial({ color:0xd9bf94, roughness:0.85, metalness:0 });
    var sol = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.14, 9.2),
                             [chant, chant, dessus, chant, chant, chant]);
    sol.position.y = -0.07;
    sol.receiveShadow = true;
    versLineaire(sol);
    scene.add(sol);

    var pieces = [];                       // {mesh, kit, id}
    var selection = null;
    var rayon = new THREE.Raycaster();
    var souris = new THREE.Vector2();
    var planSol = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
    var pointSol = new THREE.Vector3();

    /* ====================== Les pièces du kit ============================
       Chaque pièce est un ASSEMBLAGE de primitives, pas une primitive seule.
       Un cylindre bleu ne dit rien à un élève ; une cuve avec ses nervures,
       son couvercle et son robinet de puisage se reconnaît sans légende, et
       c'est ce qui permet de lire une maquette d'un coup d'œil au moment de
       la projeter.

       Les modèles sont construits par le code plutôt que chargés depuis des
       fichiers : rien à télécharger, donc rien que le filtre du réseau puisse
       bloquer, et le dépôt reste léger. Les nombres de segments sont bas
       (16 à 24) pour rester fluides sur les tablettes du collège.
       ================================================================== */

    // Matériaux communs. Les créer une fois évite d'en fabriquer un par pièce
    // posée, ce qui finirait par peser sur des maquettes d'une dizaine d'objets.
    // Le plastique reçoit un vernis (clearcoat) : c'est le reflet net posé sur
    // une teinte mate qui fait lire « objet moulé » plutôt que « forme colorée ».
    var Physique = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;
    var MAT = {
      plastique: function(c){
        return new Physique({ color:c, roughness:0.46, metalness:0,
                              clearcoat:0.25, clearcoatRoughness:0.32, envMapIntensity:0.55 });
      },
      metal: function(c){
        return new THREE.MeshStandardMaterial({ color:c || 0xc5ccd4, roughness:0.26,
                                                metalness:0.95, envMapIntensity:1.0 });
      },
      verre: function(){
        return new Physique({ color:0xdcefff, roughness:0.05, metalness:0,
                              clearcoat:1, clearcoatRoughness:0.05,
                              transparent:true, opacity:0.32, envMapIntensity:1.2 });
      },
      sombre: function(){
        return new THREE.MeshStandardMaterial({ color:0x2b3440, roughness:0.5, metalness:0.2,
                                                envMapIntensity:0.5 });
      },
      ceramique: function(){
        return new Physique({ color:0xf1f4f7, roughness:0.2, metalness:0,
                              clearcoat:0.9, clearcoatRoughness:0.08, envMapIntensity:0.6 });
      },
      mat: function(c, rugosite){
        return new THREE.MeshStandardMaterial({ color:c, roughness:rugosite || 0.9, metalness:0,
                                                envMapIntensity:0.45 });
      },
      bois: function(c){
        return new THREE.MeshStandardMaterial({ color:c || 0xffffff, map:textureBois(),
                                                roughness:0.75, metalness:0, envMapIntensity:0.45 });
      },
      ecran: function(tex){
        // L'écran émet sa propre image : il reste lisible sur la photo même
        // quand la pièce est tournée à l'opposé de la lumière.
        return new THREE.MeshStandardMaterial({ color:0xffffff, map:tex, emissive:0xffffff,
                                                emissiveMap:tex, emissiveIntensity:0.75,
                                                roughness:0.25, metalness:0 });
      },
      voyant: function(c){
        return new THREE.MeshStandardMaterial({ color:c, emissive:c, emissiveIntensity:0.9,
                                                roughness:0.35 });
      }
    };

    /**
     * Boîte aux arêtes arrondies, centrée sur l'origine.
     * Une arête vive est ce qui trahit le plus vite une maquette de synthèse ;
     * un rayon de quelques millimètres suffit à accrocher la lumière comme un
     * vrai boîtier moulé.
     */
    function boite(w, h, d, r){
      r = Math.min(r === undefined ? 0.012 : r, w/2 - 0.001, h/2 - 0.001, d/2 - 0.001);
      if (r < 0.002) return new THREE.BoxGeometry(w, h, d);
      var sw = w - 2*r, sd = d - 2*r, sh = h - 2*r;
      var rr = Math.min(r * 0.8, sw/2, sd/2);
      var x = -sw/2, y = -sd/2;
      var s = new THREE.Shape();
      s.moveTo(x + rr, y);
      s.lineTo(x + sw - rr, y);   s.quadraticCurveTo(x + sw, y, x + sw, y + rr);
      s.lineTo(x + sw, y + sd - rr); s.quadraticCurveTo(x + sw, y + sd, x + sw - rr, y + sd);
      s.lineTo(x + rr, y + sd);   s.quadraticCurveTo(x, y + sd, x, y + sd - rr);
      s.lineTo(x, y + rr);        s.quadraticCurveTo(x, y, x + rr, y);
      var geo = new THREE.ExtrudeGeometry(s, { depth:Math.max(0.0001, sh), bevelEnabled:true,
        bevelThickness:r, bevelSize:r, bevelSegments:3, curveSegments:4 });
      geo.translate(0, 0, -sh/2);
      geo.rotateX(-Math.PI/2);
      return geo;
    }

    function cyl(rHaut, rBas, h, seg){
      return new THREE.CylinderGeometry(rHaut, rBas, h, seg || 24);
    }

    /* Textures des pièces : dessinées une fois, partagées par toutes les
       pièces du même type. */
    var cacheTex = {};
    function texture(cle, w, h, dessin){
      if (cacheTex[cle]) return cacheTex[cle];
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      dessin(c.getContext('2d'), w, h);
      return (cacheTex[cle] = enSRGB(new THREE.CanvasTexture(c)));
    }

    function textureBois(){
      return texture('bois', 256, 256, function(g, w, h){
        g.fillStyle = '#b7824c'; g.fillRect(0, 0, w, h);
        for (var i = 0; i < 38; i++){
          var y0 = Math.random() * h;
          g.strokeStyle = 'rgba(90,52,20,' + (0.08 + Math.random() * 0.16).toFixed(3) + ')';
          g.lineWidth = 1 + Math.random() * 2.5;
          g.beginPath();
          for (var x = 0; x <= w; x += 8){
            var y = y0 + Math.sin(x / 60 + i) * 3;
            if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
          }
          g.stroke();
        }
      });
    }

    // Cadran du compteur d'eau : les rouleaux chiffrés et l'aiguille des litres.
    function textureCadran(){
      return texture('cadran', 256, 256, function(g){
        g.fillStyle = '#f5f7fa'; g.beginPath(); g.arc(128,128,126,0,Math.PI*2); g.fill();
        g.strokeStyle = '#1e3a8a'; g.lineWidth = 3;
        for (var i = 0; i < 40; i++){
          var a = i / 40 * Math.PI * 2, l = (i % 5 === 0) ? 16 : 8;
          g.beginPath();
          g.moveTo(128 + Math.cos(a) * 118, 128 + Math.sin(a) * 118);
          g.lineTo(128 + Math.cos(a) * (118 - l), 128 + Math.sin(a) * (118 - l));
          g.stroke();
        }
        var chiffres = ['0','0','4','8','2'];
        for (var k = 0; k < 5; k++){
          g.fillStyle = k < 4 ? '#111827' : '#b91c1c';
          g.fillRect(54 + k * 30, 70, 26, 38);
          g.fillStyle = '#ffffff'; g.font = 'bold 28px sans-serif'; g.textAlign = 'center';
          g.fillText(chiffres[k], 67 + k * 30, 99);
        }
        g.fillStyle = '#1e3a8a'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center';
        g.fillText('m³', 128, 142);
        g.strokeStyle = '#dc2626'; g.lineWidth = 5;                  // aiguille
        g.beginPath(); g.moveTo(128, 190); g.lineTo(160, 168); g.stroke();
        g.fillStyle = '#111827'; g.beginPath(); g.arc(128, 190, 7, 0, Math.PI*2); g.fill();
      });
    }

    function textureLCD(cle, texte, sous, fond, encre){
      return texture(cle, 256, 128, function(g, w, h){
        g.fillStyle = fond; g.fillRect(0, 0, w, h);
        g.fillStyle = encre; g.textAlign = 'center';
        g.font = 'bold 64px monospace'; g.fillText(texte, w/2, 78);
        if (sous){ g.font = 'bold 20px sans-serif'; g.fillText(sous, w/2, 112); }
      });
    }

    // Écran du smartphone : la notification d'alerte, lisible de loin.
    function textureTelephone(){
      return texture('tel', 128, 256, function(g, w, h){
        var d = g.createLinearGradient(0, 0, 0, h);
        d.addColorStop(0, '#1e3a8a'); d.addColorStop(1, '#0f172a');
        g.fillStyle = d; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(255,255,255,.85)'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center';
        g.fillText('10:42', w/2, 22);
        g.fillStyle = '#ffffff';
        g.beginPath(); g.moveTo(14, 60); g.lineTo(w - 14, 60); g.lineTo(w - 14, 130);
        g.lineTo(14, 130); g.closePath(); g.fill();
        g.fillStyle = '#dc2626'; g.beginPath(); g.arc(30, 80, 9, 0, Math.PI*2); g.fill();
        g.fillStyle = '#111827'; g.textAlign = 'left'; g.font = 'bold 14px sans-serif';
        g.fillText('Fuite !', 46, 85);
        g.font = '12px sans-serif'; g.fillStyle = '#374151';
        g.fillText('3 L/h la nuit', 22, 108);
        g.fillText('compteur n°2', 22, 123);
        g.fillStyle = '#38bdf8';                                     // goutte
        g.beginPath(); g.moveTo(w/2, 150); g.quadraticCurveTo(w/2 + 30, 195, w/2, 215);
        g.quadraticCurveTo(w/2 - 30, 195, w/2, 150); g.fill();
      });
    }

    // Face du pommeau : les buses en couronnes.
    function texturePommeau(){
      return texture('pommeau', 128, 128, function(g){
        g.fillStyle = '#d7dde3'; g.beginPath(); g.arc(64,64,63,0,Math.PI*2); g.fill();
        g.fillStyle = '#39424c';
        [[0,1],[12,6],[24,12],[36,18],[48,24]].forEach(function(c){
          for (var i = 0; i < c[1]; i++){
            var a = i / c[1] * Math.PI * 2;
            g.beginPath(); g.arc(64 + Math.cos(a)*c[0], 64 + Math.sin(a)*c[0], 3, 0, Math.PI*2); g.fill();
          }
        });
      });
    }

    /** Texture d'un panneau photovoltaïque : la grille de cellules. */
    var texCellules = null;
    function textureCellules(){
      if (texCellules) return texCellules;
      var c = document.createElement('canvas');
      c.width = c.height = 128;
      var g = c.getContext('2d');
      g.fillStyle = '#12306b'; g.fillRect(0,0,128,128);
      g.fillStyle = '#1d4a9e';
      for (var y=0;y<4;y++){
        for (var x=0;x<4;x++){ g.fillRect(x*32+3, y*32+3, 26, 26); }
      }
      // Les fins rubans clairs des connexions entre cellules
      g.strokeStyle = 'rgba(210,230,255,.55)'; g.lineWidth = 1.4;
      for (var i=0;i<4;i++){
        g.beginPath(); g.moveTo(i*32+12, 0); g.lineTo(i*32+12, 128); g.stroke();
        g.beginPath(); g.moveTo(i*32+22, 0); g.lineTo(i*32+22, 128); g.stroke();
      }
      texCellules = new THREE.CanvasTexture(c);
      if (THREE.SRGBColorSpace && 'colorSpace' in texCellules) texCellules.colorSpace = THREE.SRGBColorSpace;
      else if (THREE.sRGBEncoding) texCellules.encoding = THREE.sRGBEncoding;
      return texCellules;
    }

    /** Raccourci : ajoute un maillage au groupe, avec position et rotation. */
    function part(groupe, geo, mat, pos, rot){
      var m = new THREE.Mesh(geo, mat);
      if (pos) m.position.set(pos[0], pos[1], pos[2]);
      if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
      m.castShadow = true;
      m.receiveShadow = true;
      groupe.add(m);
      return m;
    }

    /* --- Les huit modèles d'origine -------------------------------------- */

    function modeleCuve(couleur){
      var g = new THREE.Group();
      var corps = MAT.plastique(couleur);
      part(g, new THREE.CylinderGeometry(0.36, 0.36, 0.04, 24), MAT.sombre(), [0, 0.02, 0]);      // socle
      part(g, new THREE.CylinderGeometry(0.34, 0.34, 0.72, 24), corps, [0, 0.40, 0]);             // fût
      [0.16, 0.40, 0.64].forEach(function(h){                                                     // nervures
        part(g, new THREE.TorusGeometry(0.345, 0.018, 8, 24), corps, [0, h, 0], [Math.PI/2, 0, 0]);
      });
      part(g, new THREE.CylinderGeometry(0.30, 0.345, 0.07, 24), corps, [0, 0.79, 0]);            // épaulement
      part(g, new THREE.CylinderGeometry(0.11, 0.11, 0.05, 20), MAT.sombre(), [0, 0.84, 0]);      // trappe
      // Robinet de puisage, en bas : c'est lui qui dit « cuve » et non « fût ».
      part(g, new THREE.CylinderGeometry(0.028, 0.028, 0.14, 12), MAT.metal(0xc8a24a),
           [0, 0.14, 0.40], [Math.PI/2, 0, 0]);
      part(g, new THREE.TorusGeometry(0.045, 0.012, 8, 14), MAT.metal(0xc8a24a),
           [0, 0.21, 0.40], [0, Math.PI/2, 0]);
      return g;
    }

    function modeleTuyau(couleur){
      var g = new THREE.Group();
      var mat = MAT.plastique(couleur);
      // Léger coude : un tuyau parfaitement droit se confond avec une barre.
      var courbe = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.60, 0.07, 0),
        new THREE.Vector3(-0.18, 0.07, 0.10),
        new THREE.Vector3( 0.22, 0.07, -0.08),
        new THREE.Vector3( 0.60, 0.07, 0)
      ]);
      part(g, new THREE.TubeGeometry(courbe, 28, 0.055, 14, false), mat);
      // Raccords aux deux extrémités
      part(g, new THREE.CylinderGeometry(0.072, 0.072, 0.08, 16), MAT.metal(),
           [-0.60, 0.07, 0], [0, 0, Math.PI/2]);
      part(g, new THREE.CylinderGeometry(0.072, 0.072, 0.08, 16), MAT.metal(),
           [0.60, 0.07, 0], [0, 0, Math.PI/2]);
      return g;
    }

    function modelePompe(couleur){
      var g = new THREE.Group();
      var carter = MAT.plastique(couleur);
      part(g, new THREE.BoxGeometry(0.44, 0.05, 0.26), MAT.sombre(), [0, 0.025, 0]);          // socle
      // Volute : le corps rond caractéristique d'une pompe centrifuge
      part(g, new THREE.CylinderGeometry(0.17, 0.17, 0.13, 24), carter,
           [-0.10, 0.22, 0], [Math.PI/2, 0, 0]);
      part(g, new THREE.CylinderGeometry(0.06, 0.06, 0.13, 16), MAT.metal(),
           [-0.10, 0.22, 0.10], [Math.PI/2, 0, 0]);                                            // aspiration
      part(g, new THREE.CylinderGeometry(0.05, 0.05, 0.16, 16), MAT.metal(),
           [-0.10, 0.37, 0]);                                                                  // refoulement
      // Moteur, avec ses ailettes de refroidissement
      part(g, new THREE.CylinderGeometry(0.125, 0.125, 0.30, 20), MAT.metal(0x8f9aa6),
           [0.16, 0.22, 0], [0, 0, Math.PI/2]);
      [0.08, 0.16, 0.24].forEach(function(dx){
        part(g, new THREE.TorusGeometry(0.128, 0.011, 6, 18), MAT.metal(0x8f9aa6),
             [dx, 0.22, 0], [0, Math.PI/2, 0]);
      });
      part(g, new THREE.BoxGeometry(0.09, 0.07, 0.09), MAT.sombre(), [0.30, 0.22, 0]);         // boîte à bornes
      return g;
    }

    function modeleFiltre(couleur){
      var g = new THREE.Group();
      part(g, new THREE.CylinderGeometry(0.135, 0.135, 0.11, 20), MAT.plastique(couleur), [0, 0.45, 0]); // tête
      // Piquages d'entrée et de sortie, de part et d'autre de la tête
      part(g, new THREE.CylinderGeometry(0.045, 0.045, 0.12, 14), MAT.metal(),
           [-0.17, 0.45, 0], [0, 0, Math.PI/2]);
      part(g, new THREE.CylinderGeometry(0.045, 0.045, 0.12, 14), MAT.metal(),
           [0.17, 0.45, 0], [0, 0, Math.PI/2]);
      // Bol transparent : on doit voir la cartouche, c'est tout l'intérêt
      part(g, new THREE.CylinderGeometry(0.12, 0.105, 0.36, 24, 1, false), MAT.verre(), [0, 0.21, 0]);
      part(g, new THREE.CylinderGeometry(0.068, 0.068, 0.30, 16), MAT.plastique(0xf2efe4), [0, 0.21, 0]);
      // Plis de la cartouche, suggérés par quelques nervures verticales
      for (var i=0;i<10;i++){
        var a = i * Math.PI * 2 / 10;
        part(g, new THREE.BoxGeometry(0.012, 0.29, 0.03), MAT.plastique(0xe4dfcd),
             [Math.cos(a)*0.068, 0.21, Math.sin(a)*0.068], [0, -a, 0]);
      }
      part(g, new THREE.CylinderGeometry(0.105, 0.09, 0.04, 20), MAT.plastique(couleur), [0, 0.02, 0]);
      return g;
    }

    function modeleCapteur(couleur){
      var g = new THREE.Group();
      part(g, new THREE.BoxGeometry(0.05, 0.16, 0.05), MAT.metal(0x9aa6b2), [0, 0.08, 0]);      // support
      part(g, new THREE.BoxGeometry(0.19, 0.12, 0.07), MAT.plastique(couleur), [0, 0.22, 0]);   // boîtier
      part(g, new THREE.SphereGeometry(0.035, 16, 12), MAT.sombre(), [0, 0.22, 0.045]);         // lentille
      // Témoin lumineux : une pièce qui « vit » se reconnaît mieux
      part(g, new THREE.SphereGeometry(0.013, 10, 8),
           new THREE.MeshStandardMaterial({ color:0xff4d3d, emissive:0xb01a0d,
                                            emissiveIntensity:0.9, roughness:0.4 }),
           [0.06, 0.26, 0.038]);
      // Câble, replié derrière
      var fil = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.17, -0.03),
        new THREE.Vector3(0.04, 0.09, -0.10),
        new THREE.Vector3(-0.04, 0.03, -0.17)
      ]);
      part(g, new THREE.TubeGeometry(fil, 12, 0.012, 8, false), MAT.sombre());
      return g;
    }

    function modelePanneau(couleur){
      var g = new THREE.Group();
      var alu = MAT.metal(0xc3cbd4);
      // Châssis incliné : un panneau posé à plat ne se lit pas. Les pieds
      // montent jusqu'au cadre — hauts à l'avant, courts à l'arrière — et
      // reposent sur deux longerons : la pièce tient au sol au lieu d'y flotter.
      [-0.33, 0.33].forEach(function(x){
        part(g, new THREE.BoxGeometry(0.035, 0.35, 0.035), alu, [x, 0.175, 0.22]);
        part(g, new THREE.BoxGeometry(0.035, 0.17, 0.035), alu, [x, 0.085, -0.22]);
        part(g, new THREE.BoxGeometry(0.04, 0.03, 0.52), alu, [x, 0.015, 0]);
      });

      var plaque = new THREE.Group();
      part(plaque, new THREE.BoxGeometry(0.80, 0.035, 0.52), alu, [0, 0, 0]);
      var cellules = new THREE.MeshStandardMaterial({
        color:0xffffff, map:textureCellules(), roughness:0.22, metalness:0.15, envMapIntensity:0.9
      });
      part(plaque, new THREE.BoxGeometry(0.74, 0.012, 0.46), cellules, [0, 0.022, 0]);
      plaque.position.set(0, 0.28, 0);
      plaque.rotation.x = -0.35;
      g.add(plaque);
      // La teinte du kit reste visible sur le cadre arrière
      part(g, new THREE.BoxGeometry(0.30, 0.03, 0.05), MAT.plastique(couleur), [0, 0.20, -0.20]);
      return g;
    }

    function modeleVanne(couleur){
      var g = new THREE.Group();
      var laiton = MAT.metal(0xc9a43f);
      part(g, new THREE.SphereGeometry(0.115, 20, 14), laiton, [0, 0.13, 0]);                    // corps
      // Brides d'entrée et de sortie
      part(g, new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16), laiton,
           [-0.15, 0.13, 0], [0, 0, Math.PI/2]);
      part(g, new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16), laiton,
           [ 0.15, 0.13, 0], [0, 0, Math.PI/2]);
      part(g, new THREE.CylinderGeometry(0.075, 0.075, 0.025, 16), laiton,
           [-0.21, 0.13, 0], [0, 0, Math.PI/2]);
      part(g, new THREE.CylinderGeometry(0.075, 0.075, 0.025, 16), laiton,
           [ 0.21, 0.13, 0], [0, 0, Math.PI/2]);
      // Tige et volant : la pièce qu'on tourne, donc celle qu'on reconnaît
      part(g, new THREE.CylinderGeometry(0.018, 0.018, 0.13, 10), MAT.metal(), [0, 0.30, 0]);
      var volant = MAT.plastique(couleur);
      part(g, new THREE.TorusGeometry(0.085, 0.016, 8, 20), volant, [0, 0.36, 0], [Math.PI/2, 0, 0]);
      part(g, new THREE.BoxGeometry(0.16, 0.016, 0.02), volant, [0, 0.36, 0]);
      part(g, new THREE.BoxGeometry(0.02, 0.016, 0.16), volant, [0, 0.36, 0]);
      return g;
    }

    function modeleGoutteur(couleur){
      var g = new THREE.Group();
      part(g, new THREE.ConeGeometry(0.022, 0.13, 10), MAT.sombre(), [0, 0.065, 0],
           [Math.PI, 0, 0]);                                                                     // piquet
      part(g, new THREE.CylinderGeometry(0.052, 0.036, 0.09, 16), MAT.plastique(couleur), [0, 0.175, 0]);
      part(g, new THREE.CylinderGeometry(0.058, 0.058, 0.018, 16), MAT.sombre(), [0, 0.228, 0]);
      part(g, new THREE.CylinderGeometry(0.014, 0.014, 0.05, 10), MAT.sombre(), [0, 0.25, 0.03],
           [0.5, 0, 0]);                                                                         // embout
      // La goutte : elle nomme la pièce à elle seule
      var goutte = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 14, 12),
        new THREE.MeshStandardMaterial({ color:0x8fd4ff, roughness:0.05, metalness:0.1,
                                         transparent:true, opacity:0.75, envMapIntensity:1.1 })
      );
      goutte.scale.set(1, 1.35, 1);
      goutte.position.set(0, 0.10, 0.055);
      goutte.castShadow = true;
      g.add(goutte);
      return g;
    }

    /* --- Eau : raccords, commande de débit, comptage, collecte ----------- */

    function modeleRaccord(couleur){
      var g = new THREE.Group();
      var laiton = MAT.metal(couleur);
      part(g, cyl(0.05, 0.05, 0.34, 20), laiton, [0, 0.07, 0], [0, 0, Math.PI/2]);
      part(g, cyl(0.05, 0.05, 0.17, 20), laiton, [0, 0.07, 0.085], [Math.PI/2, 0, 0]);
      part(g, new THREE.SphereGeometry(0.058, 20, 14), laiton, [0, 0.07, 0]);
      // Écrous hexagonaux : ce sont eux qui disent « raccord » et non « tube »
      part(g, cyl(0.068, 0.068, 0.05, 6), laiton, [-0.17, 0.07, 0], [0, 0, Math.PI/2]);
      part(g, cyl(0.068, 0.068, 0.05, 6), laiton, [ 0.17, 0.07, 0], [0, 0, Math.PI/2]);
      part(g, cyl(0.068, 0.068, 0.05, 6), laiton, [0, 0.07, 0.17], [Math.PI/2, 0, 0]);
      return g;
    }

    function modeleElectrovanne(couleur){
      var g = new THREE.Group();
      var laiton = MAT.metal(0xc9a43f);
      part(g, boite(0.28, 0.12, 0.13, 0.015), laiton, [0, 0.07, 0]);
      part(g, cyl(0.045, 0.045, 0.10, 18), laiton, [-0.18, 0.07, 0], [0, 0, Math.PI/2]);
      part(g, cyl(0.045, 0.045, 0.10, 18), laiton, [ 0.18, 0.07, 0], [0, 0, Math.PI/2]);
      part(g, cyl(0.058, 0.058, 0.03, 6), laiton, [-0.215, 0.07, 0], [0, 0, Math.PI/2]);
      part(g, cyl(0.058, 0.058, 0.03, 6), laiton, [ 0.215, 0.07, 0], [0, 0, Math.PI/2]);
      part(g, cyl(0.03, 0.03, 0.06, 16), MAT.metal(), [0, 0.16, 0]);                   // tube-guide
      // La bobine : c'est l'électroaimant qui ouvre la vanne sur commande
      part(g, cyl(0.078, 0.078, 0.16, 28), MAT.plastique(couleur), [0, 0.27, 0]);
      part(g, cyl(0.05, 0.05, 0.012, 24), MAT.sombre(), [0, 0.356, 0]);
      part(g, cyl(0.018, 0.018, 0.03, 6), MAT.metal(), [0, 0.37, 0]);
      part(g, boite(0.09, 0.09, 0.05, 0.01), MAT.sombre(), [0, 0.27, 0.10]);          // connecteur
      var fil = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.25, 0.125), new THREE.Vector3(0, 0.12, 0.2),
        new THREE.Vector3(0.1, 0.02, 0.28)
      ]);
      part(g, new THREE.TubeGeometry(fil, 12, 0.012, 8, false), MAT.sombre());
      return g;
    }

    function modeleCompteur(couleur){
      var g = new THREE.Group();
      var laiton = MAT.metal(0xc9a43f);
      part(g, cyl(0.045, 0.045, 0.42, 18), laiton, [0, 0.07, 0], [0, 0, Math.PI/2]);  // passage
      part(g, cyl(0.06, 0.06, 0.035, 6), laiton, [-0.21, 0.07, 0], [0, 0, Math.PI/2]);
      part(g, cyl(0.06, 0.06, 0.035, 6), laiton, [ 0.21, 0.07, 0], [0, 0, Math.PI/2]);
      part(g, cyl(0.105, 0.11, 0.12, 28), laiton, [0, 0.10, 0]);                       // corps
      part(g, cyl(0.118, 0.118, 0.03, 32), MAT.plastique(couleur), [0, 0.175, 0]);     // bague
      var cadran = new THREE.Mesh(new THREE.CircleGeometry(0.098, 40),
        new THREE.MeshStandardMaterial({ map:textureCadran(), roughness:0.4, metalness:0 }));
      cadran.rotation.x = -Math.PI/2;
      cadran.position.set(0, 0.1905, 0);
      g.add(cadran);
      var dome = part(g, new THREE.SphereGeometry(0.104, 28, 10, 0, Math.PI*2, 0, Math.PI/2),
                      MAT.verre(), [0, 0.19, 0]);
      dome.scale.y = 0.28;
      dome.castShadow = false;
      // Flèche du sens d'écoulement, moulée sur le corps
      part(g, new THREE.ConeGeometry(0.02, 0.05, 3), MAT.plastique(0xf8fafc),
           [0.05, 0.10, 0.108], [0, 0, -Math.PI/2]);
      return g;
    }

    function modeleGouttiere(couleur){
      var g = new THREE.Group();
      var zinc = MAT.metal(couleur);
      zinc.roughness = 0.42;
      zinc.side = THREE.DoubleSide;
      var H = 0.95;
      // La gouttière : un demi-tube ouvert vers le haut
      part(g, new THREE.CylinderGeometry(0.08, 0.08, 1.1, 24, 1, true, 0, Math.PI), zinc,
           [0, H, 0], [0, 0, -Math.PI/2]);
      part(g, new THREE.CylinderGeometry(0.08, 0.08, 0.008, 24, 1, false, 0, Math.PI), zinc,
           [-0.55, H, 0], [0, 0, -Math.PI/2]);
      part(g, new THREE.CylinderGeometry(0.08, 0.08, 0.008, 24, 1, false, 0, Math.PI), zinc,
           [ 0.55, H, 0], [0, 0, -Math.PI/2]);
      part(g, cyl(0.012, 0.012, 1.1, 10), zinc, [0, H, 0.08], [0, 0, Math.PI/2]);      // ourlets
      part(g, cyl(0.012, 0.012, 1.1, 10), zinc, [0, H, -0.08], [0, 0, Math.PI/2]);
      // La descente jusqu'au sol, avec ses colliers et son dauphin
      part(g, cyl(0.05, 0.05, 0.10, 18), zinc, [0.42, H - 0.10, 0]);
      part(g, cyl(0.045, 0.045, 0.80, 18), zinc, [0.42, 0.48, 0]);
      [0.30, 0.66].forEach(function(y){
        part(g, new THREE.TorusGeometry(0.05, 0.009, 8, 20), MAT.sombre(), [0.42, y, 0], [Math.PI/2, 0, 0]);
      });
      part(g, new THREE.SphereGeometry(0.046, 16, 12), zinc, [0.42, 0.08, 0]);
      part(g, cyl(0.045, 0.045, 0.16, 18), zinc, [0.42, 0.06, 0.08], [Math.PI/2 - 0.25, 0, 0]);
      return g;
    }

    /* --- Commande : capter, programmer, afficher, alerter ---------------- */

    function modeleSonde(couleur){
      var g = new THREE.Group();
      var or = MAT.metal(0xd4a82f);
      // Deux électrodes : l'humidité du sol se mesure par le courant qui passe
      // de l'une à l'autre.
      [-0.035, 0.035].forEach(function(x){
        part(g, boite(0.028, 0.22, 0.008, 0.003), or, [x, 0.14, 0]);
        part(g, new THREE.ConeGeometry(0.014, 0.03, 4), or, [x, 0.015, 0], [Math.PI, Math.PI/4, 0]);
      });
      part(g, boite(0.15, 0.09, 0.035, 0.01), MAT.plastique(couleur), [0, 0.29, 0]);
      part(g, boite(0.04, 0.03, 0.01, 0.003), MAT.sombre(), [0, 0.30, 0.02]);
      var fil = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.33, 0), new THREE.Vector3(-0.04, 0.38, -0.05),
        new THREE.Vector3(-0.12, 0.2, -0.12), new THREE.Vector3(-0.18, 0.015, -0.16)
      ]);
      part(g, new THREE.TubeGeometry(fil, 16, 0.011, 8, false), MAT.sombre());
      return g;
    }

    function modeleCarte(couleur){
      var g = new THREE.Group();
      part(g, boite(0.40, 0.018, 0.28, 0.006), MAT.plastique(couleur), [0, 0.05, 0]);  // circuit
      [[-0.17,-0.11],[0.17,-0.11],[-0.17,0.11],[0.17,0.11]].forEach(function(p){
        part(g, cyl(0.012, 0.012, 0.042, 8), MAT.metal(), [p[0], 0.021, p[1]]);       // entretoises
      });
      part(g, boite(0.085, 0.014, 0.085, 0.003), MAT.sombre(), [0.03, 0.066, 0.02]);   // microcontrôleur
      part(g, boite(0.07, 0.04, 0.06, 0.004), MAT.metal(), [-0.18, 0.078, -0.06]);     // USB
      part(g, cyl(0.022, 0.022, 0.06, 16), MAT.sombre(), [-0.18, 0.08, 0.08], [0, 0, Math.PI/2]);
      part(g, boite(0.30, 0.028, 0.022, 0.003), MAT.sombre(), [0.03, 0.073, -0.12]);   // connecteurs
      part(g, boite(0.30, 0.028, 0.022, 0.003), MAT.sombre(), [0.03, 0.073,  0.12]);
      for (var i = 0; i < 10; i++){                                                     // broches
        part(g, boite(0.01, 0.006, 0.01, 0), MAT.metal(0xd4a82f), [-0.105 + i*0.03, 0.089, -0.12]);
        part(g, boite(0.01, 0.006, 0.01, 0), MAT.metal(0xd4a82f), [-0.105 + i*0.03, 0.089,  0.12]);
      }
      part(g, cyl(0.014, 0.014, 0.035, 14), MAT.metal(0xd9dde2), [0.14, 0.077, 0.04]); // condensateur
      part(g, new THREE.SphereGeometry(0.01, 10, 8), MAT.voyant(0x22c55e), [0.15, 0.066, -0.05]);
      part(g, cyl(0.01, 0.01, 0.01, 12), MAT.plastique(0xdc2626), [0.10, 0.064, -0.07]);
      return g;
    }

    function modeleBouton(couleur){
      var g = new THREE.Group();
      part(g, boite(0.18, 0.12, 0.18, 0.02), MAT.plastique(0xe5e7eb), [0, 0.06, 0]);
      part(g, cyl(0.07, 0.076, 0.02, 32), MAT.metal(), [0, 0.13, 0]);
      part(g, cyl(0.055, 0.055, 0.025, 32), MAT.plastique(couleur), [0, 0.15, 0]);
      var dome = part(g, new THREE.SphereGeometry(0.055, 28, 10, 0, Math.PI*2, 0, Math.PI/2),
                      MAT.plastique(couleur), [0, 0.162, 0]);
      dome.scale.y = 0.45;
      return g;
    }

    function modeleProgrammateur(couleur){
      var g = new THREE.Group();
      part(g, boite(0.20, 0.26, 0.13, 0.035), MAT.plastique(couleur), [0, 0.17, 0]);
      part(g, boite(0.16, 0.14, 0.012, 0.01), MAT.plastique(0x374151), [0, 0.19, 0.066]);
      var lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.06),
        MAT.ecran(textureLCD('prog', '06:00', 'ARROSAGE 15 min', '#b8c9a3', '#1f2d1f')));
      lcd.position.set(0, 0.215, 0.0735);
      g.add(lcd);
      part(g, cyl(0.014, 0.014, 0.012, 16), MAT.plastique(0x9ca3af), [-0.035, 0.155, 0.075], [Math.PI/2, 0, 0]);
      part(g, cyl(0.014, 0.014, 0.012, 16), MAT.plastique(0x9ca3af), [ 0.035, 0.155, 0.075], [Math.PI/2, 0, 0]);
      part(g, cyl(0.04, 0.04, 0.05, 18), MAT.sombre(), [0, 0.32, 0]);                  // arrivée
      part(g, cyl(0.056, 0.056, 0.045, 18), MAT.plastique(0x9ca3af), [0, 0.355, 0]);   // écrou
      part(g, cyl(0.028, 0.028, 0.05, 16), MAT.sombre(), [0, 0.025, 0]);               // sortie
      return g;
    }

    function modeleAfficheur(couleur){
      var g = new THREE.Group();
      part(g, cyl(0.09, 0.10, 0.02, 32), MAT.sombre(), [0, 0.01, 0]);
      part(g, boite(0.03, 0.14, 0.02, 0.006), MAT.sombre(), [0, 0.09, 0]);
      var ecran = new THREE.Group();
      part(ecran, boite(0.40, 0.25, 0.04, 0.015), MAT.plastique(couleur), [0, 0, 0]);
      var face = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.20),
        MAT.ecran(textureLCD('conso', '12,4 L', 'CETTE DOUCHE', '#0b1f14', '#4ade80')));
      face.position.z = 0.0205;
      ecran.add(face);
      ecran.position.set(0, 0.28, 0);
      ecran.rotation.x = -0.12;
      g.add(ecran);
      return g;
    }

    function modeleSmartphone(couleur){
      var g = new THREE.Group();
      part(g, boite(0.17, 0.02, 0.13, 0.008), MAT.sombre(), [0, 0.01, 0]);             // support
      part(g, boite(0.15, 0.13, 0.014, 0.005), MAT.sombre(), [0, 0.07, -0.05], [-0.45, 0, 0]);
      var tel = new THREE.Group();
      part(tel, boite(0.15, 0.30, 0.014, 0.02), MAT.plastique(couleur), [0, 0, 0]);
      var ecran = new THREE.Mesh(new THREE.PlaneGeometry(0.135, 0.28), MAT.ecran(textureTelephone()));
      ecran.position.z = 0.0072;
      tel.add(ecran);
      tel.position.set(0, 0.165, 0.005);
      tel.rotation.x = -0.35;
      g.add(tel);
      return g;
    }

    /* --- Énergie ---------------------------------------------------------- */

    function modeleBatterie(couleur){
      var g = new THREE.Group();
      part(g, boite(0.30, 0.18, 0.18, 0.015), MAT.plastique(0x2b3440), [0, 0.09, 0]);
      part(g, boite(0.304, 0.05, 0.184, 0.006), MAT.plastique(couleur), [0, 0.09, 0]); // bandeau
      part(g, boite(0.31, 0.03, 0.19, 0.01), MAT.plastique(0x374151), [0, 0.19, 0]);   // couvercle
      part(g, cyl(0.022, 0.022, 0.04, 16), MAT.metal(0xd4a82f), [-0.09, 0.225, 0]);
      part(g, cyl(0.022, 0.022, 0.04, 16), MAT.metal(0xd4a82f), [ 0.09, 0.225, 0]);
      part(g, cyl(0.032, 0.032, 0.012, 16), MAT.plastique(0xdc2626), [-0.09, 0.209, 0]);
      part(g, cyl(0.032, 0.032, 0.012, 16), MAT.plastique(0x111827), [ 0.09, 0.209, 0]);
      part(g, boite(0.04, 0.008, 0.012, 0), MAT.plastique(0xdc2626), [-0.09, 0.207, 0.06]); // +
      part(g, boite(0.012, 0.008, 0.04, 0), MAT.plastique(0xdc2626), [-0.09, 0.207, 0.06]);
      part(g, boite(0.04, 0.008, 0.012, 0), MAT.plastique(0xf8fafc), [ 0.09, 0.207, 0.06]); // −
      return g;
    }

    function modeleCable(couleur){
      var g = new THREE.Group();
      function trace(dz){
        return new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.5, 0.03, dz), new THREE.Vector3(-0.15, 0.03, 0.12 + dz),
          new THREE.Vector3(0.2, 0.03, -0.1 + dz), new THREE.Vector3(0.5, 0.03, dz)
        ]);
      }
      part(g, new THREE.TubeGeometry(trace(-0.014), 32, 0.014, 10, false), MAT.plastique(couleur));
      part(g, new THREE.TubeGeometry(trace( 0.014), 32, 0.014, 10, false), MAT.plastique(0x1f2328));
      part(g, boite(0.06, 0.045, 0.07, 0.008), MAT.sombre(), [-0.52, 0.03, 0]);
      part(g, boite(0.06, 0.045, 0.07, 0.008), MAT.sombre(), [ 0.52, 0.03, 0]);
      return g;
    }

    /* --- Équipements du collège ------------------------------------------ */

    function modeleWC(){
      var g = new THREE.Group();
      var cer = MAT.ceramique();
      part(g, cyl(0.13, 0.17, 0.34, 32), cer, [0, 0.17, 0.03]).scale.z = 1.3;          // pied
      part(g, cyl(0.22, 0.15, 0.12, 40), cer, [0, 0.40, 0.05]).scale.z = 1.3;          // cuvette
      var eau = new THREE.Mesh(new THREE.CircleGeometry(0.17, 36), MAT.mat(0x9fd3ee, 0.1));
      eau.rotation.x = -Math.PI/2; eau.scale.y = 1.3;
      eau.position.set(0, 0.455, 0.05);
      g.add(eau);
      part(g, new THREE.TorusGeometry(0.185, 0.03, 12, 40), cer,
           [0, 0.475, 0.05], [Math.PI/2, 0, 0]).scale.y = 1.3;                         // abattant
      part(g, cyl(0.2, 0.2, 0.02, 40), cer, [0, 0.74, -0.19], [Math.PI/2 + 0.12, 0, 0]).scale.z = 1.3;
      part(g, boite(0.30, 0.10, 0.14, 0.03), cer, [0, 0.50, -0.20]);
      part(g, boite(0.44, 0.34, 0.17, 0.035), cer, [0, 0.67, -0.30]);                // réservoir
      // Double commande de chasse : la petite touche pour trois litres, la
      // grande pour six. C'est la pièce qui porte l'idée d'économie.
      part(g, cyl(0.05, 0.05, 0.015, 28), MAT.metal(), [-0.045, 0.845, -0.30]);
      part(g, cyl(0.032, 0.032, 0.015, 28), MAT.metal(), [ 0.055, 0.845, -0.30]);
      part(g, cyl(0.012, 0.012, 0.36, 10), MAT.metal(), [0.17, 0.30, -0.37]);          // arrivée d'eau
      return g;
    }

    function modeleLavabo(){
      var g = new THREE.Group();
      var cer = MAT.ceramique();
      part(g, cyl(0.075, 0.11, 0.62, 32), cer, [0, 0.31, -0.02]).scale.z = 0.8;        // colonne
      var profil = [[0,0],[0.12,0],[0.2,0.03],[0.26,0.09],[0.285,0.14],[0.29,0.155],
                    [0.275,0.155],[0.25,0.125],[0.18,0.065],[0.09,0.04],[0,0.04]]
                    .map(function(p){ return new THREE.Vector2(p[0], p[1]); });
      var vasque = new THREE.Mesh(new THREE.LatheGeometry(profil, 40), cer);
      vasque.material.side = THREE.DoubleSide;
      vasque.position.y = 0.60;
      vasque.scale.z = 0.78;
      vasque.castShadow = vasque.receiveShadow = true;
      g.add(vasque);
      var bonde = new THREE.Mesh(new THREE.CircleGeometry(0.025, 24), MAT.metal());
      bonde.rotation.x = -Math.PI/2; bonde.position.y = 0.642;
      g.add(bonde);
      // Plage arrière : le mitigeur y est posé, il ne flotte plus derrière la vasque.
      part(g, boite(0.36, 0.035, 0.13, 0.012), cer, [0, 0.74, -0.215]);
      var chrome = MAT.metal(0xe3e8ee);
      part(g, cyl(0.026, 0.03, 0.03, 20), chrome, [0, 0.772, -0.21]);                 // mitigeur
      part(g, cyl(0.022, 0.022, 0.13, 20), chrome, [0, 0.84, -0.21]);
      var bec = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.89, -0.21), new THREE.Vector3(0, 0.925, -0.16),
        new THREE.Vector3(0, 0.88, -0.10)
      ]);
      part(g, new THREE.TubeGeometry(bec, 16, 0.013, 12, false), chrome);
      part(g, boite(0.016, 0.016, 0.09, 0.005), chrome, [0, 0.915, -0.245], [0.45, 0, 0]);
      return g;
    }

    function modeleDouche(couleur){
      var g = new THREE.Group();
      var chrome = MAT.metal(0xe3e8ee);
      part(g, cyl(0.10, 0.11, 0.02, 32), chrome, [0, 0.01, 0]);
      part(g, cyl(0.018, 0.018, 1.05, 16), chrome, [0, 0.54, 0]);                     // barre
      part(g, boite(0.22, 0.07, 0.07, 0.02), chrome, [0, 0.45, 0.04]);                // mitigeur
      part(g, cyl(0.03, 0.03, 0.035, 20), MAT.plastique(couleur), [-0.08, 0.45, 0.085], [Math.PI/2, 0, 0]);
      part(g, cyl(0.03, 0.03, 0.035, 20), MAT.plastique(couleur), [ 0.08, 0.45, 0.085], [Math.PI/2, 0, 0]);
      part(g, cyl(0.006, 0.006, 0.02, 8), MAT.plastique(0x2563eb), [-0.08, 0.475, 0.1]);
      part(g, cyl(0.006, 0.006, 0.02, 8), MAT.plastique(0xdc2626), [ 0.08, 0.475, 0.1]);
      var bras = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.05, 0), new THREE.Vector3(0, 1.11, 0.08), new THREE.Vector3(0, 1.1, 0.22)
      ]);
      part(g, new THREE.TubeGeometry(bras, 16, 0.016, 12, false), chrome);
      var tete = new THREE.Group();
      part(tete, cyl(0.13, 0.13, 0.025, 48), chrome, [0, 0, 0]);
      var buses = new THREE.Mesh(new THREE.CircleGeometry(0.12, 40),
        new THREE.MeshStandardMaterial({ map:texturePommeau(), roughness:0.35, metalness:0.6 }));
      buses.rotation.x = Math.PI/2;
      buses.position.y = -0.0135;
      tete.add(buses);
      tete.position.set(0, 1.08, 0.3);
      tete.rotation.x = 0.18;
      g.add(tete);
      return g;
    }

    function modeleJardiniere(couleur){
      var g = new THREE.Group();
      var planche = MAT.bois(0xffffff);
      var poteau = MAT.bois(0xb89a7a);
      part(g, boite(0.90, 0.24, 0.03, 0.006), planche, [0, 0.12, 0.205]);
      part(g, boite(0.90, 0.24, 0.03, 0.006), planche, [0, 0.12, -0.205]);
      part(g, boite(0.03, 0.24, 0.38, 0.006), planche, [-0.435, 0.12, 0]);
      part(g, boite(0.03, 0.24, 0.38, 0.006), planche, [ 0.435, 0.12, 0]);
      [[-0.44,-0.21],[0.44,-0.21],[-0.44,0.21],[0.44,0.21]].forEach(function(p){
        part(g, boite(0.05, 0.27, 0.05, 0.006), poteau, [p[0], 0.135, p[1]]);
      });
      part(g, boite(0.84, 0.04, 0.38, 0.004), MAT.mat(0x5a3a22, 1), [0, 0.21, 0]);    // terre
      var vert = [0x4d9a3a, 0x5fae45, 0x3f8a30];
      [-0.27, 0, 0.27].forEach(function(x, i){                                          // salades
        var s = part(g, new THREE.SphereGeometry(0.085, 16, 12), MAT.mat(vert[i], 0.6), [x, 0.26, -0.07]);
        s.scale.y = 0.6;
      });
      [-0.3, -0.1, 0.1, 0.3].forEach(function(x){                                       // semis
        part(g, new THREE.ConeGeometry(0.02, 0.09, 6), MAT.mat(0x6cbf4a, 0.6), [x, 0.275, 0.1]);
      });
      return g;
    }

    function modeleCaniveau(couleur){
      var g = new THREE.Group();
      part(g, boite(1.0, 0.10, 0.2, 0.01), MAT.mat(0xb9b5ae, 0.95), [0, 0.05, 0]);   // béton
      part(g, boite(0.96, 0.01, 0.13, 0), MAT.mat(0x1f2328, 1), [0, 0.1, 0]);         // fente
      var fonte = MAT.metal(couleur);
      fonte.roughness = 0.55;
      part(g, boite(0.96, 0.012, 0.012, 0), fonte, [0, 0.106, 0.065]);
      part(g, boite(0.96, 0.012, 0.012, 0), fonte, [0, 0.106, -0.065]);
      for (var i = 0; i < 20; i++){
        part(g, boite(0.014, 0.012, 0.13, 0), fonte, [-0.45 + i * 0.0474, 0.106, 0]);
      }
      return g;
    }

    function modelePaves(couleur){
      var g = new THREE.Group();
      // Les joints engazonnés laissent l'eau s'infiltrer sur place : ils sont
      // la raison d'être de la pièce, d'où ce vert bien visible.
      part(g, boite(0.74, 0.03, 0.74, 0.006), MAT.mat(0x5f9a3c, 0.95), [0, 0.015, 0]);
      var teintes = [couleur, 0x9c958f, 0xb3ada7];
      for (var i = 0; i < 4; i++){
        for (var j = 0; j < 4; j++){
          part(g, boite(0.15, 0.06, 0.15, 0.012), MAT.mat(teintes[(i + j*2) % 3], 0.9),
               [-0.27 + i * 0.18, 0.045, -0.27 + j * 0.18]);
        }
      }
      return g;
    }

    var MODELES = {
      cuve:modeleCuve, tuyau:modeleTuyau, raccord:modeleRaccord, pompe:modelePompe,
      filtre:modeleFiltre, vanne:modeleVanne, electrovanne:modeleElectrovanne,
      compteur:modeleCompteur, gouttiere:modeleGouttiere, goutteur:modeleGoutteur,
      capteur:modeleCapteur, sonde:modeleSonde, carte:modeleCarte, bouton:modeleBouton,
      programmateur:modeleProgrammateur, afficheur:modeleAfficheur, smartphone:modeleSmartphone,
      panneau:modelePanneau, batterie:modeleBatterie, cable:modeleCable,
      wc:modeleWC, lavabo:modeleLavabo, douche:modeleDouche, jardiniere:modeleJardiniere,
      caniveau:modeleCaniveau, paves:modelePaves
    };

    /**
     * Construit la pièce demandée, calée sur l'établi.
     * Chaque modèle est dessiné en posant son point bas à y = 0 ; on mesure
     * malgré tout la boîte englobante, pour qu'un modèle retouché plus tard ne
     * se retrouve pas enterré ou flottant.
     */
    function construirePiece(kit){
      var fabrique = MODELES[kit.id];
      var g = fabrique ? fabrique(kit.couleur) : new THREE.Group();
      if (!fabrique){
        part(g, new THREE.BoxGeometry(0.25, 0.25, 0.25), MAT.plastique(kit.couleur), [0, 0.125, 0]);
      }
      versLineaire(g);
      var boite = new THREE.Box3().setFromObject(g);
      g.userData.pose = -boite.min.y;
      return g;
    }

    var PAS_ELEVATION = 0.15;

    function ajouterPiece(kit, x, z, rot, elev){
      var g = construirePiece(kit);
      g.rotation.y = rot || 0;
      g.userData.elev = Math.max(0, elev || 0);
      g.position.set(x || 0, g.userData.pose + g.userData.elev, z || 0);
      g.userData.kit = kit.id;
      scene.add(g);
      var p = { mesh:g, kit:kit.id, id:'p' + Date.now() + Math.floor(Math.random()*1000) };
      pieces.push(p);
      return p;
    }

    /** Monte ou descend la pièce sélectionnée d'un cran. */
    function elever(sens){
      if (!selection) return false;
      var g = selection.mesh;
      g.userData.elev = Math.max(0, Math.min(3, g.userData.elev + sens * PAS_ELEVATION));
      g.position.y = g.userData.pose + g.userData.elev;
      return true;
    }

    /**
     * Met en évidence la pièce sélectionnée.
     * Une pièce étant un assemblage, la surbrillance parcourt ses maillages.
     * Les matériaux étant partagés entre pièces de même type, on ne peut pas
     * teinter le matériau : on pose un contour lumineux sur le groupe entier.
     */
    var halo = null;
    function surbrillance(){
      if (halo){ scene.remove(halo); halo = null; }
      if (!selection) return;
      var boite = new THREE.Box3().setFromObject(selection.mesh);
      var taille = boite.getSize(new THREE.Vector3());
      var centre = boite.getCenter(new THREE.Vector3());
      halo = new THREE.Box3Helper(
        new THREE.Box3(
          centre.clone().sub(taille.clone().multiplyScalar(0.58)),
          centre.clone().add(taille.clone().multiplyScalar(0.58))
        ),
        new THREE.Color(0x0EA5E9)
      );
      scene.add(halo);
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
      // Une pièce est un assemblage : le rayon touche l'un de ses maillages,
      // et il faut remonter jusqu'au groupe pour savoir laquelle a été visée.
      var touches = rayon.intersectObjects(pieces.map(function(p){ return p.mesh; }), true);
      if (touches.length){
        var o = touches[0].object;
        while (o && !o.userData.kit) o = o.parent;
        selection = pieces.filter(function(p){ return p.mesh === o; })[0] || null;
        glisse = !!selection;
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

    /**
     * Vignettes du kit : chaque pièce photographiée seule, sous la même
     * lumière que l'établi. Le bouton du kit montre ainsi la pièce que l'élève
     * va réellement poser, et non un pictogramme qui lui ressemble plus ou
     * moins. Un second contexte WebGL, minuscule, est ouvert le temps de ces
     * prises de vue puis refermé.
     */
    var vignettesCache = null;
    function vignettes(kits, taille){
      if (vignettesCache) return vignettesCache;
      vignettesCache = {};
      var r2;
      try {
        r2 = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
      } catch(e){ return vignettesCache; }
      r2.setPixelRatio(1);
      r2.setSize(taille || 160, taille || 160, false);
      if (THREE.ACESFilmicToneMapping){ r2.toneMapping = THREE.ACESFilmicToneMapping; r2.toneMappingExposure = 0.95; }
      if ('outputColorSpace' in r2 && THREE.SRGBColorSpace) r2.outputColorSpace = THREE.SRGBColorSpace;
      else if ('outputEncoding' in r2 && THREE.sRGBEncoding) r2.outputEncoding = THREE.sRGBEncoding;

      var studio = new THREE.Scene();
      studio.environment = envStudio(r2);
      var lum = new THREE.DirectionalLight(0xfff6ea, 1.0);
      lum.position.set(3, 6, 4);
      studio.add(lum);
      var cam = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
      var dir = new THREE.Vector3(0.9, 0.75, 1.25).normalize();
      var demiAngle = cam.fov * Math.PI / 360;

      kits.forEach(function(kit){
        var g = construirePiece(kit);
        studio.add(g);
        var sphere = new THREE.Box3().setFromObject(g).getBoundingSphere(new THREE.Sphere());
        cam.position.copy(sphere.center).addScaledVector(dir, sphere.radius / Math.sin(demiAngle) * 1.02);
        cam.lookAt(sphere.center);
        r2.render(studio, cam);
        vignettesCache[kit.id] = r2.domElement.toDataURL('image/png');
        studio.remove(g);
        g.traverse(function(o){
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
      });
      r2.dispose();
      if (r2.forceContextLoss) r2.forceContextLoss();
      return vignettesCache;
    }

    /** Cadre la vue sur l'ensemble des pièces posées (ou sur l'établi vide). */
    function recadrer(){
      etat.theta = 0.8; etat.phi = 1.02;
      if (!pieces.length){
        cible.set(0, 0.35, 0);
        etat.r = 6.2;
      } else {
        var b = new THREE.Box3();
        pieces.forEach(function(p){ b.expandByObject(p.mesh); });
        b.getCenter(cible);
        // Une boîte ou une sphère englobant toute la maquette surestime une
        // maquette étalée : ses coins hauts tombent dans le vide. On mesure
        // plutôt où tombent à l'écran les coins de CHAQUE pièce, et on ajuste
        // la distance jusqu'à ce qu'ils occupent 90 % du cadre.
        var coins = [];
        pieces.forEach(function(p){
          var bp = new THREE.Box3().setFromObject(p.mesh);
          for (var i = 0; i < 8; i++){
            coins.push(new THREE.Vector3(i & 1 ? bp.max.x : bp.min.x,
                                         i & 2 ? bp.max.y : bp.min.y,
                                         i & 4 ? bp.max.z : bp.min.z));
          }
        });
        etat.r = 6;
        for (var n = 0; n < 4; n++){
          ctrl.place();
          camera.updateMatrixWorld();
          var m = 0.01;
          coins.forEach(function(c){
            var v = c.clone().project(camera);
            m = Math.max(m, Math.abs(v.x), Math.abs(v.y));
          });
          etat.r = Math.max(etat.rmin, Math.min(etat.rmax, etat.r * m / 0.9));
        }
      }
      ctrl.place();
    }

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
      ajouter:function(kit, x, z, rot, elev){
        var p = ajouterPiece(kit, x, z, rot, elev); surbrillance(); return p;
      },
      elever:elever,
      retirer:function(id){
        for (var i=0;i<pieces.length;i++){
          if (pieces[i].id === id){
            scene.remove(pieces[i].mesh);
            // Une pièce compte plusieurs maillages : on libère chacun.
            // Les matériaux sont partagés entre pièces de même type, ils ne
            // sont donc pas détruits ici.
            pieces[i].mesh.traverse(function(o){
              if (o.geometry) o.geometry.dispose();
            });
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
                   elev:+(p.mesh.userData.elev || 0).toFixed(2),
                   rot:+p.mesh.rotation.y.toFixed(3) };
        });
      },
      /** Image JPEG de la maquette, insérée dans le dossier final. */
      snapshot:function(){
        try {
          // Le cadre de sélection ne doit pas figurer sur la photo remise au
          // professeur ni sur celle projetée en classe.
          var visible = halo && halo.visible;
          if (halo) halo.visible = false;
          renderer.render(scene, camera);
          // JPEG et non PNG : le grain du plateau rendait l'image dix fois plus
          // lourde (400 Ko contre 45). Or la photo est rangée dans le stockage
          // du navigateur, partagé par toutes les équipes du poste : plein, il
          // refuse en silence d'enregistrer le travail suivant. Le fond étant
          // opaque, le JPEG ne perd rien d'utile.
          var img = renderer.domElement.toDataURL('image/jpeg', 0.88);
          if (halo) halo.visible = visible;
          return img;
        } catch(e){ return ''; }
      },
      recadrer:recadrer,
      vignettes:vignettes,
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
