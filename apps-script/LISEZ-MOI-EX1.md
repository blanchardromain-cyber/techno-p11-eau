# Exercice n°1 (Capteurs, actionneurs & CDCF) — report automatique des notes

Quand le professeur clique sur **Enregistrer la note** dans le modal d'une copie « P11 — Exercice n°1 »
du site Technologie, les points des 8 parties (A1 à D, sur 30), la note validée (sur 20 ou 30) et
l'appréciation sont reportés dans le classeur **« Evaluation P11 — Exercice n°1 (Capteurs, actionneurs & CDCF) »**,
sur la ligne de l'élève (identité de son compte du site), dans l'onglet de sa classe.

## Installation (une seule fois)

1. Ouvrir le classeur → **Extensions → Apps Script** → remplacer `Code.gs` par [`Ex1-Report.gs`](Ex1-Report.gs), enregistrer.
2. Choisir la fonction **`installer`** → **Exécuter** (autoriser l'accès). Onglets 4A à 4G, Journal, Mode d'emploi.
3. **Déployer → Nouveau déploiement → Application web** · Exécuter en tant que **Moi** · Accès **Tout le monde**.
4. Transmettre l'URL `/exec` à Claude, qui la branche dans le site (`cabler_report_ex1.py <URL>`).

## Règles

- Revalider une copie met la ligne à jour (c'est la dernière validation qui compte).
- **Protection :** une ligne dont les points ont été saisis à la main n'est jamais écrasée : le site affiche
  « report refusé » et le Journal garde la trace.
- Élève introuvable ou homonyme : ajouté en bas de l'onglet, fond orangé, remarque « vérifier le nom ».
- Rien n'est envoyé depuis une page du site ouverte en local.
- Après toute modification du script : **Déployer → Gérer les déploiements → Modifier → Nouvelle version**.
