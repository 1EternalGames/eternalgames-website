// app/actions/aboutActions.ts
'use server';

import { client } from '@/lib/sanity.client';
import { aboutPageQuery } from '@/lib/sanity.queries';
import prisma from '@/lib/prisma';
import { unstable_cache, revalidateTag } from 'next/cache';
import { sanityWriteClient } from '@/lib/sanity.server';
import { getAuthenticatedSession } from '@/lib/auth';

// Cached Action: Fetches the configured about page data and enriches it with usernames
export const getAboutPageDataAction = unstable_cache(
    async () => {
        try {
            const rawData = await client.fetch(aboutPageQuery);
            
            if (!rawData) return null;

            // Collect all Prisma User IDs from the fetched data
            const userIds = new Set<string>();

            const collect = (item: any) => {
                if (item && item.prismaUserId) {
                    userIds.add(item.prismaUserId);
                }
            };

            collect(rawData.ceo);
            collect(rawData.headOfCommunication);
            collect(rawData.headOfReviews);
            collect(rawData.editorInChief);
            collect(rawData.headOfVisuals);
            (rawData.reportersSection || []).forEach(collect);
            (rawData.authorsSection || []).forEach(collect);
            (rawData.designersSection || []).forEach(collect);

            const uniqueIds = Array.from(userIds);
            const usernameMap = new Map<string, string>();

            if (uniqueIds.length > 0) {
                const users = await prisma.user.findMany({
                    where: { id: { in: uniqueIds } },
                    select: { id: true, username: true }
                });
                users.forEach((u: any) => {
                    if (u.username) usernameMap.set(u.id, u.username);
                });
            }

            // Enrich the data
            const enrich = (item: any) => {
                if (item && item.prismaUserId && usernameMap.has(item.prismaUserId)) {
                    return { ...item, username: usernameMap.get(item.prismaUserId) };
                }
                return item;
            };

            return {
                ceo: enrich(rawData.ceo),
                headOfCommunication: enrich(rawData.headOfCommunication),
                headOfReviews: enrich(rawData.headOfReviews),
                editorInChief: enrich(rawData.editorInChief),
                headOfVisuals: enrich(rawData.headOfVisuals),
                reportersSection: (rawData.reportersSection || []).map(enrich),
                authorsSection: (rawData.authorsSection || []).map(enrich),
                designersSection: (rawData.designersSection || []).map(enrich),
            };

        } catch (error) {
            console.error("Failed to fetch about page data:", error);
            return null;
        }
    },
    ['about-page-data'],
    { revalidate: 3600, tags: ['about-page', 'studio-metadata'] }
);

// Server Action to update the about page settings
export async function updateAboutPageAction(data: Record<string, string | string[] | null>) {
    try {
        const session = await getAuthenticatedSession();
        const userRoles = session.user.roles;
        const canEdit = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');

        if (!canEdit) {
            return { success: false, message: 'غير مصرح لك.' };
        }

        const patchData: Record<string, any> = {};

        for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value)) {
                patchData[key] = value.map(id => ({ _type: 'reference', _ref: id, _key: id }));
            } else if (value) {
                patchData[key] = { _type: 'reference', _ref: value };
            } else {
                // If value is null, unset the reference
                patchData[key] = undefined;
            }
        }
        
        await sanityWriteClient.createIfNotExists({
            _id: 'aboutPageSettings',
            _type: 'aboutPageSettings'
        });

        await sanityWriteClient
            .patch('aboutPageSettings')
            .set(patchData)
            .commit();

        revalidateTag('about-page', 'max');

        return { success: true, message: 'تم تحديث صفحة "من نحن".' };
    } catch (error) {
        console.error("Failed to update about page:", error);
        return { success: false, message: 'حدث خطأ أثناء التحديث.' };
    }
}