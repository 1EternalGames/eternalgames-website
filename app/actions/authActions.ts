// app/actions/authActions.ts
'use server';

import prisma from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sensitiveLimiter } from '@/lib/rate-limit'; // Rate Limiter
import { passwordResetSchema } from '@/lib/validations'; // Zod Schema
import { headers } from 'next/headers';
import { z } from 'zod';

// This would be your email sending function.
async function sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    
    // --- SECURITY FIX: REMOVED CONSOLE.LOG OF SECRETS ---
    // Only log that an email *attempt* was made, never the token itself in production.
    if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV ONLY] Reset Link: ${resetLink}`);
    } else {
        console.log(`[Email Service] Sending password reset to ${email}`);
        // TODO: Integrate real email provider here (e.g., Resend, SendGrid)
        // await resend.emails.send({ ... })
    }
}

export async function requestPasswordReset(email: string) {
    try {
        const ip = (await headers()).get('x-forwarded-for') || 'unknown';
        const limitCheck = await sensitiveLimiter.check(`reset-req-${ip}`, 3); 
        if (!limitCheck.success) return { success: false, message: 'محاولات كثيرة جدًا. انتظر قليلاً.' };

        const emailValidation = z.string().email().safeParse(email);
        if (!emailValidation.success) return { success: false, message: 'البريد الإلكتروني غير صالح.' };

        const lowercasedEmail = emailValidation.data.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: lowercasedEmail } });
        
        if (!user || !user.password) {
            // Security: Always return success to prevent Email Enumeration
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