// app/studio/[contentType]/[id]/page.tsx
import { sanityWriteClient } from '@/lib/sanity.server';
import { editorDataQuery } from '@/lib/sanity.queries'; 
import { EditorClient } from "./EditorClient";
import { portableTextToTiptap } from '../../utils/portableTextToTiptap';
import { notFound } from 'next/navigation';

// FORCE DYNAMIC: Ensure this page never statically generates
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditorPage({ params: paramsPromise }: { params: Promise<{ contentType: string; id: string }> }) {
    const params = await paramsPromise;
    
    if (!params || !params.id) {
        notFound();
    }
    
    // We strip 'drafts.' to ensure we have the base ID, but the query handles looking up the draft.
    const publicId = params.id.replace('drafts.', '');
    
    try {
        // CRITICAL FIX: Added 'perspective' and 'cache: no-store'
        const { document, dictionary, metadata } = await sanityWriteClient.fetch(
            editorDataQuery, 
            { id: publicId },
            { 
                cache: 'no-store',
                perspective: 'previewDrafts', // Explicitly request drafts
                next: { revalidate: 0 } 
            }
        );
        
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
                colorDictionary={dictionary?.autoColors || []}
                studioMetadata={metadata} 
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