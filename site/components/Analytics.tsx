import Script from "next/script";

// Google Analytics 4 (la cuenta del sitio). Va en todas las páginas, en los dos idiomas (components/RootShell.tsx).
const GA_ID = "G-V935ED0C5J";

/**
 * El código de Google Analytics (gtag.js). Se carga después de que la página está lista, para no demorarla.
 * Sólo en el build de producción: con `npm run dev` no cuenta visitas.
 * Cada página carga completa (los links son <a> comunes), así que cada una registra su propia visita.
 */
export function Analytics() {
  if (process.env.NODE_ENV !== "production") return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
    </>
  );
}
