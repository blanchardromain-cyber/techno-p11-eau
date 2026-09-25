# Exercice n°2 (Le diagramme FAST) — report automatique des notes

Quand le professeur clique sur **Enregistrer la note** (ou **Valider**) dans le modal d'une copie « P11 — Exercice n°2 »
du site Technologie, les points des 7 parties (A à D, sur 30), la note validée (sur 20 ou 30) et
l'appréciation sont reportés dans le classeur **« P11 — Exercice n°2 (Le diagramme FAST) »**,
sur la ligne de l'élève (identité de son compte du site), dans l'onglet de sa classe.

## Installation (une seule fois)

1. Ouvrir le classeur → **Extensions → Apps Script** → remplacer `Code.gs` par [`Ex2-Report.gs`](Ex2-Report.gs), enregistrer.
2. Choisir la fonction **`installer`** → **Exécuter** (autoriser l'accès). Onglets 4A à 4G, Journal, Mode d'emploi.
3. **Déployer → Nouveau déploiement → Application web** · Exécuter en tant que **Moi** · Accès **Tout le monde**.
4. Transmettre l'URL `/exec` à Claude, qui la branche dans le site (à coller dans `P11_REPORT["p11-ex2"].url` d'index.html).

## Règles

- Revalider une copie met la ligne à jour (c'est la dernière validation qui compte).
- **Protection :** une ligne dont les points ont été saisis à la main n'est jamais écrasée : le site affiche
  « report refusé » et le Journal garde la trace.
- Élève introuvable ou homonyme : ajouté en bas de l'onglet, fond orangé, remarque « vérifier le nom ».
- Rien n'est envoyé depuis une page du site ouverte en local.
- Après toute modification du script : **Déployer → Gérer les déploiements → Modifier → Nouvelle version**.
- Le bouton **Reporter toutes les copies validées** n'envoie que les copies pas encore reportées ou modifiées depuis leur dernier report (mémoire propre au navigateur).
