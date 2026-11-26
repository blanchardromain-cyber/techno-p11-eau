// Texte de la lettre du fabricant (entreprise imaginaire), partagé par le PDF, l'audio et la page projetée.
// Règle d'or : ni matériau, ni critère, ni procédé, ni valeur de l'activité 8. 120 mots au plus.
export const LETTRE = {
  appel: "Bonjour à toute la classe,",
  corps: [
    "Nous fabriquons le robinet automatique que vous connaissez bien. Nous avons un problème, et nous avons besoin de vous.",
    "Des clients se plaignent : quand on ouvre juste un petit filet d'eau, le robinet ne s'allume pas.",
    "La turbine que nous utilisons aujourd'hui nous coûte cher. Et nous devons en fabriquer beaucoup, pour beaucoup de robinets.",
    "Nous vous confions deux turbines d'essai, A et B. <span style=\"white-space:nowrap\">Observez-les</span>, puis faites-les tourner.",
    "Avant de décider quoi que ce soit, nous voulons vos questions. Toutes vos questions !",
  ],
  fin: "Merci d'avance pour votre aide.",
  signe: "Le bureau d'études de Fontelame",
};

// Version facile à lire : un pictogramme (outils/pictos.mjs) par idée, une phrase courte.
export const FALC = [
  ["usine", "Nous fabriquons des robinets automatiques."],
  ["filet", "Avec un petit filet d'eau, le robinet ne s'allume pas."],
  ["pieces", "La turbine nous coûte cher."],
  ["beaucoup", "Nous devons fabriquer beaucoup de turbines."],
  ["turbine", "Voici deux turbines : A et B."],
  ["question", "Aidez-nous : posez-nous vos questions."],
];

// Problématique officielle de l'activité 8 (fiche élève), affichée en dernier.
export const PROBLEMATIQUE = "Quel matériau choisir pour la turbine du robinet automatique, et quelle énergie a-t-il fallu pour la fabriquer ?";
