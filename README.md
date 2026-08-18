## Architecture and design choices

**Next.js App Router, single project.** Front-end and back-end live in one
repo using API routes, rather than a separate Express server. At this
scope — three endpoints, one data model — a second server would add
deployment and CORS overhead with no real benefit.

**Supabase (Postgres) for storage.** Orders are naturally relational
(one row per order), so a Postgres table fits better than a NoSQL
document store here. The service role key is used server-side only,
with Row Level Security enabled and no public policies, so the
database can't be read or written directly from the browser.

**Cart state via React Context.** `CartProvider` wraps the app in the
root layout so cart state (add, increment, decrement, subtotal) is
available to the menu, header, and checkout without prop drilling or
an external state library — appropriate for a cart's size and lifetime
(cleared once an order is placed).

**Status derived from time, not stored.** `computeStatus()` calculates
an order's status from elapsed time since `createdAt`, rather than
writing status updates on a timer. This keeps the "real-time" behavior
correct even if the server restarts or multiple people view the same
order — the status is always recalculated fresh from a single
timestamp, not dependent on a background job staying alive.

**Polling over WebSockets.** The order status page polls
`GET /api/orders/[id]` every 3 seconds and stops once the order reaches
"Delivered." Polling was chosen over WebSockets/SSE because the status
changes are infrequent (a handful of times per order) and short-lived
(the page isn't open for hours) — a persistent connection would add
complexity without a meaningful benefit at this scale.

## Challenges faced

- **Serverless storage.** The first implementation used an in-memory
  `Map`, which worked locally but failed on Vercel (`404` on freshly
  created orders) because serverless functions don't share memory
  between invocations. Fixed by moving storage to Supabase.
- **Next.js 15 async route params.** Dynamic API route params
  (`params.id`) became a `Promise` in this Next.js version, which
  wasn't caught until testing on the deployed app. Fixed by awaiting
  `params` before use, in both the route and its tests.
- **Cart clearing too early.** Clearing the cart immediately on
  checkout submit caused a one-frame flash of the "empty cart" state
  before the redirect completed. Fixed by moving `clear()` to run once
  the order status page mounts, instead of during checkout submission.
- **Unbounded polling.** The status page kept polling every few seconds
  even after an order was marked "Delivered," since the interval had no
  exit condition. Fixed by clearing the interval once a terminal status
  is reached.

## Use of AI tools

I built this project, with Claude used mainly for
debugging support — working through errors like the serverless storage
issue on Vercel, the Next.js async route params change, and the
Supabase connection setup. It was also used as a sounding board for a
few implementation decisions (e.g. polling vs. WebSockets for status
updates) and to review test coverage before pushing. The core
implementation, structure, and decisions on how to build each feature
were mine.