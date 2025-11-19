// app/actions/banActions.ts
'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import prisma from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { unstable_cache } from "next/cache";

// --- CONFIGURATION ---
// REPLACE THIS WITH YOUR EXACT EMAIL ADDRESS
const OWNER_EMAIL = "mhmfalsaadd@gmail.com"; 

const PROTECTED_ROLES = ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'];

// --- 1. THE CACHED CHECK (Zero DB Load) ---
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

// --- 2. The Public Action ---
export async function checkBanStatus() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { isBanned: false, banReason: null };
    return await getCachedBanStatus(session.user.id);
}

// --- 3. The Toggle Action ---
export async function toggleUserBanAction(targetUserId: string, reason: string, shouldBan: boolean) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return { success: false, message: "غير مصرح لك." };
    }

    try {
        // 1. Fetch Requester (Actor)
        const actor = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, email: true, roles: { select: { name: true } } }
        });

        if (!actor) return { success: false, message: "المستخدم غير موجود." };
        
        const actorRoles = actor.roles.map(r => r.name);
        const isDirector = actorRoles.includes('DIRECTOR');
        const isAdmin = actorRoles.includes('ADMIN');
        const isOwner = actor.email === OWNER_EMAIL; // <--- THE GOD CHECK

        // Basic Permission Check (Owner bypasses this)
        if (!isDirector && !isAdmin && !isOwner) {
            return { success: false, message: "صلاحياتك لا تسمح بالحظر." };
        }

        // 2. Fetch Target User
        const target = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, email: true, roles: { select: { name: true } } }
        });

        if (!target) return { success: false, message: "المستخدم المستهدف غير موجود." };
        const targetRoles = target.roles.map(r => r.name);

        // --- THE IMMUTABLE SHIELD ---
        // If the target is the Owner, NO ONE can ban them.
        if (target.email === OWNER_EMAIL) {
            return { success: false, message: "هذا الكيان محصن ضد الحظر." };
        }

        // 3. Hierarchy Validation
        // If actor is the Owner, skip ALL hierarchy checks (The Sword).
        if (!isOwner) {
            // Safety: Cannot ban self
            if (actor.id === target.id) {
                return { success: false, message: "لا يمكنك حظر نفسك." };
            }

            if (isDirector) {
                if (targetRoles.includes('DIRECTOR')) {
                    return { success: false, message: "لا يمكن للمدير حظر مدير آخر." };
                }
            } 
            else if (isAdmin) {
                const hasProtectedRole = targetRoles.some(role => PROTECTED_ROLES.includes(role));
                if (hasProtectedRole) {
                    return { success: false, message: "المسؤولون لا يملكون صلاحية حظر طاقم العمل." };
                }
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

        revalidateTag('ban-status');
        revalidatePath('/studio/director');
        
        return { success: true, message: shouldBan ? "تم حظر المستخدم." : "تم رفع الحظر." };

    } catch (error) {
        console.error("Ban action failed:", error);
        return { success: false, message: "حدث خطأ في النظام." };
    }
}