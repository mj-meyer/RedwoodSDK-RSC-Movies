import { env } from "cloudflare:workers";

const db = env.DB;

/**
 * Utility function to handle batch queries with D1's 32 variable limit
 * Executes queries in chunks and preserves input order
 * https://developers.cloudflare.com/d1/platform/limits/
 */
async function batchQuery<T, K>(
  ids: K[],
  batchFn: (chunk: K[]) => Promise<T[]>,
  getKey: (item: T) => K,
  batchSize = 30,
) {
  // If we're under the limit, use a single query
  if (ids.length <= batchSize) {
    const results = await batchFn(ids);
    // Create a map for O(1) lookups
    const resultMap = new Map(results.map((item) => [getKey(item), item]));
    // Return in exact same order as input ids
    return ids.map((id) => resultMap.get(id));
  }

  // Otherwise, split into chunks and combine results
  const resultMap = new Map();
  for (let i = 0; i < ids.length; i += batchSize) {
    const chunk = ids.slice(i, i + batchSize);
    const chunkResults = await batchFn(chunk);
    // Add all results to the map
    chunkResults.forEach((item) => resultMap.set(getKey(item), item));
  }

  // Return in exact same order as input ids
  return ids.map((id) => resultMap.get(id));
}

/**
 * Batch function to load multiple movies by id
 */
export async function batchMovies(ids: number[]) {
  return batchQuery(ids, executeBatchMoviesQuery, (movie) => movie.id);
}

/**
 * Helper function to execute a batch query for movies
 */
async function executeBatchMoviesQuery(ids: number[]) {
  const placeholders = ids.map(() => "?").join(",");
  // order by year
  const query = `
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

  return result.results.map((movie: any) => {
    movie.genre_ids = JSON.parse(movie.genre_ids);
    movie.cast_ids = JSON.parse(movie.cast_ids);
    return movie as Movie;
  });
}

/**
 * Batch function to load multiple actors by id
 */
export async function batchActors(ids: number[]) {
  return batchQuery(ids, executeBatchActorsQuery, (actor) => actor.id);
}

/**
 * Helper function to execute a batch query for actors
 */
async function executeBatchActorsQuery(ids: number[]) {
  const placeholders = ids.map(() => "?").join(",");
  const query = `
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

  return result.results.map((actor: any) => {
    actor.movie_ids = actor.movie_ids
      ? actor.movie_ids.split(",").map(Number)
      : [];
    return actor as Actor;
  });
}

export async function getFavorites(sessionId: string) {
  const result = await db
    .prepare("SELECT * FROM favorites WHERE session_id = ?")
    .bind(sessionId)
    .all();

  return result.results.map((favorite: any) => favorite.movie_id);
}

export async function addFavorite(sessionId: string, movieId: number) {
  const alreadyFavorite = await isFavorite(sessionId, movieId);
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
