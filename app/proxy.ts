import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk lee la sesión en cada pedido. Qué puede ver cada uno se decide en las páginas y las acciones (lib/auth.ts).
export default clerkMiddleware();

export const config = {
  matcher: [
    // Todo menos los archivos internos de Next.js y los estáticos
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
