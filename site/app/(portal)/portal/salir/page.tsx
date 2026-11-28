"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";
import posthog from "posthog-js";

// El botón "Cerrar sesión" del menú del sitio (components/Header.tsx) es un link: esta página cierra la sesión y va al ingreso.
export default function SignOutPage() {
  const { signOut } = useClerk();
  useEffect(() => {
    if (posthog.__loaded) posthog.reset();
    void signOut({ redirectUrl: "/portal/ingresar" });
  }, [signOut]);
  return null;
}
