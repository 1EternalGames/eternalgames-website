// app/actions/banActions.ts
'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const PROTECTED_ROLES = ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'];

export async function toggleUserBanAction(targetUserId: string, reason: string, shouldBan: boolean) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { success: false, message: "غير مصرح لك." };
    }

    try {
        // 1. Fetch Requester (Actor) Roles
        const actor = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, roles: { select: { name: true } } }
        });

        if (!actor) return { success: false, message: "المستخدم غير موجود." };
        const actorRoles = actor.roles.map(r => r.name);
        const isDirector = actorRoles.includes('DIRECTOR');
        const isAdmin = actorRoles.includes('ADMIN');

        if (!isDirector && !isAdmin) {
            return { success: false, message: "صلاحياتك لا تسمح بالحظر." };
        }

        // 2. Fetch Target User
        const target = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, roles: { select: { name: true } } }
        });

        if (!target) return { success: false, message: "المستخدم المستهدف غير موجود." };
        const targetRoles = target.roles.map(r => r.name);

        // 3. Hierarchy Validation
        
        // Safety: Cannot ban self
        if (actor.id === target.id) {
            return { success: false, message: "لا يمكنك حظر نفسك." };
        }

        // Director Rule: Can ban anyone except another Director
        if (isDirector) {
            if (targetRoles.includes('DIRECTOR')) {
                return { success: false, message: "لا يمكن للمدير حظر مدير آخر." };
            }
        } 
        // Admin Rule: Can only ban normal users (cannot ban Admin/Reviewer/etc)
        else if (isAdmin) {
            const hasProtectedRole = targetRoles.some(role => PROTECTED_ROLES.includes(role));
            if (hasProtectedRole) {
                return { success: false, message: "المسؤولون لا يملكون صلاحية حظر طاقم العمل." };
            }
        }

        // 4. Execute Ban/Unban
        await prisma.user.update({
            where: { id: targetUserId },
            data: {
                isBanned: shouldBan,
                banReason: shouldBan ? reason : null,
                bannedAt: shouldBan ? new Date() : null,
            }
        });

        revalidatePath('/studio/director');
        // We don't revalidate the profile path because if they are banned, they can't see it anyway.
        
        return { success: true, message: shouldBan ? "تم حظر المستخدم." : "تم رفع الحظر." };

    } catch (error) {
        console.error("Ban action failed:", error);
        return { success: false, message: "حدث خطأ في النظام." };
    }
}