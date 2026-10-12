// Los anchos de las copias más chicas de cada foto, y dónde quedan. Lo usan next.config.ts, el script que las hace
// (scripts/copy-images.mjs) y el loader de next/image (lib/image-loader.ts). En JavaScript y no en TypeScript para
// que el script lo pueda importar con Node.

/** Para las fotos que ocupan buena parte de la pantalla (sizes en vw). Hasta 1920: ninguna foto es más ancha. */
export const deviceSizes = [640, 750, 828, 1080, 1200, 1920];
/** Para las chicas (logos, la portada de la revista). */
export const imageSizes = [128, 256, 384, 512];
export const imageWidths = [...imageSizes, ...deviceSizes];

/**
 * "/img/blog/x.jpg" a 640 px → "/img/_w/blog/x-640.webp". Siempre una copia, también al ancho original: si el loader
 * devolviera la foto tal cual, next/image avisa que no respeta el ancho ("missing-loader-width").
 * @param {string} src
 * @param {number} width
 */
export function variantPath(src, width) {
  return src.replace(/^\/img\//, "/img/_w/").replace(/\.\w+$/, `-${width}.webp`);
}
