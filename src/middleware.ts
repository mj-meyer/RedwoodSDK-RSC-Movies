import { Session } from "@/sessions";
import { RequestInfo } from "rwsdk/worker";
import { env } from "cloudflare:workers";

export interface SessionContext {
  session: Session;
}

export async function setupSession({ request, ctx, headers }: RequestInfo) {
  // Get existing session cookie or create a new one
  let sessionId = request.headers
    .get("Cookie")
    ?.match(/sessionId=([^;]+)/)?.[1];

  if (!sessionId) {
    // Generate a new sessionId if none exists
    sessionId = crypto.randomUUID();

    headers.set(
      "Set-Cookie",
      `sessionId=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 30}`, // 30 days
    );

    console.log(`Created new session with ID: ${sessionId}`);
  } else {
    console.log(`Using existing session with ID: ${sessionId}`);
  }

  // Get the Durable Object for this session
  const id = env.SESSIONS.idFromName(sessionId);
  // Cast the stub to include our RPC methods using type assertion
  const sessionDO = env.SESSIONS.get(id);

  const sessionData = await sessionDO.getSession(sessionId);
  ctx.session = sessionData as unknown as Session;
}
