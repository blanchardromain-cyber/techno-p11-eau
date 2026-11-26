// Pictogrammes du kit A8 (SVG au trait, 64 × 64, couleur = currentColor). Aucun emoji, aucune ressource externe.
const dents = (n, r1, r2, cx = 32, cy = 32) => {
  const pts = [];
  for (let i = 0; i < n * 4; i++) {
    const a = (i / (n * 4)) * 2 * Math.PI, r = i % 4 < 2 ? r2 : r1;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}"/>`;
};
const turbine = (cx = 32, cy = 32, R = 26) => {
  let s = `<circle cx="${cx}" cy="${cy}" r="${R * 0.32}"/>`;
  for (let k = 0; k < 8; k++) {
    const a0 = (k / 8) * 2 * Math.PI, r0 = R * 0.32, a1 = a0 + 0.55;
    const p = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
    s += `<path d="M${p(r0, a0)} Q${p(R * 0.75, a0 + 0.1)} ${p(R, a1)}"/>`;
  }
  return s;
};

export const P = {
  robinet: `<path d="M6 20h26a10 10 0 0 1 10 10v8"/><path d="M6 14v12"/><path d="M38 38h8"/><path d="M20 20v-8M14 12h12"/>`,
  filet: `<path d="M6 16h26a10 10 0 0 1 10 10v6"/><path d="M6 10v12"/><path d="M38 32h8"/><path d="M42 38v4M42 47v3M42 55v3" stroke-width="2.5"/>`,
  goutte: `<path d="M32 6C23 21 16 30 16 40a16 16 0 0 0 32 0c0-10-7-19-16-34z"/>`,
  pieces: `<ellipse cx="24" cy="48" rx="16" ry="6"/><path d="M8 48v-8M40 48v-8"/><ellipse cx="24" cy="40" rx="16" ry="6"/><path d="M8 40v-8M40 40v-8"/><ellipse cx="24" cy="32" rx="16" ry="6"/><circle cx="48" cy="18" r="11"/><path d="M52 13.5a6 6 0 1 0 0 9M42 16.5h8M42 19.5h8"/>`,
  usine: `<path d="M6 56V32l14 9v-9l14 9v-9l14 9V12h9v44z"/><path d="M14 48h6M28 48h6M42 48h6"/>`,
  beaucoup: `<rect x="6" y="36" width="14" height="14" rx="2"/><rect x="25" y="36" width="14" height="14" rx="2"/><rect x="44" y="36" width="14" height="14" rx="2"/><rect x="15" y="18" width="14" height="14" rx="2"/><rect x="34" y="18" width="14" height="14" rx="2"/><rect x="25" y="2" width="14" height="13" rx="2"/>`,
  question: `<path d="M8 12h48v30H30l-11 11V42H8z"/><path d="M26 21a6 6 0 1 1 8.5 5.4c-1.7.8-2.5 1.8-2.5 3.8"/><circle cx="32" cy="35.5" r="1.6" fill="currentColor"/>`,
  loupe: `<circle cx="27" cy="27" r="16"/><path d="M39 39l17 17"/>`,
  etapes: `<rect x="4" y="10" width="16" height="16" rx="3"/><rect x="24" y="24" width="16" height="16" rx="3"/><rect x="44" y="38" width="16" height="16" rx="3"/><path d="M12 30v8h8M32 44v8h8"/>`,
  barres: `<path d="M14 54V40M32 54V26M50 54V12" stroke-width="9"/><path d="M6 58h52"/>`,
  ampoule: `<path d="M24 42c0-6-9-10-9-21a17 17 0 0 1 34 0c0 11-9 15-9 21z"/><path d="M25 48h14M27 54h10"/>`,
  dominos: `<rect x="9" y="18" width="11" height="32" rx="2" transform="rotate(-24 14.5 34)"/><rect x="28" y="18" width="11" height="32" rx="2"/><path d="M45 34h13M52 28l6 6-6 6"/>`,
  origine: `<path d="M32 59S13 38 13 25a19 19 0 0 1 38 0c0 13-19 34-19 34z"/><circle cx="32" cy="25" r="7"/>`,
  ouinon: `<path d="M6 34l9 9 15-18"/><path d="M38 24l18 18M56 24L38 42"/>`,
  echantillons: `<rect x="6" y="34" width="22" height="22" rx="2"/><circle cx="45" cy="45" r="11"/><path d="M33 29l11-22 11 22z"/>`,
  balance: `<path d="M32 9v45M18 56h28M10 17h44"/><path d="M10 17L4 34h12zM54 17l-6 17h12z"/><path d="M4 34a6 4 0 0 0 12 0M48 34a6 4 0 0 0 12 0"/>`,
  engrenage: `${dents(8, 20, 26)}<circle cx="32" cy="32" r="8"/>`,
  cout: `<circle cx="32" cy="32" r="24"/><path d="M36 14L23 35h10l-5 15 14-22H31z" fill="currentColor" stroke-linejoin="round"/>`,
  velo: `<circle cx="15" cy="42" r="11"/><circle cx="49" cy="42" r="11"/><path d="M15 42l11-18h15l8 18M26 24l8 18H15M22 19h9M41 24l-2-7h7"/>`,
  gourde: `<rect x="19" y="20" width="26" height="38" rx="7"/><rect x="24" y="7" width="16" height="13" rx="2"/><path d="M19 32h26"/>`,
  casque: `<path d="M7 42a25 25 0 0 1 50 0z"/><path d="M5 42h54M20 25l4 9M32 19v11M44 25l-4 9"/>`,
  roche: `<path d="M7 47l7-19 15-9 16 5 12 14-5 14-22 4z"/><path d="M14 28l12 6 19-10M26 34l-4 18"/>`,
  petrole_plante: `<path d="M18 10C12 22 8 29 8 36a10 10 0 0 0 20 0c0-7-4-14-10-26z" fill="currentColor"/><path d="M34 56c0-18 9-30 24-32 0 18-9 30-24 32z"/><path d="M34 56l16-22"/>`,
  granules: `<circle cx="12" cy="48" r="5"/><circle cx="24" cy="52" r="5"/><circle cx="18" cy="39" r="5"/><circle cx="30" cy="42" r="5"/><circle cx="8" cy="57" r="4"/><ellipse cx="46" cy="16" rx="12" ry="5"/><path d="M34 16v26M58 16v26"/><ellipse cx="46" cy="42" rx="12" ry="5"/><path d="M36 24c6 3 14 3 20 0M36 32c6 3 14 3 20 0"/>`,
  flamme: `<path d="M32 59c-13 0-19-9-19-19 0-13 13-17 13-31 8 6 10 15 8 21 4-2 6-6 6-11 7 7 11 13 11 21 0 10-6 19-19 19z"/>`,
  ecole: `<path d="M6 30L32 11l26 19M13 25v31h38V25"/><path d="M27 56V42h10v14"/><path d="M32 18v6"/>`,
  turbine: turbine(),
  oreille: `<path d="M20 26a14 14 0 1 1 26 7c-3 5-8 7-8 14a8 8 0 0 1-15 3"/><path d="M28 27a5 5 0 1 1 8 4"/>`,
  postit: `<path d="M10 8h44v34L40 56H10z"/><path d="M54 42H40v14"/><path d="M18 20h26M18 29h22"/>`,
};

// Rendu : <svg> avec trait épais, arrondi.
export const picto = (nom, mm, ep = 3.6, couleur = "currentColor", extra = "") =>
  `<svg class="picto ${extra}" viewBox="0 0 64 64" style="width:${mm}mm;height:${mm}mm;color:${couleur}" fill="none" stroke="currentColor" stroke-width="${ep}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[nom]}</svg>`;

// Les 4 zones du tableau : couleur + motif (jamais la couleur seule) + pictogramme.
export const ZONES = [
  { n: 1, q: "Quel matériau ?", picto: "echantillons", c: "#2E75B6", motif: "rayures", nomMotif: "rayures" },
  { n: 2, q: "Pourquoi celui-là ?", picto: "balance", c: "#C55A11", motif: "pois", nomMotif: "pois" },
  { n: 3, q: "Comment le fabriquer ?", picto: "engrenage", c: "#2E7D32", motif: "damier", nomMotif: "damier" },
  { n: 4, q: "Qu'a-t-il coûté à fabriquer ?", picto: "cout", c: "#6A3D9A", motif: "vagues", nomMotif: "vagues" },
];

// Motif SVG : fond couleur, dessin blanc. Rendu en <svg> de taille libre (preserveAspectRatio none sur le cadre).
export const motif = (z, id) => {
  const d = {
    rayures: `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="${z.c}"/><rect width="4" height="10" fill="#fff" opacity=".55"/></pattern>`,
    pois: `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${z.c}"/><circle cx="6" cy="6" r="2.6" fill="#fff" opacity=".7"/></pattern>`,
    damier: `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${z.c}"/><rect width="6" height="6" fill="#fff" opacity=".5"/><rect x="6" y="6" width="6" height="6" fill="#fff" opacity=".5"/></pattern>`,
    vagues: `<pattern id="${id}" width="16" height="10" patternUnits="userSpaceOnUse"><rect width="16" height="10" fill="${z.c}"/><path d="M0 5q4-5 8 0t8 0" stroke="#fff" stroke-width="2" fill="none" opacity=".75"/></pattern>`,
  }[z.motif];
  return d;
};
// Sans viewBox : le motif garde ses proportions quelle que soit la taille du cadre ; « echelle » grossit le dessin.
export const bandeMotif = (z, id, cls = "", echelle = 1) =>
  `<svg class="bande ${cls}" aria-hidden="true"><defs>${motif(z, id)}</defs><g transform="scale(${echelle})"><rect width="4000" height="4000" fill="url(#${id})"/></g></svg>`;
