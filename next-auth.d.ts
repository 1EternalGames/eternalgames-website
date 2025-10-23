// next-auth.d.ts

import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user?: {
            id: string;
            roles: string[];
            username?: string | null; // <-- ADD THIS LINE
        } & DefaultSession["user"];
        needsOnboarding?: boolean; // <-- ADD THIS LINE
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        roles: string[];
        username?: string | null; // <-- ADD THIS LINE
        needsOnboarding?: boolean; // <-- ADD THIS LINE
    }
}


