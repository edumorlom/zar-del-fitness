// Los episodios del podcast son videos de YouTube (db/podcasts.json). Lo usan lib/podcasts.ts y el script que baja
// las miniaturas (scripts/copy-images.mjs). En JavaScript y no en TypeScript para que el script lo pueda importar con
// Node.

/**
 * El id de un video, de cualquiera de sus links: youtube.com/watch?v=…, youtu.be/…, youtube.com/shorts/…, /embed/…
 * o /live/…. Si no es un link de YouTube, undefined.
 * @param {string} url
 */
export function youtubeId(url) {
  return url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})(?![\w-])/)?.[1];
}

/**
 * La miniatura de un episodio: "/img/podcasts/<id>.webp", en db/img/podcasts/. scripts/copy-images.mjs la baja de
 * YouTube si falta.
 * @param {string} id
 */
export const youtubeImage = (id) => `/img/podcasts/${id}.webp`;
