// app/studio/[contentType]/[id]/page.tsx

import { createClient } from 'next-sanity';
import { projectId, dataset, apiVersion } from '@/lib/sanity.client';
import { editorDocumentQuery, allGamesForStudioQuery, allTagsForStudioQuery, allCreatorsForStudioQuery } from '@/lib/sanity.queries';
import { notFound } from "next/navigation";
import { EditorClient } from "./EditorClient";
import { unstable_noStore as noStore } from 'next/cache';
import { portableTextToTiptap } from '../../utils/portableTextToTiptap';

const studioClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_WRITE_TOKEN,
    fetch: {
        cache: 'no-store',
    },
});

export default async function EditorPage({ params }: { params: { contentType: string; id: string } }) {
    noStore();
    
    const { id } = await params;
    
    const [document, allGames, allTags, allCreators] = await Promise.all([
        studioClient.fetch(editorDocumentQuery, { id }),
        studioClient.fetch(allGamesForStudioQuery),
        studioClient.fetch(allTagsForStudioQuery),
        studioClient.fetch(allCreatorsForStudioQuery)
    ]);

    if (!document) notFound();
    
    const tiptapContent = portableTextToTiptap(document.content ?? []);
    
    const documentWithTiptapContent = {
        ...document,
        tiptapContent: tiptapContent,
    };
    
    return <EditorClient 
                document={documentWithTiptapContent} 
                allGames={allGames}
                allTags={allTags}
                allCreators={allCreators}
           />;
}