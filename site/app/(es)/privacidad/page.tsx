import { LegalPage, legalMetadata } from "@/components/LegalPage";

export const metadata = legalMetadata("es", "privacidad");

export default function PrivacyPage() {
  return <LegalPage lang="es" id="privacidad" />;
}
