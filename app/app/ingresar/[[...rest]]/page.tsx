import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginBackdrop } from "~/components/LoginBackdrop";
import { SiteHeader } from "~/components/SiteHeader";
import { getViewer } from "~/lib/auth";

export const metadata: Metadata = { title: "Ingresar" };

// [[...rest]]: los pasos de Clerk (el código por correo, la vuelta de Google) viven bajo /ingresar/….
export default async function LoginPage() {
  if (await getViewer()) redirect("/");
  return (
    <>
    <SiteHeader login={{ label: "Ingresar", href: "/ingresar" }} />
    <main id="main" className="login">
      <LoginBackdrop />

      {/* El panel no se anima: el formulario de Clerk llega después (lo baja de Clerk) y moverlo o achicarlo mientras
          tanto se veía a los saltos. Entran el título y el texto; el formulario, en su lugar ya reservado (.signin). */}
      <div className="panel">
        <p className="eyebrow intro">
          <span className="dot" /> Mi progreso
        </p>
        <h1 className="h2 intro-lines">
          <span className="ln">
            <span>Bienvenido</span>
          </span>{" "}
          <span className="ln">
            <span>
              <em className="serif gold-text">de vuelta</em>
            </span>
          </span>
        </h1>
        <p className="panel__lead intro">Entrá con Google o con tu correo.</p>
        <div className="signin">
          <SignIn routing="path" path="/ingresar" withSignUp fallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" />
        </div>
      </div>

      <p className="motto intro-lines">
        <span className="ln">
          <span>Nada se promete acá.</span>
        </span>{" "}
        <span className="ln">
          <span>
            <em className="serif gold-text">Todo se entrena.</em>
          </span>
        </span>
      </p>

    </main>
    </>
  );
}
