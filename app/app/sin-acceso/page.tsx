import { currentUser } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import gimnasio from "@db/gimnasio.json";
import { SignOut } from "~/components/Shell";
import { getViewer } from "~/lib/auth";

export const metadata: Metadata = { title: "Sin acceso" };

const wa = `https://wa.me/${gimnasio.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hola! Quiero entrar a Mi progreso.")}`;

// Entró con Clerk, pero su correo no está cargado en el portal.
export default async function NoAccessPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/ingresar");
  if (viewer !== "unregistered") redirect("/");
  const email = (await currentUser())?.primaryEmailAddress?.emailAddress;

  return (
    <main id="main" className="login">
      <div className="panel intro">
        <img className="panel__logo" src="/img/logo.webp" alt="Zar del Fitness" width={666} height={361} />
        <p className="eyebrow">
          <span className="dot" /> Mi progreso
        </p>
        <h1 className="h2 intro-lines">
          <span className="ln">
            <span>Todavía</span>
          </span>{" "}
          <span className="ln">
            <span>
              <em className="serif gold-text">no estás</em>
            </span>
          </span>
        </h1>
        <p className="panel__lead">
          {email ? <>Tu correo <b>{email}</b> no está registrado.</> : "Tu correo no está registrado."} Pedile a tu coach
          que te sume con ese correo, o entrá con otro.
        </p>
        <div className="panel__actions">
          <a className="btn btn--gold" href={wa} target="_blank" rel="noopener">
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <use href="#i-wa" />
            </svg>
            Escribinos
          </a>
          <SignOut />
        </div>
      </div>
    </main>
  );
}
