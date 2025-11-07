// app/studio/[contentType]/[id]/page.tsx

import { sanityWriteClient } from '@/lib/sanity.server';
import { editorDocumentQuery, allGamesForStudioQuery, allTagsForStudioQuery, allCreatorsForStudioQuery } from '@/lib/sanity.queries';
import { EditorClient } from "./EditorClient";
import { portableTextToTiptap } from '../../utils/portableTextToTiptap';
import { notFound } from 'next/navigation';

export const runtime = 'nodejs';

export default async function EditorPage({ params }: { params: { contentType: string; id: string } }) {
    const { id } = params;

    try {
        const [document, allGames, allTags, allCreators] = await Promise.all([
            // THE DEFINITIVE FIX IS HERE:
            // The query uses a parameter named `$id`.
            // Therefore, the parameters object MUST contain a key named `id`.
            // The value of `id` is passed from the URL `params`.
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
        // This error message is what you are seeing on Vercel.
        return (
            <div className="container page-container" style={{ textAlign: 'center' }}>
                <h1 className="page-title">Error Loading Editor</h1>
                <p style={{color: 'var(--text-secondary)'}}>Failed to load editor data. Please check the console for details.</p>
            </div>
        );
    }
}