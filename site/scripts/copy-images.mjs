// Las imágenes viven en db/img/, en la raíz del repo, junto con el resto del contenido. Next.js sólo sirve los
// archivos de public/, así que antes de `npm run dev` y `npm run build` se copian a public/img/ (que no se sube).
import { cpSync, rmSync } from "node:fs";

const from = new URL("../../db/img", import.meta.url);
const to = new URL("../public/img", import.meta.url);

rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true });
