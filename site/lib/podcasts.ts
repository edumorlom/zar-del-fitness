// Los episodios del podcast, Detrás del Espejo: videos de YouTube, uno por entrada de db/podcasts.json (ver
// db/README.md). Se listan en /podcasts/ (y /en/podcasts/), y cada uno tiene su página, /podcasts/<id>/, con el video,
// para que aparezca en Google. Desde la lista, un click abre el video en el modal y cambia la URL a la del episodio.

import podcasts from "@db/podcasts.json";
import { content } from "./content";
import { fill, localePath, text, type Lang } from "./i18n";
import { youtubeId, youtubeImage } from "./youtube.mjs";

export type Episode = {
  lang: Lang;
  /** El final de su URL: "suplementos-ciencia-o-estafa". El mismo en los dos idiomas. */
  id: string;
  /** "/podcasts/suplementos-ciencia-o-estafa/" (en inglés, "/en/podcasts/…") */
  path: string;
  /** El id del video en YouTube. */
  videoId: string;
  /** El link al video en YouTube, tal cual está en db/podcasts.json. */
  video: string;
  title: string;
  /** El título de su página, para Google y la pestaña: "Suplementos: ¿ciencia o estafa? · Podcast". */
  pageTitle: string;
  /** "2026-09-18" */
  date: string;
  /** "56:45" */
  duration: string;
  seconds: number;
  guest: string;
  description: string;
  /** Los párrafos de su página. */
  summary: string[];
  /** La miniatura del video, "/img/podcasts/<id del video>.webp" (la baja scripts/copy-images.mjs). */
  image: string;
};

function load(lang: Lang): Episode[] {
  const { t } = content(lang);
  const episodes = podcasts.map((p, i) => {
    const where = `db/podcasts.json [${i}]`;
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) throw new Error(`${where}: "id" va en minúsculas y con guiones, sin tildes`);
    const videoId = youtubeId(p.video);
    if (!videoId) throw new Error(`${where}: "video" tiene que ser un link de YouTube`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.fecha)) throw new Error(`${where}: la fecha va como 2026-09-18`);
    // "56:45" o "1:02:30"
    if (!/^(\d+:)?\d{1,2}:\d{2}$/.test(p.duracion)) throw new Error(`${where}: la duración va como 56:45 (o 1:02:30)`);
    const title = text(p.titulo, lang, `${where}.titulo`);
    return {
      lang,
      id: p.id,
      path: localePath(lang, `/podcasts/${p.id}/`),
      videoId,
      video: p.video,
      title,
      pageTitle: fill(t.seo.episodio, { titulo: title }),
      date: p.fecha,
      duration: p.duracion,
      seconds: p.duracion.split(":").reduce((total, n) => total * 60 + Number(n), 0),
      guest: p.invitado,
      description: text(p.descripcion, lang, `${where}.descripcion`),
      summary: text(p.resumen, lang, `${where}.resumen`),
      image: youtubeImage(videoId),
    };
  });
  for (const e of episodes)
    if (episodes.filter((o) => o.id === e.id).length > 1) throw new Error(`db/podcasts.json: hay dos episodios con "id": "${e.id}"`);
  return episodes.sort((a, b) => b.date.localeCompare(a.date));
}

/** Los episodios en cada idioma, del más nuevo al más viejo. */
export const episodes: Record<Lang, Episode[]> = { es: load("es"), en: load("en") };

export const findEpisode = (lang: Lang, id: string) => episodes[lang].find((e) => e.id === id);

/** Las URLs de los episodios, para el build (generateStaticParams). */
export const episodeParams = () => podcasts.map((p) => ({ id: p.id }));
