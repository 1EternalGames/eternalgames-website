// app/actions/userActions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { put } from '@vercel/blob';
import bcrypt from 'bcryptjs';
import { getAuthenticatedSession } from '@/lib/auth';
import { sanityWriteClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import { profileSchema, signUpSchema } from '@/lib/validations';
import { sensitiveLimiter } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { validateImageFile } from '@/lib/security'; // SECURITY IMPORT

// ... (Keep existing syncUserToSanity function as is) ...
async function syncUserToSanity(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, image: true, bio: true, roles: { select: { name: true } } },
        });
        if (!user || !user.name) return;
        const userRoles = user.roles.map((r: any) => r.name);
        const creatorTypes = userRoles
            .map((role: string) => ({ 'REVIEWER': 'reviewer', 'AUTHOR': 'author', 'REPORTER': 'reporter', 'DESIGNER': 'designer' }[role]))
            .filter(Boolean) as string[];
        if (creatorTypes.length === 0) return;
        const sanityDocs = await sanityWriteClient.fetch(groq`*[_type in $creatorTypes && prismaUserId == $userId]`, { creatorTypes, userId: user.id });
        let imageAssetRef: string | undefined = undefined;
        if (user.image && user.image.startsWith('https://')) {
            try {
                const existingAsset = await sanityWriteClient.fetch(groq`*[_type == "sanity.imageAsset" && url == $imageUrl][0]._id`, { imageUrl: user.image });
                if (existingAsset) imageAssetRef = existingAsset;
                else {
                    const response = await fetch(user.image);
                    const imageBlob = await response.blob();
                    const imageAsset = await sanityWriteClient.assets.upload('image', imageBlob, { contentType: imageBlob.type, filename: `${user.id}-avatar.jpg` });
                    imageAssetRef = imageAsset._id;
                }
            } catch (e) { console.warn(`[Sanity Sync] Image upload failed`, e); }
        }
        const transaction = sanityWriteClient.transaction();
        for (const doc of sanityDocs) {
            const patchData: any = { name: user.name, bio: user.bio };
            if (imageAssetRef) patchData.image = { _type: 'image', asset: { _type: 'reference', _ref: imageAssetRef } };
            transaction.patch(doc._id, { set: patchData });
        }
        await transaction.commit();
    } catch (error) { console.error(`[CRITICAL] Failed to sync user ${userId} to Sanity:`, error); }
}

export async function getUserState() {
    try {
        const session = await getAuthenticatedSession();
        
        const [engagements, shares] = await Promise.all([
            prisma.engagement.findMany({ 
                where: { userId: session.user.id }, 
                select: { contentId: true, contentType: true, type: true } 
            }),
            prisma.share.findMany({ 
                where: { userId: session.user.id }, 
                select: { contentId: true, contentType: true } 
            }),
        ]);

        const likes: string[] = [];
        const bookmarks: string[] = [];
        const shareKeys: string[] = [];

        engagements.forEach(e => {
            const key = `${e.contentType}-${e.contentId}`;
            if (e.type === 'LIKE') likes.push(key);
            else if (e.type === 'BOOKMARK') bookmarks.push(key);
        });

        shares.forEach(s => {
            shareKeys.push(`${s.contentType}-${s.contentId}`);
        });

        return { 
            success: true, 
            data: { likes, bookmarks, shares: shareKeys } 
        };
    } catch (error) { 
        return { success: false, data: null }; 
    }
}

export async function updateUserProfile(formData: FormData) {
    try {
        const session = await getAuthenticatedSession();
        
        const ip = (await headers()).get('x-forwarded-for') || 'unknown';
        const limitCheck = await sensitiveLimiter.check(`update-profile-${session.user.id}-${ip}`, 5);
        if (!limitCheck.success) throw new Error("تجاوزت حد التحديثات المسموح به.");

        const rawData = {
            name: formData.get('name'),
            username: formData.get('username'),
            bio: formData.get('bio'),
            twitterHandle: formData.get('twitterHandle'),
            instagramHandle: formData.get('instagramHandle'),
        };

        const validation = profileSchema.safeParse(rawData);
        if (!validation.success) {
            throw new Error(validation.error.issues[0].message);
        }
        const data = validation.data;

        const agePublic = formData.get('agePublic') === 'on';
        const countryPublic = formData.get('countryPublic') === 'on';

        if (data.username) {
            const existingUser = await prisma.user.findUnique({ where: { username: data.username } });
            if (existingUser && existingUser.id !== session.user.id) throw new Error('اسمٌ محجوز.');
        }
        
        await prisma.user.update({
            where: { id: session.user.id },
            data: { 
                name: data.name, 
                username: data.username, 
                bio: data.bio, 
                twitterHandle: data.twitterHandle, 
                instagramHandle: data.instagramHandle, 
                agePublic, 
                countryPublic 
            },
        });
        
        await syncUserToSanity(session.user.id);

        revalidateTag(`user-session-${session.user.id}`, 'max');
        revalidateTag('enriched-creators', 'max');
        revalidateTag('enriched-creator-details', 'max');
        revalidatePath('/profile');
        revalidatePath(`/profile/${session.user.id}`);
        if (data.username) revalidatePath(`/creators/${data.username}`);

        return { success: true, message: 'تَجَدَّدَ مَلَفُكَ الشخصي.' };
    } catch (error: any) { return { success: false, message: error.message || 'أخفق تحديث الملف.' }; }
}

export async function completeOnboardingAction(formData: FormData) {
    try {
        const session = await getAuthenticatedSession();
        const rawData = {
            name: formData.get('fullName'),
            username: formData.get('username'),
        };
        
        const nameVal = profileSchema.shape.name.safeParse(rawData.name);
        const userVal = profileSchema.shape.username.safeParse(rawData.username);
        
        if (!nameVal.success) return { success: false, message: nameVal.error.issues[0].message };
        if (!userVal.success) return { success: false, message: userVal.error.issues[0].message };
        
        const fullName = nameVal.data;
        const username = userVal.data;

        const ageStr = formData.get('age') as string;
        const country = formData.get('country') as string;

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });

        if (username !== user?.username) {
            const usernameValidation = await checkUsernameAvailability(username);
            if (!usernameValidation.available) return { success: false, message: usernameValidation.message };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { name: fullName, username: username, age: ageStr ? parseInt(ageStr, 10) : null, country: country || null },
        });

        revalidateTag(`user-session-${session.user.id}`, 'max');
        revalidateTag('enriched-creators', 'max');
        revalidateTag('enriched-creator-details', 'max');
        revalidatePath('/profile');
        if (username) revalidatePath(`/profile/${username}`);
        return { success: true };
    } catch (error: any) { return { success: false, message: error.message || 'طرأ خطبٌ عند التهيئة.' }; }
}

export async function changePasswordAction(formData: FormData) {
    try {
        const session = await getAuthenticatedSession();
        
        const ip = (await headers()).get('x-forwarded-for') || 'unknown';
        const limitCheck = await sensitiveLimiter.check(`change-pw-${session.user.id}-${ip}`, 3); 
        if (!limitCheck.success) throw new Error("محاولات كثيرة جدًا.");

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user?.password) return { success: false, message: 'لا يمكن تغيير كلمة السر للحسابات المربوطة بمزود خارجي.' };
        
        const currentPassword = formData.get('currentPassword') as string;
        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;
        
        // DIRECTOR Override check
        const userRoles = session.user.roles || [];
        const isDirector = userRoles.includes('DIRECTOR');

        // Logic split: Director doesn't need currentPassword
        if (!isDirector) {
            if (!currentPassword) return { success: false, message: 'كلمة السر الحالية مطلوبة.' };
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) return { success: false, message: 'كلمة السر الحالية خاطئة.' };
        }

        if (!newPassword || !confirmPassword) return { success: false, message: 'الكلمة الجديدة وتأكيدها مطلوبان.' };
        
        const pwVal = signUpSchema.shape.password.safeParse(newPassword);
        if (!pwVal.success) return { success: false, message: pwVal.error.issues[0].message };
        
        if (newPassword !== confirmPassword) return { success: false, message: 'الكلمتان الجديدتان لا تتطابقان.' };
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
        
        return { success: true, message: 'تغيَّرت كلمة السر.' };
    } catch (error: any) { return { success: false, message: error.message || 'طرأ خطبٌ ما.' }; }
}

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; message: string }> {
    const validation = profileSchema.shape.username.safeParse(username);
    if (!validation.success) return { available: false, message: validation.error.issues[0].message };
    
    const existingUser = await prisma.user.findUnique({ where: { username: validation.data } });
    if (existingUser) return { available: false, message: 'اسمٌ محجوز.' };
    return { available: true, message: 'الاسمُ متاح.' };
}

export async function signUp(formData: FormData) {
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const limitCheck = await sensitiveLimiter.check(`signup-${ip}`, 3); 
    if (!limitCheck.success) return { success: false, message: "يرجى الانتظار قبل المحاولة مرة أخرى." };

    const rawData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        username: formData.get('username'),
    };

    const validation = signUpSchema.safeParse(rawData);
    if (!validation.success) {
        return { success: false, message: validation.error.issues[0].message };
    }
    const data = validation.data;

    const usernameCheck = await checkUsernameAvailability(data.username);
    if (!usernameCheck.available) return { success: false, message: usernameCheck.message };
    
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) return { success: false, message: 'بريدٌ مسجل.' };
    
    return { success: true, message: 'تمَّت المصادقة.' };
}

export async function setUsernameAction(username: string) {
    try {
        const session = await getAuthenticatedSession();
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (user?.username) return { success: false, message: 'الاسمُ قد عُيِّن.' };
        
        const validation = profileSchema.shape.username.safeParse(username);
        if (!validation.success) return { success: false, message: validation.error.issues[0].message };
        const cleanUsername = validation.data;

        const availability = await checkUsernameAvailability(cleanUsername);
        if (!availability.available) return { success: false, message: availability.message };
        
        await prisma.user.update({ where: { id: session.user.id }, data: { username: cleanUsername } });
        revalidatePath('/profile');
        revalidateTag(`user-session-${session.user.id}`, 'max');
        return { success: true };
    } catch (error: any) { return { success: false, message: error.message || 'أخفق تحديث الاسم.' }; }
}

export async function updateUserAvatar(formData: FormData) {
    try {
        const session = await getAuthenticatedSession();
        
        // Rate limit for uploads (heavy operation)
        const ip = (await headers()).get('x-forwarded-for') || 'unknown';
        const limitCheck = await sensitiveLimiter.check(`avatar-upload-${session.user.id}-${ip}`, 3); 
        if (!limitCheck.success) throw new Error("محاولات رفع كثيرة جداً.");

        const avatarFile = formData.get('avatar') as File | null;
        if (!avatarFile || avatarFile.size === 0) return { success: true, message: 'لا صورة جديدة.' };
        
        // SECURITY: Strict File Validation
        if (avatarFile.size > 5 * 1024 * 1024) throw new Error('حجم الصورة كبير جدًا (أقصى حد 5 ميجابايت).');
        
        // SECURITY: Verify Magic Bytes
        const validation = await validateImageFile(avatarFile);
        if (!validation.isValid) throw new Error(validation.error);

        const sanitizedFilename = `${session.user.id}-${Date.now()}-${avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        const blob = await put(sanitizedFilename, avatarFile, { access: 'public', contentType: avatarFile.type });
        
        await prisma.user.update({ where: { id: session.user.id }, data: { image: blob.url } });
        await syncUserToSanity(session.user.id);
        
        revalidatePath('/profile');
        revalidateTag('enriched-creators', 'max');
        revalidateTag('enriched-creator-details', 'max');
        revalidateTag(`user-session-${session.user.id}`, 'max');
        
        return { success: true, message: 'تجدَّدت الصورة الرمزية.' };
    } catch (error: any) { return { success: false, message: error.message || 'أخفق الرفع.' }; }
}

export async function getCommentedContentIds() {
    try {
        const session = await getAuthenticatedSession();
        const comments = await prisma.comment.findMany({
            where: { authorId: session.user.id, isDeleted: false },
            select: { contentSlug: true },
            distinct: ['contentSlug'],
        });
        return comments.map((c: any) => c.contentSlug);
    } catch (error) { return []; }
}