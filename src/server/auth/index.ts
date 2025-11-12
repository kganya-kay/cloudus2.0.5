import NextAuth from "next-auth";
import { authConfig } from "./config";

// Export uncached auth to avoid stale session reads after redirects
const { auth, handlers, signIn, signOut } = NextAuth(authConfig);

export { auth, handlers, signIn, signOut };
