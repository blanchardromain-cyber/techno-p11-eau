# Grille d'évaluation — P11 · Séance 5

**Pieuvre et cahier des charges** · Technologie, cycle 4, classe de 4ᵉ
Compétence travaillée : **CT 2.1 — S'approprier un cahier des charges.**

Cette grille décrit ce que l'activité numérique
[`s5-pieuvre-cdcf/`](s5-pieuvre-cdcf/) évalue, comment, et ce qui reste à la
charge du professeur. Elle sert de barème de référence et de document de
cadrage pour une correction manuelle sur copie papier.

---

## 1. Ce qui est évalué

| Mission | Attendu | Points | Correction |
|---|---|---:|---|
| **1 — Décryptage de la pieuvre** | Distinguer fonction principale et fonction contrainte à partir des liens avec le milieu extérieur | **20** | automatique |
| **2 — Cahier des charges** | Traduire une fonction en critère mesurable et en niveau chiffré | **20** | automatique |
| **3 — Défi créatif** | Rédiger le cahier des charges d'un objet qu'on invente | **20** | 12 automatiques + 8 professeur |
| | | **60** | → note sur 20 |

La note sur 20 est calculée au demi-point : `20 × points obtenus / points possibles`.
**Une mission jamais vérifiée est exclue du dénominateur** et signalée « non
rendue ». Un élève qui n'a fait que les missions 1 et 2 est donc noté sur ces
deux missions, non pénalisé deux fois.

---

## 2. Mission 1 — Décryptage de la pieuvre (20 points)

### 2.1 Tracé de la pieuvre (8 points)

| Critère | Points | Réussite |
|---|---:|---|
| La fonction principale relie **l'utilisateur** et **l'eau** à travers l'objet | 3 | le trait traverse l'objet et joint deux EME |
| Chaque fonction contrainte relie l'objet à **un seul** EME | 5 | 1 point par contrainte juste (mains, milieu humide, énergie, lavabo, budget) |

Une contrainte tracée vers un EME qui appartient à la fonction principale est
signalée à l'élève : c'est l'erreur de raisonnement la plus fréquente.

### 2.2 Classement des six fonctions (12 points)

2 points par fonction correctement typée, sur les six énoncés de la fiche papier.

| Énoncé | Attendu |
|---|---|
| Permettre à l'utilisateur de se laver les mains avec de l'eau | **FP1** |
| Détecter la présence des mains | FC1 |
| Résister à l'environnement humide | FC2 |
| Être alimenté en énergie | FC4 |
| Se fixer sur le lavabo | FC5 |
| Respecter le budget | FC6 |

Le retour donné à l'élève ne se limite pas à juste / faux : il rappelle à chaque
ligne le **critère de décision** — deux éléments du milieu extérieur reliés à
travers l'objet, ou un seul élément auquel l'objet doit s'adapter.

---

## 3. Mission 2 — Cahier des charges fonctionnel (20 points)

L'équipe choisit un objet technique parmi quatre. Le barème est ramené à 20
points quel que soit l'objet, afin que les quatre sujets soient équivalents.

**5 points par ligne**, décomposés ainsi :

| Élément | Points | Ce qui est vérifié |
|---|---:|---|
| Critère | 2 | la grandeur mesurée (tolérance aux fautes d'orthographe : 1 point si le mot est reconnaissable mais mal écrit) |
| Valeur | 2 | un nombre, dans une **plage plausible** — 1 point si l'ordre de grandeur est proche |
| Unité | 1 | l'unité correspond bien à la grandeur annoncée |

L'unité est notée séparément parce que c'est elle qui trahit une confusion de
grandeur : un élève qui écrit « débit : 5 cm » a compris le mot, pas la notion.

### Niveaux de référence — le robinet automatique

| Rep. | Fonction | Critère attendu | Niveau attendu | Plage acceptée |
|---|---|---|---|---|
| FP1 | Distribuer de l'eau pour se laver les mains | le débit | ≈ 5 L/min | 3 à 8 L/min |
| FC1 | Détecter la présence des mains | la distance de détection | ≈ 10 cm | 5 à 20 cm |
| FC2 | Résister à l'environnement humide | l'indice de protection (IP) | IP65 | second chiffre ≥ 4 |
| FC3 | Limiter la consommation d'eau | le volume par lavage, ou la temporisation | ≤ 0,5 L — ou ≈ 6 s | 0,2 à 1 L, ou 3 à 15 s |

Les trois autres objets — récupérateur d'eau de pluie, arrosage goutte-à-goutte,
station de potabilisation mobile — suivent la même structure. Leurs niveaux de
référence s'affichent dans l'activité en mode `?prof`, et sont définis dans
`s5-pieuvre-cdcf/js/data.js`.

---

## 4. Mission 3 — Défi créatif (20 points)

### 4.1 Part automatique (12 points)

Seule la **forme** est corrigée par la machine : ce sont les points que le cours
permet de vérifier sans juger l'idée.

| Critère | Points | Réussite |
|---|---:|---|
| Fiche d'identité | 3 | la solution est nommée, le problème est décrit, le principe de fonctionnement est expliqué (1 point chacun) |
| Structure de la pieuvre | 2 | une seule fonction principale (1) et au moins trois contraintes (1) |
| Formulation | 3 | toutes les fonctions commencent par un **verbe à l'infinitif** — 1 point seulement si certaines sont conjuguées |
| Critères et niveaux | 3 | chaque fonction porte un critère et un niveau chiffré **avec son unité** |
| Maquette | 1 | au moins trois pièces assemblées — ou, sans 3D disponible, un principe de fonctionnement détaillé |

### 4.2 Part professeur (8 points)

Ces points ne peuvent pas être attribués automatiquement. Ils se saisissent dans
l'onglet « Dossier », en mode `?prof`, avec une remarque qui redescend dans le
dossier de l'élève.

| Critère | Points | Indicateurs |
|---|---:|---|
| Pertinence du besoin | 2 | le problème traité est une vraie consommation d'eau, situé et quantifiable |
| Faisabilité | 2 | la solution tient compte du collège réel : place disponible, budget, entretien, sécurité |
| Justification des niveaux | 2 | les valeurs choisies sont argumentées, pas prises au hasard |
| Cohérence maquette / cahier des charges | 2 | la maquette illustre bien le principe décrit ; on retrouve les pièces annoncées |

**Repères de notation.** 8/8 : une solution qu'un adulte pourrait étudier
sérieusement. 6/8 : idée juste, un critère faible. 4/8 : idée recevable mais peu
argumentée. 2/8 : hors sujet ou recopiée d'un exemple de l'activité.

---

## 5. Positionnement de la compétence

La compétence est positionnée sur le pourcentage de points obtenus.

| Niveau | Seuil | Ce que l'élève sait faire |
|---|---|---|
| **Maîtrise insuffisante** | < 40 % | Les notions de fonction principale et de contrainte ne sont pas en place |
| **Maîtrise fragile** | 40 à 59 % | Distingue l'essentiel, mais critères et niveaux restent flous |
| **Maîtrise satisfaisante** | 60 à 79 % | Sait lire et compléter un cahier des charges fonctionnel |
| **Très bonne maîtrise** | ≥ 80 % | Sait en rédiger un pour un objet nouveau — l'attendu de CT 2.1 |

---

## 6. Conduite de la séance

**Durée indicative :** 55 min pour les missions 1 et 2, 55 min pour la mission 3
et le dossier. Les missions 1 et 2 seules constituent déjà une séance complète et
évaluable.

**Modalité.** Seul ou en binôme, au choix, déclaré au démarrage. En binôme,
demander l'alternance aux commandes à chaque mission : le dossier porte les deux
noms et reçoit la même note.

**Faire recopier le code d'équipe sur le cahier.** C'est lui qui rouvre le
dossier à la séance suivante, sur le même poste.

**Rendu.** Impression du dossier, ou enregistrement en PDF depuis la fenêtre
d'impression. Le dossier contient l'identité de l'équipe, les trois productions,
la note et le positionnement.

**Projection.** Les adresses `#m1`, `#m2`, `#m3` ouvrent directement une mission :
utile pour un temps de mise en commun au vidéoprojecteur.

---

## 7. Différenciation et aménagements

- **Élèves rapides.** Proposer un second objet technique en mission 2 : le
  changement d'objet est possible à tout moment (le cahier des charges en cours
  est alors effacé, avec confirmation).
- **Élèves en difficulté sur la mission 1.** Le bouton « Voir le mémo » rappelle
  la règle FP / FC. Faire d'abord repérer les cinq éléments sur la maquette 3D :
  le passage par l'objet réel lève la plupart des blocages.
- **Difficulté d'écriture.** La mission 3 peut être menée à l'oral, le professeur
  saisissant les fonctions dictées par l'élève ; la structure reste évaluée.
- **Poste ancien ou réseau filtrant.** Ajouter `?no3d` à l'adresse : l'activité
  bascule sur des schémas et **le barème est inchangé** — le point de maquette
  s'obtient alors par la description écrite du principe.
- **Correction en deux temps.** Chaque vérification donne une aide au premier
  essai et le corrigé au second. Annoncer ce fonctionnement : les élèves qui
  cliquent deux fois d'affilée sans corriger perdent le bénéfice de l'aide.
