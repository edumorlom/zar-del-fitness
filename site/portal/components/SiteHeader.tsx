import { Header, type PortalMenu } from "@/components/Header";
import { content, siteUrl } from "@/lib/content";
import { otherLang, type Lang } from "@/lib/i18n";

// Los links del menú van al sitio con su dominio: el portal también se abre en mi. (ver proxy.ts).
const abs = (href: string) => (href.startsWith("/") ? siteUrl + href : href);

/**
 * El mismo menú que el sitio (components/Header.tsx, con sus textos de db/), con el botón del portal. Con `lang` (lo que
 * ve el cliente), en ese idioma y el ES/EN cambia el del portal; sin él (el equipo), en castellano y EN lleva al sitio en inglés.
 */
export function SiteHeader({ login, portal, lang }: { login: { label: string; href: string }; portal?: PortalMenu; lang?: Lang }) {
  const { t, pages, nav: siteNav, links, price } = content(lang ?? "es");
  const other = otherLang(lang ?? "es");
  const nav = siteNav.map((item) => ({ ...item, href: abs(item.href) }));
  return (
    <Header
      home={abs(pages.home)}
      nav={nav}
      announce={{ text: t.encabezado.anuncio, price: price("reto-online"), cta: t.encabezado.anuncioBoton, href: links.retoOnline }}
      waInfo={links.waInfo}
      login={login}
      portal={portal}
      labels={{
        logo: t.encabezado.logo,
        nav: t.encabezado.menuPrincipal,
        navMobile: t.encabezado.menuMovil,
        open: t.encabezado.abrirMenu,
        close: t.encabezado.cerrarMenu,
        write: t.encabezado.escribinos,
      }}
      language={{ href: lang ? `/portal/idioma/${other}` : `${siteUrl}/en/`, lang: other, label: content(other).t.general.leerEn }}
    />
  );
}
