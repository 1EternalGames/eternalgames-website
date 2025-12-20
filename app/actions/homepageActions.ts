// app/actions/homepageActions.ts
'use server';

import { sanityWriteClient } from '@/lib/sanity.server';
import { client } from '@/lib/sanity.client';
import { getAuthenticatedSession } from '@/lib/auth';
import { revalidateTag } from 'next/cache';
import { groq } from 'next-sanity';

export async function updateReleasesCreditsAction(creatorIds: string[]) {
    try {
        const session = await getAuthenticatedSession();
        const userRoles = session.user.roles;
        const canEdit = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');

        if (!canEdit) {
            return { success: false, message: 'غير مصرح لك.' };
        }

        const references = creatorIds.map(id => ({
            _type: 'reference',
            _ref: id,
            _key: id 
        }));

        await sanityWriteClient.createIfNotExists({
            _id: 'homepageSettings',
            _type: 'homepageSettings',
            releasesCredits: []
        });

        await sanityWriteClient
            .patch('homepageSettings')
            .set({ releasesCredits: references })
            .commit();

        // FIX: Added 'max' profile argument to satisfy Next.js cache API
        revalidateTag('content', 'max');
        revalidateTag('homepage-content-consolidated-v2', 'max');

        return { success: true, message: 'تم تحديث القائمة.' };
    } catch (error) {
        console.error("Failed to update releases credits:", error);
        return { success: false, message: 'حدث خطأ أثناء التحديث.' };
    }
}

export async function getAllStaffAction() {
    try {
        // Fetch all creator documents
        const query = groq`*[_type in ["reviewer", "author", "reporter", "designer"]] {
            _id,
            name,
            "image": image,
            prismaUserId,
            username
        }`;
        const rawStaff = await client.fetch(query);

        // Deduplicate logic
        const uniqueMap = new Map();
        
        rawStaff.forEach((creator: any) => {
            let key = creator.prismaUserId;
            if (!key) {
                key = `name:${creator.name}`;
            }
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, creator);
            }
        });

        return Array.from(uniqueMap.values()).sort((a: any, b: any) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Failed to fetch staff:", error);
        return [];
    }
}


