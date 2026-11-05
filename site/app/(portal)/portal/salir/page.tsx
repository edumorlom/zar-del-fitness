"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

// El botón "Cerrar sesión" del menú del sitio (components/Header.tsx) es un link: esta página cierra la sesión y va al ingreso.
export default function SignOutPage() {
  const { signOut } = useClerk();
  useEffect(() => {
    signOut({ redirectUrl: "/portal/ingresar" });
  }, [signOut]);
  return null;
}
