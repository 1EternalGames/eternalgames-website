// app/studio/actions.ts
'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/authOptions';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sanityWriteClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import { slugify } from 'transliteration';
import { tiptapToPortableText } from './utils/tiptapToPortableText';
import { portableTextToTiptap } from './utils/portableTextToTiptap';
import { editorDocumentQuery } from '@/lib/sanity.queries';
import type { QueryParams } from '@sanity/client';

// --- uploadImageFromUrlAction REMOVED as it's no longer needed ---

export async function createDraftAction(contentType: 'review' | 'article' | 'news' | 'gameRelease') {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles) throw new Error('غير مصرح لك.');
    
    const userRoles = session.user.roles;
    const canCreate = (userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR')) || (contentType === 'review' && userRoles.includes('REVIEWER')) || (contentType === 'article' && userRoles.includes('AUTHOR')) || (contentType === 'news' && userRoles.includes('REPORTER'));
    if (!canCreate) throw new Error('صلاحيات غير كافية.');

    const highestIdQuery = groq`*[_type in ["review", "article", "news", "gameRelease"]] | order(legacyId desc)[0].legacyId`;
    const lastId = await sanityWriteClient.fetch<number>(highestIdQuery);
    const newLegacyId = (lastId || 0) + 1;

    let doc: any = { _type: contentType, title: `Untitled ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`, legacyId: newLegacyId };

    if (contentType === 'review' || contentType === 'article' || contentType === 'news') {
        let sanityCreator;
        const creatorTypeMap: Record<string, string> = { 'review': 'reviewer', 'article': 'author', 'news': 'reporter' };
        const sanityDocType = creatorTypeMap[contentType];
        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, image: true } });
        if (!user || !user.name) throw new Error("User not found or name is missing.");
        
        const existingCreator = await sanityWriteClient.fetch(`*[_type == "${sanityDocType}" && prismaUserId == $userId][0]`, { userId: session.user.id });
        if (existingCreator) {
            sanityCreator = existingCreator;
        } else {
            const newCreatorPayload: any = { _type: sanityDocType, _id: `${sanityDocType}-${session.user.id}`, name: user.name, prismaUserId: session.user.id };
            if (user.image) {
                try {
                    // THE DEFINITIVE FIX: Fetch the image data from the URL before uploading.
                    const response = await fetch(user.image);
                    const imageBlob = await response.blob();
                    const imageAsset = await sanityWriteClient.assets.upload('image', imageBlob, {
                        contentType: imageBlob.type,
                        filename: `${session.user.id}-avatar.jpg`
                    });
                    newCreatorPayload.image = { _type: 'image', asset: { _type: 'reference', _ref: imageAsset._id }};
                } catch (e) { console.warn('Image upload on draft creation failed', e); }
            }
            sanityCreator = await sanityWriteClient.create(newCreatorPayload);
        }
        if (contentType === 'review' || contentType === 'article') { doc.authors = [{ _type: 'reference', _ref: sanityCreator._id, _key: sanityCreator._id }] };
        if (contentType === 'news') { doc.reporters = [{ _type: 'reference', _ref: sanityCreator._id, _key: sanityCreator._id }] };
    }
    
    if (contentType === 'review') { doc.score = 0; doc.verdict = '...'; doc.pros = []; doc.cons = []; }
    if (contentType === 'news') doc.category = 'Industry';
    if (contentType === 'article') doc.publishedYear = new Date().getFullYear();
    if (contentType === 'gameRelease') { doc.releaseDate = new Date().toISOString().split('T')[0]; doc.synopsis = '...'; doc.platforms = []; }
    
    const result = await sanityWriteClient.create(doc, { autoGenerateArrayKeys: true });
    revalidatePath('/studio');
    return { _id: result._id, _type: result._type };
}

export async function updateDocumentAction(docId: string, patchData: Record<string, any>) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, message: 'غير مصرح لك.' };

    const publicId = docId.replace('drafts.', '');
    const draftId = `drafts.${publicId}`;

    try {
        const tx = sanityWriteClient.transaction();
        const existingDraft = await sanityWriteClient.getDocument(draftId);

        if (existingDraft) {
            tx.patch(draftId, (p) => p.set(patchData));
        } else {
            const originalDoc = await sanityWriteClient.getDocument(publicId);
            if (!originalDoc) {
                const docTypeQuery = groq`*[_id == $id][0]._type`;
                const docType = await sanityWriteClient.fetch(docTypeQuery, { id: publicId });
                const newDoc = { _id: draftId, _type: docType, ...patchData };
                tx.create(newDoc);
            } else {
                // THE DEFINITIVE FIX: Create a new object excluding the system properties.
                const { _rev, _updatedAt, _createdAt, ...restOfOriginalDoc } = originalDoc;
                const newDraftPayload = { ...restOfOriginalDoc, ...patchData, _id: draftId };
                tx.create(newDraftPayload);
            }
        }

        await tx.commit({ autoGenerateArrayKeys: true });
        revalidatePath('/studio');
        return { success: true };

    } catch (error: any) {
        console.error("Error during document update:", error);
        return { success: false, message: error.message || "An unexpected error occurred during the save operation." };
    }
}


export async function deleteDocumentAction(docId: string): Promise<{ success: boolean; message?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles) return { success: false, message: 'غير مصرح لك.' };
    const docToDelete = await sanityWriteClient.fetch(groq`*[_id == $docId][0]{_type}`, { docId });
    if (!docToDelete) return { success: false, message: 'Document not found.' };
    const userRoles = session.user.roles;
    const isAdminOrDirector = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');
    const docType = docToDelete._type;
    const canDelete = isAdminOrDirector || (docType === 'review' && userRoles.includes('REVIEWER')) || (docType === 'article' && userRoles.includes('AUTHOR')) || (docType === 'news' && userRoles.includes('REPORTER'));
    if (!canDelete) return { success: false, message: 'Insufficient permissions.' };
    const result = await sanityWriteClient.delete(docId);
    if (result.results.length > 0) {
        revalidatePath('/studio');
        return { success: true };
    }
    return { success: false, message: 'Could not be deleted.' };
}

export async function searchCreatorsAction(query: string, roleName: 'REVIEWER' | 'AUTHOR' | 'REPORTER' | 'DESIGNER'): Promise<{ _id: string; name: string }[]> {
    const usersWithRole = await prisma.user.findMany({ where: { roles: { some: { name: roleName } }, name: { contains: query, mode: 'insensitive' } }, select: { id: true }, take: 10 });
    if (usersWithRole.length === 0) return [];
    const prismaUserIds = usersWithRole.map(u => u.id);
    const sanityTypeMap = { REVIEWER: 'reviewer', AUTHOR: 'author', REPORTER: 'reporter', DESIGNER: 'designer' };
    const sanityType = sanityTypeMap[roleName];
    const sanityQuery = `*[_type == $sanityType && prismaUserId in $prismaUserIds]{_id, name}`;
    return await sanityWriteClient.fetch(sanityQuery, { sanityType, prismaUserIds }) as {_id: string, name: string}[];
}

export async function publishDocumentAction(docId: string, publishTime?: string | null): Promise<{ success: boolean; updatedDocument?: any; message?: string }> {
    const session = await getServerSession(authOptions);
    const userRoles = session?.user?.roles || [];
    const isAdminOrDirector = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');
    const doc = await sanityWriteClient.fetch(groq`*[_id == $docId || _id == 'drafts.' + $docId][0]{_id, _type, "slug": slug.current}`, { docId });
    if (!doc) return { success: false, message: 'Document not found.' };
    
    const docType = doc._type;
    if (docType === 'gameRelease') return { success: false, message: 'Releases do not support publishing.' };

    const canPublish = isAdminOrDirector || (docType === 'review' && userRoles.includes('REVIEWER')) || (docType === 'article' && userRoles.includes('AUTHOR')) || (docType === 'news' && userRoles.includes('REPORTER'));
    if (!canPublish) return { success: false, message: 'صلاحيات غير كافية.' };

    try {
        const publicId = docId.replace('drafts.', '');
        const draftId = `drafts.${publicId}`;

        // UNPUBLISH action
        if (publishTime === null) {
            const tx = sanityWriteClient.transaction();
            tx.delete(publicId);
            tx.patch(draftId, (p) => p.unset(['publishedAt']));
            await tx.commit({ returnDocuments: false });

            const contentTypePlural = docType === 'news' ? 'news' : `${docType}s`;
            revalidatePath(`/${contentTypePlural}`);
            revalidatePath(`/${contentTypePlural}/${doc.slug}`);
            revalidatePath('/studio');

            const finalDoc = await sanityWriteClient.fetch(editorDocumentQuery, { id: draftId });
            const docWithTiptap = { ...finalDoc, tiptapContent: portableTextToTiptap(finalDoc.content ?? []) };
            return { success: true, updatedDocument: docWithTiptap, message: 'تم إلغاء نشر المستند بنجاح.' };
        }

        // --- THE DEFINITIVE FIX: PUBLISH / UPDATE ACTION ---
        const draft = await sanityWriteClient.getDocument(draftId);
        
        // Fetch the published document to check its existing publishedAt date.
        const publishedDocForDateCheck = await sanityWriteClient.fetch(groq`*[_id == $id][0]{publishedAt}`, { id: publicId });

        let finalTime;
        if (publishTime) {
            // Case 1: User is explicitly scheduling/rescheduling. Use their specified time.
            finalTime = publishTime;
        } else if (publishedDocForDateCheck?.publishedAt) {
            // Case 2: User is updating an already live document. Preserve the original publish date.
            finalTime = publishedDocForDateCheck.publishedAt;
        } else {
            // Case 3: User is publishing a new draft for the first time. Set the publish date to now.
            finalTime = new Date().toISOString();
        }

        if (draft) {
            const publishedDocPayload = { ...draft, _id: publicId, publishedAt: finalTime };
            const tx = sanityWriteClient.transaction();
            tx.createOrReplace(publishedDocPayload);
            tx.delete(draftId);
            await tx.commit({ returnDocuments: false });
        } else {
            // This fallback handles cases where there's no draft, e.g., only changing the schedule of a live doc.
            await sanityWriteClient.patch(publicId).set({ publishedAt: finalTime }).commit();
        }

        revalidatePath('/studio');
        if (new Date(finalTime) <= new Date()) {
            const contentTypePlural = docType === 'news' ? 'news' : `${docType}s`;
            revalidatePath(`/${contentTypePlural}`);
            revalidatePath(`/${contentTypePlural}/${doc.slug}`);
        }

        // Fetch the newly published document to return to the client, ensuring UI consistency.
        const finalDoc = await sanityWriteClient.fetch(editorDocumentQuery, { id: publicId });
        const docWithTiptap = { ...finalDoc, tiptapContent: portableTextToTiptap(finalDoc.content ?? []) };
        const message = publishTime ? 'تم جدولة المستند بنجاح.' : (publishedDocForDateCheck ? 'تم تحديث المستند بنجاح.' : 'تم نشر المستند بنجاح.');
        return { success: true, updatedDocument: docWithTiptap, message: message };

    } catch (error) {
        console.error('Failed to publish/unpublish document:', error);
        return { success: false, message: 'Failed to commit publication status.' };
    }
}

export async function searchGamesAction(query: string): Promise<{_id: string, title: string}[]> {
    if (query.length < 2) return [];
    try {
        const results = await sanityWriteClient.fetch(
            `*[_type == "game" && title match $searchTerm + "*"][0...10]{_id, title}`, 
            { searchTerm: query }
        ) as {_id: string, title: string}[];
        return results;
    } catch (error) { console.error("Game search failed:", error); return []; }
}

export async function createGameAction(title: string): Promise<{_id: string, title: string} | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles.some((role: string) => ['ADMIN', 'DIRECTOR', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role))) { return null; }
    try {
        const newGame = await sanityWriteClient.create({ _type: 'game', title, slug: { _type: 'slug', current: slugify(title.toLowerCase(), { separator: '-' }) } });
        return { _id: newGame._id, title: newGame.title };
    } catch (error) { console.error("Failed to create game:", error); return null; }
}

export async function searchTagsAction(query: string): Promise<{_id: string, title: string}[]> {
    if (query.length < 1) return [];
    try {
        const results = await sanityWriteClient.fetch(
            `*[_type == "tag" && title match $searchTerm + "*"][0...10]{_id, title}`, 
            { searchTerm: query }
        ) as {_id: string, title: string}[];
        return results;
    } catch (error) { console.error("Tag search failed:", error); return []; }
}

export async function createTagAction(title: string): Promise<{_id: string, title: string} | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles.some((role: string) => ['ADMIN', 'DIRECTOR', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role))) { return null; }
    try {
        const newTag = await sanityWriteClient.create({ _type: 'tag', title, slug: { _type: 'slug', current: slugify(title.toLowerCase()) } });
        return { _id: newTag._id, title: newTag.title };
    } catch (error) { console.error("Failed to create tag:", error); return null; }
}

export async function getRecentTagsAction(): Promise<{_id: string, title: string}[]> {
    try {
        const results = await sanityWriteClient.fetch(groq`*[_type == "tag"] | order(_createdAt desc)[0...50]{_id, title}`);
        return results;
    } catch (error) { console.error("Recent tags fetch failed:", error); return []; }
}

export async function validateSlugAction(slug: string, docId: string): Promise<{ isValid: boolean; message: string }> {
    if (!docId) {
        return { isValid: false, message: 'Waiting for document ID...' };
    }
    
    if (!slug || slug.trim() === '') {
        return { isValid: false, message: 'المُعرِّف لا يمكن أن يكون فارغًا.' };
    }
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
        return { isValid: false, message: 'يمكن أن يحتوي المُعرِّف على أحرف وأرقام وشرطات فقط.' };
    }
    
    const query = groq`!defined(*[
        _type in ["review", "article", "news", "gameRelease"] &&
        slug.current == $slug &&
        !(_id in [$draftId, $publicId])
    ][0])`;
    
    try {
        const publicId = docId.replace('drafts.', '');
        const draftId = `drafts.${publicId}`;
        
        const isUnique = await sanityWriteClient.fetch(query, { slug, draftId, publicId });
        
        if (isUnique) {
            return { isValid: true, message: 'المُعرِّف صالح.' };
        }
        return { isValid: false, message: 'هذا المُعرِّف مستخدم بالفعل.' };

    } catch (error) {
        console.error('Sanity slug validation failed:', error);
        return { isValid: false, message: 'فشل التحقق بسبب خطأ في الخادم.' };
    }
}