// app/studio/director/actions.ts

'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { Role } from "@prisma/client";
import { sanityWriteClient } from "@/lib/sanity.server";

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
    
    if (user.image) {
        try {
            const response = await fetch(user.image);
            const imageBlob = await response.blob();
            const imageAsset = await sanityWriteClient.assets.upload('image', imageBlob, {
                contentType: imageBlob.type,
                filename: `${user.id}-avatar.jpg`
            });
            newCreator.image = { _type: 'image', asset: { _type: 'reference', _ref: imageAsset._id } };
        } catch (e) {
            console.warn(`Could not upload user image to Sanity for ${user.name}:`, e);
        }
    }

    await sanityWriteClient.create(newCreator);
    console.log(`Created Sanity ${sanityType} for ${user.name}.`);
}

export async function updateUserRolesAction(userId: string, roleIds: number[]) {
    const session = await getServerSession(authOptions);
    
    // Use safe access or DB verification here if strict security is needed, 
    // but for the action message itself:
    if (!session?.user?.roles.includes('DIRECTOR')) {
        return { success: false, message: "غير مُصرَّح لك بهذا الإجراء." };
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { roles: { set: roleIds.map(id => ({ id })) } },
            include: { roles: true }
        });

        const userRoles = updatedUser.roles.map(r => r.name);
        
        for (const roleName of userRoles) {
            const sanityType = ROLE_TO_SANITY_TYPE[roleName];
            if (sanityType) {
                try {
                    await findOrCreateSanityCreator(userId, sanityType);
                } catch (sanityError: any) {
                    console.error(`Failed to sync Sanity ${sanityType} for user ${userId}:`, sanityError.message);
                }
            }
        }
        
        revalidateTag('enriched-creators', 'max');
        revalidateTag('enriched-creator-details', 'max');

        revalidatePath('/studio/director');
        revalidatePath(`/profile/${userId}`);
        if(updatedUser.username) {
            revalidatePath(`/creators/${updatedUser.username}`);
        }

        return { success: true, updatedRoles: updatedUser.roles as Role[] };
    } catch (error) {
        console.error("Failed to update user roles:", error);
        return { success: false, message: "حدث خطأ أثناء التحديث في قاعدة البيانات." };
    }
}