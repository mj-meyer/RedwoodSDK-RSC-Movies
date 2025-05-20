import { requestInfo } from "rwsdk/worker";

export async function FavoriteLink({ id }: { id: number }) {
  const { ctx } = requestInfo;

  const movie = await ctx.load.movie(id);
  if (!movie) return null;
  return (
    <a href={`/movie/${movie.id}`}>
      <img src={movie.thumbnail} className="w-[112px] h-[162px] object-cover" />
    </a>
  );
}
