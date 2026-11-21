// Las tarjetas que se repiten en las páginas del equipo: una cuenta (KPI), un aviso y "no hay nada".

/** Una cuenta del dashboard o de Pagos: la etiqueta, la aclaración, el número grande (animado) y un pie. */
export function Kpi({
  label,
  sub,
  value,
  unit,
  of,
  money,
  foot,
  wide,
  children,
}: {
  label: string;
  sub: string;
  value: number | string;
  unit?: string;
  /** Al lado del número, en gris: de cuántos ("12 de 40"). */
  of?: string;
  /** Un monto ya escrito ("$ 450.000"): más chico y sin animar. */
  money?: boolean;
  /** Debajo del número: un texto (va en gris) o algo propio (un link, una comparación). */
  foot?: React.ReactNode;
  wide?: boolean;
  /** Lo demás de la tarjeta (la cobertura del dashboard): después del número. */
  children?: React.ReactNode;
}) {
  return (
    <section className={wide ? "card kpi kpi--wide" : "card kpi"}>
      <p className="label">{label}</p>
      <p className="kpi__sub">{sub}</p>
      <p className={money ? "kpi__big kpi__big--money" : "kpi__big"}>
        {money ? value : <span data-count={value}>{value}</span>}
        {unit && <small>{unit}</small>}
        {of && <span className="muted kpi__of">{of}</span>}
      </p>
      {children}
      {typeof foot === "string" ? <p className="kpi__foot">{foot}</p> : foot}
    </section>
  );
}

/** Un aviso con borde dorado: el título en negrita y el texto en gris. Con `aside`, algo a la derecha (un botón). */
export function Notice({
  title,
  text,
  aside,
  reveal = true,
  role,
}: {
  title: React.ReactNode;
  text?: React.ReactNode;
  aside?: React.ReactNode;
  /** Entra animada al hacer scroll (data-reveal de components/motion/Reveals.tsx). */
  reveal?: boolean;
  role?: string;
}) {
  const body = (
    <>
      <p className="strong">{title}</p>
      {text && <p className="muted">{text}</p>}
    </>
  );
  return (
    <div className={aside ? "card notice notice--row" : "card notice"} data-reveal={reveal || undefined} role={role}>
      {aside ? (
        <>
          <div>{body}</div>
          {aside}
        </>
      ) : (
        body
      )}
    </div>
  );
}

/** "Todavía no hay…": una tarjeta con el título grande y, si hace falta, por qué o qué hacer. */
export function Empty({ title, text, reveal }: { title: string; text?: React.ReactNode; reveal?: boolean }) {
  return (
    <div className="card empty" data-reveal={reveal || undefined}>
      <p className="fact">{title}</p>
      {text && <p className="muted">{text}</p>}
    </div>
  );
}
