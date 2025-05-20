/// <reference types="@cloudflare/workers-types" />

// Cloudflare environment bindings
declare global {
  interface Env {
    SESSIONS: DurableObjectNamespace;
    DB: D1Database;
  }
} 