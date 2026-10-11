// Las notas del blog: un archivo Markdown por nota en db/blog/, con un encabezado entre "---" (ver db/README.md).
// Se leen durante el build. Cada nota se publica en /año/mes/día/archivo/, la misma URL que tenía en el sitio
// anterior, para no perder lo que Google ya había indexado.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Marked } from "marked";

// En el build, process.cwd() es site/.
const DB = path.join(process.cwd(), "..", "db");
const DIR = path.join(DB, "blog");
const KEYS = ["titulo", "fecha", "autor", "categoria", "descripcion", "imagen"] as const;

/**
 * El ancho y alto de una imagen WebP de db/ ("/img/blog/x.webp"), leídos de su encabezado. Con el tamaño en el
 * <img>, el navegador le reserva el lugar y la página no salta mientras carga.
 */
export function imageSize(src: string) {
  if (!src.endsWith(".webp")) throw new Error(`${src}: las imágenes del blog van en WebP`);
  const b = readFileSync(path.join(DB, src)).subarray(0, 30);
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
  throw new Error(`${src}: no es un WebP válido`);
}

// Las imágenes del cuerpo de las notas, con su tamaño y cargando recién cuando se acercan a la pantalla.
const marked = new Marked({
  renderer: {
    image({ href, text }) {
      const { w, h } = imageSize(href);
      return `<img src="${href}" alt="${text.replace(/"/g, "&quot;")}" width="${w}" height="${h}" loading="lazy" decoding="async">`;
    },
  },
});

export type Post = {
  slug: string;
  title: string;
  /** "2026-10-03" */
  date: string;
  author: string;
  category: string;
  description: string;
  image: string;
  imageSize: { w: number; h: number };
  /** "/2026/10/03/peptidos-y-perdida-de-peso-semaglutida-y-tirzepatida/" */
  path: string;
  html: string;
  words: number;
  minutes: number;
};

function read(file: string): Post {
  const where = `db/blog/${file}`;
  const raw = readFileSync(path.join(DIR, file), "utf-8").replace(/\r\n/g, "\n");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${where}: falta el encabezado entre "---"`);

  // Una línea "clave: valor" por dato.
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  for (const key of KEYS) if (!meta[key]) throw new Error(`${where}: falta "${key}" en el encabezado`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.fecha)) throw new Error(`${where}: la fecha va como 2026-10-03`);

  const slug = file.replace(/\.md$/, "");
  const [year, month, day] = meta.fecha.split("-");
  const body = match[2];
  const words = body.split(/\s+/).filter(Boolean).length;

  return {
    slug,
    title: meta.titulo,
    date: meta.fecha,
    author: meta.autor,
    category: meta.categoria,
    description: meta.descripcion,
    image: meta.imagen,
    imageSize: imageSize(meta.imagen),
    path: `/${year}/${month}/${day}/${slug}/`,
    html: marked.parse(body, { async: false }),
    words,
    minutes: Math.max(1, Math.round(words / 200)),
  };
}

/** Todas las notas, de la más nueva a la más vieja. */
export const posts: Post[] = readdirSync(DIR)
  .filter((f) => f.endsWith(".md"))
  .map(read)
  .sort((a, b) => b.date.localeCompare(a.date));

const longDate = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "2026-10-03" → "3 de octubre de 2026" */
export const formatDate = (date: string) => longDate.format(new Date(`${date}T12:00:00Z`));
