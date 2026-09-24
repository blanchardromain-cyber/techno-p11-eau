# Évaluation n°1 — report automatique des notes du tableur

La page `evaluation-1-tableur.html` (partie C de l'évaluation) corrige la feuille de
l'élève et envoie ses points C1, C2, C3 au classeur **« P11 — Évaluation n°1 — Report
des notes »** (Drive : `P11/Claude/Evaluations/P11_evaluation_1`). La note se range
sur la ligne de l'élève, dans l'onglet de sa classe, à côté des points de la copie papier.

À faire **une seule fois**, en une dizaine de minutes. Tant que ce n'est pas fait, la
page fonctionne : elle affiche la note à l'élève et lui demande de la montrer au professeur.

## 1. Coller le script

Ouvrir le classeur, puis **Extensions → Apps Script**. Remplacer le contenu de `Code.gs`
par celui de [`Eval1-Report.gs`](Eval1-Report.gs). Enregistrer.

## 2. Construire les onglets

Dans l'éditeur, choisir la fonction **`installer`** puis **Exécuter**. Google demande
l'autorisation d'accéder au classeur (« Paramètres avancés → Accéder à… » : l'avertissement
est normal pour un script personnel). Le classeur reçoit :

- un onglet par classe, **4A à 4G**, organisé comme la feuille de report de l'an dernier
  (ligne 3 = barème, une colonne par question, totaux par compétence, notes sur 40, 20 et 30) ;
- un onglet **Journal** qui garde la trace de chaque envoi ;
- un onglet **Mode d'emploi**.

Coller ensuite la liste des élèves de chaque classe en colonne A, à partir de la ligne 4
(« NOM Prénom », export Ecole Directe). Ce n'est pas obligatoire : un élève absent de la
liste est ajouté en bas de son onglet, sur fond orangé, avec une remarque « à vérifier ».

## 3. Déployer en application web

**Déployer → Nouveau déploiement → Application web**

| Réglage | Valeur |
|---|---|
| Exécuter en tant que | **Moi** |
| Qui a accès | **Tout le monde** |

Copier l'**URL de l'application web** (elle finit par `/exec`).

## 4. Brancher la page

Dans `evaluation-1-tableur.html`, en tête du dernier script, renseigner :

```js
var SCRIPT_URL_REPORT = "https://script.google.com/macros/s/…/exec";
```

puis mettre en ligne (ou transmettre l'URL à Claude, qui le fera). Vérifier : ouvrir l'URL
`/exec` dans le navigateur affiche « P11 Évaluation n°1 : script de report en ligne. »

## Règles utiles

- **La première validation fait foi.** Un élève qui revalide (autre poste, autre navigateur)
  n'écrase pas sa note : l'envoi est seulement noté au Journal. Pour autoriser un nouvel
  envoi, effacer ses cellules C1, C2, C3 et la date.
- Un nom tapé avec des accents ou des majuscules différents est reconnu. Deux lignes
  possibles (homonymes) : l'élève est ajouté en bas, pour que vous tranchiez.
- Après toute modification du script : **Déployer → Gérer les déploiements → Modifier →
  Nouvelle version**, sinon l'ancienne version reste active.
- **Capsule du site Technologie.** Quand vous validez une copie « Évaluation n°1 » dans le
  modal professeur du site, ses points (Q1 à C3, remis sur 40) sont reportés sur la ligne de
  l'élève (identité de son compte du site), avec la remarque « Capsule du site — validée le… ».
  Revalider met la ligne à jour. **Protection :** une ligne qui contient déjà des points du
  parcours papier (Q1-Q6 saisis ou C1-C3 envoyés par la page du tableur) n'est jamais écrasée :
  le site affiche « report refusé » et le Journal garde la trace.
- Menu **P11 Évaluation 1** du classeur : réinstaller les onglets, ou tester un envoi
  (ligne « TEST Essai » en 4A, à effacer ensuite).
