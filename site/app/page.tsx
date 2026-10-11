import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { About } from "@/components/About";
import { Programs } from "@/components/Programs";
import { Method } from "@/components/Method";
import { Benefits } from "@/components/Benefits";
import { Results } from "@/components/Results";
import { Vip } from "@/components/Vip";
import { Visit } from "@/components/Visit";
import { Press } from "@/components/Press";
import { Team } from "@/components/Team";
import { Faq } from "@/components/Faq";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { Reveals } from "@/components/motion/Reveals";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Marquee />
        <About />
        <Programs />
        <Method />
        <Benefits />
        <Results />
        <Vip />
        <Visit />
        <Press />
        <Team />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppFloat />
      {/* Último: conecta las animaciones data-* una vez montado todo el contenido */}
      <Reveals />
    </>
  );
}
