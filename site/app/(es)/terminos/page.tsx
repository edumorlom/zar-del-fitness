import { LegalPage, legalMetadata } from "@/components/LegalPage";

export const metadata = legalMetadata("es", "terminos");

export default function TermsPage() {
  return <LegalPage lang="es" id="terminos" />;
}
