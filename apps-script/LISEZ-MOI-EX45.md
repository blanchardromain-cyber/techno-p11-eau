# Exercices n°4 (Choix Matériaux) et n°5 (Énergie Grise) — scripts des classeurs

Deux classeurs, deux scripts générés par `P11/P11_exercices_4_5/_sources/build_gs.py` (ne pas les modifier à la main) :

| Classeur | Script | Onglets |
|---|---|---|
| P11 — Exercice n°4 (Choix Matériaux) | [`Ex4-Report.gs`](Ex4-Report.gs) | 4A à 4G, **Attributions**, Journal, Compétences, **Clé** (masqué) |
| P11 — Exercice n°5 (Énergie Grise) | [`Ex5-Report.gs`](Ex5-Report.gs) | 4A à 4G, Journal, Compétences |

L'onglet **Attributions** (sujet de chaque élève, volume et quantité de l'exercice n°5, aides imposées) et la **Clé**
sont dans le classeur de l'exercice n°4 ; le script de l'exercice n°5 les lit là.

## Installation (une fois par classeur, le n°4 d'abord)

1. Ouvrir le classeur → **Extensions → Apps Script** → remplacer `Code.gs` par le script, enregistrer.
2. Choisir la fonction **`installer`** → **Exécuter** (autoriser l'accès ; pour le n°5, aussi au classeur du n°4).
   Elle écrit les en-têtes, la liste des élèves (lue dans Attributions), Journal et Compétences, puis vérifie la clé.
3. **Déployer → Nouveau déploiement → Application web** · Exécuter en tant que **Moi** · Accès **Tout le monde**.
4. Transmettre l'URL `/exec` à Claude, qui la branche dans les capsules et le site.

## Règles

- La capsule envoie les réponses brutes ; le script corrige avec la clé et **ne renvoie jamais les points**.
- La première copie reçue fait foi ; une copie suivante est notée « ignorée » au Journal.
- Changer le sujet d'un élève : modifier la colonne **Sujet** d'Attributions (identifiant du sujet, ex. `skate`) **avant** qu'il commence.
- Imposer une aide : colonne **Aides imposées** (« 2 candidats », « calculs guidés », « coups de pouce »).
- La note validée dans le site remplace la note automatique (colonnes « Note ajustée » et « Note finale », statut « validée »).
- Rien n'est envoyé depuis une page du site ouverte en local. Compte de test 4T : corrigé, jamais rangé.
- Après toute modification du script : **Déployer → Gérer les déploiements → Modifier → Nouvelle version**.
