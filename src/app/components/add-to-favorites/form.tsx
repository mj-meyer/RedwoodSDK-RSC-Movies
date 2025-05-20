import { AddToFavoritesButton } from "./button";
import { isFavorite } from "@/db";
import { updateFavorite } from "./update-favorite";
import { requestInfo } from "rwsdk/worker";

export async function AddToFavoritesForm({ movieId }: { movieId: number }) {
  const {
    ctx: { session },
  } = requestInfo;

  const liked = await isFavorite(session.id, movieId);
  return (
    <form action={updateFavorite}>
      <input type="hidden" name="id" value={movieId} />
      <input type="hidden" name="intent" value={liked ? "remove" : "add"} />
      <AddToFavoritesButton isLiked={liked} />
    </form>
  );
}
