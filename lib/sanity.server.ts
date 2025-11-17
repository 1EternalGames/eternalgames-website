// lib/sanity.server.ts

import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/lib/sanity.env'

export const sanityWriteClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_WRITE_TOKEN!,
    // THE DEFINITIVE FIX: Explicitly tell this client to fetch drafts.
    perspective: 'previewDrafts',
});