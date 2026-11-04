import { Header } from "@/components/Header";
import { content, siteUrl } from "@/lib/content";

// El portal vive en mi.zardelfitness.com.ar: los links del menú van al sitio, con su dominio.
const abs = (href: string) => (href.startsWith("/") ? siteUrl + href : href);

/** El mismo menú que el sitio (components/Header.tsx, con sus textos de db/), con el botón del portal. */
export function SiteHeader({ login }: { login: { label: string; href: string } }) {
  const { t, pages, nav: siteNav, links, price } = content("es");
  const nav = siteNav.map((item) => ({ ...item, href: abs(item.href) }));
  return (
    <Header
      home={abs(pages.home)}
      nav={nav}
      announce={{ text: t.encabezado.anuncio, price: price("reto-online"), cta: t.encabezado.anuncioBoton, href: links.retoOnline }}
      waInfo={links.waInfo}
      login={login}
      labels={{
        logo: t.encabezado.logo,
        nav: t.encabezado.menuPrincipal,
        navMobile: t.encabezado.menuMovil,
        open: t.encabezado.abrirMenu,
        close: t.encabezado.cerrarMenu,
        write: t.encabezado.escribinos,
      }}
      language={{ href: `${siteUrl}/en/`, lang: "en", label: content("en").t.general.leerEn }}
    />
  );
}
