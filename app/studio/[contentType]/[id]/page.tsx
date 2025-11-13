// app/studio/[contentType]/[id]/page.tsx
import { sanityWriteClient } from '@/lib/sanity.server';
import { editorDocumentQuery, allGamesForStudioQuery, allTagsForStudioQuery, allCreatorsForStudioQuery } from '@/lib/sanity.queries';
import { EditorClient } from "./EditorClient";
import { portableTextToTiptap } from '../../utils/portableTextToTiptap';
import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';

export const runtime = 'nodejs';

export default async function EditorPage({ params: paramsPromise }: { params: Promise<{ contentType: string; id: string }> }) {
    noStore();
    const params = await paramsPromise;
    
    if (!params || !params.id) {
        notFound();
    }
    
    const publicId = params.id.replace('drafts.', '');
    
    try {
        const [document, allGames, allTags, allCreators] = await Promise.all([
            sanityWriteClient.fetch(editorDocumentQuery, { id: publicId }),
            sanityWriteClient.fetch(allGamesForStudioQuery),
            sanityWriteClient.fetch(allTagsForStudioQuery),
            sanityWriteClient.fetch(allCreatorsForStudioQuery)
        ]);
        
        if (!document) {
            notFound();
        }
        
        // CRITICAL FIX: Convert on-the-fly instead of caching in document
        // This ensures fresh conversion with fixed empty paragraph handling
        const tiptapContent = portableTextToTiptap(document.content ?? []);
        
        // Pass the converted content separately, don't merge into document
        // EditorClient will do fresh conversions as needed
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