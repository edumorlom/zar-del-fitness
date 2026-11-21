"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";

export type NavItem = { href: string; label: string; icon: IconName };

/** El menú lateral del equipo en escritorio; en móvil los links están en SiteHeader. */
export function Sidebar({ items, account }: { items: NavItem[]; account: React.ReactNode }) {
  const path = usePathname();
  const isCurrent = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <aside className="side">
      <div className="side__body" id="side-nav">
        <nav className="side__nav" aria-label="Panel">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className="side__link" aria-current={isCurrent(it.href) ? "page" : undefined}>
              <Icon name={it.icon} />
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="side__account">{account}</div>
      </div>
    </aside>
  );
}
