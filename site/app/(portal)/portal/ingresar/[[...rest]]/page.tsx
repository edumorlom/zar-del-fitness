import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DiguiChat } from "~/components/DiguiChat";
import { LoginBackdrop } from "~/components/LoginBackdrop";
import { SiteHeader } from "~/components/SiteHeader";
import { getViewer } from "~/lib/auth";
import { getLang } from "~/lib/lang";
import { pick } from "@/lib/i18n";

// La única página del portal que se indexa: está en el sitemap del sitio (app/sitemap.ts), para que quien busque
// "Zar del Fitness portal" o "mi progreso" llegue al ingreso. Las demás piden sesión y no se indexan (app/(portal)/layout.tsx).
export async function generateMetadata(): Promise<Metadata> {
  const tr = pick(await getLang());
  return {
    title: tr("Ingresar", "Sign in"),
    description: tr(
      "Mi Portal de Zar del Fitness: tu progreso, tus evaluaciones y tus turnos con tu coach. Entrá con Google o con tu correo.",
      "Zar del Fitness member portal: your progress, your evaluations and your sessions with your coach. Sign in with Google or your email."
    ),
    robots: { index: true, follow: false },
  };
}

// [[...rest]]: los pasos de Clerk (el código por correo, la vuelta de Google) viven bajo /portal/ingresar/….
export default async function LoginPage() {
  if (await getViewer()) redirect("/portal");
  const lang = await getLang();
  const tr = pick(lang);
  return (
    <>
    <SiteHeader login={{ label: tr("Iniciar sesión", "Sign in"), href: "/portal/ingresar" }} lang={lang} />
    <main id="main" className="login">
      <LoginBackdrop />

      {/* El panel no se anima: el formulario de Clerk llega después (lo baja de Clerk) y moverlo o achicarlo mientras
          tanto se veía a los saltos. Entran el título y el texto; el formulario, en su lugar ya reservado (.signin). */}
      <div className="panel">
        <p className="eyebrow intro">
          <span className="dot" /> {tr("Mi progreso", "My progress")}
        </p>
        <h1 className="h2 intro-lines">
          <span className="ln">
            <span>{tr("Bienvenido", "Welcome")}</span>
          </span>{" "}
          <span className="ln">
            <span>
              <em className="serif gold-text">{tr("de vuelta", "back")}</em>
            </span>
          </span>
        </h1>
        <p className="panel__lead intro">{tr("Entrá con Google o con tu correo.", "Sign in with Google or your email.")}</p>
        <div className="signin">
          <SignIn routing="path" path="/portal/ingresar" withSignUp fallbackRedirectUrl="/portal" signUpFallbackRedirectUrl="/portal" />
        </div>
      </div>

      <p className="motto intro-lines">
        <span className="ln">
          <span>{tr("Nada se promete acá.", "Nothing is promised here.")}</span>
        </span>{" "}
        <span className="ln">
          <span>
            <em className="serif gold-text">{tr("Todo se entrena.", "Everything is earned.")}</em>
          </span>
        </span>
      </p>

    </main>
    <DiguiChat forget />
    </>
  );
}
