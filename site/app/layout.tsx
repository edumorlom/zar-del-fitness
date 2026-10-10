import type { Metadata, Viewport } from "next";
import { Anton, Instrument_Serif, Manrope } from "next/font/google";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const instrument = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
});
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  metadataBase: new URL("https://zardelfitness.com.ar"),
  title: "Zar del Fitness · Reto de los 25 días by Ronald Medina",
  description:
    "Entrená con Ronald Medina, el Zar del Fitness. Reto de los 25 días online, Sistema Premium presencial en The VIP (Colegiales, CABA) y entrenamiento online internacional.",
  openGraph: {
    title: "Zar del Fitness · Reto de los 25 días",
    description: "Transformá tu cuerpo con el método de Ronald Medina. Resultados cada 25 días.",
    images: ["/img/ronald-portrait.webp"],
    locale: "es_AR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${anton.variable} ${instrument.variable} ${manrope.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Ir al contenido
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
