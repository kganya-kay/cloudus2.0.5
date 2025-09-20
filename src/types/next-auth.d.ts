import "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    supplierId?: string | null;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      supplierId?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    supplierId?: string | null;
  }
}
