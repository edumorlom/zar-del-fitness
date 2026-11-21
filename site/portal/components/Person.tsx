import Link from "next/link";

/** "Melanie Wolman" → "MW": lo que se ve en lugar de la foto. */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** La foto redonda chica de una persona en una lista, o sus iniciales si no tiene (un guión si no hay persona). */
export function Avatar({ name, photo, quiet }: { name: string | null; photo: string | null; quiet?: boolean }) {
  if (photo) return <img className="person__img" src={photo} alt="" />;
  return (
    <span className={quiet ? "avatar avatar--sm avatar--quiet" : "avatar avatar--sm"} aria-hidden="true">
      {name ? initials(name) : "—"}
    </span>
  );
}

/**
 * Una persona en una tabla: su foto (o sus iniciales), su nombre y una línea chica debajo (`sub`). Con `href` es un
 * link a su ficha. `quiet`: una persona secundaria (el coach de un cliente), sin negrita; sin `name`, `label`.
 */
export function Person({
  name,
  label,
  photo,
  sub,
  href,
  quiet,
  children,
}: {
  name: string | null;
  label?: string;
  photo: string | null;
  sub?: React.ReactNode;
  href?: string;
  quiet?: boolean;
  /** Lo que va al lado del nombre (una estrella, un aviso). */
  children?: React.ReactNode;
}) {
  const inner = (
    <>
      <Avatar name={name} photo={photo} quiet={quiet} />
      <span>
        <span className={quiet ? undefined : "strong"}>{name ?? label}</span>
        {children}
        {sub && <span className="person__sub">{sub}</span>}
      </span>
    </>
  );
  return href ? (
    <Link className="person" href={href}>
      {inner}
    </Link>
  ) : (
    <span className="person">{inner}</span>
  );
}
