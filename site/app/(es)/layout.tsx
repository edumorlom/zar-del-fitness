import { RootShell, rootMetadata, rootViewport } from "@/components/RootShell";

// El sitio en castellano: "/", el blog y sus notas. El inglés tiene su propio layout raíz en app/(en)/.
export const metadata = rootMetadata;
export const viewport = rootViewport;

export default function SpanishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootShell lang="es">{children}</RootShell>;
}
