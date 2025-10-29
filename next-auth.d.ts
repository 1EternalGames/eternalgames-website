// next-auth.d.ts

declare module "next-auth" {
    interface Session {
        user?: {
            id: string;
            roles: string[];
            username?: string | null;
        } & import("next-auth").DefaultSession["user"];
        needsOnboarding?: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends import("next-auth/jwt").JWT {
        id: string;
        roles: string[];
        username?: string | null;
        needsOnboarding?: boolean;
    }
}