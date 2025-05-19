import { AppContext } from "@/worker";

export async function FavoriteLink({
  ctx,
  id,
}: {
  ctx: AppContext;
  id: number;
}) {
  const movie = await ctx.load.movie(id);
  if (!movie) return null;
  return (
    <a href={`/movie/${movie.id}`}>
      <img src={movie.thumbnail} className="w-[112px] h-[162px] object-cover" />
    </a>
  );
}
