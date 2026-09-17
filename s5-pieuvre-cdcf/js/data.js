/* ============================================================================
   P11 · Séance 5 — Contenus pédagogiques
   ----------------------------------------------------------------------------
   Tout ce qui relève du COURS est rassemblé ici : éléments du milieu extérieur,
   fonctions, critères et niveaux attendus, barème, textes de la narration.
   Le reste du code (core, modules, évaluation) ne contient aucune connaissance
   métier : pour modifier l'activité d'une année sur l'autre, ce fichier suffit.

   Les valeurs numériques des niveaux sont celles de la fiche papier
   « P11 - S5 Fiche élève - Pieuvre et cahier des charges », complétées par des
   plages de tolérance : un élève qui écrit 6 L/min au lieu de 5 L/min n'a pas
   tort, il a choisi un autre robinet du commerce.
   ========================================================================== */

var P11DATA = (function(){
  'use strict';

  /* ---------------------------------------------------------------------
     1. L'objet technique de référence : le robinet automatique
        (déjà étudié en séance 3 avec la bête à cornes)
     --------------------------------------------------------------------- */

  // Éléments du Milieu Extérieur.
  //   `angle` : position sur le cercle de la pieuvre, en degrés, 0 = en haut,
  //             sens horaire. Les sept éléments sont régulièrement répartis.
  //             module1.js convertit cet angle en pixels d'après la taille
  //             réelle du plateau et des pastilles : une position figée en
  //             pourcentages chevauchait l'objet central sur téléphone.
  //   `court` : libellé de repli quand le plateau est étroit.
  var EME = [
    { id:'util',   nom:"L'utilisateur",    court:"Utilisateur", ico:'🧍', angle:0,
      desc:"La personne qui vient se laver les mains." },
    { id:'eau',    nom:"L'eau du réseau",  court:"L'eau",       ico:'💧', angle:51,
      desc:"L'eau arrive par la canalisation du collège." },
    { id:'mains',  nom:"Les mains",        court:"Les mains",   ico:'🤲', angle:103,
      desc:"Ce que le capteur doit détecter sous le bec." },
    { id:'energie',nom:"L'énergie",        court:"Énergie",     ico:'🔋', angle:154,
      desc:"Pile ou transformateur : le capteur ne marche pas tout seul." },
    { id:'lavabo', nom:"Le lavabo",        court:"Lavabo",      ico:'🚿', angle:206,
      desc:"Le support sur lequel le robinet est fixé." },
    { id:'humide', nom:"Le milieu humide", court:"Humidité",    ico:'💦', angle:257,
      desc:"Projections, vapeur, produits de nettoyage." },
    { id:'budget', nom:"Le budget",        court:"Budget",      ico:'💶', angle:309,
      desc:"La somme que le collège peut dépenser." }
  ];

  /* Les six fonctions de la fiche papier, à typer FP ou FC.
     `via` : les EME reliés. Une FP en relie DEUX (le trait passe à travers
     l'objet) ; une FC en relie UN SEUL à l'objet. C'est ce critère, et non le
     sens de la phrase, qui permet de trancher — d'où le champ `pourquoi`. */
  var FONCTIONS = [
    { id:'f1', texte:"Permettre à l'utilisateur de se laver les mains avec de l'eau",
      type:'FP', rep:'FP1', via:['util','eau'],
      pourquoi:"Cette fonction met en relation DEUX éléments du milieu extérieur — l'utilisateur et l'eau — en passant par le robinet. C'est la raison d'être de l'objet : c'est la fonction principale." },

    { id:'f2', texte:"Détecter la présence des mains",
      type:'FC', rep:'FC1', via:['mains'],
      pourquoi:"Le robinet est relié à UN seul élément, les mains. L'objet doit s'adapter à cet élément : c'est une contrainte." },

    { id:'f3', texte:"Résister à l'environnement humide",
      type:'FC', rep:'FC2', via:['humide'],
      pourquoi:"L'objet subit l'humidité de la salle d'eau : il doit s'y adapter. Un seul élément relié, donc une fonction contrainte." },

    { id:'f4', texte:"Être alimenté en énergie",
      type:'FC', rep:'FC4', via:['energie'],
      pourquoi:"Le robinet dépend de l'énergie pour fonctionner. Un seul élément relié : contrainte." },

    { id:'f5', texte:"Se fixer sur le lavabo",
      type:'FC', rep:'FC5', via:['lavabo'],
      pourquoi:"L'objet doit s'adapter au lavabo existant (perçage, diamètre). Un seul élément relié : contrainte." },

    { id:'f6', texte:"Respecter le budget",
      type:'FC', rep:'FC6', via:['budget'],
      pourquoi:"Le budget est imposé au concepteur, il ne dépend pas de l'usage. Un seul élément relié : contrainte." }
  ];

  /* Points chauds de la scène 3D : chacun désigne un EME visible sur la maquette.
     `pos` est la position dans la scène Three.js (unités de la scène). */
  var HOTSPOTS = [
    { id:'mains',   pos:[0, 0.68, 0.30], titre:"Les mains",
      texte:"Le capteur infrarouge vise cette zone. Quand il y détecte quelque chose à environ 10 cm, il ouvre l'électrovanne." },
    { id:'eau',     pos:[0, 1.34, -0.22], titre:"L'eau du réseau",
      texte:"L'eau arrive sous pression par la canalisation, traverse le corps du robinet et sort par le bec." },
    { id:'energie', pos:[0.72, 0.34, -0.50], titre:"L'énergie",
      texte:"Le boîtier de pile alimente le capteur et l'électrovanne. Sans énergie, le robinet reste fermé." },
    { id:'lavabo',  pos:[0.95, 0.12, 0.34], titre:"Le lavabo",
      texte:"Le robinet se visse dans le perçage du plan de vasque : son diamètre doit correspondre." },
    { id:'humide',  pos:[-0.66, 0.44, 0.30], titre:"Le milieu humide",
      texte:"Projections et vapeur attaquent l'électronique : le boîtier doit être étanche (indice IP)." }
  ];

  /* ---------------------------------------------------------------------
     2. Le cahier des charges fonctionnel du robinet automatique
        (les quatre lignes de la fiche papier)

     Chaque ligne décrit :
       critere      : les mots-clés acceptés pour le critère
       critereAttendu : la formulation de référence affichée en corrigé
       unites       : les unités proposées dans la liste déroulante
       uniteOk      : l'unité (ou les unités) correcte(s)
       plage        : [min, max] de valeurs acceptées comme plausibles
       niveauAttendu: le niveau de référence affiché en corrigé
     --------------------------------------------------------------------- */
  var CDCF_ROBINET = {
    id:'robinet',
    nom:"Le robinet automatique",
    emoji:'🚰',
    resume:"L'objet technique étudié depuis la séance 3. Reprends-le pour consolider.",
    contexte:"Le collège remplace les robinets des sanitaires par des robinets à détection, pour arrêter le gaspillage aux récréations.",
    lignes:[
      { rep:'FP1',
        fonction:"Distribuer de l'eau pour se laver les mains",
        critere:['debit','flux','quantite d eau par minute','litre par minute'],
        critereAttendu:"Le débit",
        unites:['L/min','L','cm','s','€','—'], uniteOk:['L/min'],
        plage:[3,8], niveauAttendu:"environ 5 L/min",
        aide:"De quoi a-t-on besoin pour dire si l'eau coule assez vite ? Regarde ce qui s'écoule en une minute.",
        commentaire:"Un robinet de lavabo courant débite 4 à 6 L/min. En dessous de 3 L/min, on se lave mal les mains ; au-dessus de 8 L/min, on gaspille." },

      { rep:'FC1',
        fonction:"Détecter la présence des mains",
        critere:['distance','portee','eloignement','distance de detection'],
        critereAttendu:"La distance de détection",
        unites:['cm','mm','m','s','L/min','—'], uniteOk:['cm'],
        plage:[5,20], niveauAttendu:"environ 10 cm",
        aide:"Le capteur ne voit pas à l'infini. Quelle grandeur mesure-t-on entre les mains et le capteur ?",
        commentaire:"Réglé trop court (< 5 cm), l'élève ne déclenche rien ; trop long (> 20 cm), le robinet coule quand quelqu'un passe devant." },

      { rep:'FC2',
        fonction:"Résister à l'environnement humide",
        critere:['indice ip','ip','indice de protection','etancheite','protection'],
        critereAttendu:"L'indice de protection (IP)",
        unites:['IP','—','cm','s'], uniteOk:['IP'],
        // L'indice IP se contrôle par la fonction dédiée `verifIP`, pas par une plage.
        special:'ip', niveauAttendu:"IP65 (au minimum IP44)",
        aide:"Tu as vu cette norme à la séance 4 : deux chiffres, le premier pour les poussières, le second pour l'eau.",
        commentaire:"Le second chiffre doit valoir au moins 4 (projections d'eau). IP65 = étanche aux poussières et aux jets." },

      { rep:'FC3',
        fonction:"Limiter la consommation d'eau",
        critere:['volume par lavage','volume','temporisation','duree','temps d ecoulement','consommation'],
        critereAttendu:"Le volume d'eau par lavage (ou la durée de temporisation)",
        unites:['L','s','L/min','cm','—'], uniteOk:['L','s'],
        // Deux réponses correctes possibles : un volume en litres ou une durée en secondes.
        plageParUnite:{ 'L':[0.2,1], 's':[3,15] },
        niveauAttendu:"au maximum 0,5 L par lavage — ou une temporisation d'environ 6 s",
        aide:"Deux réponses sont possibles : ce qui sort à chaque lavage, ou le temps pendant lequel l'eau coule.",
        commentaire:"0,5 L par lavage contre 2 L avec un robinet classique laissé ouvert : c'est là que se fait l'économie." }
    ]
  };

  /* ---------------------------------------------------------------------
     3. Les autres objets techniques proposés au module 2
        Tous tournent autour de l'eau comme ressource à préserver.
     --------------------------------------------------------------------- */
  var CDCF_CUVE = {
    id:'cuve',
    nom:"Le récupérateur d'eau de pluie",
    emoji:'🛢️',
    resume:"Une cuve raccordée à la gouttière du collège pour arroser le potager sans eau potable.",
    contexte:"Le collège arrose son potager pédagogique avec l'eau du robinet. Le conseil de vie collégienne propose d'installer une cuve de récupération sous la gouttière du préau.",
    lignes:[
      { rep:'FP1', fonction:"Permettre aux élèves d'arroser le potager avec l'eau de pluie",
        critere:['volume disponible','volume','capacite','reserve','quantite'],
        critereAttendu:"Le volume d'eau disponible",
        unites:['L','m³','cm','€','—'], uniteOk:['L'],
        plage:[200,2000], niveauAttendu:"au moins 500 L",
        aide:"Combien d'eau doit-on pouvoir prendre dans la cuve entre deux pluies ?",
        commentaire:"500 L couvrent environ deux semaines d'arrosage d'un potager de 20 m² en été." },

      { rep:'FC1', fonction:"Retenir les feuilles et les débris de la gouttière",
        critere:['finesse','filtration','taille des mailles','maille','filtre','diametre des trous'],
        critereAttendu:"La finesse de filtration (taille des mailles)",
        unites:['mm','cm','L','—'], uniteOk:['mm'],
        plage:[0.2,5], niveauAttendu:"mailles de 1 mm au maximum",
        aide:"Le filtre doit laisser passer l'eau mais arrêter les feuilles du toit. Quelle grandeur décrit ses trous ?",
        commentaire:"Au-delà de 5 mm, les aiguilles de pin passent et la cuve s'encrasse." },

      { rep:'FC2', fonction:"Résister au gel et au soleil toute l'année",
        critere:['temperature','plage de temperature','resistance au gel','temperature de service'],
        critereAttendu:"La plage de température supportée",
        unites:['°C','L','ans','—'], uniteOk:['°C'],
        plage:[-20,60], niveauAttendu:"de −10 °C à +50 °C sans se fissurer",
        aide:"En Vendée, il gèle l'hiver et la cuve chauffe l'été. Quelle grandeur physique varie ?",
        commentaire:"Un plastique non traité anti-UV devient cassant en deux étés." },

      { rep:'FC3', fonction:"Se raccorder à la descente de gouttière existante",
        critere:['diametre','diametre de la descente','section','dimension du raccord'],
        critereAttendu:"Le diamètre de la descente de gouttière",
        unites:['mm','cm','L','—'], uniteOk:['mm','cm'],
        plageParUnite:{ 'mm':[60,120], 'cm':[6,12] },
        niveauAttendu:"80 mm (diamètre courant des descentes)",
        aide:"On ne change pas la gouttière du collège : c'est la cuve qui doit s'y adapter. Quelle dimension faut-il connaître ?",
        commentaire:"80 et 100 mm sont les deux diamètres normalisés que l'on rencontre sur un bâtiment public." }
    ]
  };

  var CDCF_GOUTTE = {
    id:'goutte',
    nom:"L'arrosage goutte-à-goutte",
    emoji:'🌱',
    resume:"Un réseau de tuyaux percés qui dose l'eau au pied de chaque plante du potager.",
    contexte:"Arrosé à l'arrosoir, le potager du collège reçoit trop d'eau d'un coup et rien pendant les vacances. Un arrosage goutte-à-goutte automatique apporterait juste ce qu'il faut.",
    lignes:[
      { rep:'FP1', fonction:"Permettre au jardinier d'apporter l'eau au pied des plantes",
        critere:['debit par goutteur','debit','quantite par plante','apport'],
        critereAttendu:"Le débit de chaque goutteur",
        unites:['L/h','L/min','L','s','—'], uniteOk:['L/h'],
        plage:[1,8], niveauAttendu:"2 à 4 L/h par goutteur",
        aide:"Un goutteur ne fait pas couler un jet : il laisse tomber des gouttes. Que mesure-t-on par heure ?",
        commentaire:"En dessous de 1 L/h le sol ne s'humidifie pas en profondeur ; au-dessus de 8 L/h on retrouve le ruissellement qu'on voulait éviter." },

      { rep:'FC1', fonction:"Se déclencher automatiquement, même pendant les vacances",
        critere:['duree d arrosage','duree','temps','plage horaire','programmation'],
        critereAttendu:"La durée d'arrosage programmée",
        unites:['min','s','h','—'], uniteOk:['min'],
        plage:[5,60], niveauAttendu:"2 arrosages de 20 min par jour",
        aide:"Le programmateur ouvre puis referme la vanne. Quelle grandeur règle-t-on sur la molette ?",
        commentaire:"Arroser tôt le matin limite l'évaporation : la même durée apporte davantage d'eau aux racines." },

      { rep:'FC2', fonction:"Fonctionner sans branchement électrique au potager",
        critere:['autonomie','duree de fonctionnement','energie','puissance du panneau','tension'],
        critereAttendu:"L'autonomie de l'alimentation",
        unites:['mois','h','W','V','—'], uniteOk:['mois','h'],
        plageParUnite:{ 'mois':[3,24], 'h':[100,10000] },
        niveauAttendu:"au moins 6 mois sur piles, ou un panneau solaire de 5 W",
        aide:"Il n'y a pas de prise au potager. Pendant combien de temps le programmateur doit-il tenir tout seul ?",
        commentaire:"Une saison de culture dure environ 6 mois : c'est la durée minimale entre deux interventions." },

      { rep:'FC3', fonction:"Économiser l'eau par rapport à l'arrosoir",
        critere:['economie','pourcentage d economie','reduction','gain','consommation'],
        critereAttendu:"Le pourcentage d'eau économisé",
        unites:['%','L','L/h','—'], uniteOk:['%'],
        plage:[20,90], niveauAttendu:"au moins 50 % d'eau en moins",
        aide:"Comment comparer deux méthodes d'arrosage avec un seul nombre ? Pense à une part sur cent.",
        commentaire:"Le goutte-à-goutte supprime l'évaporation de surface et le ruissellement : 50 à 70 % d'économie selon les cultures." }
    ]
  };

  var CDCF_STATION = {
    id:'station',
    nom:"La station de potabilisation mobile",
    emoji:'🏕️',
    resume:"Une unité transportable qui rend potable l'eau d'une rivière après une catastrophe.",
    contexte:"Après une inondation, l'eau du réseau n'est plus potable. Une ONG demande une station compacte capable d'alimenter un village de 300 personnes.",
    lignes:[
      { rep:'FP1', fonction:"Permettre aux habitants de boire l'eau de la rivière sans risque",
        critere:['taux d elimination','elimination des bacteries','taux','efficacite','pourcentage de bacteries'],
        critereAttendu:"Le taux d'élimination des bactéries",
        unites:['%','L/h','kg','—'], uniteOk:['%'],
        plage:[99,100], niveauAttendu:"99,99 % des bactéries éliminées",
        aide:"On ne peut pas dire « presque propre ». Quel nombre, sur cent, exprime la part de microbes retirés ?",
        commentaire:"En dessous de 99 %, le risque sanitaire reste réel : la norme vise 99,99 % (soit 4 microbes restants sur 10 000)." },

      { rep:'FC1', fonction:"Produire assez d'eau pour 300 personnes",
        critere:['debit','production','volume par heure','quantite produite'],
        critereAttendu:"Le débit d'eau produite",
        unites:['L/h','L/min','L','—'], uniteOk:['L/h'],
        plage:[200,2000], niveauAttendu:"au moins 600 L/h (soit 15 L par personne et par jour)",
        aide:"300 personnes × 15 L d'eau par jour, à produire en une dizaine d'heures : quelle grandeur exprime cela ?",
        commentaire:"L'ONU retient 15 L par personne et par jour comme minimum vital en situation d'urgence." },

      { rep:'FC2', fonction:"Être transportée à deux personnes",
        critere:['masse','poids','encombrement','dimensions'],
        critereAttendu:"La masse de la station",
        unites:['kg','g','cm','—'], uniteOk:['kg'],
        plage:[5,60], niveauAttendu:"au maximum 25 kg",
        aide:"Deux personnes doivent pouvoir la porter sur un chemin. Quelle grandeur limite-t-on ?",
        commentaire:"Au-delà de 25 kg, il faut un véhicule — or les routes sont souvent coupées." },

      { rep:'FC3', fonction:"Fonctionner sans réseau électrique",
        critere:['autonomie','duree de fonctionnement','energie','temps de fonctionnement'],
        critereAttendu:"L'autonomie de fonctionnement",
        unites:['h','jours','W','—'], uniteOk:['h','jours'],
        plageParUnite:{ 'h':[4,72], 'jours':[1,10] },
        niveauAttendu:"au moins 8 h de fonctionnement par jour (panneau solaire + batterie)",
        aide:"Le réseau électrique est coupé lui aussi. Combien de temps la station doit-elle tenir seule ?",
        commentaire:"8 h correspondent à une journée de production continue avec le soleil disponible." }
    ]
  };

  var OST = [CDCF_ROBINET, CDCF_CUVE, CDCF_GOUTTE, CDCF_STATION];

  /* ---------------------------------------------------------------------
     4. Module 3 — le défi créatif
     --------------------------------------------------------------------- */

  // Pistes proposées si l'équipe manque d'idées. Ce ne sont pas des solutions
  // toutes faites : chacune pose un problème, pas un objet.
  var PISTES = [
    { t:"La chasse d'eau du collège",   d:"350 élèves, plusieurs passages par jour : comment utiliser moins d'eau potable pour évacuer ?" },
    { t:"L'eau des lavabos perdue",      d:"L'eau de rinçage des mains part à l'égout. Où pourrait-elle resservir avant cela ?" },
    { t:"La fuite invisible",            d:"Une fuite dans un tuyau enterré peut couler des mois. Comment la repérer tôt ?" },
    { t:"Le potager pendant les vacances", d:"Personne n'est là pendant huit semaines. Comment arroser juste ce qu'il faut ?" },
    { t:"La douche du gymnase",          d:"Comment garder une douche agréable en divisant la consommation par deux ?" },
    { t:"L'eau de pluie de la cour",     d:"La cour est goudronnée : l'eau file dans le caniveau. Comment la garder sur place ?" }
  ];

  // Kit de pièces de la maquette 3D. `couleur` sert aussi de pastille dans la liste.
  var KIT3D = [
    { id:'cuve',    nom:"Cuve",        ico:'🛢️', couleur:0x2E75B6, forme:'cylindre', taille:[0.45,0.45,0.9] },
    { id:'tuyau',   nom:"Tuyau",       ico:'➖', couleur:0x9AA7B4, forme:'tube',     taille:[0.09,0.09,1.4] },
    { id:'pompe',   nom:"Pompe",       ico:'⚙️', couleur:0xB7791F, forme:'cube',     taille:[0.4,0.35,0.4] },
    { id:'filtre',  nom:"Filtre",      ico:'🧽', couleur:0x1E8E5A, forme:'cylindre', taille:[0.25,0.25,0.5] },
    { id:'capteur', nom:"Capteur",     ico:'📡', couleur:0xC0392B, forme:'cube',     taille:[0.2,0.2,0.2] },
    { id:'solaire', nom:"Panneau",     ico:'🔆', couleur:0x0F766E, forme:'plaque',   taille:[0.8,0.05,0.55] },
    { id:'vanne',   nom:"Vanne",       ico:'🔩', couleur:0x7C3AED, forme:'cube',     taille:[0.22,0.22,0.22] },
    { id:'goutteur',nom:"Goutteur",    ico:'💧', couleur:0x0EA5E9, forme:'cone',     taille:[0.14,0.22,0.14] }
  ];

  /* ---------------------------------------------------------------------
     5. Barème et grille de compétence

     Total 60 points, converti sur 20 dans le dossier. Le découpage est
     volontairement lisible par l'élève : il voit d'où viennent ses points.
     --------------------------------------------------------------------- */
  var BAREME = {
    m1:{ liens:8, typage:12, total:20 },   // module 1 : tracé des liens + typage FP/FC
    m2:{ total:20 },                       // module 2 : 4 lignes × 5 points
    m3:{ auto:12, prof:8, total:20 },      // module 3 : formalisme auto + pertinence prof
    total:60
  };

  // Les quatre niveaux de maîtrise du cycle 4. `min` est le seuil en % du total.
  var NIVEAUX = [
    { min:0,  code:'MI', nom:"Maîtrise insuffisante",  couleur:'#C0392B',
      texte:"Les notions de fonction principale et de contrainte ne sont pas encore en place. Reprends la pieuvre de la fiche papier avec le professeur." },
    { min:40, code:'MF', nom:"Maîtrise fragile",       couleur:'#B7791F',
      texte:"Tu distingues l'essentiel, mais les critères et les niveaux restent flous. Retiens qu'un niveau est toujours un nombre avec une unité." },
    { min:60, code:'MS', nom:"Maîtrise satisfaisante", couleur:'#2E75B6',
      texte:"Tu sais lire et compléter un cahier des charges fonctionnel. Soigne encore la formulation des fonctions (verbe à l'infinitif)." },
    { min:80, code:'TBM',nom:"Très bonne maîtrise",    couleur:'#1E8E5A',
      texte:"Tu t'appropries un cahier des charges et tu sais en rédiger un pour un objet nouveau. C'est exactement l'attendu de la compétence CT 2.1." }
  ];

  /* ---------------------------------------------------------------------
     6. Textes de la narration et mémo de cours
     --------------------------------------------------------------------- */
  var BRIEF = {
    de:"Mairie des Essarts — Service des bâtiments",
    titre:"Appel d'offres : économiser l'eau dans les bâtiments publics",
    corps:[
      "Notre commune consomme chaque année près de 9 000 m³ d'eau potable dans ses bâtiments, dont une part importante au collège. Nous ouvrons un appel d'offres auprès des bureaux d'études du territoire.",
      "Votre bureau d'études devra prouver qu'il sait lire un besoin, le traduire en fonctions, puis en exigences mesurables. Trois missions vous attendent avant de pouvoir déposer votre dossier.",
      "Un dossier n'est retenu que si chaque exigence est chiffrée : « économiser l'eau » n'engage personne, « au maximum 0,5 L par lavage » engage le fabricant."
    ]
  };

  var MEMO = [
    { t:"La pieuvre", d:"Elle représente les liens entre l'objet technique et les éléments de son milieu extérieur (EME)." },
    { t:"Fonction principale (FP)", d:"Elle relie DEUX éléments du milieu extérieur en passant par l'objet. C'est la raison d'être de l'objet. On la formule avec un verbe à l'infinitif." },
    { t:"Fonction contrainte (FC)", d:"Elle relie l'objet à UN SEUL élément du milieu extérieur. L'objet doit s'y adapter. Verbe à l'infinitif également." },
    { t:"Le critère", d:"La grandeur que l'on mesure pour savoir si la fonction est remplie (un débit, une distance, une masse…)." },
    { t:"Le niveau", d:"La valeur à atteindre, toujours un nombre avec son unité (5 L/min, 10 cm, IP65). Sans niveau, une exigence n'est pas vérifiable." },
    { t:"Le cahier des charges fonctionnel", d:"Le document qui liste les fonctions, leurs critères et leurs niveaux. C'est le contrat que le concepteur doit respecter." }
  ];

  /* Verbes acceptés en tête d'une fonction bien formulée. La liste sert au
     contrôle « verbe à l'infinitif » du module 3 : elle n'est pas exhaustive,
     le contrôle retombe sinon sur la terminaison (-er, -ir, -re…). */
  var VERBES = [
    'permettre','distribuer','detecter','resister','etre','se fixer','fixer','limiter',
    'reduire','economiser','stocker','filtrer','retenir','alimenter','arroser','doser',
    'proteger','mesurer','signaler','recuperer','transporter','produire','eliminer',
    'chauffer','refroidir','nettoyer','evacuer','repartir','maintenir','assurer',
    'supporter','s adapter','adapter','informer','avertir','declencher','se raccorder',
    'raccorder','se deplacer','contenir','isoler','purifier','pomper','couper','fonctionner'
  ];

  return {
    EME:EME, FONCTIONS:FONCTIONS, HOTSPOTS:HOTSPOTS,
    OST:OST, PISTES:PISTES, KIT3D:KIT3D,
    BAREME:BAREME, NIVEAUX:NIVEAUX, BRIEF:BRIEF, MEMO:MEMO, VERBES:VERBES
  };
})();
