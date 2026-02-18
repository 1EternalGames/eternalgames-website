// app/actions/homepageActions.ts
'use server';

import { sanityWriteClient } from '@/lib/sanity.server';
import { client } from '@/lib/sanity.client';
import { getAuthenticatedSession } from '@/lib/auth';
import { revalidateTag, unstable_cache } from 'next/cache';
import { groq } from 'next-sanity';
import { cardListProjection, mainImageFields } from '@/lib/sanity.queries'; 
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

        revalidateTag('content');
        revalidateTag('homepage-content-consolidated-v2');

        return { success: true, message: 'تم تحديث القائمة.' };
    } catch (error) {
        console.error("Failed to update releases credits:", error);
        return { success: false, message: 'حدث خطأ أثناء التحديث.' };
    }
}

export const getAllStaffAction = unstable_cache(
    async () => {
        try {
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

            const uniqueMap = new Map();
            
            rawStaff.forEach((creator: any) => {
                let key = creator.prismaUserId;
                if (!key) {
                    key = `name:${creator.name}`;
                }
                
                if (creator.prismaUserId && usernameMap.has(creator.prismaUserId)) {
                    creator.username = usernameMap.get(creator.prismaUserId);
                }

                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, creator);
                } else {
                    const existing = uniqueMap.get(key);
                    const combinedContent = [...(existing.linkedContent || []), ...(creator.linkedContent || [])];
                    const uniqueContentMap = new Map();
                    combinedContent.forEach(item => uniqueContentMap.set(item._id, item));
                    const uniqueContent = Array.from(uniqueContentMap.values());
                    uniqueContent.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
                    
                    existing.linkedContent = uniqueContent.slice(0, 24); 
                    
                    if (!existing.image && creator.image) existing.image = creator.image;
                    if (!existing.bio && creator.bio) existing.bio = creator.bio;
                }
            });

            const uniqueStaff = Array.from(uniqueMap.values());

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
        revalidate: false, 
        tags: ['creators', 'content', 'enriched-creators'] 
    }
);

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
        revalidate: false, 
        tags: ['tag', 'content'] 
    }
);

export const getRecentGamesAction = unstable_cache(
    async () => {
        try {
            const slugQuery = groq`{
                "reviews": *[_type == "review" && defined(game) && defined(publishedAt) && publishedAt < now()] | order(publishedAt desc)[0...10].game->slug.current,
                "articles": *[_type == "article" && defined(game) && defined(publishedAt) && publishedAt < now()] | order(publishedAt desc)[0...12].game->slug.current,
                "news": *[_type == "news" && defined(game) && defined(publishedAt) && publishedAt < now()] | order(publishedAt desc)[0...18].game->slug.current,
                "releases": *[_type == "gameRelease" && defined(game)].game->slug.current
            }`;

            const slugsData = await client.fetch(slugQuery);
            
            const slugs = new Set<string>();
            
            (slugsData.reviews || []).forEach((s: string) => s && slugs.add(s));
            (slugsData.articles || []).forEach((s: string) => s && slugs.add(s));
            (slugsData.news || []).forEach((s: string) => s && slugs.add(s));
            (slugsData.releases || []).forEach((s: string) => s && slugs.add(s));

            const uniqueSlugs = Array.from(slugs);

            if (uniqueSlugs.length === 0) return [];

            const query = groq`*[_type == "game" && slug.current in $slugs] {
                _id,
                title,
                "slug": slug.current,
                "mainImage": mainImage{${mainImageFields}},
                
                "linkedContent": *[_type in ["review", "article", "news"] && defined(publishedAt) && publishedAt < now() && game->slug.current == ^.slug.current] | order(publishedAt desc)[0...24] { ${cardListProjection} }
            }`;
            
            const rawGames = await client.fetch(query, { slugs: uniqueSlugs });
            
            const enrichedGames = await Promise.all(rawGames.map(async (game: any) => {
                if (game.linkedContent && game.linkedContent.length > 0) {
                    game.linkedContent = await enrichContentList(game.linkedContent);
                    game.contentLoaded = true;
                }
                return game;
            }));

            return enrichedGames;
        } catch (error) {
            console.error("Failed to fetch recent games:", error);
            return [];
        }
    },
    ['recent-games-hubs-targeted-v7'],
    { 
        revalidate: false, 
        tags: ['game', 'content'] 
    }
);