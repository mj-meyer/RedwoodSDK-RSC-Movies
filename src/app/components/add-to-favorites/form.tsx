import { AddToFavoritesButton } from "./button";
import { isFavorite } from "@/db";
import { updateFavorite } from "./update-favorite";
import { AppContext } from "@/worker";

export async function AddToFavoritesForm({
  ctx,
  movieId,
}: {
  ctx: AppContext;
  movieId: number;
}) {
  let liked = await isFavorite(ctx.session.id, movieId);
  console.log("liked", liked);
  return (
    <form action={updateFavorite}>
      <input type="hidden" name="id" value={movieId} />
      <input type="hidden" name="intent" value={liked ? "remove" : "add"} />
      <AddToFavoritesButton isLiked={liked} />
    </form>
  );
}
