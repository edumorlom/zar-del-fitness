import { LegalPage, legalMetadata } from "@/components/LegalPage";

export const metadata = legalMetadata("en", "terminos");

export default function TermsPage() {
  return <LegalPage lang="en" id="terminos" />;
}
