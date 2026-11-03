"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";

/**
 * Le pide a Google el permiso para el calendario del Zar (ver y crear eventos). Si entró con Google, se le amplía el
 * permiso a esa cuenta; si entró con el código por correo, se le conecta la cuenta de Google. Vuelve a la Agenda.
 */
export function ConnectCalendar({ scopes }: { scopes: string[] }) {
  const { user } = useUser();
  const [error, setError] = useState("");
  const connect = async () => {
    setError("");
    try {
      const google = user?.externalAccounts.find((a) => a.provider === "google");
      const account = google
        ? await google.reauthorize({ additionalScopes: scopes, redirectUrl: location.href })
        : await user!.createExternalAccount({ strategy: "oauth_google", redirectUrl: location.href, additionalScopes: scopes });
      const url = account.verification?.externalVerificationRedirectURL;
      if (url) location.href = url.href;
    } catch {
      setError("No se pudo abrir Google. Probá de nuevo.");
    }
  };
  return (
    <span className="connect">
      <button type="button" className="btn btn--gold btn--sm" onClick={connect} disabled={!user}>
        Conectar Google Calendar
      </button>
      {error && (
        <span className="form-msg form-msg--error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
