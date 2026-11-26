// Essais du lecteur du clip A8, partagés par tester_declencheur.mjs et tester_diaporama.mjs.
// Chrome installé (channel "chrome") : le Chromium de Playwright ne lit pas le H.264 des clips.
import path from "node:path";

export async function lancerChrome(chromium) {
  return chromium.launch({ channel: "chrome", args: ["--autoplay-policy=no-user-gesture-required"] });
}

// url : page (file:// ou https://) ; id : id de la section du lecteur (absent pour la page autonome)
export async function testerClip(nav, url, id, ko, APE, prefixe) {
  const p = await nav.newPage({ viewport: { width: 1600, height: 900 } });
  const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message)); p.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
  await p.goto(url); await p.evaluate(() => document.fonts.ready);
  let k = 0;
  if (id) {
    k = await p.evaluate((id) => [...document.querySelectorAll("#points button")].findIndex((b) => b.title.startsWith(document.getElementById(id).dataset.titre)) + 1, id);
    await p.goto(url.split("#")[0] + "#" + k); await p.reload(); await p.evaluate(() => document.fonts.ready);
  }
  const sel = (id ? "#" + id + " " : "") + ".js-clip video";
  await p.waitForFunction((s) => document.querySelector(s).readyState >= 1, sel, { timeout: 15000 }).catch(() => ko(prefixe + " : métadonnées de la vidéo non chargées"));
  const m = await p.evaluate((s) => { const v = document.querySelector(s); const t = v.textTracks[0];
    return { err: v.error && v.error.code, dur: v.duration, pistes: v.textTracks.length, mode: t && t.mode, cues: t && t.cues ? t.cues.length : 0, src: v.currentSrc.split("/").pop() }; }, sel);
  console.log(`${prefixe} · vidéo :`, JSON.stringify(m));
  if (m.err || !(m.dur > 100)) ko(prefixe + " : vidéo illisible");
  if (!m.pistes || m.mode !== "showing" || m.cues < 10) ko(prefixe + " : sous-titres absents ou masqués");
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(APE, `${prefixe}_clip.png`) });

  // Lecture, puis bascule vers la version adaptée à 30 s : position proportionnelle, lecture continue
  await p.evaluate(async (s) => { const v = document.querySelector(s); v.muted = true; v.currentTime = 30; await v.play(); }, sel);
  await p.waitForTimeout(700);
  await p.click((id ? "#" + id + " " : "") + ".js-clip-ad");
  await p.waitForFunction((s) => { const v = document.querySelector(s); return /adapte/.test(v.currentSrc) && v.readyState >= 1 && v.currentTime > 1; }, sel, { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(600);
  const b = await p.evaluate((s) => { const v = document.querySelector(s); return { src: v.currentSrc.split("/").pop(), t: v.currentTime, joue: !v.paused, cues: v.textTracks[0].cues.length,
    presse: document.querySelector(".js-clip-ad").getAttribute("aria-pressed"), lien: (document.querySelector(".js-clip-lien[data-mp4]") || {}).href || "" }; }, sel);
  console.log(`${prefixe} · version adaptée :`, JSON.stringify({ ...b, lien: b.lien.split("/").pop() }));
  if (!/adapte/.test(b.src) || b.presse !== "true") ko(prefixe + " : bascule vers la version adaptée");
  if (Math.abs(b.t - 30 * 170.276 / 117.533) > 2.5) ko(prefixe + ` : position non gardée (${b.t.toFixed(1)} s au lieu d'environ 43,5 s)`);
  if (!b.joue) ko(prefixe + " : la lecture ne reprend pas après la bascule");
  if (b.lien && !/adapte/.test(b.lien)) ko(prefixe + " : le lien « vidéo seule » ne suit pas la version");
  // Sous-titres : bouton
  await p.click((id ? "#" + id + " " : "") + ".js-clip-st");
  const st = await p.evaluate((s) => document.querySelector(s).textTracks[0].mode, sel);
  if (st !== "hidden") ko(prefixe + " : le bouton Sous-titres ne les masque pas");
  await p.click((id ? "#" + id + " " : "") + ".js-clip-st");

  if (id) {
    // Le lecteur a le focus : espace ne change pas d'étape
    await p.focus(sel); const h0 = await p.evaluate(() => location.hash);
    await p.keyboard.press(" "); await p.keyboard.press("ArrowRight"); await p.waitForTimeout(300);
    const h1 = await p.evaluate(() => location.hash);
    if (h1 !== h0) ko(prefixe + ` : espace ou flèche sur le lecteur a changé d'étape (${h0} → ${h1})`);
    // Touche V hors du lecteur : lecture / pause
    await p.evaluate(() => document.activeElement && document.activeElement.blur());
    const avant = await p.evaluate((s) => document.querySelector(s).paused, sel);
    await p.keyboard.press("v"); await p.waitForTimeout(400);
    const apres = await p.evaluate((s) => document.querySelector(s).paused, sel);
    if (avant === apres) ko(prefixe + " : la touche V ne bascule pas lecture / pause");
    if (apres) { await p.keyboard.press("v"); await p.waitForTimeout(300); }
    // Quitter l'écran : la vidéo se met en pause
    await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(400);
    const pause = await p.evaluate((s) => document.querySelector(s).paused, sel);
    if (!pause) ko(prefixe + " : la vidéo continue après avoir quitté l'écran");
    console.log(`${prefixe} · clavier : espace sur lecteur ${h0}→${h1} ; V ${avant ? "pause→lecture" : "lecture→pause"} ; pause en quittant l'écran : ${pause}`);
    // Aperçu réduit à 50 %
    const p2 = await nav.newPage({ viewport: { width: 800, height: 450 } });
    await p2.goto(url.split("#")[0] + "#" + k); await p2.evaluate(() => document.fonts.ready); await p2.waitForTimeout(800);
    await p2.screenshot({ path: path.join(APE, `${prefixe}_clip_reduit50.png`) }); await p2.close();
  } else {
    // Page autonome : transcription dépliée par #transcription, horodatage cliquable
    await p.goto(url.split("#")[0] + "#transcription"); await p.waitForTimeout(500);
    const ouvert = await p.evaluate(() => document.getElementById("transcription").open);
    if (!ouvert) ko(prefixe + " : #transcription ne déplie pas la transcription");
    await p.screenshot({ path: path.join(APE, `${prefixe}_transcription.png`), fullPage: true });
  }
  erreurs.forEach((e) => ko(prefixe + " · console : " + e));
  await p.close();
}
