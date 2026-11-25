// Convertit 01_contenu.md en HTML à styles en ligne, pour un import en Google Docs (titres, listes, tableaux, gras, italique, code).
// Usage : node outils/md-vers-html.mjs <entrée.md> <sortie.html>
import fs from "node:fs";
const [entree, sortie] = process.argv.slice(2);
const lignes = fs.readFileSync(entree, "utf8").replace(/\r/g, "").split("\n");
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const enLigne = (t) => esc(t)
  .replace(/`([^`]+)`/g, '<span style="font-family:Consolas,monospace">$1</span>')
  .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
  .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<i>$2</i>");
const POLICE = "font-family:Arial,sans-serif;font-size:11pt;line-height:1.3";
const TD = "border:1px solid #6b7480;padding:4px 6px;vertical-align:top;font-size:10pt";
let html = [], i = 0;
while (i < lignes.length) {
  const l = lignes[i];
  if (!l.trim()) { i++; continue; }
  const h = l.match(/^(#{1,4}) (.*)$/);
  if (h) { const n = h[1].length, taille = [0, 18, 15, 13, 12][n];
    html.push(`<h${n} style="font-family:Arial,sans-serif;font-size:${taille}pt;color:#1d2433;margin:14pt 0 6pt">${enLigne(h[2])}</h${n}>`); i++; continue; }
  if (/^---+$/.test(l.trim())) { html.push('<hr>'); i++; continue; }
  if (l.startsWith("|")) {
    const bloc = []; while (i < lignes.length && lignes[i].startsWith("|")) bloc.push(lignes[i++]);
    const cellules = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    const rangs = bloc.filter((r) => !/^\|[\s:|-]+\|$/.test(r)).map(cellules);
    html.push(`<table style="border-collapse:collapse;width:100%;margin:4pt 0">` + rangs.map((r, k) =>
      `<tr>${r.map((c) => k === 0 ? `<th style="${TD};background:#1d2433;color:#ffffff;text-align:left">${enLigne(c)}</th>` : `<td style="${TD}">${enLigne(c)}</td>`).join("")}</tr>`).join("") + "</table>");
    continue;
  }
  const puce = /^(\s*)(- |\d+\. )/;
  if (puce.test(l)) {
    const ordonnee = /^\s*\d+\. /.test(l), items = [];
    while (i < lignes.length && puce.test(lignes[i])) {
      const retrait = lignes[i].match(/^(\s*)/)[1].length;
      items.push(`<li style="${POLICE};margin-left:${retrait * 6}pt">${enLigne(lignes[i].replace(puce, ""))}</li>`); i++;
    }
    html.push(`<${ordonnee ? "ol" : "ul"}>${items.join("")}</${ordonnee ? "ol" : "ul"}>`); continue;
  }
  if (l.startsWith("> ")) { html.push(`<p style="${POLICE};border-left:3pt solid #f5b700;padding-left:6pt">${enLigne(l.slice(2))}</p>`); i++; continue; }
  const para = []; while (i < lignes.length && lignes[i].trim() && !/^(#|\||- |\d+\. |---|> )/.test(lignes[i])) para.push(lignes[i++]);
  html.push(`<p style="${POLICE};margin:0 0 6pt">${enLigne(para.join(" "))}</p>`);
}
fs.writeFileSync(sortie, `<html><head><meta charset="utf-8"></head><body>${html.join("\n")}</body></html>`);
console.log(`${html.length} blocs, ${fs.statSync(sortie).size} octets`);
