// Al arrancar el servidor: crea las tablas que falten y el primer admin. No durante `next build` (no hay base).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { migrate } = await import("~/lib/migrate");
  await migrate();
}
