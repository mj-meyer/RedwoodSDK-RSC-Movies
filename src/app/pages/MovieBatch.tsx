import { RequestInfo } from "rwsdk/worker";
import { env } from "cloudflare:workers";
import { ActorLinkBatch } from "../components/actor-link-batch";

export async function MovieBatch({ ctx, params }: RequestInfo) {
  const movie = await env.DB.prepare("SELECT title FROM movies WHERE id = ?")
    .bind(params.id)
    .first<any>();

  const cast = await env.DB.prepare(
    "SELECT actor_id FROM cast WHERE movie_id = ?",
  )
    .bind(params.id)
    .all<any>();

  return (
    <>
      <h1>{movie.title}</h1>
      <ul>
        {cast.results.map(({ actor_id }) => (
          <li key={actor_id}>
            <ActorLinkBatch ctx={ctx} id={actor_id} />
          </li>
        ))}
      </ul>
    </>
  );
}
