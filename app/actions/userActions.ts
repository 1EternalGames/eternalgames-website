// app/actions/userActions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { put } from '@vercel/blob';
import bcrypt from 'bcryptjs';
import { getAuthenticatedSession } from '@/lib/auth';
import { sanityWriteClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';

// MODIFIED: Created a reusable function to sync Prisma user data to Sanity creator documents.
async function syncUserToSanity(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, image: true, bio: true, roles: { select: { name: true } } },
        });

        if (!user || !user.name) {
            console.warn(`[Sanity Sync] User ${userId} not found or has no name. Skipping sync.`);
            return;
        }

        const userRoles = user.roles.map((r: any) => r.name);
        const creatorTypes = userRoles
            .map((role: string) => ({
                'REVIEWER': 'reviewer',
                'AUTHOR': 'author',
                'REPORTER': 'reporter',
                'DESIGNER': 'designer',
            }[role]))
            .filter(Boolean) as string[];

        if (creatorTypes.length === 0) {
            return; // Not a creator, no need to sync.
        }

        const sanityDocs = await sanityWriteClient.fetch(
            groq`*[_type in $creatorTypes && prismaUserId == $userId]`,
            { creatorTypes, userId: user.id }
        );

        let imageAssetRef: string | undefined = undefined;
        if (user.image && user.image.startsWith('https://')) {
            try {
                // Check if this image URL already exists as an asset to avoid re-uploading
                const existingAsset = await sanityWriteClient.fetch(groq`*[_type == "sanity.imageAsset" && url == $imageUrl][0]._id`, { imageUrl: user.image });
                if (existingAsset) {
                    imageAssetRef = existingAsset;
                } else {
                    const response = await fetch(user.image);
                    const imageBlob = await response.blob();
                    const imageAsset = await sanityWriteClient.assets.upload('image', imageBlob, {
                        contentType: imageBlob.type,
                        filename: `${user.id}-avatar.jpg`
                    });
                    imageAssetRef = imageAsset._id;
                }
            } catch (e) {
                console.warn(`[Sanity Sync] Image upload failed for user ${userId}. Skipping image update.`, e);
            }
        }

        const transaction = sanityWriteClient.transaction();
        for (const doc of sanityDocs) {
            const patchData: { name: string; bio: string | null; image?: any } = {
                name: user.name,
                bio: user.bio,
            };
            if (imageAssetRef) {
                patchData.image = {
                    _type: 'image',
                    asset: { _type: 'reference', _ref: imageAssetRef }
                };
            }
            transaction.patch(doc._id, { set: patchData });
        }
        await transaction.commit();
        console.log(`[Sanity Sync] Synced profile for user ${userId} to ${sanityDocs.length} creator document(s).`);

    } catch (error) {
        console.error(`[CRITICAL] Failed to sync user ${userId} to Sanity:`, error);
        // We don't throw here to avoid failing the main user action.
    }
}

export async function getUserState() {
    try {
        const session = await getAuthenticatedSession();
        // Fetch all user state in parallel
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
        return { success: true, data: { engagements, shares } };
    } catch (error) {
        // This will happen if the user is not logged in, which is expected.
        return { success: false, data: null };
    }
}

export async function updateUserProfile(formData: FormData) {
    try {
        const session = await getAuthenticatedSession();
        
        const name = formData.get('name') as string;
        const username = (formData.get('username') as string)?.toLowerCase();
        const bio = formData.get('bio') as string;
        const twitterHandle = formData.get('twitterHandle') as string;
        const instagramHandle = formData.get('instagramHandle') as string;
        const agePublic = formData.get('agePublic') === 'on';
        const countryPublic = formData.get('countryPublic') === 'on';

        if (username) {
            const validation = validateUsername(username);
            if (!validation.success) throw new Error(validation.message);
            const existingUser = await prisma.user.findUnique({ where: { username } });
            if (existingUser && existingUser.id !== session.user.id) {
                throw new Error('اسمٌ محجوز.');
            }
        }
        
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: name || undefined,
                username: username || undefined,
                bio: bio.slice(0, 500),
                twitterHandle,
                instagramHandle,
                agePublic,
                countryPublic,
            },
        });
        
        // MODIFIED: Trigger the Sanity sync after a successful profile update.
        await syncUserToSanity(session.user.id);

        // THE DEFINITIVE FIX: Added 'max' argument to revalidateTag.
        revalidateTag('enriched-creators', 'max');
        revalidateTag('enriched-creator-details', 'max');
        revalidatePath('/profile');
        revalidatePath(`/profile/${session.user.id}`);
        if (username) revalidatePath(`/creators/${username}`);

        return { success: true, message: 'تَجَدَّدَ مَلَفُكَ الشخصي.' };
    } catch (error: any) {
        return { success: false, message: error.message || 'أخفق تحديث الملف.' };
    }
}

export async function completeOnboardingAction(formData: FormData) {
    try {
        const session = await getAuthenticatedSession();
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });

        const fullName = formData.get('fullName') as string;
        const username = (formData.get('username') as string)?.toLowerCase();
        const ageStr = formData.get('age') as string;
        const country = formData.get('country') as string;

        if (!fullName || fullName.trim() === '') {
            return { success: false, message: 'الاسم الكامل مطلوب.' };
        }
        if (!username) {
            return { success: false, message: 'اسم المستخدم مطلوب.' };
        }

        if (username !== user?.username) {
            const usernameValidation = await checkUsernameAvailability(username);
            if (!usernameValidation.available) {
                return { success: false, message: usernameValidation.message };
            }
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: fullName,
                username: username,
                age: ageStr ? parseInt(ageStr, 10) : null,
                country: country || null,
            },
        });

        // THE DEFINITIVE FIX: Added 'max' argument to revalidateTag.
        revalidateTag('enriched-creators', 'max');
        revalidateTag('enriched-creator-details', 'max');
        revalidatePath('/profile');
        if (username) revalidatePath(`/profile/${username}`);
        
        return { success: true };

    } catch (error: any) {
        return { success: false, message: error.message || 'طرأ خطبٌ عند التهيئة.' };
    }
}

export async function changePasswordAction(formData: FormData) {
    try {
        const session = await getAuthenticatedSession();
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });

        if (!user?.password) {
            return { success: false, message: 'لا يمكن تغيير كلمة السر للحسابات المربوطة بمزود خارجي.' };
        }

        const currentPassword = formData.get('currentPassword') as string;
        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return { success: false, message: 'الحقولُ كلُّها لازمة.' };
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return { success: false, message: 'كلمة السر الحالية خاطئة.' };
        }

        if (newPassword.length < 8) {
            return { success: false, message: 'كلمة السر الجديدة لا تقل عن ثمانيةِ حروف.' };
        }

        if (newPassword !== confirmPassword) {
            return { success: false, message: 'الكلمتان الجديدتان لا تتطابقان.' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        return { success: true, message: 'تغيَّرت كلمة السر.' };

    } catch (error: any) {
        return { success: false, message: error.message || 'طرأ خطبٌ ما.' };
    }
}
const validateUsername = (username: string) => {
    if (!username) return { success: false, message: 'اسم المستخدم مطلوب.' };
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
        return { success: false, message: 'اسم المستخدم يجب أن يتكون من 3-20 حرفًا إنجليزيًا.' };
    }
    return { success: true, message: '' };
};

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; message: string }> {
    const validation = validateUsername(username);
    if (!validation.success) {
        return { available: false, message: validation.message };
    }
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
        return { available: false, message: 'اسمٌ محجوز.' };
    }
    return { available: true, message: 'الاسمُ متاح.' };
}
export async function signUp(formData: FormData) {
    const name = formData.get('name') as string;
    const email = (formData.get('email') as string)?.toLowerCase(); // MODIFIED
    const password = formData.get('password') as string;
    const username = (formData.get('username') as string)?.toLowerCase();
    if (!name || !email || !password || !username) {
        return { success: false, message: 'الحقولُ كلُّها لازمة.' };
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        return { success: false, message: 'البريد الإلكتروني غير صالح.' };
    }
    if (password.length < 8) {
        return { success: false, message: 'كلمة السر لا تقل عن ثمانيةِ حروف.' };
    }
    const usernameValidation = await checkUsernameAvailability(username);
    if (!usernameValidation.available) {
        return { success: false, message: usernameValidation.message };
    }
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
        return { success: false, message: 'بريدٌ مسجل.' };
    }
    return { success: true, message: 'تمَّت المصادقة.' };
}
export async function setUsernameAction(username: string) {
    try {
        const session = await getAuthenticatedSession();
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (user?.username) return { success: false, message: 'الاسمُ قد عُيِّن.' };

        const cleanUsername = username.toLowerCase();
        const validation = await checkUsernameAvailability(cleanUsername);
        if (!validation.available) return { success: false, message: validation.message };

        await prisma.user.update({
            where: { id: session.user.id },
            data: { username: cleanUsername },
        });
        revalidatePath('/profile');
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message || 'أخفق تحديث الاسم.' };
    }
}
export async function updateUserAvatar(formData: FormData) {
    try {
        const session = await getAuthenticatedSession();
        const avatarFile = formData.get('avatar') as File | null;
        if (!avatarFile || avatarFile.size === 0) return { success: true, message: 'لا صورة جديدة.' };

        const sanitizedFilename = `${session.user.id}-${Date.now()}-${avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        const blob = await put(sanitizedFilename, avatarFile, { access: 'public', contentType: avatarFile.type });
        await prisma.user.update({ where: { id: session.user.id }, data: { image: blob.url } });
        
        // MODIFIED: Trigger Sanity sync after avatar update.
        await syncUserToSanity(session.user.id);
        
        revalidatePath('/profile');
        // THE DEFINITIVE FIX: Added 'max' argument to revalidateTag.
        revalidateTag('enriched-creators', 'max');
        revalidateTag('enriched-creator-details', 'max');
        return { success: true, message: 'تجدَّدت الصورة الرمزية.' };
    } catch (error: any) {
        return { success: false, message: error.message || 'أخفق الرفع.' };
    }
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
    } catch (error) {
        return [];
    }
}