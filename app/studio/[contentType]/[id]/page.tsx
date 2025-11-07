// app/studio/[contentType]/[id]/page.tsx

import { sanityWriteClient } from '@/lib/sanity.server';
import { editorDocumentQuery, allGamesForStudioQuery, allTagsForStudioQuery, allCreatorsForStudioQuery } from '@/lib/sanity.queries';
import { EditorClient } from "./EditorClient";
import { portableTextToTiptap } from '../../utils/portableTextToTiptap';
import { notFound } from 'next/navigation';

// THE DEFINITIVE FIX: Force this page to use the Node.js runtime on Vercel.
export const runtime = 'nodejs';

// This is now a Server Component
export default async function EditorPage({ params }: { params: { contentType: string; id: string } }) {
    const { id } = params;

    try {
        const [document, allGames, allTags, allCreators] = await Promise.all([
            sanityWriteClient.fetch(editorDocumentQuery, { id }),
            sanityWriteClient.fetch(allGamesForStudioQuery),
            sanityWriteClient.fetch(allTagsForStudioQuery),
            sanityWriteClient.fetch(allCreatorsForStudioQuery)
        ]);

        if (!document) {
            // Use notFound() for a proper 404 page in Next.js App Router
            notFound();
        }
        
        const tiptapContent = portableTextToTiptap(document.content ?? []);
        const documentWithTiptapContent = { ...document, tiptapContent };
        
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
        // Render an error state if fetching fails
        return (
            <div className="container page-container" style={{ textAlign: 'center' }}>
                <h1 className="page-title">Error Loading Editor</h1>
                <p style={{color: 'var(--text-secondary)'}}>Failed to load editor data. Please check the console for details.</p>
            </div>
        );
    }
}