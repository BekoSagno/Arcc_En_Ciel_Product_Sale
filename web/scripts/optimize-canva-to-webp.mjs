import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const CANVA_DIR = path.join(ROOT, "public", "canva");

const QUALITY = 78;

function isImageFile(name) {
  const n = name.toLowerCase();
  return n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg");
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const entries = await fs.readdir(CANVA_DIR, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && isImageFile(e.name))
    .map((e) => e.name);

  if (files.length === 0) {
    console.log("Aucune image à convertir dans public/canva.");
    return;
  }

  let converted = 0;
  for (const name of files) {
    const src = path.join(CANVA_DIR, name);
    const out = path.join(
      CANVA_DIR,
      name.replace(/\.(png|jpe?g)$/i, ".webp")
    );

    // Skip si déjà converti (évite de recréer des fichiers à chaque run)
    if (await fileExists(out)) continue;

    await sharp(src)
      .webp({ quality: QUALITY })
      .toFile(out);

    converted += 1;
    console.log(`✔ ${name} -> ${path.basename(out)}`);
  }

  console.log(`\nTerminé. Convertis: ${converted}/${files.length}`);
  console.log(
    "Étape suivante: mettre à jour les références /canva/*.png(jpg) vers .webp dans le code."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

