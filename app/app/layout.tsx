// Primero los estilos del sitio (colores, tipografías, botones, animaciones) y después los del portal.
import "@/app/globals.css";
import "./portal.css";
import { ClerkProvider } from "@clerk/nextjs";
import { esUY } from "@clerk/localizations";
import type { Metadata, Viewport } from "next";
import { Anton, Instrument_Serif, Manrope } from "next/font/google";
import { IconSprite } from "@/components/Icon";
import { Cursor } from "@/components/motion/Cursor";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

// Las mismas tipografías que site/components/RootShell.tsx.
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const instrument = Instrument_Serif({ weight: "400", style: "italic", subsets: ["latin"], variable: "--font-instrument" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: { default: "Mi progreso | Zar del Fitness", template: "%s | Zar del Fitness" },
  // Privado: que los buscadores no lo indexen.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" };

// El ingreso de Clerk con los colores y los botones del sitio (site/app/globals.css), dentro del panel de /ingresar.
const gold = "linear-gradient(120deg, #a7892f, #e7c152 55%, #988858)";
const appearance = {
  elements: {
    rootBox: { width: "100%" },
    cardBox: { width: "100%", boxShadow: "none", border: "none", background: "transparent" },
    card: { background: "transparent", boxShadow: "none", border: "none", padding: 0 },
    // El título y el logo ya están en el panel
    header: { display: "none" },
    footer: { background: "transparent" },
    formButtonPrimary: {
      minHeight: "48px",
      border: "none",
      borderRadius: "999px",
      background: gold,
      color: "#000",
      fontWeight: 800,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      boxShadow: "0 10px 40px -12px rgba(214, 166, 29, 0.55)",
    },
    socialButtonsBlockButton: {
      minHeight: "48px",
      borderRadius: "999px",
      border: "1px solid rgba(220, 220, 220, 0.12)",
      background: "rgba(255, 255, 255, 0.03)",
    },
    formFieldInput: { minHeight: "48px" },
  },
  variables: {
    colorPrimary: "#d6a61d",
    colorPrimaryForeground: "#000000",
    colorBackground: "#131313",
    colorForeground: "#ffffff",
    colorMutedForeground: "#a3a3a3",
    colorNeutral: "#dcdcdc",
    colorInput: "#1b1b1b",
    colorInputForeground: "#ffffff",
    colorBorder: "rgba(220, 220, 220, 0.12)",
    colorRing: "#988858",
    colorDanger: "#ff8a7a",
    fontFamily: "var(--font-manrope), system-ui, sans-serif",
    borderRadius: "14px",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${anton.variable} ${instrument.variable} ${manrope.variable}`}>
      <body>
        {/* esUY: castellano rioplatense (con vos), lo más cercano a Argentina que trae Clerk */}
        <ClerkProvider appearance={appearance} localization={esUY} signInUrl="/ingresar" signUpUrl="/ingresar">
          <IconSprite />
          <a className="skip-link" href="#main">
            Ir al contenido
          </a>
          <SmoothScroll />
          <Cursor />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
