import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppFloat } from "./WhatsAppFloat";
import { Reveals } from "./motion/Reveals";
import { content } from "@/lib/content";
import { otherLang, type Lang } from "@/lib/i18n";

/**
 * Lo que rodea a cada página: menú, pie, WhatsApp y las animaciones data-*. `alternate` es la URL de la misma
 * página en el otro idioma (el botón "EN"/"ES" del menú); si no está traducida, el inicio del otro idioma.
 */
export function PageShell({ lang, alternate, children }: { lang: Lang; alternate: string; children: React.ReactNode }) {
  const { t, pages, nav, links, price } = content(lang);
  const other = otherLang(lang);
  return (
    <>
      <Header
        home={pages.home}
        nav={nav}
        announce={{ text: t.encabezado.anuncio, price: price("reto-online"), cta: t.encabezado.anuncioBoton, href: links.retoOnline }}
        cta={t.encabezado.boton}
        waInfo={links.waInfo}
        labels={{
          logo: t.encabezado.logo,
          nav: t.encabezado.menuPrincipal,
          navMobile: t.encabezado.menuMovil,
          open: t.encabezado.abrirMenu,
          close: t.encabezado.cerrarMenu,
          write: t.encabezado.escribinos,
        }}
        // "Read in English" en inglés, "Leer en español" en castellano: en el idioma al que lleva.
        language={{ href: alternate, lang: other, label: content(other).t.general.leerEn }}
      />
      <main id="main">{children}</main>
      <Footer lang={lang} />
      <WhatsAppFloat href={links.waInfo} label={t.whatsapp.botonFlotante} cursor={t.general.cursorChat} />
      {/* Último: conecta las animaciones data-* una vez montado todo el contenido */}
      <Reveals />
    </>
  );
}
