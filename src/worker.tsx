import { Document } from "@/app/Document";
import { setCommonHeaders } from "@/app/headers";
import { batch } from "@ryanflorence/batch-loader";
import { render, route } from "rwsdk/router";
import { defineApp } from "rwsdk/worker";
import { Home } from "./app/pages/home";
import { batchActors, batchMovies } from "./app/db";
import { Movie } from "./app/pages/movie";
import { Actor } from "./app/pages/actor";

export type AppContext = {
  load: {
    actor: (id: number) => Promise<any>;
    movie: (id: number) => Promise<any>;
  };
};

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
  ({ ctx }) => {
    ctx.load = createLoaders();
  },
  render(Document, [
    route("/", Home),
    route("/movie/:id", Movie),
    route("/actor/:id", Actor),
  ]),
]);
