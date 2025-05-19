import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { batch } from "@ryanflorence/batch-loader";
import { env } from "cloudflare:workers";
import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { Movie } from "./app/pages/Movie";
import { MovieBatch } from "./app/pages/MovieBatch";

export type AppContext = {
  queries: number;
  load: {
    actor: (id: number) => Promise<any>;
  };
};

function createLoaders(env: Cloudflare.Env) {
  return {
    actor: batch(async (ids: number[]) => {
      const qs = ids.map(() => "?").join(",");
      const { results } = await env.DB.prepare(
        `SELECT id, name FROM actors WHERE id IN (${qs})`,
      )
        .bind(...ids)
        .all<{ id: number; name: string }>();
      const map = new Map(results.map((r) => [r.id, r]));
      return ids.map((id) => map.get(id) ?? null); // maintain order!
    }),
  };
}

function countDbQueriesMiddleware({
  ctx,
  headers,
}: {
  ctx: AppContext;
  headers: Headers;
}) {
  ctx.queries = 0;

  const instrumentStatement = (stmt: any, sql: string) => {
    const wrapExec = (fnName: string) => {
      if (typeof stmt[fnName] === "function") {
        const original = stmt[fnName].bind(stmt);
        stmt[fnName] = async (...args: any[]) => {
          console.log(
            `[SQL ${ctx.queries}] ${fnName.toUpperCase()} ::`,
            sql,
            "→",
            args,
          );

          headers.set("X-Query-Count", String(++ctx.queries));

          return original(...args);
        };
      }
    };

    // wrap first/all/run/raw
    ["first", "all", "run", "raw"].forEach(wrapExec);

    // wrap bind() so clones stay instrumented
    if (typeof stmt.bind === "function") {
      const originalBind = stmt.bind.bind(stmt);
      stmt.bind = (...args: any[]) => {
        return instrumentStatement(originalBind(...args), sql);
      };
    }

    return stmt;
  };

  const instrumentDB = (db: any) => {
    const originalPrepare = db.prepare.bind(db);
    db.prepare = (...args: any[]) =>
      instrumentStatement(originalPrepare(...args), args[0]);
  };

  instrumentDB(env.DB);
}

function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>RSC N + 1 Demo (RWSDK)</h1>

      <p>
        Two identical pages, one naïve and one using a request-scoped batch
        loader. Open dev-tools → “Network” and compare the
        <code>X-Query-Count</code> response header.
      </p>

      <div style={{ display: "flex", gap: "1rem" }}>
        <a
          href="/movie/1"
          style={{ padding: ".6rem 1rem", border: "1px solid" }}
        >
          naive&nbsp;version
        </a>
        <a
          href="/movie/1/batch"
          style={{ padding: ".6rem 1rem", border: "1px solid" }}
        >
          batched&nbsp;version
        </a>
      </div>
    </main>
  );
}

export default defineApp([
  setCommonHeaders(),
  countDbQueriesMiddleware,
  render(Document, [
    route("/", Home),
    route("/movie/:id", Movie),
    route("/movie/:id/batch", [
      ({ ctx }) => {
        ctx.load = createLoaders(env);
      },
      MovieBatch,
    ]),
  ]),
]);
