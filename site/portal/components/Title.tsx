/**
 * Un título en dos líneas, la segunda en cursiva dorada (como Lines del sitio). Entra animado al hacer scroll
 * (data-lines, components/motion/Reveals.tsx) o, con `intro`, al cargar la página (intro-lines, portal.css): lo de
 * arriba no espera al scroll.
 */
export function Title({
  plain,
  accent,
  as: Tag = "h2",
  className = "h2 h2--sm",
  intro = false,
}: {
  plain: string;
  accent?: string;
  as?: "h1" | "h2";
  className?: string;
  intro?: boolean;
}) {
  return (
    <Tag className={intro ? `${className} intro-lines` : className} data-lines={intro ? undefined : true}>
      <span className="ln">
        <span>{plain}</span>
      </span>
      {accent && (
        <>
          {" "}
          <span className="ln">
            <span>
              <em className="serif gold-text">{accent}</em>
            </span>
          </span>
        </>
      )}
    </Tag>
  );
}
