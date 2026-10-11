import type { Metadata } from "next";
// RootShell antes que la página, para que los estilos globales se carguen primero.
import { RootShell, rootMetadata, rootViewport } from "@/components/RootShell";
import { NotFoundPage } from "@/components/NotFoundPage";
import { business, content } from "@/lib/content";

// La 404 de todo el sitio (out/404.html). Con dos layouts raíz (uno por idioma), Next.js la necesita aparte:
// no pasa por ningún layout, así que arma su propio <html> con RootShell.
export const metadata: Metadata = {
  ...rootMetadata,
  title: { absolute: `${content("es").t.noEncontrada.titulo} | ${business.name}` },
};
export const viewport = rootViewport;

export default function GlobalNotFound() {
  return (
    <RootShell lang="es">
      <NotFoundPage />
    </RootShell>
  );
}
