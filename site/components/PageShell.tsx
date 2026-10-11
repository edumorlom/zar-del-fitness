import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppFloat } from "./WhatsAppFloat";
import { Reveals } from "./motion/Reveals";

/** Lo que rodea a cada página interna: menú, pie, WhatsApp y las animaciones data-*. */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <WhatsAppFloat />
      {/* Último: conecta las animaciones data-* una vez montado todo el contenido */}
      <Reveals />
    </>
  );
}
