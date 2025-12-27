// app/actions/homepageActions.ts
'use server';

import { sanityWriteClient } from '@/lib/sanity.server';
import { client } from '@/lib/sanity.client';
import { getAuthenticatedSession } from '@/lib/auth';
import { revalidateTag, unstable_cache } from 'next/cache';
import { groq } from 'next-sanity';
import { cardListProjection } from '@/lib/sanity.queries'; 
import { enrichContentList } from '@/lib/enrichment'; 
import prisma from '@/lib/prisma';

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
                bio,
                prismaUserId,
                username,
                "linkedContent": *[_type in ["review", "article", "news"] && defined(publishedAt) && publishedAt < now() && references(^._id)] | order(publishedAt desc)[0...24] { ${cardListProjection} }
            }`;
            
            const rawStaff = await client.fetch(query);

            // Extract Prisma IDs to fetch Usernames
            const userIds = rawStaff
                .map((c: any) => c.prismaUserId)
                .filter((id: string) => id);

            let usernameMap = new Map<string, string>();
            
            if (userIds.length > 0) {
                try {
                    const users = await prisma.user.findMany({
                        where: { id: { in: userIds } },
                        select: { id: true, username: true }
                    });
                    users.forEach((u: any) => {
                        if (u.username) usernameMap.set(u.id, u.username);
                    });
                } catch (dbError) {
                    console.error("DB Error fetching usernames for staff:", dbError);
                }
            }

            // Deduplicate and Merge Content
            const uniqueMap = new Map();
            
            rawStaff.forEach((creator: any) => {
                let key = creator.prismaUserId;
                if (!key) {
                    key = `name:${creator.name}`;
                }
                
                // Inject Username from DB if available
                if (creator.prismaUserId && usernameMap.has(creator.prismaUserId)) {
                    creator.username = usernameMap.get(creator.prismaUserId);
                }

                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, creator);
                } else {
                    // Merge content if duplicate found
                    const existing = uniqueMap.get(key);
                    
                    const combinedContent = [...(existing.linkedContent || []), ...(creator.linkedContent || [])];
                    
                    // Deduplicate content items by _id
                    const uniqueContentMap = new Map();
                    combinedContent.forEach(item => uniqueContentMap.set(item._id, item));
                    const uniqueContent = Array.from(uniqueContentMap.values());
                    
                    // Sort combined list by date descending
                    uniqueContent.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
                    
                    existing.linkedContent = uniqueContent.slice(0, 24); 
                    
                    if (!existing.image && creator.image) existing.image = creator.image;
                    if (!existing.bio && creator.bio) existing.bio = creator.bio;
                }
            });

            const uniqueStaff = Array.from(uniqueMap.values());

            // Enrich the content lists
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
    ['all-staff-full-data-v4'], 
    { 
        revalidate: 3600, 
        tags: ['creators', 'content', 'enriched-creators'] 
    }
);

// NEW: CACHED ACTION for TAGS
// Fetches all tags (Games, Articles, News) and their recent items
export const getAllTagsAction = unstable_cache(
    async () => {
        try {
            const query = groq`*[_type == "tag"] {
                _id,
                title,
                "slug": slug.current,
                category,
                "items": *[_type in ["review", "article", "news"] && defined(publishedAt) && publishedAt < now() && (references(^._id) || category._ref == ^._id)] | order(publishedAt desc)[0...24] { ${cardListProjection} }
            }`;
            
            const rawTags = await client.fetch(query);

            // Enrich content lists inside each tag
            const enrichedTags = await Promise.all(rawTags.map(async (tag: any) => {
                if (tag.items && tag.items.length > 0) {
                    tag.items = await enrichContentList(tag.items);
                }
                return tag;
            }));

            return enrichedTags;
        } catch (error) {
            console.error("Failed to fetch all tags:", error);
            return [];
        }
    },
    ['all-tags-full-data'], 
    { 
        revalidate: 3600, 
        tags: ['tag', 'content'] 
    }
);