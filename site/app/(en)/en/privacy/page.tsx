import { LegalPage, legalMetadata } from "@/components/LegalPage";

export const metadata = legalMetadata("en", "privacidad");

export default function PrivacyPage() {
  return <LegalPage lang="en" id="privacidad" />;
}
