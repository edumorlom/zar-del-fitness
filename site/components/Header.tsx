"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "./Icon";
import { links, nav, price, socials } from "@/lib/content";
import { scroll } from "@/lib/scroll";
import styles from "./Header.module.css";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

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
        <a className={styles.announce} href={links.retoOnline}>
          <Icon name="spark" />
          <span>
            Reto de los 25 días online: <strong>{price("reto-online")}</strong>
          </span>
          <span className={styles.announceCta}>
            Inscribite <Icon name="arrow" />
          </span>
        </a>

        <div className={`container ${styles.bar}`}>
          <a className={styles.logo} href="#top" aria-label="Zar del Fitness, inicio" onClick={closeMenu}>
            <Image src="/img/logo.webp" alt="Zar del Fitness" width={666} height={361} sizes="120px" preload />
          </a>

          <nav className={styles.nav} aria-label="Principal">
            {nav.map((item) => (
              <a key={item.href} href={item.href}>
                <span data-text={item.label}>{item.label}</span>
              </a>
            ))}
          </nav>

          <a className={`btn btn--gold btn--sm ${styles.cta}`} href="#programas" data-magnetic>
            <span>Empezá el reto</span>
          </a>

          <button
            className={styles.burger}
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
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
        <nav className={styles.menuNav} aria-label="Móvil">
          {nav.map((item, i) => (
            <a key={item.href} href={item.href} onClick={closeMenu} style={{ "--i": i } as React.CSSProperties}>
              <small>0{i + 1}</small>
              {item.label}
            </a>
          ))}
        </nav>
        <div className={styles.menuFoot}>
          <a className="btn btn--gold" href={links.waInfo}>
            <Icon name="wa" />
            <span>Escribinos</span>
          </a>
          <div className="socials">
            {socials.slice(0, 4).map((s) => (
              <a key={s.label} href={s.href} aria-label={s.label}>
                <Icon name={s.icon} className="" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
