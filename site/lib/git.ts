import { execFileSync } from "node:child_process";

/**
 * La fecha del último commit que tocó estos archivos ("2026-10-12T13:45:00-04:00"), para el lastmod de sitemap.xml.
 * Las rutas son desde site/ ("../db/podcasts.json") y pueden ser patrones de git ("../db/*.json"). Sin git o sin
 * historia (un archivo nuevo, sin commit todavía), undefined. En GitHub Actions hace falta la historia entera
 * (fetch-depth: 0 en el workflow): con sólo el último commit, todas las páginas tendrían esa fecha.
 */
export function lastCommit(...paths: string[]): string | undefined {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cI", "--", ...paths], { encoding: "utf8" }).trim() || undefined;
  } catch {
    return undefined;
  }
}
