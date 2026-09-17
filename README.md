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

La séance 5 prolonge la fiche papier *P11 — S5 : Pieuvre et cahier des charges*.
Elle reprend le même objet technique que la séance 3, le robinet automatique :
l'élève passe du besoin (bête à cornes) aux fonctions et à leurs exigences chiffrées.

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
s5-pieuvre-cdcf/
├── index.html            page unique, tous les écrans
├── css/style.css         charte et composants
└── js/
    ├── data.js           TOUT le contenu pédagogique (voir ci-dessous)
    ├── core.js           état, sauvegarde locale, navigation, outils de texte
    ├── badge.js          identification de l'équipe, reprise d'un dossier
    ├── scene3d.js        les deux scènes 3D, et leur repli sans 3D
    ├── module1.js        mission 1 — la pieuvre
    ├── module2.js        mission 2 — le cahier des charges
    ├── module3.js        mission 3 — le défi créatif
    └── evaluation.js     dossier final, note sur 20, exports
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

### Où va le travail des élèves

Le travail est enregistré dans le **navigateur du poste** (`localStorage`), sous
un code d'équipe généré à l'inscription (par exemple `4B-K7M2`). Rien ne part sur
un serveur.

Conséquences pratiques :

- l'élève retrouve son dossier sur **le même poste** sans rien saisir ;
- pour changer de poste, il exporte son dossier en `.json` depuis l'onglet
  « Dossier », puis le réimporte sur l'autre poste ;
- **le rendu se fait par impression** (ou enregistrement en PDF depuis la fenêtre
  d'impression) : c'est ce document qui est noté ;
- une session de navigation privée ou un nettoyage du poste efface le travail.
  L'activité prévient l'élève si l'enregistrement échoue.

En salle informatique, `?prof` affiche sur chaque poste la liste des dossiers
qui y ont été créés, avec les notes des trois missions.

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
