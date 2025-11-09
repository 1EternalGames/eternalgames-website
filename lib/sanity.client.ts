// lib/sanity.client.ts

import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/lib/sanity.env'

export const client = createClient({
    projectId,
    dataset,
    apiVersion,
    // THE FIX: useCdn must be false for server-to-server communication to ensure fresh data
    // and to use the provided token.
    useCdn: false, 
    // THE FIX: Provide the read token to authenticate requests from the server.
    token: process.env.SANITY_API_READ_TOKEN,
    // Best practice: specify that we want the published version of documents.
    perspective: 'published',
});