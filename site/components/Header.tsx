"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import type { Lang } from "@/lib/i18n";
import { scroll } from "@/lib/scroll";
import styles from "./Header.module.css";

/** Los textos y links del menú, ya en el idioma de la página (los arma components/PageShell.tsx). */
type HeaderProps = {
  home: string;
  nav: { href: string; label: string }[];
  announce: { text: string; price: string; cta: string; href: string };
  cta: string;
  waInfo: string;
  labels: { logo: string; nav: string; navMobile: string; open: string; close: string; write: string };
  /** La misma página en el otro idioma. */
  language: { href: string; lang: Lang; label: string };
};

export function Header({ home, nav, announce, cta, waInfo, labels, language }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  // usePathname() no trae la barra final: "/en".
  const isHome = `${usePathname().replace(/\/$/, "")}/` === home;

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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
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

          <a className={`btn btn--gold btn--sm ${styles.cta}`} href={`${home}#programas`} data-magnetic>
            <span>{cta}</span>
          </a>

          <button
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

      <div className={styles.menu} id="mobile-menu" data-open={open} aria-hidden={!open} inert={!open}>
        <nav className={styles.menuNav} aria-label={labels.navMobile}>
          {nav.map((item, i) => (
            <a key={item.href} href={item.href} onClick={closeMenu} style={{ "--i": i } as React.CSSProperties}>
              <small>0{i + 1}</small>
              {item.label}
            </a>
          ))}
        </nav>
        <div className={styles.menuFoot}>
          <a className="btn btn--gold" href={waInfo}>
            <Icon name="wa" />
            <span>{labels.write}</span>
          </a>
        </div>
      </div>
    </>
  );
}
