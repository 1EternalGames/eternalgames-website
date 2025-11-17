// app/studio/[contentType]/[id]/page.tsx
import { sanityWriteClient } from '@/lib/sanity.server';
import { editorDocumentQuery, allGamesForStudioQuery, allTagsForStudioQuery, allCreatorsForStudioQuery } from '@/lib/sanity.queries';
import { EditorClient } from "./EditorClient";
import { portableTextToTiptap } from '../../utils/portableTextToTiptap';
import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { groq } from 'next-sanity';

export const runtime = 'nodejs';

// ADDED: Query to fetch the color dictionary
const colorDictionaryQuery = groq`*[_type == "colorDictionary" && _id == "colorDictionary"][0]{ autoColors }`;

export default async function EditorPage({ params: paramsPromise }: { params: Promise<{ contentType: string; id: string }> }) {
    noStore();
    const params = await paramsPromise;
    
    if (!params || !params.id) {
        notFound();
    }
    
    const publicId = params.id.replace('drafts.', '');
    
    try {
        const [document, allGames, allTags, allCreators, colorDictionary] = await Promise.all([
            sanityWriteClient.fetch(editorDocumentQuery, { id: publicId }),
            sanityWriteClient.fetch(allGamesForStudioQuery),
            sanityWriteClient.fetch(allTagsForStudioQuery),
            sanityWriteClient.fetch(allCreatorsForStudioQuery),
            sanityWriteClient.fetch(colorDictionaryQuery), // ADDED: Fetch call
        ]);
        
        if (!document) {
            notFound();
        }
        
        const tiptapContent = portableTextToTiptap(document.content ?? []);
        
        const documentWithTiptapContent = { 
            ...document, 
            tiptapContent 
        };
        
        return (
            <EditorClient 
                document={documentWithTiptapContent} 
                allGames={allGames}
                allTags={allTags}
                allCreators={allCreators}
                colorDictionary={colorDictionary?.autoColors || []} // ADDED: Pass data to client
            />
        );
    } catch (err: any) {
        console.error("Failed to load editor data:", err);
        return (
            <div className="container page-container" style={{ textAlign: 'center' }}>
                <h1 className="page-title">Error Loading Editor</h1>
                <p style={{color: 'var(--text-secondary)'}}>Failed to load editor data. Please check the deployment logs for details.</p>
            </div>
        );
    }
}