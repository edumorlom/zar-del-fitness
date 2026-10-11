/** Un texto de db/ con *cursiva* y **negrita**, como en Markdown. `emClass` le da estilo a la cursiva. */
export function Rich({ text, emClass }: { text: string; emClass?: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((part, i) =>
        part.startsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : part.startsWith("*") ? (
          <em key={i} className={emClass}>
            {part.slice(1, -1)}
          </em>
        ) : (
          part
        )
      )}
    </>
  );
}
