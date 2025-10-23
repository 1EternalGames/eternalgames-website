// app/actions/authActions.ts
'use server';

import prisma from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// This would be your email sending function. For now, it logs to the console.
async function sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    console.log(`--- PASSWORD RESET EMAIL ---`);
    console.log(`To: ${email}`);
    console.log(`Link: ${resetLink}`);
    console.log(`--------------------------`);
    // In production, you would use a service like Resend, SendGrid, or Nodemailer here.
}

export async function requestPasswordReset(email: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            // Don't reveal if a user exists or not for security reasons.
            // Also, don't allow password resets for OAuth users.
            return { success: true, message: 'إن كان البريد مسجلاً، فقد أُرسِلَ إليه رابط.' };
        }

        // Invalidate any existing tokens for this user
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(new Date().getTime() + 60 * 60 * 1000); // 1 hour expiry

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expires,
            },
        });

        await sendPasswordResetEmail(email, token);

        return { success: true, message: 'إن كان البريد مسجلاً، فقد أُرسِلَ إليه رابط.' };
    } catch (error) {
        console.error('Password reset request failed:', error);
        return { success: false, message: 'طرأ خطأ غير متوقع.' };
    }
}

export async function resetPassword(token: string, newPassword: string) {
    try {
        if (!token || !newPassword) {
            return { success: false, message: 'Invalid request.' };
        }

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!resetToken || resetToken.expires < new Date()) {
            if (resetToken) {
                await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
            }
            return { success: false, message: 'الرمز باطل أو منتهي الصلاحية.' };
        }

        if (newPassword.length < 8) {
            return { success: false, message: 'يجب ألا تقل كلمة السر عن ثمانية أحرف.' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword },
        });

        await prisma.passwordResetToken.delete({
            where: { id: resetToken.id },
        });

        return { success: true, message: 'تم استعادة كلمة السر بنجاح.' };
    } catch (error) {
        console.error('Password reset failed:', error);
        return { success: false, message: 'طرأ خطأ غير متوقع.' };
    }
}


