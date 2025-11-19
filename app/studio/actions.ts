// app/studio/actions.ts
'use server';

import { getAuthenticatedSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { sanityWriteClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import { slugify } from 'transliteration';
import { tiptapToPortableText } from './utils/tiptapToPortableText';
import { portableTextToTiptap } from './utils/portableTextToTiptap';
import { editorDocumentQuery } from '@/lib/sanity.queries';
import type { IdentifiedSanityDocumentStub } from '@sanity/client';
import { v4 as uuidv4 } from 'uuid';

export async function translateTitleToAction(title: string): Promise<string> {
    const session = await getAuthenticatedSession();
    const userRoles = session.user.roles;
    const isAuthorized = userRoles.some((role: string) =>
      ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role)
    );

    if (!isAuthorized) {
        throw new Error('غير مُصرَّح به.');
    }
    
    const apiUrl = process.env.TRANSLATION_API_URL;
    if (!apiUrl) {
        return slugify(title);
    }
    
    try {
        const url = `${apiUrl}?q=${encodeURIComponent(title)}&langpair=ar|en`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Translation API responded with status: ${response.status}`);
        }
        const data = await response.json();
        
        const translatedText = data?.responseData?.translatedText;
        if (!translatedText || typeof translatedText !== 'string') {
            throw new Error("Invalid response structure from translation API.");
        }

        return slugify(translatedText, {
            lowercase: true,
            separator: '-',
            allowedChars: 'a-zA-Z0-9-',
        });

    } catch (error) {
        return slugify(title, {
            lowercase: true,
            separator: '-',
            allowedChars: 'a-zA-Z0-9-',
        });
    }
}


export async function createDraftAction(contentType: 'review' | 'article' | 'news' | 'gameRelease') {
    const session = await getAuthenticatedSession();
    const userRoles = session.user.roles;
    
    const canCreate = (userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR')) || (contentType === 'review' && userRoles.includes('REVIEWER')) || (contentType === 'article' && userRoles.includes('AUTHOR')) || (contentType === 'news' && userRoles.includes('REPORTER'));
    if (!canCreate) throw new Error('صلاحياتٌ قاصرة.');

    const highestIdQuery = groq`*[_type in ["review", "article", "news", "gameRelease"] && defined(legacyId)] | order(legacyId desc)[0].legacyId`;
    const lastId = await sanityWriteClient.fetch<number>(highestIdQuery, {}, { perspective: 'previewDrafts' });
    const newLegacyId = (lastId || 0) + 1;

    let doc: any = { _type: contentType, title: `Untitled ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`, legacyId: newLegacyId };

    if (contentType === 'review' || contentType === 'article' || contentType === 'news') {
        let sanityCreator;
        const creatorTypeMap: Record<string, string> = { 'review': 'reviewer', 'article': 'author', 'news': 'reporter' };
        const sanityDocType = creatorTypeMap[contentType];
        const user = session.user;
        if (!user || !user.name) throw new Error("المستخدمُ مفقودٌ أو الاسمُ غائب.");
        
        const existingCreator = await sanityWriteClient.fetch(`*[_type == "${sanityDocType}" && prismaUserId == $userId][0]`, { userId: user.id });
        if (existingCreator) {
            sanityCreator = existingCreator;
        } else {
            const newCreatorPayload: any = { _type: sanityDocType, _id: `${sanityDocType}-${user.id}`, name: user.name, prismaUserId: user.id };
            if (user.image) {
                try {
                    const response = await fetch(user.image);
                    const imageBlob = await response.blob();
                    const imageAsset = await sanityWriteClient.assets.upload('image', imageBlob, {
                        contentType: imageBlob.type,
                        filename: `${user.id}-avatar.jpg`
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
    if (contentType === 'gameRelease') { doc.releaseDate = new Date().toISOString().split('T')[0]; doc.synopsis = '...'; doc.platforms = []; }
    
    const result = await sanityWriteClient.create(doc, { autoGenerateArrayKeys: true });
    revalidatePath('/studio');
    return { _id: result._id, _type: result._type };
}

export async function updateDocumentAction(docId: string, patchData: Record<string, any>): Promise<{ success: boolean; message?: string; updatedDocument?: any }> {
    const session = await getAuthenticatedSession();
    if (!session) return { success: false, message: 'غير مُخَوَّل.' };

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
                if (!docType) throw new Error("لم يُعثر على نوع الوثيقة لإنشائها.");
                const newDoc = { _id: draftId, _type: docType, ...patchData };
                tx.create(newDoc);
            } else {
                const { _rev, _updatedAt, _createdAt, ...restOfOriginalDoc } = originalDoc;
                const newDraftPayload = { ...restOfOriginalDoc, ...patchData, _id: draftId };
                tx.create(newDraftPayload);
            }
        }

        await tx.commit({ autoGenerateArrayKeys: true, returnDocuments: false });
        
        const finalDoc = await sanityWriteClient.fetch(editorDocumentQuery, { id: publicId });
        if (!finalDoc) throw new Error("الوثيقةُ مفقودةٌ بعد تحديثها.");
        
        revalidatePath('/studio');
        const docType = finalDoc._type;
        const slug = finalDoc.slug?.current;
        if (slug) {
            const contentTypePlural = docType === 'news' ? 'news' : `${docType}s`;
            revalidatePath(`/${contentTypePlural}`);
            revalidatePath(`/${contentTypePlural}/${slug}`);
        }
        
        const docWithTiptap = { ...finalDoc, tiptapContent: portableTextToTiptap(finalDoc.content ?? []) };
        return { success: true, updatedDocument: docWithTiptap };

    } catch (error: any) {
        console.error("Error during document update:", error);
        return { success: false, message: error.message || "أصابنا خطبٌ أثناء الحفظ." };
    }
}

// --- THE FIXED DELETE FUNCTION ---
export async function deleteDocumentAction(docId: string): Promise<{ success: boolean; message?: string }> {
    const session = await getAuthenticatedSession();
    const userRoles = session.user.roles;
    
    // 1. Robust ID Resolution: Calculate both potential IDs (draft and public)
    const baseId = docId.replace(/^drafts\./, '');
    const draftId = `drafts.${baseId}`;

    // 2. Fetch Metadata: Check if *either* version exists to verify type and ownership
    const docToDelete = await sanityWriteClient.fetch(
        groq`*[_id in [$baseId, $draftId]][0]{_type}`, 
        { baseId, draftId }
    );
    
    if (!docToDelete) return { success: false, message: 'الوثيقةُ مفقودة.' };
    
    const isAdminOrDirector = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');
    const docType = docToDelete._type;
    
    const canDelete = 
        isAdminOrDirector || 
        (docType === 'review' && userRoles.includes('REVIEWER')) || 
        (docType === 'article' && userRoles.includes('AUTHOR')) || 
        (docType === 'news' && userRoles.includes('REPORTER'));

    if (!canDelete) return { success: false, message: 'أذوناتٌ قاصرة.' };
    
    try {
        // 3. Transactional Delete: Attempt to delete BOTH versions.
        // Sanity transactions will ignore deletion operations on non-existent documents,
        // so this safely removes whatever exists (draft, public, or both).
        const tx = sanityWriteClient.transaction();
        tx.delete(baseId);
        tx.delete(draftId);
        await tx.commit();

        revalidatePath('/studio');
        return { success: true };
    } catch (error) {
        console.error("Delete failed:", error);
        return { success: false, message: 'تأبى الحذف.' };
    }
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
    const session = await getAuthenticatedSession();
    const userRoles = session.user.roles;
    const isAdminOrDirector = userRoles.includes('ADMIN') || userRoles.includes('DIRECTOR');
    
    const doc = await sanityWriteClient.fetch(groq`*[_id == $docId || _id == 'drafts.' + $docId] | order(_updatedAt desc)[0]{_id, _type, "slug": slug.current}`, { docId });
    if (!doc) return { success: false, message: 'الوثيقةُ مفقودة.' };
    
    const docType = doc._type;
    
    const canPublish = isAdminOrDirector || (docType === 'review' && userRoles.includes('REVIEWER')) || (docType === 'article' && userRoles.includes('AUTHOR')) || (docType === 'news' && userRoles.includes('REPORTER')) || (docType === 'gameRelease' && isAdminOrDirector);
    if (!canPublish) return { success: false, message: 'صلاحياتٌ قاصرة.' };

    try {
        const publicId = docId.replace('drafts.', '');
        const draftId = `drafts.${publicId}`;

        if (publishTime === null) {
            const tx = sanityWriteClient.transaction();
            tx.delete(publicId);
            tx.patch(draftId, (p) => p.unset(['publishedAt']));
            await tx.commit({ returnDocuments: false });

            const contentTypePlural = docType === 'news' ? 'news' : `${docType}s`;
            revalidatePath(`/${contentTypePlural}`);
            revalidatePath(`/${contentTypePlural}/${doc.slug}`);
            revalidatePath('/studio');

            const finalDoc = await sanityWriteClient.fetch(editorDocumentQuery, { id: publicId });
            if (!finalDoc) throw new Error("Document not found after unpublish.");
            const docWithTiptap = { ...finalDoc, tiptapContent: portableTextToTiptap(finalDoc.content ?? []) };
            return { success: true, updatedDocument: docWithTiptap, message: 'أُلغيَ نشرُ الوثيقة.' };
        }

        const draft = await sanityWriteClient.getDocument(draftId);
        
        let finalTime = publishTime || new Date().toISOString();
        if (docType !== 'gameRelease') {
            const publishedDocForDateCheck = await sanityWriteClient.fetch(groq`*[_id == $id][0]{publishedAt}`, { id: publicId });
            if (publishTime) {
                finalTime = publishTime;
            } else if (publishedDocForDateCheck?.publishedAt) {
                finalTime = publishedDocForDateCheck.publishedAt;
            }
        }
        
        if (draft) {
            const publishedDocPayload: IdentifiedSanityDocumentStub = { ...draft, _id: publicId };
            if (docType !== 'gameRelease') {
                publishedDocPayload.publishedAt = finalTime;
            }
            const tx = sanityWriteClient.transaction();
            tx.createOrReplace(publishedDocPayload);
            tx.delete(draftId);
            await tx.commit({ returnDocuments: false });
        } else if (docType !== 'gameRelease') {
            await sanityWriteClient.patch(publicId).set({ publishedAt: finalTime }).commit();
        }

        revalidatePath('/studio');
        if (docType === 'gameRelease') {
            revalidatePath('/releases');
            revalidatePath('/celestial-almanac');
        } else if (new Date(finalTime) <= new Date()) {
            const contentTypePlural = docType === 'news' ? 'news' : `${docType}s`;
            revalidatePath(`/${contentTypePlural}`);
            revalidatePath(`/${contentTypePlural}/${doc.slug}`);
        }

        const finalDoc = await sanityWriteClient.fetch(editorDocumentQuery, { id: publicId });
        const docWithTiptap = { ...finalDoc, tiptapContent: portableTextToTiptap(finalDoc.content ?? []) };
        const message = docType === 'gameRelease' ? 'نُشِرَ الإصدار.' : (publishTime ? 'جُدولت الوثيقة.' : 'نُشِرت الوثيقة.');
        return { success: true, updatedDocument: docWithTiptap, message: message };

    } catch (error) {
        console.error('Failed to publish/unpublish document:', error);
        return { success: false, message: 'أخفق تنفيذ حالة النشر.' };
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
    } catch (error) { console.error("أخفق البحث عن اللعبة:", error); return []; }
}

export async function createGameAction(title: string): Promise<{_id: string, title: string} | null> {
    const session = await getAuthenticatedSession();
    const userRoles = session.user.roles;
    if (!userRoles.some((role: string) => ['ADMIN', 'DIRECTOR', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role))) { return null; }
    try {
        const newGame = await sanityWriteClient.create({ _type: 'game', title, slug: { _type: 'slug', current: slugify(title.toLowerCase(), { separator: '-' }) } });
        return { _id: newGame._id, title: newGame.title };
    } catch (error) { console.error("أخفق إنشاء اللعبة:", error); return null; }
}

export async function searchTagsAction(query: string): Promise<{_id: string, title: string}[]> {
    if (query.length < 1) return [];
    try {
        const results = await sanityWriteClient.fetch(
            `*[_type == "tag" && title match $searchTerm + "*"][0...10]{_id, title}`, 
            { searchTerm: query }
        ) as {_id: string, title: string}[];
        return results;
    } catch (error) { console.error("أخفق البحث عن الوسم:", error); return []; }
}

export async function createTagAction(title: string, category: 'Game' | 'Article' | 'News'): Promise<{_id: string, title: string} | null> {
    const session = await getAuthenticatedSession();
    const userRoles = session.user.roles;
    if (!userRoles.some((role: string) => ['ADMIN', 'DIRECTOR', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role))) { return null; }
    try {
        const newTag = await sanityWriteClient.create({ _type: 'tag', title, category, slug: { _type: 'slug', current: slugify(title.toLowerCase()) } });
        return { _id: newTag._id, title: newTag.title };
    } catch (error) { console.error("أخفق إنشاء الوسم:", error); return null; }
}

export async function getRecentTagsAction(): Promise<{_id: string, title: string}[]> {
    try {
        const results = await sanityWriteClient.fetch(groq`*[_type == "tag"] | order(_createdAt desc)[0...50]{_id, title}`);
        return results;
    } catch (error) { console.error("أخفق جلب آخر الوسوم:", error); return []; }
}

export async function validateSlugAction(slug: string, docId: string): Promise<{ isValid: boolean; message: string }> {
    if (!docId) return { isValid: false, message: 'بانتظار مُعرِّف الوثيقة...' };
    if (!slug || slug.trim() === '') return { isValid: false, message: 'لا يكُن المُعرِّفُ خاويًا.' };
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) return { isValid: false, message: 'المُعرِّف: حروفٌ وأرقامٌ وشَرْطاتٌ لا غير.' };
    
    const query = groq`!defined(*[_type in ["review", "article", "news", "gameRelease"] && slug.current == $slug && !(_id in [$draftId, $publicId])][0])`;
    try {
        const publicId = docId.replace('drafts.', '');
        const draftId = `drafts.${publicId}`;
        const isUnique = await sanityWriteClient.fetch(query, { slug, draftId, publicId });
        if (isUnique) return { isValid: true, message: 'المُعرِّفُ صالح.' };
        return { isValid: false, message: 'مُعرِّفٌ مُستعمل.' };
    } catch (error) { console.error('Sanity slug validation failed:', error); return { isValid: false, message: 'أخفق التحقق لخطبٍ في الخادم.' }; }
}

export async function uploadSanityAssetAction(formData: FormData): Promise<{ success: boolean; asset?: { _id: string; url: string }; error?: string }> {
    const session = await getAuthenticatedSession();
    const userRoles = session.user.roles;
    const isCreatorOrAdmin = userRoles.some((role: string) => ['DIRECTOR', 'ADMIN', 'REVIEWER', 'AUTHOR', 'REPORTER', 'DESIGNER'].includes(role));

    if (!isCreatorOrAdmin) return { success: false, error: 'غير مُصرَّح به' };
    
    const file = formData.get('file') as File | null;
    if (!file) return { success: false, error: 'لم يُقدَّم ملف.' };

    try {
        const asset = await sanityWriteClient.assets.upload('image', file, { filename: file.name, contentType: file.type });
        return { success: true, asset: { _id: asset._id, url: asset.url } };
    } catch (error: any) { console.error("Sanity asset upload failed:", error); return { success: false, error: 'أخفق رفع الملف.' }; }
}

export async function addOrUpdateColorDictionaryAction(newMapping: { word: string; color: string }) {
  try {
    await getAuthenticatedSession();
    const newEntry = { ...newMapping, _key: uuidv4() };
    const tx = sanityWriteClient.transaction();
    tx.createIfNotExists({ _id: 'colorDictionary', _type: 'colorDictionary', title: 'Color Dictionary' });
    tx.patch('colorDictionary', (p) => p.setIfMissing({ autoColors: [] }));
    tx.patch('colorDictionary', (p) => p.insert('before', 'autoColors[0]', [newEntry]) );
    await tx.commit({ returnDocuments: false });
    const updatedDictionary = await sanityWriteClient.fetch(groq`*[_id == "colorDictionary"][0]`);
    return { success: true, updatedDictionary };
  } catch (error: any) { console.error("Failed to update dictionary:", error); return { success: false, message: error.message || 'Failed to update dictionary.' }; }
}

export async function removeColorDictionaryAction(keyToRemove: string) {
  try {
    await getAuthenticatedSession();
    await sanityWriteClient.patch('colorDictionary').unset([`autoColors[_key=="${keyToRemove}"]`]).commit({ returnDocuments: false, autoGenerateArrayKeys: true });
    const updatedDictionary = await sanityWriteClient.fetch(groq`*[_id == "colorDictionary"][0]`);
    return { success: true, updatedDictionary };
  } catch (error: any) { console.error("Failed to remove from dictionary:", error); return { success: false, message: error.message || 'Failed to remove from dictionary.' }; }
}