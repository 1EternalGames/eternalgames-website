// app/studio/[contentType]/[id]/page.tsx

import { sanityWriteClient } from '@/lib/sanity.server'; // CORRECTED: Use server client
import { editorDocumentQuery, allGamesForStudioQuery, allTagsForStudioQuery, allCreatorsForStudioQuery } from '@/lib/sanity.queries';
import { EditorClient } from "./EditorClient";
import { portableTextToTiptap } from '../../utils/portableTextToTiptap';
import { notFound } from 'next/navigation';

export const runtime = 'nodejs';

export default async function EditorPage({ params }: { params: { contentType: string; id: string } }) {
    const { id } = params;

    try {
        // CORRECTED: Pass the 'id' parameter to the fetch call
        const [document, allGames, allTags, allCreators] = await Promise.all([
            sanityWriteClient.fetch(editorDocumentQuery, { id }),
            sanityWriteClient.fetch(allGamesForStudioQuery),
            sanityWriteClient.fetch(allTagsForStudioQuery),
            sanityWriteClient.fetch(allCreatorsForStudioQuery)
        ]);

        if (!document) {
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
        return (
            <div className="container page-container" style={{ textAlign: 'center' }}>
                <h1 className="page-title">Error Loading Editor</h1>
                <p style={{color: 'var(--text-secondary)'}}>Failed to load editor data. Please check the console for details.</p>
            </div>
        );
    }
}