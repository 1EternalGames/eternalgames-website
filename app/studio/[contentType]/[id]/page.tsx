// app/studio/[contentType]/[id]/page.tsx
import { sanityWriteClient } from '@/lib/sanity.server';
import { editorDocumentQuery } from '@/lib/sanity.queries'; // Removed other queries
import { EditorClient } from "./EditorClient";
import { portableTextToTiptap } from '../../utils/portableTextToTiptap';
import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { groq } from 'next-sanity';

export const runtime = 'nodejs';

const colorDictionaryQuery = groq`*[_type == "colorDictionary" && _id == "colorDictionary"][0]{ autoColors }`;

export default async function EditorPage({ params: paramsPromise }: { params: Promise<{ contentType: string; id: string }> }) {
    noStore();
    const params = await paramsPromise;
    
    if (!params || !params.id) {
        notFound();
    }
    
    const publicId = params.id.replace('drafts.', '');
    
    try {
        // OPTIMIZATION: Only fetch the document and color dictionary.
        // Lists are now fetched on demand via async search actions.
        const [document, colorDictionary] = await Promise.all([
            sanityWriteClient.fetch(editorDocumentQuery, { id: publicId }),
            sanityWriteClient.fetch(colorDictionaryQuery),
        ]);
        
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
                colorDictionary={colorDictionary?.autoColors || []} 
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