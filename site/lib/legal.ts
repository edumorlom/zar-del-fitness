// Las páginas legales: los términos y condiciones y la política de privacidad. Un archivo Markdown por página en
// db/legal/, y su traducción al inglés con el mismo nombre en db/legal/en/ (ver db/README.md). Se leen durante el build.
// Las URLs están acá (legalPaths): cada una tiene su page.tsx en app/(es)/ y app/(en)/en/.

import path from "node:path";
import { Marked, type Tokens } from "marked";
import gimnasio from "@db/gimnasio.json";
import { formatDate, LANGS, type Lang } from "./i18n";
import { readFrontmatter } from "./markdown";

// En el build, process.cwd() es site/.
const DIR = path.join(process.cwd(), "..", "db", "legal");
const KEYS = ["titulo", "descripcion", "actualizado"] as const;

export const LEGAL_IDS = ["terminos", "privacidad"] as const;
export type LegalId = (typeof LEGAL_IDS)[number];

/** La URL de cada página legal en cada idioma. */
export const legalPaths: Record<LegalId, Record<Lang, string>> = {
  terminos: { es: "/terminos/", en: "/en/terms/" },
  privacidad: { es: "/privacidad/", en: "/en/privacy/" },
};

export type LegalDoc = {
  id: LegalId;
  lang: Lang;
  title: string;
  description: string;
  /** "2026-11-17": la fecha de la última versión. Con una fecha nueva en la de privacidad o la de términos, el portal les vuelve a pedir el consentimiento a los clientes (portal/lib/consent.ts). */
  updated: string;
  path: string;
  html: string;
  /** Los subtítulos (##), para el índice: su ancla y su texto. */
  toc: { id: string; text: string }[];
};

/** "4. Datos de salud" → "4-datos-de-salud": el ancla de un subtítulo. */
export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const { calle, barrio, ciudad, codigoPostal } = gimnasio.direccion;
const legal = gimnasio.legal;

/**
 * Los datos del negocio que van en el texto, de db/gimnasio.json: en el Markdown se escriben entre llaves ({cuit}).
 * Si falta alguno de los de `legal` (titular, CUIT, correo), la página dice "[a completar]" y el build avisa.
 */
const values: Record<string, string> = {
  marca: gimnasio.nombre,
  gimnasio: gimnasio.gimnasio,
  titular: legal.titular,
  cuit: legal.cuit,
  correo: legal.correo,
  domicilio: `${calle}, ${barrio}, ${ciudad} (${codigoPostal})`,
  whatsapp: gimnasio.whatsapp,
  sitio: gimnasio.sitioWeb,
};

function fillValues(text: string, where: string) {
  const missing = new Set<string>();
  const filled = text.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in values)) throw new Error(`${where}: no existe el dato {${key}} (los que hay: ${Object.keys(values).join(", ")})`);
    if (values[key]) return values[key];
    missing.add(key);
    return "[a completar]";
  });
  if (missing.size)
    console.warn(`${where}: falta ${[...missing].join(", ")} en db/gimnasio.json (legal); la página dice "[a completar]".`);
  return filled;
}

function read(id: LegalId, lang: Lang): LegalDoc {
  const where = `db/legal/${lang === "en" ? "en/" : ""}${id}.md`;
  const { meta, body: raw } = readFrontmatter(path.join(DIR, lang === "en" ? "en" : "", `${id}.md`), where, KEYS, "actualizado");

  // Los subtítulos (##) con su ancla, para el índice y para poder enlazar una sección (/privacidad/#5-tus-derechos).
  const toc: LegalDoc["toc"] = [];
  const marked = new Marked({
    renderer: {
      heading({ tokens, depth, text }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens);
        if (depth !== 2) return `<h${depth}>${inner}</h${depth}>\n`;
        const id = slugify(text);
        if (toc.some((t) => t.id === id)) throw new Error(`${where}: hay dos subtítulos "${text}"`);
        toc.push({ id, text });
        return `<h2 id="${id}">${inner}</h2>\n`;
      },
    },
  });
  const body = fillValues(raw, where);
  if (/^# /m.test(body)) throw new Error(`${where}: los subtítulos van con "##" (el título ya es el del encabezado)`);

  return {
    id,
    lang,
    title: meta.titulo,
    description: meta.descripcion,
    updated: meta.actualizado,
    path: legalPaths[id][lang],
    html: marked.parse(body, { async: false }),
    toc,
  };
}

/** Las páginas legales, ya leídas, en cada idioma. */
export const legalDocs = Object.fromEntries(
  LEGAL_IDS.map((id) => [id, Object.fromEntries(LANGS.map((lang) => [lang, read(id, lang)]))])
) as Record<LegalId, Record<Lang, LegalDoc>>;

for (const id of LEGAL_IDS)
  if (legalDocs[id].es.updated !== legalDocs[id].en.updated)
    throw new Error(`db/legal/${id}.md y db/legal/en/${id}.md tienen distinta fecha ("actualizado"): actualizá la traducción también`);

/** La versión vigente de los términos y de la privacidad: la fecha más nueva de las dos. Es la que acepta cada cliente. */
export const legalVersion = LEGAL_IDS.map((id) => legalDocs[id].es.updated).sort().at(-1)!;

/** "Última actualización: 17 de noviembre de 2026". */
export const updatedLabel = (doc: LegalDoc, label: string) => `${label} ${formatDate(doc.updated, doc.lang)}`;
