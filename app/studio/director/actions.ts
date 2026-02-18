// app/studio/director/actions.ts
'use server';

import { getAuthenticatedSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { sanityWriteClient } from '@/lib/sanity.server';
import { isSafeImageUrl } from "@/lib/security";

const ROLE_TO_SANITY_TYPE: Record<string, string> = {
    REVIEWER: 'reviewer',
    AUTHOR: 'author',
    REPORTER: 'reporter',
    DESIGNER: 'designer',
};

async function findOrCreateSanityCreator(userId: string, sanityType: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, image: true } });
    if (!user || !user.name) throw new Error('بيانات العضو غير مكتملة.');

    const existingCreator = await sanityWriteClient.fetch(`*[_type == "${sanityType}" && prismaUserId == $userId][0]`, { userId });

    if (existingCreator) {
        return; 
    }

    const newCreator: any = {
        _type: sanityType,
        _id: `${sanityType}-${userId}`,
        name: user.name,
        prismaUserId: user.id,
    };
    
    if (user.image && isSafeImageUrl(user.image)) {
        try {
            const response = await fetch(user.image);
            if (response.ok) {
                const imageBlob = await response.blob();
                const imageAsset = await sanityWriteClient.assets.upload('image', imageBlob, {
                    contentType: imageBlob.type,
                    filename: `${user.id}-avatar.jpg`
                });
                newCreator.image = { _type: 'image', asset: { _type: 'reference', _ref: imageAsset._id } };
            }
        } catch (e) {
            console.warn(`[Security/Sync] Skipped image upload for ${user.name}:`, e);
        }
    }

    await sanityWriteClient.create(newCreator);
}

export async function updateUserRolesAction(userId: string, roleIds: number[]) {
    const session = await getAuthenticatedSession();
    if (!session.user.roles.includes('DIRECTOR')) {
        return { success: false, message: "غير مُصرَّح لك بهذا الإجراء." };
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { roles: { set: roleIds.map(id => ({ id })) } },
            include: { roles: true }
        });

        const userRoles = updatedUser.roles.map((r: any) => r.name);
        for (const roleName of userRoles) {
            const sanityType = ROLE_TO_SANITY_TYPE[roleName];
            if (sanityType) {
                try {
                    await findOrCreateSanityCreator(userId, sanityType);
                } catch (sanityError: any) {
                    console.error(`Failed to sync Sanity ${sanityType}:`, sanityError.message);
                }
            }
        }
        
        // FIX: Added 'max' argument to satisfy type definition
        revalidateTag('enriched-creators', 'max');
        revalidateTag('studio-metadata', 'max'); 
        revalidatePath('/studio/director');
        return { success: true, updatedRoles: updatedUser.roles };
    } catch (error) {
        return { success: false, message: "حدث خطأ أثناء التحديث." };
    }
}

// NEW: Search and Pagination Action
export async function searchUsersAction(query: string, offset: number, limit: number) {
    const session = await getAuthenticatedSession();
    if (!session.user.roles.includes('DIRECTOR')) throw new Error("Unauthorized");

    const where = query ? {
        OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } }
        ]
    } : {};

    const users = await prisma.user.findMany({
        where,
        skip: offset,
        take: limit,
        include: { roles: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
    });

    return users;
}