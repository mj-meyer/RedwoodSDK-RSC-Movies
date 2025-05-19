# RSC N + 1 Demo on RedwoodSDK

This repo shows **why a request‑scoped batch loader matters on Cloudflare D1** and how easy it is to wire one up with [`@ryanflorence/batch-loader`](https://github.com/ryanflorence/batch-loader).

| Route            | Queries Fired | Explanation                                                                                                                                   |
| ---------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `/movie/1`       | **27**        | _Naïve._ One query for the movie, one for the cast list, and 25 more from each `<ActorLink>` component doing its own `SELECT … WHERE id = ?`. |
| `/movie/1/batch` | **3**         | _Batched._ One query for the movie, one for the cast list, and one `IN (…)` for all actor details.                                            |

The query count is surfaced via an **`X‑Query‑Count`** response header and `echoed to the console`.

---

## Quick Start

```bash
pnpm install
pnpm db:create        # one‑time – creates the D1 database in your CF account
pnpm db:seed          # local fill (migrations/0001_init.sql)
pnpm dev
```

Open [http://localhost:5173/](http://localhost:5173/) and click the _naïve_ / _batched_ buttons.

### Deploy to Cloudflare

```bash
pnpm release          # builds + wrangler deploy
pnpm db:seed:prod     # run once to seed the remote DB
```

---

## How Batching Works

1. **Middleware** attaches a per‑request `ctx.load` created with `@ryanflorence/batch-loader`.
2. Every `ctx.load.actor(id)` call is memoised until the event‑loop yields.
3. On flush the loader issues **one** `SELECT id, name FROM actors WHERE id IN (…)`.
4. All awaiting components resume with their row; duplicate IDs cost **zero** extra round trips.

---

## Why This Matters on D1

In the naïve implementation, each <ActorLink> component independently fetches a single row from the database:

```ts
export async function ActorLink({ ctx, id }) {
  const actor = await ctx.env.DB
    .prepare("SELECT id, name FROM actors WHERE id = ?")
    .bind(id)
    .first();

  return <a href={`/actor/${actor.id}`}>{actor.name}</a>;
}
```

Each DB call is a network hop out of the Worker isolate. In this example, it happens 25 times on a single page render, once per actor ID. So the naïve code (the classic “N + 1” problem) scales linearly with component count. On a page with many RSC components doing DB queries, it can easily start to hit Cloudflare limits. Batching collapses those hops and keeps renders predictable.

### Why not just lift the query up to a parent component?

It's indeed a solid approach and definitely something to consider when doing any DB work. But it has its own set of tradeoffs. For example:

1. **Reusability**: A component like `<ActorLink>` can be used across routes without knowing how it gets its data.
2. **Separation of concerns**: Your layout or page doesn’t need to fetch the entire graph of things the child components need.
3. **RSC laziness**: You might not even render some server components depending on Suspense conditions or props—so lifting queries prematurely wastes work.
4. **Co-location**: You want the query near the markup that uses it—so you can read, maintain, and test it in one place.

---

### Copy‑Paste Pattern for Your App

```ts
import { batch } from "@ryanflorence/batch-loader";

export const loaders = {
  actor: batch(async (ids: number[]) => {
    const qs = ids.map(() => "?").join(",");
    const { results } = await env.DB.prepare(
      `SELECT id, name FROM actors WHERE id IN (${qs})`,
    )
      .bind(...ids)
      .all<{ id: number; name: string }>();

    const map = new Map(results.map((r) => [r.id, r]));
    return ids.map((id) => map.get(id) ?? null);
  }),
};

// middleware
ctx.load = loaders;
```

That’s the whole trick—no ORM required.

---

## Using an ORM? (Drizzle & Prisma)

> The batching **pattern** is identical—you just swap the raw‑SQL in the loader for your ORM’s query helper so you still return rows **in the same order** as the input keys.

### Drizzle

```ts
import { db, schema } from "@/drizzle";
import { inArray, eq } from "drizzle-orm/sqlite-core";
import { batch } from "@ryanflorence/batch-loader";

export const loaders = {
  actor: batch(async (ids: number[]) => {
    const rows = await db
      .select()
      .from(schema.actors)
      .where(inArray(schema.actors.id, ids));

    const map = new Map(rows.map((r) => [r.id, r]));
    return ids.map((id) => map.get(id) ?? null);
  }),
};
```

### Prisma

```ts
import { PrismaClient } from "@prisma/client";
import { batch } from "@ryanflorence/batch-loader";

const prisma = new PrismaClient();

export const loaders = {
  actor: batch(async (ids: string[]) => {
    const rows = await prisma.actor.findMany({ where: { id: { in: ids } } });
    const map = new Map(rows.map((r) => [r.id, r]));
    return ids.map((id) => map.get(id) ?? null);
  }),
};
```

Both loaders drop straight into the same RWSDK middleware:

```ts
ctx.load = loaders;
```

Whether you stay on raw SQL or adopt an ORM later, the components continue to call `await ctx.load.actor(id)` and enjoy the same one‑query‑per‑request performance.
