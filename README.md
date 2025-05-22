# RSC Movies in RedwoodSDK

This project showcases React Server Components (RSC) implementation in Redwood SDK, using Ryan Florence's [RSC Movies demo](https://github.com/ryanflorence/rsc-movies) as inspiration.

## About This Project

This is a port of the [React Router RSC Preview demo](https://remix.run/blog/rsc-preview) to RedwoodSDK. The goal wasn't to prove one framework better than another, but to explore how Redwood SDK approaches RSC and to learn more about its capabilities.

I tried to stick closely to the React Router example, though some aspects may not be idiomatic RedwoodSDK. The implementation shows how lightweight yet powerful RedwoodSDK can be, especially when combined with modern concepts like RSC and Cloudflare's infrastructure.

## Key Features

- **React Server Components (RSC)** - Leveraging React's latest component model
- **Cloudflare Integration** - Built for Cloudflare Workers and D1 database
- **Durable Objects Session Store** - Simple session management without login (generates a cookie on first visit)
- **Batch Loading Pattern** - Using Ryan Florence's [`@ryanflorence/batch-loader`](https://github.com/ryanflorence/batch-loader) to efficiently solve the N+1
  query problem

## Notable Implementation Details

### Batched Database Queries

D1 has a limit of [100 bound parameters per query](https://developers.cloudflare.com/d1/platform/limits/). To handle this, I implemented a `batchQuery` utility that:

1. Chunks requests into groups of 90 or fewer
2. Preserves the original ordering of results
3. Handles single-query optimization when under the limit

```ts
async function batchQuery<T, K>(
  ids: K[],
  batchFn: (chunk: K[]) => Promise<T[]>,
  getKey: (item: T) => K,
  batchSize = 90, // D1 has a 100 bound parameter limit
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
```

### RedwoodSDK Middleware for Data Loading

The app uses RedwoodSDK middleware to attach the batch loader to the request context:

```ts
export default defineApp([
  setCommonHeaders(),
  setupSession,
  ({ ctx }) => {
    ctx.load = createLoaders();
  },
  render(Document, [
    route("/", Home),
    route("/movie/:id", Movie),
    route("/actor/:id", Actor),
  ]),
]);
```

## Getting Started

```bash
# Install dependencies
pnpm install

# First-time database setup
pnpm db:create         # Creates D1 database in your CF account

# The migration and seed files are already committed to the repo,
# so you can skip to these steps:
pnpm db:migrate:local  # Apply migrations to local D1
pnpm db:seed:local     # Seed the local D1 database

# Start development server
pnpm dev
```

> **Note:** The following steps are only necessary if you need to rebuild the migration or seed files:
>
> ```bash
> pnpm db:export:schema  # Extract schema from SQLite for migrations
> pnpm db:export:data    # Extract data from SQLite for seed files
> ```

## Deploy to Cloudflare

```bash
pnpm release           # Builds + deploys with wrangler
pnpm db:migrate:prod   # Apply migrations to production D1
pnpm db:seed:prod      # Seed the production database (run once)
```

## Reflections on RedwoodSDK

What stands out about RedwoodSDK is how it manages to be lightweight yet powerful. It doesn't rely on hidden magic, making it predictable and transparent, while still providing all the tools needed to build complex applications.

The combination of RSC, Cloudflare infrastructure, and RedwoodSDK's approach creates a development experience reminiscent of Laravel for the JavaScript world - but with the flexibility to implement your own patterns and preferences.
