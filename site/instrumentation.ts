// Al arrancar el servidor: crea las tablas que falten del portal y el primer admin. No durante `next build` (no hay
// base). Si la base no responde, el servidor arranca igual: el sitio no depende de ella (el portal sí, y falla solo).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  if (!process.env.DATABASE_URL) return console.warn("Sin DATABASE_URL: el portal no tiene base.");
  const { migrate } = await import("~/lib/migrate");
  await migrate().catch((err) => console.error("No se pudo preparar la base del portal:", err));
}
