import { postRouter } from "~/server/api/routers/post";
import { projectRouter } from "~/server/api/routers/project";
import { shopItemRouter } from "~/server/api/routers/shopItem";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { orderRouter } from "./routers/order";
import { userRouter } from "./routers/user";


/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  project:projectRouter,
  shopItem: shopItemRouter,
  order : orderRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
