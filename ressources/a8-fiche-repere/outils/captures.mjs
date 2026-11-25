// Captures d'éléments d'interface NEUTRES de la Matériauthèque (niveau 4e) pour la fiche repère A8.
// Aucune capture ne montre un tri, un verdict, un critère ou un matériau de la turbine.
// Usage (depuis video-technologie, où Playwright est installé) : node <ce fichier> <dossier de sortie>
import { createRequire } from "node:module";
const require = createRequire(`${process.env.USERPROFILE}/Documents/video-technologie/package.json`);
const { chromium } = require("playwright");

const sortie = process.argv[2];
const URL = "https://blanchardromain-cyber.github.io/materiautheque/?niveau=4";
const etat = (etape) => ({ schema: 2, niveau: 4, composant: "turbine-p11", etape, max: 6, contraintes: {}, contraintesVues: false,
  ordre: null, ordreCriteres: null, classement: {}, criteresVus: false, justif: {}, actifs: [], comparer: [], choix: null,
  essais: 0, serie: null, proto: null, texte: {}, familleRep: null, sousFamilleRep: null, ident: {} });

const nav = await chromium.launch();
const page = await nav.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 3 });
await page.goto(URL);
async function aller(etape) {
  await page.evaluate((e) => { localStorage.setItem("materiautheque-niveau", "4"); localStorage.setItem("materiautheque-piece", "turbine-p11");
    localStorage.setItem("materiautheque-i2", JSON.stringify(e)); }, etat(etape));
  await page.reload();
  await page.waitForSelector("#scene h2");
}
await aller(1);
await page.locator("#etapes").screenshot({ path: `${sortie}/barre-etapes.png` });
await page.locator('[data-action="verifier-contraintes"]').screenshot({ path: `${sortie}/bouton-verifier.png` });
await aller(4);
await page.locator(".tri-criteres .aide", { hasText: "●" }).screenshot({ path: `${sortie}/legende-points.png` });
await page.locator(".echantillon-actions .case.petite").first().screenshot({ path: `${sortie}/case-comparer.png` });
await nav.close();
console.log("captures faites");
