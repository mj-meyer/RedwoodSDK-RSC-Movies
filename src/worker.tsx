import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { setupSession, SessionContext } from "@/middleware";
import { batch } from "@ryanflorence/batch-loader";
import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { SessionDO } from "./sessions";
import { Home } from "./app/pages/home";
import { batchActors, batchMovies } from "@/db";
import { Movie } from "./app/pages/movie";
import { Actor } from "./app/pages/actor";

// Register DurableObject
export { SessionDO };

export type AppContext = {
  load: {
    actor: (id: number) => Promise<any>;
    movie: (id: number) => Promise<any>;
  };
} & SessionContext;

/**
 * Create the batched/cached loading functions so queries are naturally
 * efficient regardless of the UI on the page (solves n+1 queries and
 * refetching, based on GraphQL DataLoader)
 */
function createLoaders() {
  return {
    movie: batch(batchMovies),
    actor: batch(batchActors),
  };
}

export default defineApp([
  setCommonHeaders(),
  setupSession,
  ({ ctx }) => {
    ctx.load = createLoaders();
  },
  render(Document, [
    route("/", Home),
    route("/movie/:id", Movie),
    route("/actor/:id", Actor),
  ]),
]);
