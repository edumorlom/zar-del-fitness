// Las imágenes viven en db/img/, en la raíz del repo, junto con el resto del contenido. Next.js sólo sirve los
// archivos de public/, así que antes de `npm run dev` y `npm run build` se copian a public/img/ (que no se sube).
//
// Además, de cada foto se hacen copias en WebP más chicas (public/img/_w/foto-640.webp, …), una por cada ancho de
// lib/image-variants.mjs menor que el de la foto, más una al ancho original. next/image las ofrece en el
// srcset (lib/image-loader.ts) y cada celular baja la que le alcanza, no la foto entera. Los anchos que hay de cada
// foto quedan en lib/image-widths.json. Las copias que ya están (y son más nuevas que la foto) no se vuelven a hacer.
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { imageWidths, variantPath } from "../lib/image-variants.mjs";

const site = fileURLToPath(new URL("..", import.meta.url));
const from = path.join(site, "..", "db", "img");
const to = path.join(site, "public", "img");

// Todo menos _w/, que guarda las copias ya hechas.
mkdirSync(to, { recursive: true });
for (const entry of readdirSync(to)) if (entry !== "_w") rmSync(path.join(to, entry), { recursive: true, force: true });
cpSync(from, to, { recursive: true });

/** "/img/blog/x.webp" de cada foto de db/img/ (no los SVG). */
const photos = (dir, base = "/img") =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? photos(path.join(dir, e.name), `${base}/${e.name}`) : /\.(jpe?g|png|webp)$/i.test(e.name) ? [`${base}/${e.name}`] : []
  );

const manifest = {};
const keep = new Set();
for (const src of photos(from)) {
  const file = path.join(site, "..", "db", src);
  const { width } = await sharp(file).metadata();
  // El ancho original va al final: una .webp se copia tal cual; una .jpg o .png, convertida a WebP. Un ancho casi
  // igual al original no vale la pena (la copia puede pesar más que la foto).
  const widths = [...imageWidths.filter((w) => w < width * 0.9), width];
  manifest[src] = widths;
  for (const w of widths) {
    const dest = path.join(site, "public", variantPath(src, w));
    keep.add(dest);
    if (existsSync(dest) && statSync(dest).mtimeMs > statSync(file).mtimeMs) continue;
    mkdirSync(path.dirname(dest), { recursive: true });
    if (w === width && src.endsWith(".webp")) copyFileSync(file, dest);
    else await sharp(file).resize({ width: w }).webp({ quality: 80 }).toFile(dest);
  }
}

// Las copias de fotos que ya no están en db/img/.
const variants = (dir) =>
  existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? variants(path.join(dir, e.name)) : [path.join(dir, e.name)])) : [];
for (const f of variants(path.join(to, "_w"))) if (!keep.has(f)) rmSync(f);

writeFileSync(path.join(site, "lib", "image-widths.json"), JSON.stringify(manifest, null, 2) + "\n");
