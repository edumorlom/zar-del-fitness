import { Fragment } from "react";

/**
 * Un título de db/textos.json, por líneas (cada una entra animada, ver data-lines en Reveals). La línea entre
 * *asteriscos* es la destacada: en cursiva dorada (`em`), o sólo dorada (`gold`, en el inicio y el cierre).
 */
export function Lines({ lines, accent = "em" }: { lines: string[]; accent?: "em" | "gold" }) {
  return lines.map((line, i) => {
    const marked = line.match(/^\*(.+)\*$/)?.[1];
    return (
      <Fragment key={i}>
        {i > 0 && " "}
        <span className="ln">
          {marked === undefined ? (
            <span>{line}</span>
          ) : accent === "gold" ? (
            <span className="gold-text">{marked}</span>
          ) : (
            <span>
              <em className="serif gold-text">{marked}</em>
            </span>
          )}
        </span>
      </Fragment>
    );
  });
}
