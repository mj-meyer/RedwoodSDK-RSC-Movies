import { AddToFavoritesButton } from "./button";
import { requestInfo } from "rwsdk/worker";
import { isFavorite } from "@/app/db.js";
import { updateFavorite } from "./update-favorite";

export async function AddToFavoritesForm({ movieId }: { movieId: number }) {
  const {
    ctx: { session },
  } = requestInfo;

  let liked = await isFavorite(session.id, movieId);
  return (
    <form action={updateFavorite}>
      <input type="hidden" name="id" value={movieId} />
      <input type="hidden" name="intent" value={liked ? "remove" : "add"} />
      <AddToFavoritesButton isLiked={liked} />
    </form>
  );
}
