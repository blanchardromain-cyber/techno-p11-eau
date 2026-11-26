// Conduite de la séance A8, source unique du déroulé PDF (deroule_professeur.pdf) et des notes du diaporama (diaporama-a8.html).
// t : heure prévue depuis le début de la séance (min:s) ; ecran : étape(s) de declencheur.html ; fait / dit : texte du professeur.

// Situation déclenchante (10 min) — colonnes du déroulé PDF
export const CONDUITE = [
  { cle: "avant", t: "avant", ecran: "—", fait: "Tester le débit (fiche « fabrication et test ») et repérer la manette au ruban. Tracer 4 cadres vierges numérotés 1 à 4 au tableau, sans titre. Aimanter les 4 étiquettes et la problématique <b>face contre le tableau</b>. Ouvrir <code>declencheur.html#1</code> en plein écran (F). Poser les cartes d'amorce (1 jeu par binôme) et les post-its.", dit: "—" },
  { cle: "lettre", t: "0:00", ecran: "1 à 3", fait: "Lire la lettre, ou la faire écouter (A). Bouton « Facile à lire » (L) si besoin.", dit: "<q>Une entreprise nous a écrit. Écoutez bien : elle a un problème.</q>" },
  { cle: "mains", t: "1:00", ecran: "4", fait: "Faire passer A et B de main en main. Ne rien commenter.", dit: "<q>Voici les deux turbines d'essai de Fontelame. Prenez-les en main, faites-les passer. Pour l'instant, on ne dit rien.</q>" },
  { cle: "pari", t: "1:30", ecran: "5 et 6", fait: "Faire parier, puis démonstration au point d'eau, filet repéré : B, puis A. Laisser entendre l'eau.", dit: "<q>Pariez : laquelle va tourner sous un petit filet d'eau ? Levez la main pour A… pour B.</q> Puis : <q>Regardez… et écoutez.</q> Puis, sans conclure : <q>Je ne vous explique rien. C'est vous qui allez poser les questions.</q>" },
  { cle: "questions", t: "2:00", ecran: "7", fait: "Lancer le minuteur (Entrée). Circuler. À 1 min 30, la page affiche « Changez de rôle ! ». Post-its de la couleur 1.", dit: "<q>Par deux, écrivez le plus de questions possible sur ce que vous avez vu et sur la lettre. Une question par post-it. Interdit d'y répondre ! Vous pouvez aussi dire la question à votre binôme, qui l'écrit, ou la dessiner. Les cartes vous aident à commencer.</q> Pendant : <q>Bonne question. Écris-la.</q>" },
  { cle: "tri", t: "5:00", ecran: "8", fait: "Lancer le minuteur. Les binômes collent leurs post-its dans les 4 cadres, en rassemblant ce qui se ressemble. Le professeur regroupe à voix haute avec la classe.", dit: "<q>Venez coller vos questions. Mettez ensemble celles qui se ressemblent.</q> Puis : <q>Ces deux-là parlent de la même chose ? Comment on pourrait appeler ce groupe ?</q>" },
  { cle: "revelation", t: "7:00", ecran: "9 à 12", fait: "Retourner les étiquettes une à une au tableau, en même temps qu'à l'écran (espace). Une zone vide : relance (page 2), post-its de la couleur 2.", dit: "<q>Vous avez trouvé 4 familles de questions. Voici comment je les appelle.</q>" },
  { cle: "probleme", t: "8:00", ecran: "13", fait: "Retourner la bande de la problématique.", dit: "<q>Toutes vos questions tiennent en une seule. C'est notre problématique pour l'activité 8.</q>" },
  { cle: "transition", t: "9:00", ecran: "14", fait: "Photographier le tableau (relevé). Écran « Le clip » : V pour le lancer.", dit: "<q>Pour y répondre, on a besoin d'une méthode. Regardez.</q>" },
];

// Lancement de l'activité 8 (suite de la séance) — utilisé par le diaporama.
// Durées : clip 2 min + 2 min de marge (capsule au besoin), partie A 20 min et partie B 10 min (capsule et fiche élève).
export const LANCEMENT = [
  { cle: "clip", t: "10:00", duree: 4, fait: "Lancer le clip de méthode (V, 2 min), sous-titres actifs ; « Version adaptée » si besoin. Ne rien ajouter sur le matériau. S'il reste des doutes sur une étape, ouvrir la capsule (<code>capsule-a8.html</code>) sur cette étape. Le clip est aussi sur le réseau pour un visionnage individuel (casque).", dit: "<q>Voici comment on va s'y prendre, en 2 minutes. Regardez bien la démarche : vous l'aurez sur votre fiche repère.</q> Après : <q>Quelle est la première étape ? Et la dernière ?</q>" },
  { cle: "repere", t: "14:00", duree: 2, fait: "Distribuer la fiche élève A8 (1 par élève) et la fiche repère plastifiée (1 par binôme ; version adaptée à qui la veut). Attribuer les rôles.", dit: "<q>La fiche repère reste à côté de l'écran pendant toute l'activité. Pilote : il tient la souris. Vérificateur : il lit la fiche et vérifie chaque étape. On échange à mi-parcours.</q>" },
  { cle: "partieA", t: "16:00", duree: 20, fait: "Minuteur de 20 min (« Changez de rôle ! » à 10 min). Circuler ; renvoyer à la fiche repère plutôt que répondre. Pendant ce temps, saisir 2 ou 3 questions par zone dans l'écran « Vos questions », d'après la photo du tableau.", dit: "<q>Partie A : ouvrez la Matériauthèque, niveau 4ᵉ, et faites le parcours jusqu'à l'étape 6, « Je justifie ». Puis complétez les questions 1 à 4 de la fiche. Vous avez 20 minutes.</q>" },
  { cle: "partieB", t: "36:00", duree: 10, fait: "Minuteur de 10 min. Vérifier que chaque binôme recopie les résultats avec leurs unités.", dit: "<q>Partie B : ouvrez le mini-tableur de l'énergie grise. D'abord la masse de votre turbine, ensuite son énergie grise. Complétez les questions 5 à 7. 10 minutes.</q>" },
  { cle: "bilan", t: "46:00", duree: 4, fait: "Revenir aux questions de la classe : cocher, avec les élèves, celles qui ont maintenant une réponse. Ne pas corriger ici : la mise en commun suit.", dit: "<q>Revenons à vos questions de tout à l'heure. Lesquelles ont maintenant une réponse ? Lesquelles restent ouvertes ?</q>" },
];

export const ANTICIPATION = [
  [1, ["En quoi sont faites les turbines ?", "Est-ce que A et B sont dans la même matière ?", "On peut faire une turbine en bois ?"], "Montrer A et B côte à côte : <q>Elles se ressemblent. Qu'est-ce qui pourrait être différent, sans qu'on le voie ?</q>"],
  [2, ["Pourquoi B tourne et pas A ?", "Pourquoi A est plus lourde ?", "Laquelle est la meilleure pour le robinet ?"], "<q>Si vous étiez l'entreprise, laquelle garderiez-vous… et comment vous le justifieriez ?</q>"],
  [3, ["Comment on fabrique une turbine ?", "Avec quelle machine ?", "Combien de temps pour en faire une ?"], "Carte <q>Et pour en fabriquer 10 000 ?</q>, puis carte <q>Et pour en fabriquer une seule, ici, au collège ?</q>"],
  [4, ["Combien coûte une turbine ?", "Est-ce que ça pollue de la fabriquer ?", "D'où vient la matière ?"], "Sachet <q>D'où vient la matière ?</q> (faire toucher granulés et fil), puis carte <q>Qu'a-t-il fallu pour la transformer ?</q>"],
];

export const IMPREVUS = [
  ["A tourne quand même", "Réduire le débit jusqu'au repère. Sinon, faire comparer le démarrage : <q>Laquelle démarre la première ?</q> Ne jamais expliquer. Point d'eau inaccessible : sèche-cheveux à air froid (fiche « fabrication et test »)."],
  ["Une question hors sujet", "L'accepter sans la juger : <q>On la garde.</q> La coller dans un « parking » au bord du tableau. On y revient en fin de séquence si on a le temps."],
  ["Une classe muette", "Lire une carte d'amorce à voix haute : <q>Pourquoi… ? Pourquoi quoi ? Qu'avez-vous vu ?</q> Écrire la première question sous la dictée d'un élève. Refaire passer les turbines, puis donner 30 s de plus. Binôme bloqué : plateau A5 et cartes adaptées."],
  ["Un binôme répond au lieu de questionner", "<q>Bonne idée : transforme-la en question.</q> (« A est plus lourde » → « Pourquoi A est-elle plus lourde ? »)"],
];
