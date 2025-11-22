// app/studio/[contentType]/[id]/page.tsx
import { sanityWriteClient } from '@/lib/sanity.server';
import { editorDataQuery } from '@/lib/sanity.queries'; // Updated to combined query
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
        // OPTIMIZATION: Single batched request for document and dictionary
        const { document, dictionary } = await sanityWriteClient.fetch(editorDataQuery, { id: publicId });
        
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