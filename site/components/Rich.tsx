/** Un texto de db/ con *cursiva* y **negrita**, como en Markdown. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((part, i) =>
        part.startsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : part.startsWith("*") ? (
          <em key={i}>{part.slice(1, -1)}</em>
        ) : (
          part
        )
      )}
    </>
  );
}
