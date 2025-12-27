// app/actions/homepageActions.ts
'use server';

import { sanityWriteClient } from '@/lib/sanity.server';
import { client } from '@/lib/sanity.client';
import { getAuthenticatedSession } from '@/lib/auth';
import { revalidateTag, unstable_cache } from 'next/cache';
import { groq } from 'next-sanity';
import { cardListProjection } from '@/lib/sanity.queries'; // IMPORT PROJECTION
import { enrichContentList } from '@/lib/enrichment'; // IMPORT ENRICHMENT

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

        revalidateTag('content', 'max');
        revalidateTag('homepage-content-consolidated-v2', 'max');

        return { success: true, message: 'تم تحديث القائمة.' };
    } catch (error) {
        console.error("Failed to update releases credits:", error);
        return { success: false, message: 'حدث خطأ أثناء التحديث.' };
    }
}

// CACHED ACTION: Fetches all staff members and their recent content
export const getAllStaffAction = unstable_cache(
    async () => {
        try {
            // Fetch all creator documents WITH their content history (linkedContent)
            const query = groq`*[_type in ["reviewer", "author", "reporter", "designer"]] {
                _id,
                name,
                "image": image,
                prismaUserId,
                username,
                "linkedContent": *[_type in ["review", "article", "news"] && defined(publishedAt) && publishedAt < now() && references(^._id)] | order(publishedAt desc)[0...12] { ${cardListProjection} }
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

            const uniqueStaff = Array.from(uniqueMap.values());

            // Enrich the content lists (add usernames to the articles inside the creator's feed)
            const enrichedStaff = await Promise.all(uniqueStaff.map(async (creator: any) => {
                if (creator.linkedContent && creator.linkedContent.length > 0) {
                    creator.linkedContent = await enrichContentList(creator.linkedContent);
                }
                return creator;
            }));

            return enrichedStaff.sort((a: any, b: any) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error("Failed to fetch staff:", error);
            return [];
        }
    },
    ['all-staff-full-data'], // Cache Key
    { 
        revalidate: 3600, // Cache for 1 hour (refresh via revalidateTag)
        tags: ['creators', 'content', 'enriched-creators'] 
    }
);