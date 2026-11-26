# A8 · Situation déclenchante — Turbines de démonstration : fabrication et test

*R.Blanchard, professeur de Technologie · document professeur, à ne pas montrer aux élèves*

## 1. Les fichiers

| Fichier | Contenu | Impression |
|---|---|---|
| `turbine_A.stl` | turbine gravée « A » + son couvercle, côte à côte | flasque à plat, couvercle collerette à plat |
| `turbine_B.stl` | turbine gravée « B » + son couvercle | idem |
| `support_demo.stl` | fourche à main + 2 axes en PLA (Ø 4 × 39 mm) | à plat, tel quel |
| `turbine_demo.scad`, `support_demo.scad` | sources paramétriques (OpenSCAD) | — |

**A et B sont le même modèle** : même moyeu creux, même couvercle vissé, mêmes aubes. Seule la lettre gravée sur le dessus du moyeu change (contrôlé : sans la lettre, les deux maillages sont identiques octet pour octet). Ce qui les distingue, c'est le lest caché dans le moyeu de A.

Pour changer une cote : ouvrir le `.scad`, modifier le paramètre en haut du fichier, puis exporter :
`openscad --backend=manifold -D 'lettre="A"' -o turbine_A.stl turbine_demo.scad`
(OpenSCAD est installé dans `%LOCALAPPDATA%\Programs\OpenSCAD`. Le poste refuse de lancer un programme depuis `Documents`.)

## 2. Filament et réglages (Bambu Lab A1, buse 0,4 mm)

- **Couleur : la même bobine pour A et B**, en PLA opaque d'une couleur unie et moyenne (gris, bleu ou blanc). Éviter le PLA translucide (on verrait le lest), le « silk » (reflets) et le noir (on lit mal la lettre).
- **Imprimer A et B sur le même plateau** : même couleur, même finition, aucun indice.
- Profil Bambu Studio : imprimante *Bambu Lab A1 0.4 nozzle*, filament *Bambu PLA Basic*, process *0.20mm Standard @BBL A1*.

| Réglage | Turbines A et B | Support |
|---|---|---|
| Hauteur de couche | 0,20 mm | 0,20 mm |
| Parois | 2 | 3 |
| Remplissage | 15 % gyroïde (10 à 15 % conviennent) | 15 % gyroïde |
| Supports | **aucun** | **aucun** |
| Plateau | plaque texturée PEI, sans colle | idem |
| Orientation | celle du fichier, sans la changer | celle du fichier |

Le remplissage compte peu sur les turbines : aubes (1,6 mm), flasque (1 mm), parois (1 mm) et toit (1,2 mm) sont si minces qu'ils sortent pleins. **B est déjà aussi légère que possible**, c'est voulu.

Aucune pièce ne demande de support. Les dessous sont chanfreinés à 45°. Le seul pont est le toit du moyeu, sur environ 8 mm, ce que l'A1 franchit sans difficulté.

**Temps estimés** (le slicer n'a pas pu tourner en ligne de commande sur ce poste : vérifier dans Bambu Studio) :

| Plateau | Temps | Filament |
|---|---|---|
| A + B + 2 couvercles | ≈ 2 h 30 | ≈ 40 g |
| Support + 2 axes | ≈ 1 h 15 | ≈ 30 g |

## 3. Après l'impression (10 min)

1. **Axe** : glisser un axe dans chaque turbine. Elle doit tourner sous un simple souffle. Si elle frotte, repasser l'alésage avec un foret de 4,5 mm tourné à la main, puis poncer l'axe imprimé au papier fin. *Garder un axe par turbine* : on change de turbine avec son axe.
2. **Couvercle** : il se visse en un tour environ (filet rond au pas de 6 mm). Avant de le visser, faire **2 tours de ruban PTFE** (téflon de plombier) sur le filet du couvercle, **pour A comme pour B**. Le ruban rend le couvercle étanche (l'eau n'entre pas dans B, ce qui l'alourdirait) et l'empêche de se dévisser.
3. **Peser B** avec son couvercle (balance de cuisine au gramme). Valeur attendue : **environ 18 g**. Noter la valeur exacte dans `masse_B` du `.scad`.

## 4. Le lest de A

### Où le mettre
Dévisser le couvercle (pièce de monnaie dans la fente), puis poser la turbine à l'envers, couvercle vers le haut. Au fond, contre le toit du moyeu, **3 compartiments séparés par des cloisons**. Plus haut, à l'intérieur de la jupe du couvercle, un anneau commun.

- **Écrous M6** (DIN 934, ≈ 2,5 g : peser 10 écrous pour connaître leur masse exacte), posés à plat, **le même nombre dans chaque compartiment**.
- Combler les vides (billes d'acier, morceau d'essuie-tout tassé ou pâte adhésive) pour que **rien ne bouge ni ne cliquette**. Un bruit de grelot trahirait A, et un lest qui roule déséquilibre la turbine.
- Revisser le couvercle avec son ruban PTFE.

### Combien
B pèse environ 18 g. La cavité fait 15,5 cm³.

| A pèse… | Masse de A | Lest à ajouter | Comment |
|---|---|---|---|
| ≈ 3 fois B | ≈ 55 g | ≈ 37 g | **15 écrous M6**, 5 par compartiment : c'est le maximum en écrous seuls |
| ≈ 4 fois B | ≈ 73 g | ≈ 55 g | 15 écrous **+ ≈ 18 g de billes d'acier** glissées entre eux, ou ≈ 55 g de billes seules |
| ≈ 6 fois B | ≈ 110 g | ≈ 92 g | **impossible en acier** : la cavité en contient au plus ≈ 73 g (billes) |
| ≈ 8 fois B | ≈ 145 g | ≈ 127 g | **impossible** dans ce moyeu |

> Écart avec la demande : 4, 6 et 8 fois ne sont pas tous atteignables. Une turbine de 60 × 20 mm qui reste aussi légère que possible n'offre que 15,5 cm³ de cavité. Seul du plomb (≈ 100 g de grenaille) dépasserait 6 fois, et **je le déconseille** pour un objet passé de main en main par les élèves.
> **Visez 3 à 4 fois.** En main, 18 g contre 55 à 75 g se sentent tout de suite. Sous le filet d'eau, c'est surtout le frottement sur l'axe qui fait la différence : il croît avec la masse, et un rapport de 3 suffit à trouver un débit où B tourne et A ne démarre pas (voir le test). Si l'essai montre qu'il faut plus, je peux agrandir la turbine (par exemple 70 × 25 mm), ce qui gagne en capacité.

### Contrôle d'équilibre
Sans eau, poser A sur son axe dans le support et la lancer doucement à la main plusieurs fois. Si elle s'arrête **toujours sur la même aube en bas**, elle est déséquilibrée : déplacer un écrou du compartiment le plus bas vers celui d'en face.

## 5. Protocole de test, à faire avant le cours

**Matériel** : le support, A et B chacune sur son axe, le point d'eau de la salle, un ruban adhésif de couleur pour repérer le réglage.

**Mise en place** : tenir le support par la poignée, fourche horizontale, l'axe posé au fond des deux encoches (il ne peut pas glisser sur le côté). Placer la turbine sous le jet de façon que **l'eau tombe sur les aubes, à 2,5 cm environ à côté de l'axe** (le moyeu fait 4 cm de diamètre), jamais sur le moyeu. Les aubes courbes présentent leur creux au jet (sinon, retourner la turbine).

| Étape | Réglage | Turbine B (attendu) | Turbine A (attendu) |
|---|---|---|---|
| 1 | **Débit faible** : un filet continu de 3 à 4 mm, sans goutte-à-goutte | démarre seule en moins de 2 s et tourne franchement | ne démarre pas, ou tourne lentement et par à-coups |
| 2 | **Débit moyen** : jet plein, sans éclabousser | tourne vite | tourne aussi, mais démarre plus lentement |
| 3 | Revenir au débit de l'étape 1 et **repérer la position du robinet** (adhésif sur la manette) | — | — |

Le débit moyen sert seulement à vérifier que A n'est pas bloquée. **En classe, on montre au débit faible**, et l'on garde le débit moyen pour une relance éventuelle.

### Si le résultat n'est pas celui attendu

| Constat | Action |
|---|---|
| **A tourne trop bien** au débit faible | 1) Réduire le débit jusqu'à ce que A cale, puis vérifier que B tourne encore. 2) Sinon, ajouter 3 écrous (1 par compartiment) ou remplacer des écrous par des billes (palier de +10 à +15 g). |
| **B ne tourne pas** au débit faible | 1) Vérifier le frottement de l'axe (étape 3.1). 2) Viser les aubes plus loin de l'axe, sur leur creux. 3) Augmenter un peu le débit. 4) Dévisser B : si de l'eau est entrée, vider, sécher et refaire le ruban PTFE. |
| Les deux tournent pareil | Débit trop fort : revenir au filet. Si rien ne change, A est trop légère (voir la 1ʳᵉ ligne). |
| Les deux calent | Débit trop faible ou axe qui frotte : refaire l'étape 3.1, puis augmenter le débit par petits pas. |
| A s'arrête toujours dans la même position | Lest déséquilibré : voir « Contrôle d'équilibre ». |
| L'axe saute de l'encoche | Le jet frappe trop haut : viser plus bas sur les aubes, côté extérieur. |
| A cliquette quand on la secoue | Caler le lest (essuie-tout, pâte adhésive). |

## 6. Plan B : point d'eau inaccessible

**Sèche-cheveux en position « air froid »**, à vitesse faible. *Air froid impératif : le PLA se déforme vers 55 °C.*

- Tenir le sèche-cheveux à 30 à 40 cm, le souffle dirigé sur les aubes d'un seul côté de l'axe, comme le jet d'eau.
- Effet attendu : **B se met à tourner, A reste immobile ou démarre bien plus tard.**
- Réglage : reculer le sèche-cheveux jusqu'à la distance où B tourne encore et A ne démarre plus. Marquer cette distance au sol avant le cours.
- Avantage : pas d'éclaboussures, et l'on peut faire la démonstration au bureau. Inconvénient : on perd le bruit de l'eau. Le dire aux élèves (« imaginez que c'est l'eau du robinet »).

## 7. Après la séance

Dévisser les deux couvercles et laisser sécher à l'air, couvercle ouvert (les écrous ne doivent pas rouiller). Ranger A, B, leurs axes et le support dans un même sachet. Le lest peut rester dans A.

## 8. Ce qui a été vérifié et ce qui reste à tester à la main

Vérifié sur les fichiers :
- les trois STL sont étanches (chaque arête est partagée par exactement deux faces, orientation cohérente, aucun triangle dégénéré) ;
- A et B sont identiques hors lettre ;
- le couvercle se visse sans toucher le moyeu sur toute sa course (intersection vide, vérifiée à 0 ; 1 ; 1,5 ; 2,5 ; 3 ; 4,5 et 5,5 mm de dévissage) ;
- encombrements : turbine 60 × 60 × 20 mm, couvercle Ø 35 × 7,4 mm, support 162 × 44 × 14 mm, qui tient sur le plateau de l'A1.

Reste à faire avec les pièces imprimées :
1. le serrage réel du filet du couvercle (jeu 0,35 mm : régler `jeu_filet` à 0,25 si le couvercle a du jeu, à 0,45 s'il force) ;
2. le jeu de l'axe (`jeu_axe`) ;
3. la masse réelle de B et le nombre d'écrous qui tiennent vraiment ;
4. **le test au point d'eau** de la section 5.
