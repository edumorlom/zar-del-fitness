/** Datos estructurados para Google (JSON-LD). Ver lib/seo.ts. */
export function JsonLd({ data }: { data: object[] }) {
  const graph = { "@context": "https://schema.org", "@graph": data };
  return (
    <script
      type="application/ld+json"
      // "<" escapado para que un texto nunca pueda cerrar el <script>.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
    />
  );
}
