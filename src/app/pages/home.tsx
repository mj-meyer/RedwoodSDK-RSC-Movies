import { AppContext } from "@/worker";
import { MovieGrid } from "../components/movie-grid";
import { MovieTile } from "../components/movie-tile";

export async function Home({ ctx }: { ctx: AppContext }) {
  // using const just to spite Ryan ;)
  // but also, const is better
  const featuredMovieIds = [32932, 23643, 29915, 30895, 31472, 33411];

  return (
    <>
      <title>RedwoodSDK RSC Movies</title>
      <meta
        name="description"
        content="An RSC demo of Redwood SDK that's based off of the RR RSC Movies"
      />
      <meta name="keywords" content="demo, redwood, react" />
      <MovieGrid>
        {featuredMovieIds.map((id: number) => (
          <MovieTile ctx={ctx} key={id} id={id} />
        ))}
      </MovieGrid>
    </>
  );
}
