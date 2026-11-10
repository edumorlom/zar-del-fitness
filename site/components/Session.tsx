"use client";

import { Component, createContext, lazy, Suspense, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { signedIn } from "~/lib/digui-cookie";

// La sesión del portal (Clerk) en el sitio, que es estático: su servidor no la lee, la pregunta el navegador.
//
// Clerk deja __client_uat en el dominio: "0" o nada es sin sesión, y así lo decide también su servidor (sin revisar
// nada más). Con la cookie, Clerk se carga al terminar la página (como el chat y Analytics) y dice si la sesión sigue:
// si venció, el menú vuelve a "Iniciar sesión". Sin ella, no hay nada que preguntarle: ni se carga.

const KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/** Lo que respondió Clerk: null mientras no respondió, o si no hizo falta preguntarle. */
const ClerkSays = createContext<boolean | null>(null);

const noop = () => () => {};
const cookieSays = () => signedIn(document.cookie);

// Clerk, en un archivo aparte que sólo se baja si hay que preguntarle.
const SessionClerk = lazy(() => import("./SessionClerk"));

/** Si Clerk falla (no se baja, no carga bien, cambia algo suyo), no se cae la página: queda lo que dice la cookie. */
class Quiet extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** En el layout del sitio (components/RootShell.tsx), alrededor de todo. */
export function SiteSession({ children }: { children: React.ReactNode }) {
  const [said, setSaid] = useState<boolean | null>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (!KEY || !cookieSays()) return;
    let live = true;
    const start = () => (window.requestIdleCallback ?? window.setTimeout)(() => live && setLoad(true));
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      live = false;
      window.removeEventListener("load", start);
    };
  }, []);

  return (
    <ClerkSays.Provider value={said}>
      {children}
      {load && (
        <Quiet>
          <Suspense fallback={null}>
            <SessionClerk onChange={setSaid} />
          </Suspense>
        </Quiet>
      )}
    </ClerkSays.Provider>
  );
}

/** Lo que respondió Clerk de la sesión, o null si todavía no (o fuera del sitio). */
export const useClerkSignedIn = () => useContext(ClerkSays);

/** ¿Hay sesión iniciada? Lo que respondió Clerk; mientras tanto (y en el portal), lo que dice su cookie. */
export function useSignedIn() {
  const said = useClerkSignedIn();
  const cookie = useSyncExternalStore(noop, cookieSays, () => false);
  return said ?? cookie;
}
