# Remontée des résultats de la séance 5 vers Google Sheets

À faire **une seule fois**, en une dizaine de minutes. Tant que ce n'est pas
fait, l'activité fonctionne normalement : elle affiche simplement
« Envoi non configuré » dans le dossier, et le rendu se fait par impression.

## 1. Le classeur

Le classeur est déjà créé :

<https://docs.google.com/spreadsheets/d/1KM0b8t2JWtRS6dmB6K_qRlFj0paHwRGYAWRA7CSENDE/edit>

Ne rien créer à l'intérieur : l'onglet `P11-S5` et sa ligne d'en-têtes se
créent tout seuls au premier envoi.

## 2. Coller le script

Dans ce classeur : **Extensions → Apps Script**.

Supprimer le contenu de `Code.gs` et coller celui de
[`Code.gs`](Code.gs) (le fichier à côté de ce document). Enregistrer.

Le script est **attaché à ce classeur**, pas au backend du site principal.
C'est voulu : un redéploiement raté ici n'a aucun effet sur le reste du site.

## 3. Déployer en application web

**Déployer → Nouveau déploiement**, puis :

| Réglage | Valeur |
|---|---|
| Type | **Application web** |
| Description | `P11 S5 v1` |
| Exécuter en tant que | **Moi** (votre compte) |
| Qui a accès | **Tout le monde** |

« Tout le monde » est nécessaire : les élèves ne sont pas connectés à un compte
Google au moment où la page envoie. Le filtrage est assuré par le secret
partagé, et le script n'accepte que des lignes portant un code d'équipe.

Autoriser l'accès quand Google le demande (passer par « Paramètres avancés →
Accéder à … » au premier lancement, l'avertissement est normal pour un script
personnel non vérifié).

Copier l'**URL de l'application web**. Elle ressemble à :

```
https://script.google.com/macros/s/AKfycb.../exec
```

## 4. Renseigner l'URL dans l'activité

Dans [`../s5-pieuvre-cdcf/js/data.js`](../s5-pieuvre-cdcf/js/data.js), en bas du
fichier, remplacer `A_REMPLIR` :

```js
var CLOUD = {
  url: 'https://script.google.com/macros/s/AKfycb.../exec',
  secret: 'P11-S5-RB-2026',
  capsule: 'p11-s5'
};
```

Le `secret` doit rester **identique** à `SECRET_PARTAGE` dans `Code.gs`.
Pour le changer, le changer aux deux endroits.

Puis incrémenter le numéro de version dans `s5-pieuvre-cdcf/index.html`
(recherche-remplacement sur `v=2026-09-…`), commiter et pousser.

## 5. Vérifier

Dans l'éditeur Apps Script, lancer une fois la fonction `testerInstallation` :
elle écrit une ligne `TEST-0000` dans l'onglet. La supprimer ensuite.

Puis, depuis le site **publié** (pas depuis un serveur local — l'envoi y est
volontairement bloqué), créer un badge et vérifier une mission : la ligne doit
apparaître dans le classeur en quelques secondes, et le dossier affiche
« ✓ Envoyé ».

## Ce qui arrive dans le classeur

Une ligne par équipe, **mise à jour** à chaque vérification de mission — pas une
ligne par clic : la clé de remplacement est le code d'équipe. L'élève dispose en
plus d'un bouton **« Valider et envoyer à mon professeur »** dans son dossier,
pour refaire l'envoi une dernière fois quand il a terminé.

| Colonnes | Contenu |
|---|---|
| `date`, `classe`, `code`, `mode` | quand, qui, seul ou en binôme |
| `nom1`, `prenom1`, `nom2`, `prenom2` | identité, déjà mise en forme |
| `m1`, `m1_liens`, `m1_analyse` | mission 1 sur 20, et son détail |
| `m1_reperes` | les repères attribués aux six fonctions, dans l'ordre de la fiche |
| `m2`, `m2_objet` | mission 2 sur 20, et l'objet technique choisi |
| `m2_1_rep` … `m2_4_unite` | les quatre lignes du cahier des charges : repère, critère, niveau et unité **tels que l'élève les a saisis** |
| `m3_auto`, `m3_prof` | mission 3 : 12 points automatiques, 8 points professeur |
| `m3_appreciation` | appréciation générée automatiquement pour la mission 3 |
| `total`, `sur`, `note20`, `niveau` | note sur 20 et positionnement de compétence |
| `solution`, `probleme` | l'idée proposée en mission 3 |
| `presentation` | `oui` si l'équipe a été retenue pour la projection |
| `aides` | coups de pouce consultés en mission 2 |
| `remarque` | appréciation saisie par le professeur |

**À propos de `m1_reperes` :** les numéros suivent l'ordre dans lequel chaque
élève a tracé sa pieuvre. Deux élèves justes n'ont donc pas la même suite —
c'est normal, et c'est ce qui rend la triche par recopie inopérante. Ce qui
compte est la colonne `m1_analyse` : elle dit si chaque fonction a été reliée
au bon trait.

**Ce qui n'y arrive pas :** l'image de la maquette 3D et le détail des réponses.
Une cellule de tableur n'est pas faite pour cela — ils restent dans le dossier
imprimé et dans l'export JSON de l'élève.

## Croiser avec le travail en classe

Ce classeur est **séparé** de la feuille « Travail en classe » : rien n'y est
importé automatiquement. Pour comparer, le plus simple est un onglet de
rapprochement dans votre classeur habituel, avec une `RECHERCHEV` sur le nom :

```
=RECHERCHEV(A2; IMPORTRANGE("<id du classeur P11 S5>"; "P11-S5!F:S"); 14; FAUX)
```

`IMPORTRANGE` demande une autorisation la première fois : ouvrir la cellule,
cliquer sur « Autoriser l'accès ».

Cela reste une observation ponctuelle, à regarder au moment du bilan
trimestriel — pas une note de plus à saisir.

## En cas de problème

| Symptôme | Cause la plus probable |
|---|---|
| Le dossier affiche « Envoi non configuré » | `url` vaut encore `A_REMPLIR` dans `data.js` |
| Le dossier affiche « Mode local » | page ouverte depuis `localhost` ou un fichier : l'envoi y est bloqué exprès, pour ne pas écraser le travail d'un vrai élève |
| Le dossier reste « En attente » | réseau coupé : l'envoi repartira au prochain chargement de la page |
| Rien n'arrive, aucun message | le secret diffère entre `data.js` et `Code.gs`, ou le déploiement n'est pas en « Tout le monde » |
| Des lignes en double | le code d'équipe a changé : l'élève a recréé un badge au lieu de rouvrir le sien |

Après **toute** modification de `Code.gs`, il faut redéployer :
**Déployer → Gérer les déploiements → ✏️ → Version : Nouvelle version → Déployer**.
Garder la même URL en modifiant le déploiement existant, sinon il faut remettre
la nouvelle URL dans `data.js`.
