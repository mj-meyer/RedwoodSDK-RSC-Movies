import { AppContext } from "@/worker";
import { MovieGrid } from "../components/movie-grid";
import { MovieTile } from "../components/movie-tile";
import { RootLayout } from "../layouts/root";

export async function Actor({
  params,
  ctx,
}: {
  params: { id: string };
  ctx: AppContext;
}) {
  const actor = await ctx.load.actor(Number(params.id));

  return (
    <RootLayout>
      <title>{actor.name}</title>
      <div className="flex flex-col gap-15">
        <div className="flex flex-col gap-2 ">
          <div className="font-bold text-center">Starring</div>
          <h1 className="text-center font-instrumentSerif text-6xl">
            {actor.name}
          </h1>
        </div>
        <MovieGrid>
          {actor.movie_ids.map((id: number) => (
            <MovieTile key={id} id={id} />
          ))}
        </MovieGrid>
      </div>
    </RootLayout>
  );
}
