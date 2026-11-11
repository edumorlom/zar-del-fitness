// Primero los estilos del sitio (colores, tipografías, botones, animaciones) y después los del portal.
import "@/app/globals.css";
import "./portal.css";
import { ClerkProvider } from "@clerk/nextjs";
import { esUY } from "@clerk/localizations";
import { ui } from "@clerk/ui";
import type { Metadata, Viewport } from "next";
import { IconSprite } from "@/components/Icon";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { fonts } from "@/components/RootShell";
import { Sparkles } from "@/components/Sparkles";
import { content, portalUrl, siteUrl } from "@/lib/content";
import { locales, pick } from "@/lib/i18n";
import { getLang } from "~/lib/lang";

export const generateMetadata = async (): Promise<Metadata> => ({
  metadataBase: new URL(portalUrl),
  title: { default: `${pick(await getLang())("Mi progreso", "My progress")} | Zar del Fitness`, template: "%s | Zar del Fitness" },
  // Privado: que los buscadores no lo indexen. Sólo /portal/ingresar, la entrada, se indexa (y está en el sitemap del sitio).
  robots: { index: false, follow: false },
  // Los mismos íconos que el sitio. app/favicon.ico ya lo agrega Next.js; icon.svg, icon1.png y apple-icon.tsx son
  // del layout del sitio, y se sirven desde ahí.
  icons: {
    icon: [
      { url: `${siteUrl}/icon.svg`, sizes: "any", type: "image/svg+xml" },
      { url: `${siteUrl}/icon1.png`, sizes: "192x192", type: "image/png" },
    ],
    apple: { url: `${siteUrl}/apple-icon`, sizes: "180x180", type: "image/png" },
  },
});

export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" };

// El ingreso de Clerk con los colores y los botones del sitio (app/globals.css), dentro del panel de /ingresar.
const gold = "linear-gradient(120deg, #a7892f, #e7c152 55%, #988858)";
const appearance = {
  // Las animaciones propias de Clerk se sumaban a las del panel: una sola entrada, la de .signin en portal.css
  layout: { animations: false },
  elements: {
    rootBox: { width: "100%" },
    // Al ancho del panel: Clerk trae 25rem fijos, más que un celular
    cardBox: { width: "100%", maxWidth: "100%", boxShadow: "none", border: "none", background: "transparent" },
    card: { width: "100%", maxWidth: "100%", background: "transparent", boxShadow: "none", border: "none", padding: 0 },
    // El título y el logo ya están en el panel
    header: { display: "none" },
    footer: { background: "transparent" },
    formButtonPrimary: {
      minHeight: "46px",
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
      minHeight: "44px",
      borderRadius: "999px",
      border: "1px solid rgba(220, 220, 220, 0.12)",
      background: "rgba(255, 255, 255, 0.03)",
    },
    // 16px: con menos, iOS agranda la página al tocar el campo
    formFieldInput: { minHeight: "44px", fontSize: "16px" },
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={locales[lang].html} className={fonts}>
      <body>
        {/* esUY: castellano rioplatense (con vos), lo más cercano a Argentina que trae Clerk; en inglés, el suyo (enUS) */}
        {/* ui: la versión del formulario de Clerk queda fija con la del portal (sus estilos no se rompen solos) */}
        <ClerkProvider ui={ui} appearance={appearance} localization={lang === "es" ? esUY : undefined} signInUrl="/portal/ingresar" signUpUrl="/portal/ingresar">
          <IconSprite />
          <a className="skip-link" href="#main">
            {pick(lang)("Ir al contenido", "Skip to content")}
          </a>
          {/* El fondo del sitio (el del inicio, components/Hero.tsx): los destellos y el brillo dorado, quietos detrás de todo */}
          <div className="site-backdrop" aria-hidden="true">
            <Sparkles />
          </div>
          {/* Lo mismo que el sitio: el scroll suave, el cursor dorado y la barra de progreso arriba */}
          <MotionProvider labels={{ video: content(lang).t.video }}>{children}</MotionProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
