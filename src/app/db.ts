import { env } from "cloudflare:workers";

const db = env.DB;

/**
 * Batch function to load multiple movies by id
 */
export async function batchMovies(ids: number[]) {
  let placeholders = ids.map(() => "?").join(",");
  // order by year
  let query = `
    SELECT 
      m.*,
      JSON_GROUP_ARRAY(DISTINCT mg.genre_id) as genre_ids,
      JSON_GROUP_ARRAY(DISTINCT mc.cast_id) as cast_ids
    FROM movies m
    LEFT JOIN movie_genres mg ON m.id = mg.movie_id
    LEFT JOIN movie_cast mc ON m.id = mc.movie_id
    WHERE m.id IN (${placeholders})
    GROUP BY m.id
   `;

  const result = await db
    .prepare(query)
    .bind(...ids)
    .all();

  return result.results
    .map((movie: any) => {
      movie.genre_ids = JSON.parse(movie.genre_ids);
      movie.cast_ids = JSON.parse(movie.cast_ids);
      return movie as Movie;
    })
    .sort(
      // batch function results must be sorted in the same order as the input
      (a, b) => ids.indexOf(a.id) - ids.indexOf(b.id),
    );
}

/**
 * Batch function to load multiple actors by id
 */
export async function batchActors(ids: number[]) {
  let placeholders = ids.map(() => "?").join(",");
  let query = `
    SELECT
      actor.*,
      GROUP_CONCAT(
        DISTINCT mc.movie_id
        ORDER BY movie.year DESC
      ) as movie_ids
    FROM cast_members as actor
    LEFT JOIN movie_cast mc ON actor.id = mc.cast_id
    LEFT JOIN movies movie ON mc.movie_id = movie.id
    WHERE actor.id IN (${placeholders})
    GROUP BY actor.id
  `;

  const result = await db
    .prepare(query)
    .bind(...ids)
    .all();

  return result.results
    .map((actor: any) => {
      actor.movie_ids = actor.movie_ids
        ? actor.movie_ids.split(",").map(Number)
        : [];
      return actor as Actor;
    })
    .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

export async function getFavorites(sessionId: string) {
  const result = await db
    .prepare("SELECT * FROM favorites WHERE session_id = ?")
    .bind(sessionId)
    .all();

  return result.results.map((favorite: any) => favorite.movie_id);
}

export async function addFavorite(sessionId: string, movieId: number) {
  let alreadyFavorite = await isFavorite(sessionId, movieId);
  if (alreadyFavorite) {
    return true;
  }

  return await db
    .prepare("INSERT INTO favorites (session_id, movie_id) VALUES (?, ?)")
    .bind(sessionId, movieId)
    .run();
}

export async function removeFavorite(sessionId: string, movieId: number) {
  return await db
    .prepare("DELETE FROM favorites WHERE session_id = ? AND movie_id = ?")
    .bind(sessionId, movieId)
    .run();
}

export async function isFavorite(sessionId: string, movieId: number) {
  const result = await db
    .prepare("SELECT id FROM favorites WHERE session_id = ? AND movie_id = ?")
    .bind(sessionId, movieId)
    .first();

  return result !== null;
}

export type Movie = {
  id: number;
  title: string;
  year: number;
  href: string;
  extract: string;
  thumbnail: string;
  thumbnail_width: string;
  thumbnail_height: string;
  genre_ids: number[];
  cast_ids: number[];
};

export type Actor = {
  id: number;
  name: string;
  movie_ids: number[];
};

export type Favorite = {
  id: number;
  movie_id: number;
  session_id: string;
};
