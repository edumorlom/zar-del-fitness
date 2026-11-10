"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

// Clerk en el sitio, sólo para preguntar si hay sesión. Va aparte (lo carga components/Session.tsx al terminar la
// página): así su código no se suma al de cada página.

function Report({ onChange }: { onChange: (signedIn: boolean) => void }) {
  const { isLoaded, isSignedIn } = useAuth();
  useEffect(() => {
    if (isLoaded) onChange(Boolean(isSignedIn));
  }, [isLoaded, isSignedIn, onChange]);
  return null;
}

export default function SessionClerk({ onChange }: { onChange: (signedIn: boolean) => void }) {
  return (
    // Sin los formularios de Clerk (prefetchUI), que en el sitio no se muestran
    <ClerkProvider prefetchUI={false} signInUrl="/portal/ingresar" signUpUrl="/portal/ingresar">
      <Report onChange={onChange} />
    </ClerkProvider>
  );
}
