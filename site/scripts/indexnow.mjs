// Le avisa a Bing qué páginas cambiaron, apenas se publica el sitio (IndexNow: también lo leen Yandex, Seznam y
// Naver). ChatGPT busca sobre todo en el índice de Bing, así que un cambio llega antes a sus respuestas.
//
// Lo corre el workflow de despliegue después de subir el sitio, con el sitemap que estaba publicado antes:
//   node scripts/indexnow.mjs ../sitemap-anterior.xml
// Compara ese sitemap con el nuevo (out/sitemap.xml) y avisa las páginas nuevas o con otra fecha (lastmod, ver
// app/sitemap.ts). Sin el sitemap anterior, avisa todas. Con --dry-run sólo muestra cuáles avisaría.
//
// La clave es el archivo public/<clave>.txt: Bing lo lee en el sitio para comprobar que el aviso es nuestro.
// Si el aviso falla, el despliegue no falla (el sitio ya está publicado): queda un aviso en GitHub Actions.
import { existsSync, readdirSync, readFileSync } from "node:fs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const before = args.find((a) => !a.startsWith("--"));

/** { url: lastmod } de un sitemap.xml. */
function read(file) {
  const xml = existsSync(file) ? readFileSync(file, "utf8") : "";
  const pages = {};
  for (const [, entry] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (loc) pages[loc] = entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? "";
  }
  return pages;
}

const now = read(new URL("../out/sitemap.xml", import.meta.url).pathname);
const old = before ? read(before) : {};
const changed = Object.keys(now).filter((url) => old[url] !== now[url]);

const keyFile = readdirSync(new URL("../public", import.meta.url)).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("Falta la clave de IndexNow: public/<32 caracteres hexadecimales>.txt");
const key = keyFile.replace(/\.txt$/, "");

if (!changed.length) {
  console.log("IndexNow: ninguna página cambió.");
  process.exit(0);
}
const { origin, host } = new URL(changed[0]);
console.log(`IndexNow: ${changed.length} página(s)${dryRun ? " (--dry-run, no se avisa)" : ""}:\n${changed.join("\n")}`);
if (dryRun) process.exit(0);

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation: `${origin}/${keyFile}`, urlList: changed }),
}).catch((err) => ({ ok: false, status: err.message }));

// 200 y 202 son "recibido".
if (res.ok) console.log(`IndexNow: avisado (${res.status}).`);
else console.log(`::warning::IndexNow no aceptó el aviso (${res.status}). El sitio se publicó igual.`);
