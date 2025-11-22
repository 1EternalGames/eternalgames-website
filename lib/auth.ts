// lib/auth.ts
'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import { Session } from 'next-auth';
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

// Cache the heavy DB lookup for the user session
// This key is unique per user ID.
const getCachedUser = unstable_cache(
    async (userId: string) => {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: { 
                roles: { select: { name: true } }, 
                username: true, 
                name: true, 
                image: true, 
                email: true 
            }
        });
    },
    ['session-user-data'], // Key prefix
    { tags: ['session-user'] } // We will append the ID dynamically in usage or just use a broad tag if granular isn't needed, but let's rely on the key.
);

export async function getAuthenticatedSession(): Promise<Session> {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        throw new Error('Authentication required. Please sign in.');
    }

    const cachedUserLookup = unstable_cache(
        async (uid: string) => {
            return await prisma.user.findUnique({
                where: { id: uid },
                select: { 
                    roles: { select: { name: true } }, 
                    username: true, 
                    name: true, 
                    image: true, 
                    email: true 
                }
            });
        },
        ['session-user-lookup'],
        { tags: [`user-session-${session.user.id}`] } // Unique tag for invalidation
    );

    const user = await cachedUserLookup(session.user.id);

    if (!user) {
        throw new Error('User record not found.');
    }

    // Overwrite session data with cached DB data
    session.user.roles = user.roles.map((r: any) => r.name);
    session.user.username = user.username;
    session.user.name = user.name;
    session.user.image = user.image;
    session.user.email = user.email;

    return session;
}