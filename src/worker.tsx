import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { batch } from "@ryanflorence/batch-loader";
import { env } from "cloudflare:workers";
import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { Movie } from "./app/pages/Movie";
import { MovieBatch } from "./app/pages/MovieBatch";
import { Home } from "./app/pages/home";

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

export default defineApp([
  setCommonHeaders(),
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
