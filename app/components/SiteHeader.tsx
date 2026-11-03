import { Header } from "@/components/Header";
import { content } from "@/lib/content";

// El portal vive en mi.zardelfitness.com.ar: los links del menú van al sitio, con su dominio.
const SITE = "https://zardelfitness.com.ar";
const abs = (href: string) => (href.startsWith("/") ? SITE + href : href);

/** El mismo menú que el sitio (components/Header.tsx de site/, con sus textos de db/), con el botón del portal. */
export function SiteHeader({ login }: { login: { label: string; href: string } }) {
  const { t, pages, links, price } = content("es");
  // El menú del portal: menos secciones que el del sitio, y "Mi Perfil" (el portal) en lugar de las de la home.
  const nav = [
    { href: abs(pages.home), label: "Principal" },
    { href: "/", label: "Mi Perfil" },
    { href: abs(`${pages.home}#faq`), label: t.menu.faq },
    { href: abs(pages.blog), label: t.menu.blog },
    { href: abs(pages.podcasts), label: t.menu.podcasts },
  ];
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
      language={{ href: `${SITE}/en/`, lang: "en", label: content("en").t.general.leerEn }}
    />
  );
}
