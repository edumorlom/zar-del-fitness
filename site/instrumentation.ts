import { SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

export const posthogLoggerProvider =
  posthogToken && posthogHost
    ? new LoggerProvider({
        resource: resourceFromAttributes({ "service.name": "zar-del-fitness" }),
        processors: [
          new BatchLogRecordProcessor({
            exporter: new OTLPLogExporter({
              url: `${posthogHost.replace(/\/$/, "")}/i/v1/logs`,
              headers: {
                Authorization: `Bearer ${posthogToken}`,
                "Content-Type": "application/json",
              },
              timeoutMillis: 3_000,
            }),
          }),
        ],
      })
    : undefined;

const posthogLogger = posthogLoggerProvider?.getLogger("zar-del-fitness-posthog-lifecycle");

function logPortalLifecycle(body: string, severityNumber = SeverityNumber.INFO) {
  posthogLogger?.emit({
    body,
    severityNumber,
    attributes: { component: "portal_server_lifecycle" },
  });
}

// Al arrancar el servidor: crea las tablas que falten del portal y el primer admin. No durante `next build` (no hay
// base). Si la base no responde, el servidor arranca igual: el sitio no depende de ella (el portal sí, y falla solo).
// En producción, además, arranca el recordatorio de evaluación (portal/lib/reminders.ts), que se fija una vez por hora a
// quién mandárselo; con `npm run dev` no, para no mandarles correos a los clientes desde una base de prueba.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;

  if (!posthogLoggerProvider && process.env.NODE_ENV !== "production") {
    const missingVariable = posthogToken ? "NEXT_PUBLIC_POSTHOG_HOST" : "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN";
    console.warn(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
    );
  }

  const nodeProcess = await import("node:process");
  nodeProcess.once("beforeExit", () => {
    void posthogLoggerProvider?.forceFlush().catch(() => {});
  });

  logPortalLifecycle("portal_server_register_started");

  if (!process.env.DATABASE_URL) return console.warn("Sin DATABASE_URL: el portal no tiene base.");

  const { migrate } = await import("~/lib/migrate");
  logPortalLifecycle("portal_database_migration_started");
  try {
    await migrate();
    logPortalLifecycle("portal_database_migration_completed");
  } catch (err) {
    console.error("No se pudo preparar la base del portal:", err);
    logPortalLifecycle("portal_database_migration_failed", SeverityNumber.ERROR);
  }

  if (process.env.NODE_ENV === "production") {
    (await import("~/lib/reminders")).startEvaluationReminders();
    logPortalLifecycle("portal_evaluation_reminders_started");
  }
}
