# A8 · Situation déclenchante — Supports papier : impression

*R.Blanchard, professeur de Technologie · document professeur*

Imprimer en couleur, **taille réelle (100 %, sans « ajuster à la page »)**, papier 80 g ou mieux 160 g pour les cartes et étiquettes. Toutes les marges font au moins 6 mm : rien n'est coupé par une imprimante de bureau.

| Fichier | Pour qui | Exemplaires | Découpe |
|---|---|---|---|
| `lettre_fabricant.pdf` | classe (lecture, affichage) | 1 par binôme si vous la distribuez, sinon 1 | — |
| `lettre_fabricant_FALC.pdf` | version facile à lire, au choix de l'élève | 3 ou 4 | — |
| `lettre_fabricant.wav` | audio de la lettre (40 s, −16 LUFS, voix de synthèse Piper) | — | — |
| `cartes_amorce.pdf` | binômes : 8 amorces avec un exemple sur un autre objet | **15** (un jeu par binôme) | massicot sur les repères de coupe (3 coupes verticales, 5 horizontales) |
| `cartes_amorce_adaptees.pdf` | version adaptée : 4 amorces, grand pictogramme, sans exemple | 3 ou 4 | 1 coupe en croix |
| `plateau_A5.pdf` | version adaptée : mini-plateau de 4 cases | 2 feuilles = 4 plateaux | couper au milieu |
| `etiquettes_tableau.pdf` | tableau : 4 étiquettes (p. 1 à 4) + problématique (p. 5) | 1 | — (aimants) |
| `cartes_relance.pdf` | professeur : 4 cartes de relance (p. 1-2) + étiquette du sachet (p. 3, paysage) | 1 | p. 1-2 au milieu ; p. 3 : une étiquette entière ou 3 étiquettes séparées |

**Couleur et motif** : chaque zone a sa couleur **et** son motif, pour rester lisible imprimée en noir et blanc ou par un élève qui distingue mal les couleurs.

| Zone | Question | Couleur | Motif | Pictogramme |
|---|---|---|---|---|
| 1 | Quel matériau ? | bleu | rayures | formes (échantillons) |
| 2 | Pourquoi celui-là ? | orange | pois | balance |
| 3 | Comment le fabriquer ? | vert | damier | engrenage |
| 4 | Qu'a-t-il coûté à fabriquer ? | violet | vagues | éclair dans une pièce |

Les cases du mini-plateau sont numérotées 1 à 4 avec les mêmes couleurs et motifs, **sans texte** : avant la révélation, les binômes regroupent leurs questions sans connaître les étiquettes.

## Points de vigilance

- **Règle d'or vérifiée** : la lettre, sa version facile à lire, les cartes d'amorce et le plateau ne contiennent aucun matériau, critère, procédé ni valeur de l'activité 8 (recherche automatique de 45 mots réservés tirés du corrigé, puis relecture). Les exemples des cartes portent sur le vélo, la gourde et le casque, jamais sur le poids ni sur la matière.
- La carte de relance « Et pour en fabriquer 10 000 ? » reprend un nombre de l'A8 : c'est voulu (ton brief), et elle reste entre les mains du professeur.
- L'étiquette du sachet nomme « pétrole ou plante » : c'est aussi voulu (relance sur l'origine de la matière), elle ne sert qu'en relance.
- La photo de roche ne nomme pas le minerai : seul le crédit est imprimé.

## Pour modifier un texte

Les textes sont dans `outils/generer_papier.mjs` (lettre : `outils/texte_lettre.mjs`). Pour régénérer, lancer depuis le dossier `a8-declencheur` :
`node outils/generer_papier.mjs` (PDF et aperçus) et `node outils/generer_audio.mjs` (audio, si la lettre change).
Node se trouve dans `ClaudeConfig\nodejs\node-v24.18.0-win-x64\node.exe` ; Playwright et Piper sont pris dans `Documents\video-technologie`.
