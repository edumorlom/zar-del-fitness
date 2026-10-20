// Las notas del blog: un archivo Markdown por nota en db/blog/ (en inglés, en db/blog/en/), con un encabezado entre
// "---" (ver db/README.md). Se leen durante el build. Cada nota se publica en /año/mes/día/archivo/, la misma URL que
// tenía en el sitio anterior, para no perder lo que Google ya había indexado; las de inglés, en /en/año/mes/día/archivo/.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import { localePath, type Lang } from "./i18n";

// En el build, process.cwd() es site/.
const DB = path.join(process.cwd(), "..", "db");
const DIRS: Record<Lang, string> = { es: path.join(DB, "blog"), en: path.join(DB, "blog", "en") };
const KEYS = ["titulo", "fecha", "autor", "categoria", "descripcion", "imagen"] as const;

/**
 * El ancho y alto de una imagen WebP de db/ ("/img/blog/x.webp"), leídos de su encabezado. Con el tamaño en el
 * <img>, el navegador le reserva el lugar y la página no salta mientras carga.
 */
function imageSize(src: string) {
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
  lang: Lang;
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
  /** En las notas en inglés: el archivo de la nota original en castellano, sin ".md". */
  original?: string;
  html: string;
  words: number;
  minutes: number;
};

function read(lang: Lang, file: string): Post {
  const where = `db/blog/${lang === "en" ? "en/" : ""}${file}`;
  const raw = readFileSync(path.join(DIRS[lang], file), "utf-8").replace(/\r\n/g, "\n");
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
    lang,
    slug,
    title: meta.titulo,
    date: meta.fecha,
    author: meta.autor,
    category: meta.categoria,
    description: meta.descripcion,
    image: meta.imagen,
    imageSize: imageSize(meta.imagen),
    path: localePath(lang, `/${year}/${month}/${day}/${slug}/`),
    original: meta.original,
    html: marked.parse(body, { async: false }),
    words,
    minutes: Math.max(1, Math.round(words / 200)),
  };
}

const load = (lang: Lang) =>
  readdirSync(DIRS[lang])
    .filter((f) => f.endsWith(".md"))
    .map((f) => read(lang, f))
    .sort((a, b) => b.date.localeCompare(a.date));

/** Las notas de cada idioma, de la más nueva a la más vieja. */
export const posts: Record<Lang, Post[]> = { es: load("es"), en: load("en") };

// Cada nota en inglés dice de qué nota en castellano es la traducción ("original" en su encabezado).
for (const post of posts.en) {
  const where = `db/blog/en/${post.slug}.md`;
  if (!post.original) throw new Error(`${where}: falta "original" en el encabezado (el archivo de la nota en castellano)`);
  if (!posts.es.some((p) => p.slug === post.original))
    throw new Error(`${where}: "original: ${post.original}" no es ninguna nota de db/blog/`);
  if (posts.en.filter((p) => p.original === post.original).length > 1)
    throw new Error(`${where}: hay otra nota en inglés con "original: ${post.original}"`);
}

export type PostParams = { year: string; month: string; day: string; slug: string };

/** Las URLs de las notas de un idioma, para el build (generateStaticParams). */
export function postParams(lang: Lang): PostParams[] {
  return posts[lang].map((p) => {
    const [year, month, day] = p.date.split("-");
    return { year, month, day, slug: p.slug };
  });
}

export const findPost = (lang: Lang, { year, month, day, slug }: PostParams) =>
  posts[lang].find((p) => p.slug === slug && p.date === `${year}-${month}-${day}`);

/** La misma nota en el otro idioma, si está traducida. */
export function translationOf(post: Post): Post | undefined {
  return post.lang === "en"
    ? posts.es.find((p) => p.slug === post.original)
    : posts.en.find((p) => p.original === post.slug);
}
