import { env } from "cloudflare:workers";

export async function ActorLink({ id }: { id: number }) {
  // one separate network hop for every actor
  const row = await env.DB.prepare("SELECT id, name FROM actors WHERE id = ?")
    .bind(id)
    .first<any>();

  return <a href={`/actor/${row.id}`}>{row.name}</a>;
}
