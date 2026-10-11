// Primero: los estilos de los componentes (.module.css) tienen que cargarse después, para poder pisar los globales.
import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import { Anton, Instrument_Serif, Manrope } from "next/font/google";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { JsonLd } from "@/components/JsonLd";
import { business, content, siteUrl } from "@/lib/content";
import { locales, type Lang } from "@/lib/i18n";
import { siteGraph } from "@/lib/seo";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const instrument = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

// Lo común a todas las páginas. El título, la descripción y la URL canónica de cada una van en su page.tsx
// (con pageMetadata() de lib/seo.ts), y la imagen para compartir en su opengraph-image.tsx.
export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: business.name, template: `%s | ${business.name}` },
  applicationName: business.name,
  authors: [{ name: "Ronald Medina" }],
  creator: business.name,
  publisher: business.name,
  category: "fitness",
  // Que Google pueda mostrar imágenes grandes (Discover) y fragmentos completos. Sin index/follow: son lo
  // predeterminado, y así no chocan con el noindex que Next.js pone en la página 404.
  robots: { "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  formatDetection: { telephone: false, address: false, email: false },
};

export const rootViewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

// Siempre arrancar arriba: sin restaurar el scroll anterior ni saltar al #ancla de la URL.
// Corre en el <head>, antes de que se parsee el body y el navegador intente scrollear.
// Si la URL trae un #ancla (un link a "/#programas" desde otra página), se guarda: MotionProvider scrollea hasta ahí
// cuando todo está listo, y el preloader no se muestra (data-skip-intro).
const scrollTopScript =
  'history.scrollRestoration="manual";if(location.hash){window.__zarHash=location.hash;document.documentElement.setAttribute("data-skip-intro","");history.replaceState(null,"",location.pathname+location.search)}';

/**
 * El <html> de cada página, en su idioma. Lo usan los dos layouts raíz (app/(es)/layout.tsx y app/(en)/layout.tsx)
 * y la página 404 (app/global-not-found.tsx).
 */
export function RootShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const { t, pages } = content(lang);
  return (
    // suppressHydrationWarning: el script del <head> puede agregar data-skip-intro antes de hidratar.
    <html lang={locales[lang].html} className={`${anton.variable} ${instrument.variable} ${manrope.variable}`} suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-head-element -- es el <html> de los layouts raíz de app/, no una página */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: scrollTopScript }} />
      </head>
      <body>
        <JsonLd data={siteGraph(lang)} />
        <a className="skip-link" href="#main">
          {t.general.irAlContenido}
        </a>
        <MotionProvider home={pages.home} labels={{ preloader: t.precarga, video: t.video }}>
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
