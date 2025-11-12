import { handlers } from "~/server/auth";

// Ensure DB adapter runs in Node.js runtime, not Edge
export const runtime = "nodejs";

export const { GET, POST } = handlers;
