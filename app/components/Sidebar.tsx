"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" {...stroke} />
      <rect x="14" y="3" width="7" height="5" rx="1.5" {...stroke} />
      <rect x="14" y="12" width="7" height="9" rx="1.5" {...stroke} />
      <rect x="3" y="16" width="7" height="5" rx="1.5" {...stroke} />
    </>
  ),
  clients: (
    <>
      <circle cx="9" cy="8" r="3.5" {...stroke} />
      <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.7.7 2.8 2.4 3 5.2" {...stroke} />
    </>
  ),
  settings: (
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M18 16v4" {...stroke} />
  ),
  site: <path d="M7 17 17 7M8 7h9v9" {...stroke} />,
} as const;

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

const Icon = ({ name }: { name: keyof typeof ICONS }) => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

/** El menú del panel del equipo: a la izquierda en la compu; arriba, con un botón que lo despliega, en el celular. */
export function Sidebar({ items, account }: { items: NavItem[]; account: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  return (
    <aside className="side" data-open={open}>
      <div className="side__top">
        <Link className="side__logo" href="/">
          <img src="/img/logo.webp" alt="Zar del Fitness" width={666} height={361} />
        </Link>
        <button
          className="side__burger"
          type="button"
          aria-expanded={open}
          aria-controls="side-nav"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
        </button>
      </div>
      <div className="side__body" id="side-nav">
        <nav className="side__nav" aria-label="Panel">
          {items.map((it) => {
            const current = path === it.href || path.startsWith(`${it.href}/`);
            return (
              <Link key={it.href} href={it.href} className="side__link" aria-current={current ? "page" : undefined}>
                <Icon name={it.icon} />
                {it.label}
              </Link>
            );
          })}
          <a className="side__link side__link--quiet" href="https://zardelfitness.com.ar/">
            <Icon name="site" />
            Ver el sitio
          </a>
        </nav>
        <div className="side__account">{account}</div>
      </div>
    </aside>
  );
}
