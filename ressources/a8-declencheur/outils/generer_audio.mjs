// Audio de la lettre du fabricant → lettre_fabricant.wav (WAV 48 kHz mono 16 bits, −16 LUFS intégrés, pic ≤ −1,5 dBTP).
//
// Par défaut : la voix du professeur, enregistrée le 27/11/2026 (fichier AAC sur son Drive, hors dépôt).
//   Découpe juste avant le premier mot et juste après le dernier (instants repérés par faster-whisper),
//   mono, coupe-bas 70 Hz, fondus de 60 ms, silences de garde, normalisation en deux passes.
// Repli, seulement sur demande : node outils/generer_audio.mjs --piper  (voix de synthèse Piper fr_FR-siwis-medium).
// Usage : node outils/generer_audio.mjs [--piper] [--source <fichier audio>]
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
const sortie = path.join(ici, "lettre_fabricant.wav");
const CIBLE = "I=-16:TP=-1.5:LRA=11";

// Enregistrement du professeur (le nom de fichier contient un caractère invisible U+200B avant « .aac »).
const VOIX_PROF = {
  fichier: "G:\\Mon Drive\\2 - Technologie\\1 - Technologie 4° 182 élèves\\Classe\\P11\\A8\\27 nov. à 08.17\u200b.aac",
  debut: 0.45,   // s : premier mot « Bonjour » vers 0,68 s
  fin: 52.40,    // s : dernier mot « Fontelame » fini à 52,04 s ; l'enregistrement dure 52,77 s
};

const args = process.argv.slice(2);
const piper = args.includes("--piper");
const iSrc = args.indexOf("--source");
const source = iSrc >= 0 ? args[iSrc + 1] : VOIX_PROF.fichier;

function normaliser(entree, filtresAvant) {
  const p1 = spawnSync(ffmpeg, ["-hide_banner", "-i", entree, "-af", `${filtresAvant},loudnorm=${CIBLE}:print_format=json`, "-f", "null", "-"], { encoding: "utf8" });
  const m = JSON.parse(p1.stderr.slice(p1.stderr.lastIndexOf("{"), p1.stderr.lastIndexOf("}") + 1));
  const af = `${filtresAvant},loudnorm=${CIBLE}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  const p2 = spawnSync(ffmpeg, ["-hide_banner", "-y", "-i", entree, "-af", af, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", sortie], { encoding: "utf8" });
  if (p2.status !== 0) { console.error(p2.stderr); process.exit(1); }
}

if (piper) {
  // Repli : voix de synthèse. Texte de la lettre sans balise ; « A et B » épelés pour la voix.
  const brut = path.join(ici, "medias", "lettre_brute.wav");
  const sansBalise = (s) => s.replace(/<[^>]+>/g, "");
  const texte = ["Voici la lettre de l'entreprise Fontelame.", LETTRE.appel, ...LETTRE.corps.map(sansBalise), LETTRE.fin, LETTRE.signe + "."]
    .join("\n").replace(/A et B/g, "A, et B");
  const r = spawnSync(python, ["-m", "piper", "--model", modele, "--length_scale", "1.12", "--sentence_silence", "0.6", "--output_file", brut],
    { input: texte, encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
  if (r.status !== 0 || !fs.existsSync(brut)) { console.error("Piper a échoué :", r.stderr); process.exit(1); }
  normaliser(brut, "adelay=400:all=1,apad=pad_dur=0.8");
  fs.unlinkSync(brut);
  console.log("Voix de synthèse Piper (repli).");
} else {
  if (!fs.existsSync(source)) { console.error(`Enregistrement introuvable : ${source}\n(Drive non monté ? Sinon : --source <fichier>, ou --piper pour la voix de synthèse.)`); process.exit(1); }
  const { debut, fin } = source === VOIX_PROF.fichier ? VOIX_PROF : { debut: 0, fin: 1e6 };
  const dur = Math.min(fin, 1e5) - debut;
  const filtres = [
    `atrim=start=${debut}:end=${fin}`, "asetpts=PTS-STARTPTS",
    "pan=mono|c0=0.5*c0+0.5*c1", "highpass=f=70",
    "afade=t=in:d=0.06", fin < 1e5 ? `afade=t=out:st=${(dur - 0.06).toFixed(2)}:d=0.06` : "anull",
    "adelay=350:all=1", "apad=pad_dur=0.7",
  ].join(",");
  normaliser(source, filtres);
  console.log("Voix du professeur :", source);
}

// Mesure de contrôle (EBU R128) sur le fichier final.
const v = spawnSync(ffmpeg, ["-hide_banner", "-i", sortie, "-af", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" }).stderr;
console.log(v.slice(v.lastIndexOf("Summary:")).replace(/\s+/g, " ").trim());
const d = spawnSync(ffmpeg, ["-hide_banner", "-i", sortie], { encoding: "utf8" }).stderr.match(/Duration: ([\d:.]+)/);
console.log("Durée :", d && d[1]);
