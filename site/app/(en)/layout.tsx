import { RootShell, rootMetadata, rootViewport } from "@/components/RootShell";

// El sitio en inglés, todo bajo /english/: <html lang="en">.
export const metadata = rootMetadata;
export const viewport = rootViewport;

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootShell lang="en">{children}</RootShell>;
}
