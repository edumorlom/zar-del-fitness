import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { keyOk } from "~/lib/digui-api";
import { portalMcp } from "~/lib/mcp";

// El servidor MCP del portal (portal/lib/mcp.ts), por Streamable HTTP: <portalUrl>/api/digui/mcp, con la clave de
// Digui (Authorization: Bearer <DIGUI_API_KEY>). Sin estado: cada pedido arma su servidor y responde
// JSON, así no hay sesiones que guardar entre réplicas de Railway.
export const dynamic = "force-dynamic";

async function handle(req: Request) {
  if (!keyOk(req.headers.get("authorization"), process.env.DIGUI_API_KEY))
    return Response.json({ jsonrpc: "2.0", error: { code: -32001, message: "Clave equivocada." }, id: null }, { status: 401 });
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  const server = portalMcp();
  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    // Con enableJsonResponse la respuesta ya está entera: se cierra para no dejar el servidor colgado.
    void server.close();
  }
}

export { handle as GET, handle as POST, handle as DELETE };
