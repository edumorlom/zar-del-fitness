import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "~/lib/auth";

export const metadata: Metadata = { title: "Ingresar" };

// [[...rest]]: los pasos de Clerk (el código por correo, la vuelta de Google) viven bajo /ingresar/….
export default async function LoginPage() {
  if (await getViewer()) redirect("/");
  return (
    <main id="main" className="login">
      <div className="login__bg" aria-hidden="true">
        <img src="/img/vip-gym.webp" alt="" />
      </div>

      <div className="panel intro">
        <img className="panel__logo" src="/img/logo.webp" alt="Zar del Fitness" width={666} height={361} />
        <p className="eyebrow">
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
        <p className="panel__lead">Entrá con Google o con tu correo para ver tu progreso.</p>
        <SignIn routing="path" path="/ingresar" withSignUp fallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" />
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

      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {[0, 1].map((k) => (
            <span key={k} className="marquee__set">
              <span>Seguimiento corporal</span>
              <span className="marquee__spark">✦</span>
              <span>Medición a medición</span>
              <span className="marquee__spark">✦</span>
              <span>Resultados cada 25 días</span>
              <span className="marquee__spark">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="login__foot">
        <a href="https://zardelfitness.com.ar/">zardelfitness.com.ar ↗</a>
        <span>The VIP · Colegiales</span>
      </div>
    </main>
  );
}
