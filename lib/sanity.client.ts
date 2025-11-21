// lib/sanity.client.ts

import { createClient, type SanityClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/lib/sanity.env'

export const client = createClient({
    projectId,
    dataset,
    apiVersion,
    // THE FIX: Set useCdn to true. 
    // This allows Vercel to fetch data from Sanity's Edge CDN (fast) 
    // instead of the source database (slow).
    useCdn: true, 
    perspective: 'published',
});