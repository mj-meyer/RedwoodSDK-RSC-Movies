import { requestInfo } from "rwsdk/worker";

export async function ActorLink({ id }: { id: number }) {
  const { ctx } = requestInfo;

  const actor = await ctx.load.actor(id);
  if (!actor) return null;
  return (
    <a href={`/actor/${actor.id}`} className="text-[#1458E1] hover:underline">
      {actor.name}
    </a>
  );
}
