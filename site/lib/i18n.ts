// Los dos idiomas del sitio. El castellano está en la raíz ("/") y el inglés en "/en/".
// En db/, cada texto que se ve en el sitio viene en los dos: { "es": "…", "en": "…" } (ver db/README.md).

export const LANGS = ["es", "en"] as const;
export type Lang = (typeof LANGS)[number];

export const locales = {
  es: { html: "es-AR", og: "es_AR", intl: "es-AR", prefix: "" },
  en: { html: "en", og: "en_US", intl: "en-US", prefix: "/en" },
} as const;

export const otherLang = (lang: Lang): Lang => (lang === "es" ? "en" : "es");

/** La URL de una página en un idioma: ("en", "/blog/") → "/en/blog/". */
export const localePath = (lang: Lang, path: string) => locales[lang].prefix + path;

/** El inicio de cada idioma: "/" o "/en/". */
export const homePath = (lang: Lang) => localePath(lang, "/");

type Pair<T> = { es: T; en: T };

/** Un texto de db/ ya en un idioma: los { "es", "en" } pasan a ser string (o string[]). */
export type Localized<T> = T extends Pair<infer U>
  ? U
  : T extends readonly (infer I)[]
    ? Localized<I>[]
    : T extends object
      ? { [K in keyof T]: Localized<T[K]> }
      : T;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isPair = (v: unknown): v is Pair<unknown> => isObject(v) && ("es" in v || "en" in v);

/**
 * Un valor de db/ en un idioma. Los textos en los dos idiomas ({ "es", "en" }) se resuelven, en cualquier nivel;
 * lo demás (ids, números, links, nombres propios) queda igual. `where` es para el mensaje de error.
 */
export function localize<T>(value: T, lang: Lang, where: string): Localized<T> {
  if (isPair(value)) {
    const keys = Object.keys(value);
    for (const l of LANGS) {
      const v = value[l];
      if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0))
        throw new Error(`Falta el texto en ${l === "es" ? "castellano" : "inglés"} ("${l}") de ${where}`);
    }
    if (keys.length !== 2) throw new Error(`${where} tiene que tener sólo "es" y "en", y tiene: ${keys.join(", ")}`);
    return value[lang] as Localized<T>;
  }
  if (Array.isArray(value)) return value.map((v, i) => localize(v, lang, `${where}[${i}]`)) as Localized<T>;
  if (isObject(value))
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, localize(v, lang, `${where}.${k}`)])) as Localized<T>;
  return value as Localized<T>;
}

/**
 * Un texto que se ve en el sitio: tiene que venir en los dos idiomas. Si viene en un solo idioma (un string
 * suelto), el sitio no se construye y avisa, para que la versión en inglés nunca muestre castellano.
 */
export function text<T extends string | string[]>(value: Pair<T> | T | undefined, lang: Lang, where: string): T {
  if (!isPair(value)) throw new Error(`Falta la traducción de ${where}: tiene que ser { "es": …, "en": … }`);
  return localize(value, lang, where) as T;
}

/**
 * Revisa que todos los textos de un archivo de db/ vengan en los dos idiomas. Las claves de `neutral` (ids,
 * números) pueden ser un string suelto.
 */
export function checkTranslated(value: unknown, where: string, neutral: string[], key = ""): void {
  if (typeof value === "string") {
    if (!neutral.includes(key)) throw new Error(`Falta la traducción de ${where}: tiene que ser { "es": …, "en": … }`);
  } else if (Array.isArray(value)) value.forEach((v, i) => checkTranslated(v, `${where}[${i}]`, neutral, key));
  else if (isObject(value) && !isPair(value))
    for (const [k, v] of Object.entries(value)) checkTranslated(v, `${where}.${k}`, neutral, k);
}

/** "Hola {nombre}" + { nombre: "Ana" } → "Hola Ana". Los {marcadores} de los textos de db/textos.json. */
export function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in values)) throw new Error(`"${template}": no existe el marcador {${key}}`);
    return String(values[key]);
  });
}
