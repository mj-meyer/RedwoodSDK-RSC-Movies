import { AppContext } from "@/worker";
import { AddToFavoritesForm } from "../components/add-to-favorites/form";
import { ActorLink } from "../components/actor-link";

export async function Movie({
  params,
  ctx,
}: {
  params: { id: string };
  ctx: AppContext;
}) {
  let movie = await ctx.load.movie(Number(params.id));
  if (!movie) {
    throw new Response("Movie not found", {
      status: 404,
    });
  }

  return (
    <>
      <title>{movie.title}</title>
      <meta name="description" content={movie.extract} />

      <div className="p-12 items-center flex flex-col gap-y-12 lg:items-start lg:w-5xl lg:mx-auto lg:flex-row lg:gap-x-12">
        <div className="w-[296px] flex-none flex flex-col gap-y-2">
          <img src={movie.thumbnail} className="h-[435px] object-cover mb-4" />
          <AddToFavoritesForm movieId={movie.id} />
        </div>

        <div className="flex-1 flex flex-col gap-y-8">
          <h1 className="font-instrumentSerif leading-[125%] text-6xl">
            {movie.title}
          </h1>

          <p>{movie.extract}</p>

          <div className="flex flex-col gap-y-2">
            <div className="font-bold text-xl">Cast</div>
            <div>
              {movie.cast_ids.map((id, index, arr) => (
                <span key={id}>
                  <ActorLink ctx={ctx} id={id} />
                  {index < arr.length - 1 && " • "}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
