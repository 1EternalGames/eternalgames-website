// lib/auth.ts
'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import { Session } from 'next-auth';
import prisma from '@/lib/prisma';

/**
 * A server-side helper to get the authenticated user's session with FRESH roles from the database.
 * Throws an error if the user is not authenticated.
 * @returns {Promise<Session>} The user's session object with up-to-date roles.
 * @throws {Error} If the user is not signed in.
 */
export async function getAuthenticatedSession(): Promise<Session> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        throw new Error('Authentication required. Please sign in.');
    }

    // THE DEFINITIVE FIX:
    // Fetch fresh roles from the database to ensure immediate access control changes apply
    // without requiring a re-login. We bypass the potentially stale JWT roles here.
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { 
            roles: { select: { name: true } }, 
            username: true, 
            name: true, 
            image: true, 
            email: true 
        }
    });

    if (!user) {
        throw new Error('User record not found.');
    }

    // Overwrite session data with fresh DB data
    session.user.roles = user.roles.map(r => r.name);
    session.user.username = user.username;
    session.user.name = user.name;
    session.user.image = user.image;
    session.user.email = user.email;

    return session;
}