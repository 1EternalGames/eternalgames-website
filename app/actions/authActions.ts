// app/actions/authActions.ts
'use server';

import prisma from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { passwordResetSchema } from '@/lib/validations'; // Import schema
import { sensitiveLimiter } from '@/lib/rate-limit'; // Import rate limiter
import { headers } from 'next/headers';
import { z } from 'zod';

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
        const ip = (await headers()).get('x-forwarded-for') || 'unknown';
        const limitCheck = await sensitiveLimiter.check(`reset-req-${ip}`, 3); // 3 requests per minute
        if (!limitCheck.success) return { success: false, message: 'محاولات كثيرة جدًا. انتظر قليلاً.' };

        // Validate Email
        const emailValidation = z.string().email().safeParse(email);
        if (!emailValidation.success) return { success: false, message: 'البريد الإلكتروني غير صالح.' };

        const lowercasedEmail = emailValidation.data.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: lowercasedEmail } });
        
        if (!user || !user.password) {
            // Don't reveal if a user exists or not
            return { success: true, message: 'إن صَحَّ بريدُك، أتاك الرابط.' };
        }

        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(new Date().getTime() + 60 * 60 * 1000); 

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expires,
            },
        });

        await sendPasswordResetEmail(lowercasedEmail, token);

        return { success: true, message: 'إن صَحَّ بريدُك، أتاك الرابط.' };
    } catch (error) {
        console.error('Password reset request failed:', error);
        return { success: false, message: 'طرأ خطبٌ ما.' };
    }
}

export async function resetPassword(token: string, newPassword: string) {
    try {
        const ip = (await headers()).get('x-forwarded-for') || 'unknown';
        const limitCheck = await sensitiveLimiter.check(`reset-submit-${ip}`, 3);
        if (!limitCheck.success) return { success: false, message: 'محاولات كثيرة جدًا.' };

        // Validate Input
        const validation = passwordResetSchema.safeParse({ token, newPassword });
        if (!validation.success) {
            return { success: false, message: validation.error.issues[0].message };
        }

        const safeData = validation.data;

        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token: safeData.token },
        });

        if (!resetToken || resetToken.expires < new Date()) {
            if (resetToken) {
                await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
            }
            return { success: false, message: 'الرمز باطل أو منتهي الصلاحية.' };
        }

        const hashedPassword = await bcrypt.hash(safeData.newPassword, 10);

        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword },
        });

        await prisma.passwordResetToken.delete({
            where: { id: resetToken.id },
        });

        return { success: true, message: 'استُعيدت كلمة السّر.' };
    } catch (error) {
        console.error('Password reset failed:', error);
        return { success: false, message: 'طرأ خطبٌ ما.' };
    }
}