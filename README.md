# techno-p11-eau

Outils numériques de la séquence **P11 — Comment préserver une ressource essentielle : l'eau ?**
Technologie, cycle 4, classe de 4ᵉ — Collège Saint Pierre, Les Essarts.

Site publié : <https://blanchardromain-cyber.github.io/techno-p11-eau/>

## Contenu

| Fichier | Séance | Compétence | Ce que l'élève fait |
|---|---|---|---|
| `index.html` | — | — | Page d'accueil : la liste des outils de la séquence |
| `tableur-facture.html` | 2 | CT 2.5 | Retrouve les formules de calcul d'une facture d'eau |
| `bete-a-cornes.html` | 3 | CT 2.5 | Exprime le besoin auquel répond le robinet automatique |
| `quiz-ip.html` | 4 | CT 2.5 | Vérifie ses connaissances sur l'indice de protection |
| `s5-pieuvre-cdcf/` | 5 | CT 2.1 | Pieuvre, cahier des charges et défi créatif (3 missions) |
| `entrainement-tableur.html` | Avant l'éval. 1 | CT 5.1 | Entraînement non noté : lire une feuille, écrire et corriger des formules, recopier (club photo) |
| `evaluation-1-tableur.html` | Éval. 1 | CT 5.1 | Partie C de l'évaluation n°1 : mini-tableur autoévalué, note reportée au classeur |

La séance 5 prolonge la fiche papier *P11 — S5 : Pieuvre et cahier des charges*.
Elle reprend le même objet technique que la séance 3, le robinet automatique :
l'élève passe du besoin (bête à cornes) aux fonctions et à leurs exigences chiffrées.

## L'évaluation n°1 : la partie C sur ordinateur

`evaluation-1-tableur.html` est la partie C (tableur) de l'évaluation papier *P11 — Évaluation n°1*
(sujet, corrigé et fiche enseignant dans le Drive, dossier `Evaluations/P11_evaluation_1`).
Les élèves la passent à tour de rôle, 12 minutes chacun, pendant l'épreuve écrite.

- **Même feuille** que `tableur-facture.html` (B4, B6 et B8 fournies), prolongée par une colonne
  « Avec la fuite » ; l'élève écrit B7, B9, B10, puis C7, C9, C10 et C11.
- **Autoévaluée** : à la validation, la page affiche la note sur 12 (C1, C2, C3) et la reporte
  dans le classeur « P11 — Évaluation n°1 — Report des notes » : voir
  [`apps-script/LISEZ-MOI-EVAL1.md`](apps-script/LISEZ-MOI-EVAL1.md). La première validation fait foi.
- **Rotation** : chronomètre de 12 minutes, bouton « Élève suivant » qui libère le poste.
- **Un seul fichier** : aides dys du site Technologie intégrées, polices B612 servies par le site.
- L'envoi est refusé depuis `localhost` ou un fichier local, pour ne pas polluer le classeur.
- La **capsule complète** (parties A, B et C, pour les élèves qui ne passent pas l'épreuve papier)
  est dans le site Technologie, avec le tableau de bord du professeur.
- Fichiers **générés** : on modifie les sources du dossier `_sources` (`tableur_src.html`,
  `moteur_tableur.js`, partagé avec la capsule), puis on relance `build_capsule.py`.

## Mettre en ligne une modification

Le dépôt est publié par **GitHub Pages** depuis la branche `main`, à la racine.
Aucune compilation n'est nécessaire : ce sont des fichiers HTML, CSS et JavaScript
servis tels quels.

### Depuis un poste où Git est installé

```bash
git clone https://github.com/blanchardromain-cyber/techno-p11-eau.git
```

Modifier les fichiers, puis :

```bash
git add index.html && git commit -m "Accueil : ajout de la séance 5" && git push
```

La mise en ligne prend de quelques secondes à deux minutes. Pour vérifier qu'elle
est effective sans rafraîchir la page à l'aveugle :

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://blanchardromain-cyber.github.io/techno-p11-eau/s5-pieuvre-cdcf/
```

Un `200` signifie que la page est servie.

### Depuis le navigateur, sans Git

Sur GitHub : **Add file → Upload files**, déposer les fichiers modifiés en
conservant l'arborescence, puis **Commit changes**.

### Première activation de Pages (déjà faite ici)

*Settings → Pages → Source : Deploy from a branch → Branch : `main` / `(root)` → Save.*

### Le cache du navigateur

Les fichiers de la séance 5 sont appelés avec un numéro de version
(`css/style.css?v=2026-09-17s`). **Après chaque modification d'un fichier de
`s5-pieuvre-cdcf/`, incrémenter cette version dans `index.html`** (une seule
recherche-remplacement sur `v=2026-09-17…`). Sans cela, un poste du collège
continue de servir l'ancienne version depuis son cache, parfois plusieurs jours.

Le pied de page de l'activité affiche le même marqueur (`build 2026-09-17s`) :
il permet de vérifier d'un coup d'œil, sur le poste d'un élève, quelle version
est réellement chargée.

## L'activité de la séance 5

### Organisation des fichiers

```
apps-script/
├── Code.gs               script à coller dans le classeur Google Sheets
└── LISEZ-MOI.md          installation de la remontée des résultats

s5-pieuvre-cdcf/
├── index.html            page unique, tous les écrans
├── css/style.css         charte et composants
└── js/
    ├── data.js           TOUT le contenu pédagogique (voir ci-dessous)
    ├── core.js           état, sauvegarde locale, navigation, outils de texte
    ├── badge.js          identification de l'équipe, reprise d'un dossier
    ├── scene3d.js        les deux scènes 3D, et leur repli sans 3D
    ├── module1.js        mission 1 — la pieuvre et le tableau d'analyse
    ├── module2.js        mission 2 — le cahier des charges et les coups de pouce
    ├── module3.js        mission 3 — le défi créatif et l'atelier de maquette
    ├── evaluation.js     dossier final, note sur 20, exports
    ├── cloud.js          envoi automatique des résultats au professeur
    └── presentation.js   mode plein écran pour le vidéoprojecteur
```

**Pour modifier le contenu d'une année sur l'autre, `js/data.js` suffit.** Il
contient les éléments du milieu extérieur, les six fonctions à classer, les
quatre objets techniques proposés avec leurs critères, niveaux et plages de
tolérance, le barème et les quatre niveaux de maîtrise. Le reste du code ne
contient aucune connaissance métier.

### Adresses utiles

| Adresse | Effet |
|---|---|
| `…/s5-pieuvre-cdcf/` | l'activité, pour les élèves |
| `…/s5-pieuvre-cdcf/?prof` | ajoute les corrigés de référence, la grille et la liste des dossiers du poste |
| `…/s5-pieuvre-cdcf/#m2` | ouvre directement une mission (`#m1`, `#m2`, `#m3`, `#dossier`) — pratique pour projeter |
| `…/s5-pieuvre-cdcf/?no3d` | force le mode sans 3D, sur un poste ancien ou pour tester le repli |

Les paramètres se combinent : `?prof&no3d`.

### Comment les repères sont attribués

Les repères FP1, FC1, FC2… ne sont pas saisis par l'élève : ils sont donnés
**au tracé**, dans l'ordre où il dessine ses traits, et affichés sur la pieuvre.
Annuler un trait renumérote les suivants sans laisser de trou.

Le tableau d'analyse demande ensuite la **correspondance** : pour chaque
fonction écrite, retrouver le trait du schéma, dans un menu qui ne propose que
les repères tracés. Ces options ne nomment pas l'élément relié — sinon elles
donneraient la réponse ; l'élève remonte à son schéma. Deux élèves justes n'ont
donc pas la même numérotation, c'est voulu, et le corrigé affiché reprend les
repères de chacun.

Techniquement, le tableau retient l'*identifiant* du trait et non son numéro :
une renumérotation ne casse jamais les réponses déjà données.

### Une remarque sur la numérotation des fonctions

Les six fonctions de la pieuvre portent **FP1** puis **FC1 à FC5**, dans l'ordre
de la fiche papier. La ligne « Limiter la consommation d'eau » du cahier des
charges porte donc **FC6**, et non FC3 comme sur la fiche : sans quoi deux
fonctions différentes auraient le même repère d'une mission à l'autre. Cette
fonction n'est d'ailleurs reliée à aucun élément du milieu extérieur sur la
pieuvre — c'est une exigence de performance ajoutée au cahier des charges.

Pour revenir à la numérotation de la fiche, une seule ligne à changer dans
`js/data.js` : le `rep:'FC6'` de `CDCF_ROBINET`.

### Où va le travail des élèves

Le travail est enregistré dans le **navigateur du poste** (`localStorage`), sous
un code d'équipe généré à l'inscription (par exemple `4B-K7M2`).

Deux stockages, deux rôles :

- **`localStorage` garde le travail**, indexé par code. Il survit à la fermeture
  du navigateur : une équipe retrouve son dossier la semaine suivante sur le
  même poste, et `?prof` en liste le contenu.
- **`sessionStorage` garde seulement ce que la session en cours travaille.**
  C'est lui qui décide de la réouverture automatique. Après un simple
  rechargement, l'équipe retrouve son écran ; après la fermeture du navigateur,
  le poste repart sur l'écran de badge — **la classe suivante ne reprend pas le
  dossier de la précédente à son nom**. Le travail n'est pas perdu : il se
  rouvre avec son code.

Le bouton **« Fermer ce dossier et libérer le poste »**, en fin d'heure, fait la
même chose sans attendre.

Conséquences pratiques :

- pour changer de poste, l'élève exporte son dossier en `.json` depuis l'onglet
  « Dossier », puis le réimporte sur l'autre poste ;
- **le rendu se fait par impression** (ou enregistrement en PDF depuis la fenêtre
  d'impression) : c'est ce document qui est noté ;
- si la remontée Google Sheets est configurée (voir ci-dessous), les résultats
  arrivent en plus dans un classeur, tout seuls ;
- une session de navigation privée ou un nettoyage du poste efface le travail.
  L'activité prévient l'élève si l'enregistrement échoue.

En salle informatique, `?prof` affiche sur chaque poste la liste des dossiers
qui y ont été créés, avec les notes des trois missions et une étoile sur les
équipes qui se proposent pour la présentation.

### Remontée automatique des résultats

Les résultats peuvent arriver seuls dans un classeur Google Sheets : une ligne
par équipe, mise à jour à chaque vérification de mission, sans aucune
manipulation de l'élève ni du professeur.

L'installation prend une dizaine de minutes et se fait une seule fois :
voir **[`apps-script/LISEZ-MOI.md`](apps-script/LISEZ-MOI.md)**.

Tant que ce n'est pas fait, le dossier affiche « Envoi non configuré » et tout
le reste fonctionne normalement. Le classeur reste **séparé** de la feuille
« Travail en classe » : rien n'y est importé automatiquement, il sert à croiser
les résultats du regard au moment du bilan trimestriel.

### Présenter deux ou trois solutions en fin d'heure

Les équipes qui le souhaitent cochent **« Je propose ma solution pour la
présentation en classe »** dans leur dossier. En mode `?prof`, elles apparaissent
avec une étoile et un bouton **Projeter** qui ouvre un affichage plein écran, en
gros caractères : nom de l'équipe, problème, principe, cahier des charges et
maquette. Ni note ni corrigé à l'écran — on projette une proposition.

Les flèches ◀ ▶ (ou les touches ← →) passent d'une équipe retenue à l'autre,
Échap referme. On ne repasse pas les vingt-cinq maquettes.

### Ce qui est corrigé automatiquement, et ce qui ne l'est pas

Sur 60 points :

- **mission 1 (20 pts)** et **mission 2 (20 pts)** sont entièrement automatiques ;
- **mission 3** est séparée en **12 points automatiques** (structure de la pieuvre,
  verbe à l'infinitif, critères mesurables, niveaux chiffrés avec unité, maquette)
  et **8 points attribués par le professeur** (pertinence du besoin, originalité,
  faisabilité).

Les 8 points se saisissent dans l'onglet « Dossier » en mode `?prof`, avec une
remarque qui apparaît ensuite dans le dossier de l'élève. La note sur 20 se
recalcule aussitôt. Une mission jamais vérifiée est comptée « non rendue » et
exclue du total, pour ne pas confondre un travail raté et un travail absent.

Le détail du barème est dans [`GRILLE-EVALUATION.md`](GRILLE-EVALUATION.md).

### Sur le réseau du collège

L'activité charge deux ressources extérieures : la police Inter (Google Fonts) et
la bibliothèque 3D Three.js (CDN jsDelivr). **Si l'une ou l'autre est bloquée,
l'activité reste entièrement utilisable** : la police retombe sur Arial, et la 3D
est remplacée par des schémas équivalents, avec la même valeur pédagogique et le
même barème. Aucun point n'est perdu à cause du filtrage réseau.

Les pages s'ouvrent aussi par un simple double-clic depuis une clé USB, sans
serveur : le code n'utilise pas de modules ES.

## Licence et réutilisation

Ces outils sont produits pour les élèves du collège. Les collègues qui souhaitent
les adapter peuvent reprendre le dépôt : le contenu pédagogique est isolé dans
`js/data.js` pour la séance 5, et dans un bloc `CORRIGE` en tête de script pour
les autres outils.
