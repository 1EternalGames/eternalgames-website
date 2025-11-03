// lib/auth.ts
'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import { Session } from 'next-auth';

/**
 * A server-side helper to get the authenticated user's session.
 * Throws an error if the user is not authenticated.
 * @returns {Promise<Session>} The user's session object.
 * @throws {Error} If the user is not signed in.
 */
export async function getAuthenticatedSession(): Promise<Session> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        throw new Error('Authentication required. Please sign in.');
    }
    return session;
}


