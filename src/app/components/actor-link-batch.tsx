import { AppContext } from "@/worker";

export async function ActorLinkBatch({
  ctx,
  id,
}: {
  ctx: AppContext;
  id: number;
}) {
  const actor = await ctx.load.actor(id);
  return <a href={`/actor/${actor.id}`}>{actor.name}</a>;
}
