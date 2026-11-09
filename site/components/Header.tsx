"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import type { Lang } from "@/lib/i18n";
import { scroll } from "@/lib/scroll";
import styles from "./Header.module.css";

/** Los textos y links del menú, ya en el idioma de la página (los arma components/PageShell.tsx). */
export type PortalMenu = { items: { href: string; label: string }[]; name: string; role: string };

type HeaderProps = {
  home: string;
  nav: { href: string; label: string }[];
  announce: { text: string; price: string; cta: string; href: string };
  waInfo: string;
  /** El acceso al portal (/portal/). `signedInLabel`: el texto si el navegador ya tiene la sesión iniciada. */
  login: { label: string; signedInLabel?: string; href: string };
  labels: { logo: string; nav: string; navMobile: string; open: string; close: string; write: string };
  /** La misma página en el otro idioma. */
  language: { href: string; lang: Lang; label: string };
  /** En el panel del equipo, el único menú móvil reúne el portal y el sitio. */
  portal?: PortalMenu;
};

// El sitio es estático y Clerk sólo corre en /portal: clerk-js deja esta cookie en todo el dominio ("0" = sin sesión).
// shortcut: si la sesión venció sin volver al portal, sigue diciendo "Mi Portal" (el botón lleva al ingreso), cargar Clerk en el sitio si molesta.
const hasSession = () => /(?:^|; )__client_uat=[1-9]/.test(document.cookie);
const noop = () => () => {};

export function Header({ home, nav, announce, waInfo, login, labels, language, portal }: HeaderProps) {
  const signedIn = useSyncExternalStore(noop, hasSession, () => false);
  const loginLabel = (signedIn && login.signedInLabel) || login.label;
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  // usePathname() no trae la barra final: "/en".
  const path = usePathname();
  const isHome = `${path.replace(/\/$/, "")}/` === home;
  const burger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 400 && y > last + 2 ? true : y < last - 2 ? false : (h) => h);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const released = useRef(false);

  useEffect(() => {
    if (!open) return;
    scroll.lock();
    released.current = false;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        burger.current?.focus();
      }
      if (e.key === "Tab") {
        const targets = [burger.current, ...Array.from(menu.current?.querySelectorAll<HTMLElement>("a[href], button") ?? [])].filter((el): el is HTMLElement => Boolean(el));
        const first = targets[0];
        const last = targets.at(-1);
        if (e.shiftKey && (document.activeElement === first || !targets.includes(document.activeElement as HTMLElement))) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && (document.activeElement === last || !targets.includes(document.activeElement as HTMLElement))) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (!released.current) scroll.unlock();
    };
  }, [open]);

  // Libera el scroll en el mismo click, antes de que el handler global de anclas haga scroll.
  const closeMenu = () => {
    if (!open) return;
    released.current = true;
    scroll.unlock();
    setOpen(false);
  };

  return (
    <>
      <header
        className={styles.header}
        data-scrolled={scrolled}
        data-hidden={hidden && !open}
        data-open={open}
        data-portal={portal ? true : undefined}
      >
        <a className={styles.announce} href={announce.href}>
          <Icon name="spark" />
          <span>
            {announce.text} <strong>{announce.price}</strong>
          </span>
          <span className={styles.announceCta}>
            {announce.cta} <Icon name="arrow" />
          </span>
        </a>

        <div className={`container ${styles.bar}`}>
          <a className={styles.logo} href={isHome ? "#top" : home} aria-label={labels.logo} onClick={closeMenu}>
            <Image src="/img/logo.webp" alt="Zar del Fitness" width={666} height={361} sizes="120px" preload />
          </a>

          <nav className={styles.nav} aria-label={labels.nav}>
            {nav.map((item) => (
              <a key={item.href} href={item.href}>
                <span data-text={item.label}>{item.label}</span>
              </a>
            ))}
          </nav>

          <a
            className={styles.lang}
            href={language.href}
            hrefLang={language.lang}
            lang={language.lang}
            aria-label={language.label}
            title={language.label}
          >
            {language.lang.toUpperCase()}
          </a>

          <a className={`btn btn--gold btn--sm ${styles.login}`} href={login.href} data-magnetic>
            <span>{loginLabel}</span>
          </a>

          <button
            ref={burger}
            className={styles.burger}
            type="button"
            aria-label={open ? labels.close : labels.open}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div ref={menu} className={styles.menu} id="mobile-menu" data-lenis-prevent data-open={open} data-portal={portal ? true : undefined} aria-hidden={!open} inert={!open}>
        <div className={styles.menuSections}>
          {portal && (
            <section className={styles.portalSection} aria-labelledby="portal-menu-label">
              <div className={styles.portalAccount}>
                <h2 id="portal-menu-label">Tu panel</h2>
                <span>{portal.name} · {portal.role}</span>
              </div>
              <nav className={styles.portalNav} aria-label="Panel">
                {portal.items.map((item) => (
                  <Link key={item.href} href={item.href} onClick={closeMenu} aria-current={path === item.href || path.startsWith(`${item.href}/`) ? "page" : undefined}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </section>
          )}
          <div>
            {portal && <p className={styles.menuLabel}>Zar del Fitness</p>}
            <nav className={styles.menuNav} aria-label={labels.navMobile}>
              {nav.map((item, i) => (
                <a key={item.href} href={item.href} onClick={closeMenu} style={{ "--i": i } as React.CSSProperties}>
                  {!portal && <small>0{i + 1}</small>}
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
        <div className={styles.menuFoot}>
          <a className="btn btn--gold" href={waInfo} onClick={closeMenu}>
            <Icon name="wa" />
            <span>{labels.write}</span>
          </a>
          <a className="btn btn--ghost" href={login.href} onClick={closeMenu}>
            <span>{loginLabel}</span>
          </a>
        </div>
      </div>
    </>
  );
}
