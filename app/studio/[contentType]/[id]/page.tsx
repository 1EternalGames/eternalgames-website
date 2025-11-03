// app/studio/[contentType]/[id]/page.tsx
'use client'; 

import { createClient } from 'next-sanity';
import { projectId, dataset, apiVersion } from '@/lib/sanity.client';
import { editorDocumentQuery, allGamesForStudioQuery, allTagsForStudioQuery, allCreatorsForStudioQuery } from '@/lib/sanity.queries';
import { EditorClient } from "./EditorClient";
import { portableTextToTiptap } from '../../utils/portableTextToTiptap';
import { useState, useEffect, use } from 'react';

const studioClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.NEXT_PUBLIC_SANITY_API_WRITE_TOKEN,
});

const EditorLoading = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <div className="spinner" style={{ width: '60px', height: '60px' }} />
    </div>
);

export default function EditorPage({ params }: { params: Promise<{ contentType: string; id: string }> }) {
    const resolvedParams = use(params);

    const [isLoading, setIsLoading] = useState(true);
    const [editorData, setEditorData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { id } = resolvedParams;
                
                const [document, allGames, allTags, allCreators] = await Promise.all([
                    studioClient.fetch(editorDocumentQuery, { id }),
                    studioClient.fetch(allGamesForStudioQuery),
                    studioClient.fetch(allTagsForStudioQuery),
                    studioClient.fetch(allCreatorsForStudioQuery)
                ]);

                if (!document) {
                    setError('Document not found. It may have been deleted or the ID is incorrect.');
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
            } catch (err: any) {
                console.error("Failed to load editor data:", err);
                setError('Failed to load editor data. Please check the console for details.');
            } finally {
                setIsLoading(false);
            }
        };
        
        if (resolvedParams) {
            fetchData();
        }
    }, [resolvedParams]);

    if (isLoading) {
        return <EditorLoading />;
    }

    if (error || !editorData) {
        return (
            <div className="container page-container" style={{ textAlign: 'center' }}>
                <h1 className="page-title">Error Loading Editor</h1>
                <p style={{color: 'var(--text-secondary)'}}>{error || 'The requested document could not be loaded.'}</p>
            </div>
        );
    }
    
    return <EditorClient 
                document={editorData.document} 
                allGames={editorData.allGames}
                allTags={editorData.allTags}
                allCreators={editorData.allCreators}
           />;
}


