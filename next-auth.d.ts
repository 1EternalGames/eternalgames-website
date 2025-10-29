// next-auth.d.ts
import 'next-auth/jwt';

// By redefining the entire user object, we ensure TS recognizes the custom properties.
declare module 'next-auth' {
    interface Session {
        user?: {
            id: string;
            roles: string[];
            username?: string | null;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
        needsOnboarding?: boolean;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        roles: string[];
        username?: string | null;
        needsOnboarding?: boolean;
    }
}