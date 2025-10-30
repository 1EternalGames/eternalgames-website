// app/studio/[contentType]/[id]/page.tsx
'use client'; // <-- THE FIX: Add 'use client' directive

import { createClient } from 'next-sanity';
import { projectId, dataset, apiVersion } from '@/lib/sanity.client';
import { editorDocumentQuery, allGamesForStudioQuery, allTagsForStudioQuery, allCreatorsForStudioQuery } from '@/lib/sanity.queries';
import { notFound } from "next/navigation";
import { EditorClient } from "./EditorClient";
import { portableTextToTiptap } from '../../utils/portableTextToTiptap';
import { useState, useEffect } from 'react';

const studioClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.NEXT_PUBLIC_SANITY_API_WRITE_TOKEN, // Use public token for client-side fetching
});

// Loading Fallback Component
const EditorLoading = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" style={{ width: '60px', height: '60px' }} />
    </div>
);

export default function EditorPage({ params }: { params: { contentType: string; id: string } }) {
    const [isLoading, setIsLoading] = useState(true);
    const [editorData, setEditorData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            const { id } = params;
            
            const [document, allGames, allTags, allCreators] = await Promise.all([
                studioClient.fetch(editorDocumentQuery, { id }),
                studioClient.fetch(allGamesForStudioQuery),
                studioClient.fetch(allTagsForStudioQuery),
                studioClient.fetch(allCreatorsForStudioQuery)
            ]);

            if (!document) {
                // In a client component, we can use router or just show a message
                // For now, we'll rely on the parent notFound, but ideally this would be handled differently.
                // In this setup, it will just render nothing.
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
    }, [params]);

    if (isLoading) {
        return <EditorLoading />;
    }

    if (!editorData) {
        // This can be replaced with a proper notFound() call if using Next.js 13+ app router features for client components
        return <div>Document not found.</div>;
    }
    
    return <EditorClient 
                document={editorData.document} 
                allGames={editorData.allGames}
                allTags={editorData.allTags}
                allCreators={editorData.allCreators}
           />;
}