// app/actions/banActions.ts
'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { unstable_cache } from "next/cache";

// --- CONFIGURATION ---
const OWNER_EMAIL = "mhmfalsaadd@gmail.com"; 

const PROTECTED_ROLES = ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'];

const getCachedBanStatus = unstable_cache(
    async (userId: string) => {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isBanned: true, banReason: true }
        });
        return { 
            isBanned: user?.isBanned || false, 
            banReason: user?.banReason || null 
        };
    },
    ['user-ban-status'], 
    { tags: ['ban-status'] }
);

export async function checkBanStatus() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { isBanned: false, banReason: null };
    return await getCachedBanStatus(session.user.id);
}

export async function toggleUserBanAction(targetUserId: string, reason: string, shouldBan: boolean) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { success: false, message: "غير مصرح لك." };
    }

    try {
        const actor = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, email: true, roles: { select: { name: true } } }
        });

        if (!actor) return { success: false, message: "المستخدم غير موجود." };
        
        const actorRoles = actor.roles.map((r: any) => r.name);
        const isDirector = actorRoles.includes('DIRECTOR');
        const isAdmin = actorRoles.includes('ADMIN');
        const isOwner = actor.email === OWNER_EMAIL; 

        if (!isDirector && !isAdmin && !isOwner) {
            return { success: false, message: "صلاحياتك لا تسمح بالحظر." };
        }

        const target = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, email: true, roles: { select: { name: true } } }
        });

        if (!target) return { success: false, message: "المستخدم المستهدف غير موجود." };
        const targetRoles = target.roles.map((r: any) => r.name);

        if (target.email === OWNER_EMAIL) {
            return { success: false, message: "هذا الكيان محصن ضد الحظر." };
        }

        if (!isOwner) {
            if (actor.id === target.id) {
                return { success: false, message: "لا يمكنك حظر نفسك." };
            }

            if (isDirector) {
                if (targetRoles.includes('DIRECTOR')) {
                    return { success: false, message: "لا يمكن للمدير حظر مدير آخر." };
                }
            } 
            else if (isAdmin) {
                const hasProtectedRole = targetRoles.some((role: string) => PROTECTED_ROLES.includes(role));
                if (hasProtectedRole) {
                    return { success: false, message: "المسؤولون لا يملكون صلاحية حظر طاقم العمل." };
                }
            }
        }

        await prisma.user.update({
            where: { id: targetUserId },
            data: {
                isBanned: shouldBan,
                banReason: shouldBan ? reason : null,
                bannedAt: shouldBan ? new Date() : null,
            }
        });

        // THE FIX: Added 'max' profile argument
        revalidateTag('ban-status', 'max');
        revalidatePath('/studio/director');
        
        return { success: true, message: shouldBan ? "تم حظر المستخدم." : "تم رفع الحظر." };

    } catch (error) {
        console.error("Ban action failed:", error);
        return { success: false, message: "حدث خطأ في النظام." };
    }
}