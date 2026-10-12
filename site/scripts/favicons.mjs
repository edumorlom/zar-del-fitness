// app/favicon.ico (16, 32 y 48 px) y app/icon1.png (192 px), hechos desde app/icon.svg. Next.js los publica y pone
// sus <link rel="icon">. Google acepta el SVG, pero muestra mejor un ícono de un múltiplo de 48 px, y otros buscadores
// y programas piden /favicon.ico directamente. Si cambia app/icon.svg: `node scripts/favicons.mjs` y hacer commit.
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const app = new URL("../app/", import.meta.url);
const svg = readFileSync(new URL("icon.svg", app));
const png = (size) => sharp(svg, { density: 72 * Math.ceil(size / 64) * 4 }).resize(size, size).png().toBuffer();

await sharp(await png(192)).toFile(new URL("icon1.png", app).pathname);

// Un .ico es un índice y las imágenes en PNG, una detrás de la otra.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(png));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2); // tipo: ícono
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const entry = 6 + 16 * i;
  header.writeUInt8(size, entry); // ancho
  header.writeUInt8(size, entry + 1); // alto
  header.writeUInt16LE(1, entry + 4); // planos
  header.writeUInt16LE(32, entry + 6); // bits por píxel
  header.writeUInt32LE(images[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
});
writeFileSync(new URL("favicon.ico", app), Buffer.concat([header, ...images]));
