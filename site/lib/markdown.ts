// Los archivos Markdown de db/ (las notas del blog, los términos y la privacidad): un encabezado entre "---" con una
// línea "clave: valor" por dato, y después el texto. Se leen durante el build; si falta algo, el build avisa cuál.

import { readFileSync } from "node:fs";

/** Los datos del encabezado: los obligatorios (`K`) seguro; cualquier otro, si vino. */
export type Frontmatter<K extends string> = { meta: Record<K, string> & Partial<Record<string, string>>; body: string };

/**
 * El encabezado y el cuerpo de un archivo. `keys` son los datos obligatorios, y `dateKey` el que es una fecha
 * "AAAA-MM-DD". `where` es cómo se nombra el archivo en los errores ("db/blog/nota.md").
 */
export function readFrontmatter<K extends string>(file: string, where: string, keys: readonly K[], dateKey: K): Frontmatter<K> {
  const raw = readFileSync(file, "utf-8").replace(/\r\n/g, "\n");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${where}: falta el encabezado entre "---"`);

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  for (const key of keys) if (!meta[key]) throw new Error(`${where}: falta "${key}" en el encabezado`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta[dateKey])) throw new Error(`${where}: la fecha va como 2026-10-03`);

  return { meta: meta as Frontmatter<K>["meta"], body: match[2] };
}
