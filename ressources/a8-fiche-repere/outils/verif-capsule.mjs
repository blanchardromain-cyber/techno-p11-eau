// Vérifie la barre des étapes de la capsule A8 (6 étapes) : aucun débordement, captures des écrans concernés.
// Usage : node outils/verif-capsule.mjs <dossier de sortie>
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
const require = createRequire(`${process.env.USERPROFILE}/Documents/video-technologie/package.json`);
const { chromium } = require("playwright");
const ici = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const capsule = pathToFileURL(path.resolve(ici, "../../capsule-a8.html")).href;
const sortie = process.argv[2];
const nav = await chromium.launch();
for (const [l, h] of [[1440, 900], [1280, 720], [768, 1024]]) {
  const page = await nav.newPage({ viewport: { width: l, height: h } });
  for (let n = 1; n <= 8; n++) {
    await page.goto(`${capsule}?v=${Date.now()}#${n}`);
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => [...document.querySelectorAll(".ecran")].filter((e) => getComputedStyle(e).display !== "none" && e.getBoundingClientRect().width > 0)
      .flatMap((ec) => [...ec.querySelectorAll(".fil")].map((f) => {
        const rf = f.getBoundingClientRect(), re = ec.getBoundingClientRect();
        const etapes = [...f.querySelectorAll(".e")].map((e) => e.textContent.trim());
        return { etapes: etapes.length, deborde: f.scrollWidth > f.clientWidth + 1, horsEcran: rf.right > re.right + 1, dernier: etapes.at(-1) };
      })));
    if (r.length) {
      console.log(`${l}x${h} écran #${n}`, JSON.stringify(r));
      if (l === 1440) await page.screenshot({ path: `${sortie}/capsule_ecran${n}.png` });
    }
  }
  await page.close();
}
await nav.close();
