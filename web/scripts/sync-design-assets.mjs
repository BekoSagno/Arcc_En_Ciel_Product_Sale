/**
 * Copie les visuels Canva depuis les dossiers du projet vers web/public/canva/
 * Exécutez depuis web/ : npm run sync-design-assets
 *
 * Dossiers attendus (à la racine du projet, à côté de web/) :
 *   - Design sans titre (4)/  → étoiles numérotées (9,10,6,5.svg)
 *   - Design sans titre/       → PNG optionnels (surlignages, etc.)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const projectRoot = path.join(webRoot, "..");
const destHow = path.join(webRoot, "public", "canva", "how-it-works");

const copies = [
  ["Design sans titre (4)", "9.svg", "star-1.svg"],
  ["Design sans titre (4)", "10.svg", "star-2.svg"],
  ["Design sans titre (4)", "6.svg", "star-3.svg"],
  ["Design sans titre (4)", "5.svg", "star-4.svg"],
];

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function copyIfExists(from, to) {
  if (!fs.existsSync(from)) return false;
  fs.copyFileSync(from, to);
  return true;
}

ensureDir(destHow);
let ok = 0;
let miss = 0;

for (const [folder, file, destName] of copies) {
  const src = path.join(projectRoot, folder, file);
  const dest = path.join(destHow, destName);
  if (copyIfExists(src, dest)) {
    console.log(`OK  ${destName} ← ${folder}/${file}`);
    ok++;
  } else {
    console.warn(`SKIP ${destName} (fichier absent : ${folder}/${file})`);
    miss++;
  }
}

const pngBrush = [
  ["Design sans titre", "7.png", "brush-coral.png"],
  ["Design sans titre", "1.png", "brush-yellow.png"],
];

for (const [folder, file, destName] of pngBrush) {
  const src = path.join(projectRoot, folder, file);
  const dest = path.join(destHow, destName);
  if (copyIfExists(src, dest)) {
    console.log(`OK  ${destName} ← ${folder}/${file}`);
    ok++;
  }
}

console.log(`\nTerminé : ${ok} copié(s), ${miss} manquant(s) (placeholders public conservés si besoin).`);
