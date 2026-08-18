# Ember Kitchen — Order Management

An Order Management feature for a food delivery app for RaftLabs: browse a menu, build a cart, check out with delivery details, and track an order's status in real time.

Built as a senior full-stack developer assessment.

## Features

- **Menu display** — food items with name, description, price, and image, filterable by category
- **Order placement** — add items to a cart, adjust quantities, and check out with name, address, and phone
- **Order status tracking** — a live status page (Order Received → Preparing → Out for Delivery → Delivered) that polls the API and advances automatically based on elapsed time, simulating real-time kitchen updates
- **REST API** — endpoints for creating and retrieving orders, with input validation
- **Tests** — unit and integration tests covering the order store, both API routes, cart logic, and the checkout form

## How order status updates work

Orders are stored in memory with a `createdAt` timestamp. `computeStatus()` derives the current status from elapsed time since creation (15s → Preparing, 45s → Out for Delivery, 90s → Delivered). The order status page polls `GET /api/orders/[id]` every 5 seconds, so the status advances automatically without a websocket or manual update.

## Notes on scope

- Orders are stored in memory and reset when the server restarts — acceptable for this assessment's scope, and explicitly allowed by the brief.
- No authentication or multi-restaurant support — the feature is scoped to order management for a single menu, per the assessment brief.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS
- [Vitest](https://vitest.dev) + React Testing Library
- In-memory data store (no external database required)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running tests

```bash
npm test
```

## Project structure