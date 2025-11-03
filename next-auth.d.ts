// next-auth.d.ts
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * The `User` object is available in callbacks.
   */
  interface User {
    id: string;
    roles: string[];
    username?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }

  /**
   * The `Session` object is what is returned to the client.
   */
  interface Session {
    user: User; // The user object now includes all our custom and default fields.
    needsOnboarding?: boolean;
  }
}

declare module 'next-auth/jwt' {
  /**
   * The `JWT` interface is used in the `jwt` callback.
   */
  interface JWT {
    id: string;
    roles: string[];
    username?: string | null;
    needsOnboarding?: boolean;
  }
}


