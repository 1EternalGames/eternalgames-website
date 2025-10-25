'use server';

import prisma from '@/lib/prisma';

export async function getCreatorUsernames(creatorIds: string[]) {
    if (!creatorIds || creatorIds.length === 0) {
        return {};
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                id: { in: creatorIds }
            },
            select: {
                id: true,
                username: true
            }
        });

        // Create a map of prismaUserId -> username
        const usernameMap = users.reduce((acc, user) => {
            if (user.username) {
                acc[user.id] = user.username;
            }
            return acc;
        }, {} as Record<string, string>);

        return usernameMap;
    } catch (error) {
        console.error("Failed to fetch creator usernames:", error);
        return {};
    }
}