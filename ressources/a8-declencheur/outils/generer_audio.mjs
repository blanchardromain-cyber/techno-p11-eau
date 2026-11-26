// Audio de la lettre du fabricant : voix Piper locale (fr_FR-siwis-medium, voix de synthèse), puis
// normalisation en deux passes à −16 LUFS intégrés (pic ≤ −1,5 dBTP), WAV 48 kHz mono 16 bits.
// Usage : node outils/generer_audio.mjs
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { LETTRE } from "./texte_lettre.mjs";

const ici = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const VT = path.join(process.env.USERPROFILE, "Documents", "video-technologie");
const python = path.join(VT, ".venv", "Scripts", "python.exe");
const modele = path.join(VT, "models", "fr_FR-siwis-medium.onnx");
const ffmpeg = path.join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Packages",
  "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe", "ffmpeg-9.1-full_build", "bin", "ffmpeg.exe");
const brut = path.join(ici, "medias", "lettre_brute.wav"), sortie = path.join(ici, "lettre_fabricant.wav");

// Texte lu : celui de la lettre, sans balise ; « A et B » épelés pour la voix.
const sansBalise = (s) => s.replace(/<[^>]+>/g, "");
const texte = ["Voici la lettre de l'entreprise Fontelame.", LETTRE.appel, ...LETTRE.corps.map(sansBalise), LETTRE.fin, LETTRE.signe + "."]
  .join("\n").replace(/A et B/g, "A, et B");

const r = spawnSync(python, ["-m", "piper", "--model", modele, "--length_scale", "1.12", "--sentence_silence", "0.6", "--output_file", brut],
  { input: texte, encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
if (r.status !== 0 || !fs.existsSync(brut)) { console.error("Piper a échoué :", r.stderr); process.exit(1); }

const CIBLE = "I=-16:TP=-1.5:LRA=11";
const p1 = spawnSync(ffmpeg, ["-hide_banner", "-i", brut, "-af", `loudnorm=${CIBLE}:print_format=json`, "-f", "null", "-"], { encoding: "utf8" });
const m = JSON.parse(p1.stderr.slice(p1.stderr.lastIndexOf("{"), p1.stderr.lastIndexOf("}") + 1));
const af = `adelay=400:all=1,apad=pad_dur=0.8,loudnorm=${CIBLE}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
const p2 = spawnSync(ffmpeg, ["-hide_banner", "-y", "-i", brut, "-af", af, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", sortie], { encoding: "utf8" });
if (p2.status !== 0) { console.error(p2.stderr); process.exit(1); }
fs.unlinkSync(brut);

// Mesure de contrôle (EBU R128) sur le fichier final.
const v = spawnSync(ffmpeg, ["-hide_banner", "-i", sortie, "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const res = v.slice(v.lastIndexOf("Summary:"));
console.log(res.replace(/\s+/g, " ").trim());
const d = spawnSync(ffmpeg, ["-hide_banner", "-i", sortie], { encoding: "utf8" }).stderr.match(/Duration: ([\d:.]+)/);
console.log("Durée :", d && d[1], "· texte lu :\n" + texte);
