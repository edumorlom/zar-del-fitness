"use client";

import { Component, createContext, lazy, Suspense, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { signedIn } from "~/lib/digui-cookie";

// La sesión del portal (Clerk) en el sitio, que es estático: su servidor no la lee, la pregunta el navegador.
//
// Clerk se carga al terminar la página (como el chat y Analytics) y dice si hay sesión, lo mismo que vería el portal:
// si venció, el menú vuelve a "Iniciar sesión"; si sigue, "Mi Portal". Mientras tanto (o si Clerk no responde), vale lo
// que dice __client_uat, la cookie que Clerk deja en el dominio ("0" o nada = sin sesión). Se le pregunta aunque no
// esté: puede faltar con la sesión iniciada (y entonces el botón decía "Iniciar sesión" y el portal te dejaba entrar).

const KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/** Lo que respondió Clerk: null mientras no respondió, o si no hizo falta preguntarle. */
const ClerkSays = createContext<boolean | null>(null);

const noop = () => () => {};
const cookieSays = () => signedIn(document.cookie);

// Clerk, en un archivo aparte: se baja después de la página, sin demorarla.
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
    if (!KEY) return;
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
