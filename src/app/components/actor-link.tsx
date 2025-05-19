import { AppContext } from "@/worker";

export async function ActorLink({ ctx, id }: { ctx: AppContext; id: number }) {
  const actor = await ctx.load.actor(id);
  if (!actor) return null;
  return (
    <a href={`/actor/${actor.id}`} className="text-[#1458E1] hover:underline">
      {actor.name}
    </a>
  );
}
