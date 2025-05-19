import { ActorLink } from "./actor-link";
import { AddToFavoritesForm } from "./add-to-favorites/form";
import { AppContext } from "@/worker";

export async function MovieTile({ ctx, id }: { ctx: AppContext; id: number }) {
  const movie = await ctx.load.movie(id);

  return (
    <div className="w-[296px] flex flex-col gap-y-9">
      <a href={`/movie/${movie.id}`}>
        <img
          src={movie.thumbnail || "https://picsum.photos/150/225"}
          className="w-full h-[435px] object-cover mb-4"
          alt={movie.title}
        />
      </a>

      <AddToFavoritesForm movieId={movie.id} />

      <h2 className="font-instrumentSerif text-3xl">
        <a href={`/movie/${movie.id}`} className="hover:underline">
          {movie.title}
        </a>{" "}
        ({movie.year})
      </h2>

      <p className="mb-2">
        {movie.extract.length > 350
          ? movie.extract.slice(0, 350) + "..."
          : movie.extract}
      </p>

      <p>
        <b className="font-semibold">Starring</b>:{" "}
        {movie.cast_ids.slice(0, 10).map((id, index, arr) => (
          <span key={id}>
            <ActorLink ctx={ctx} id={id} />
            {index < arr.length - 1 && <span className="mx-1">•</span>}
          </span>
        ))}
      </p>
    </div>
  );
}
