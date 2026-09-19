# Architecture

Cloudus is still a T3 monolith. The Creative OS is a frontend and information-architecture layer.

```
Next.js App Router
  (os) routes  -> OsShell + design system
  legacy routes -> existing page chrome
tRPC routers
  workspace    -> read adapter over Prisma
  project/shop/order/room/feed/event/blog/assistant -> unchanged
Prisma / Postgres
Paystack | Stripe | Ozow | UploadThing | NextAuth
```

## Adapter rule

`workspace.overview`, `workspace.capture`, and `workspace.founderSnapshot` wrap existing tables (`Project`, `Post`, `Event`, `FeedPost`, `ShopItem`, `RoomListing`, `Order`, `User`). They do not replace shop checkout, project bids, or booking payment.

Captures are stored as `Post.name` values prefixed with `[NOTE]`, `[IDEA]`, or `[TASK]`. That reuses the existing post model instead of a new table.
