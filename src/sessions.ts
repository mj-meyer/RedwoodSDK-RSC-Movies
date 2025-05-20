import { DurableObject } from "cloudflare:workers";

export interface Session {
  id: string;
  data: Record<string, any>;
  createdAt: number;
  lastAccessedAt: number;
}

export class SessionDO extends DurableObject {
  private storage: DurableObjectStorage;
  private session: Session | null = null;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.storage = state.storage;
  }

  async getSession(sessionId: string): Promise<Session> {
    if (!sessionId) {
      throw new Error("Session ID required");
    }

    if (!this.session) {
      // Try to load from storage
      this.session = (await this.storage.get("session")) as Session | null;

      // If still null, create a new session
      if (!this.session) {
        this.session = {
          id: sessionId,
          data: {},
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
        };
        await this.storage.put("session", this.session);
      }
    }

    // Update last accessed time
    this.session.lastAccessedAt = Date.now();
    await this.storage.put("session", this.session);

    return this.session;
  }

  async setSession(newData: Record<string, any>): Promise<Session> {
    if (!this.session) {
      const sessionData = (await this.storage.get("session")) as Session | null;
      if (!sessionData) {
        throw new Error("Session not found");
      }
      this.session = sessionData;
    }

    this.session.data = { ...this.session.data, ...newData };
    this.session.lastAccessedAt = Date.now();

    await this.storage.put("session", this.session);
    return this.session;
  }

  async deleteSession(): Promise<string> {
    await this.storage.delete("session");
    this.session = null;
    return "Session deleted";
  }
}
