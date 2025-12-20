// app/studio/[contentType]/[id]/page.tsx
import { sanityWriteClient } from '@/lib/sanity.server';
import { editorDataQuery } from '@/lib/sanity.queries'; 
import { EditorClient } from "./EditorClient";
import { portableTextToTiptap } from '../../utils/portableTextToTiptap';
import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { getStudioMetadataAction } from '../../actions'; // We'll use the action if needed, but the direct query is cleaner here

export const runtime = 'nodejs';

export default async function EditorPage({ params: paramsPromise }: { params: Promise<{ contentType: string; id: string }> }) {
    noStore();
    const params = await paramsPromise;
    
    if (!params || !params.id) {
        notFound();
    }
    
    const publicId = params.id.replace('drafts.', '');
    
    try {
        // OPTIMIZATION: Single batched request for document, dictionary AND studio metadata
        const { document, dictionary, metadata } = await sanityWriteClient.fetch(editorDataQuery, { id: publicId });
        
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
                studioMetadata={metadata} // Pass down the cached metadata
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


