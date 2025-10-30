// app/studio/[contentType]/[id]/page.tsx
'use client'; 

import { createClient } from 'next-sanity';
import { projectId, dataset, apiVersion } from '@/lib/sanity.client';
import { editorDocumentQuery, allGamesForStudioQuery, allTagsForStudioQuery, allCreatorsForStudioQuery } from '@/lib/sanity.queries';
import { notFound } from "next/navigation";
import { EditorClient } from "./EditorClient";
import { portableTextToTiptap } from '../../utils/portableTextToTiptap';
import { useState, useEffect, use } from 'react'; // <-- IMPORT `use` HOOK

const studioClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.NEXT_PUBLIC_SANITY_API_WRITE_TOKEN,
});

const EditorLoading = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: '60px', height: '60px' }} />
    </div>
);

// The `params` prop is now a Promise
export default function EditorPage({ params }: { params: Promise<{ contentType: string; id: string }> }) {
    // --- THE DEFINITIVE FIX ---
    // Unwrap the params Promise using the `use` hook.
    const resolvedParams = use(params);

    const [isLoading, setIsLoading] = useState(true);
    const [editorData, setEditorData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            // Access properties from the resolved params object
            const { id } = resolvedParams;
            
            const [document, allGames, allTags, allCreators] = await Promise.all([
                studioClient.fetch(editorDocumentQuery, { id }),
                studioClient.fetch(allGamesForStudioQuery),
                studioClient.fetch(allTagsForStudioQuery),
                studioClient.fetch(allCreatorsForStudioQuery)
            ]);

            if (!document) {
                setIsLoading(false);
                return;
            }
            
            const tiptapContent = portableTextToTiptap(document.content ?? []);
            
            const documentWithTiptapContent = { ...document, tiptapContent };
            
            setEditorData({
                document: documentWithTiptapContent,
                allGames,
                allTags,
                allCreators,
            });
            setIsLoading(false);
        };
        
        fetchData();
    }, [resolvedParams]); // Depend on the resolved params

    if (isLoading) {
        return <EditorLoading />;
    }

    if (!editorData) {
        return <div>Document not found.</div>;
    }
    
    return <EditorClient 
                document={editorData.document} 
                allGames={editorData.allGames}
                allTags={editorData.allTags}
                allCreators={editorData.allCreators}
           />;
}