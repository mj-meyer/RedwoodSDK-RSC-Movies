import { getFavorites } from "@/db";
import { FavoriteLink } from "./favorite-link";
import { requestInfo } from "rwsdk/worker";

export async function Favorites() {
  const { ctx } = requestInfo;
  const favorites = await getFavorites(ctx.session.id);
  if (favorites.length === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/66 backdrop-blur-sm border-t-black/10 p-4">
      <div className="overflow-x-auto snap-x snap-mandatory">
        <div className="flex flex-nowrap gap-x-2">
          {favorites.map((id: number) => (
            <div className="flex-shrink-0 snap-start" key={id}>
              <FavoriteLink id={id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
