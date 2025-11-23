// lib/sanity.client.ts

import { createClient, type SanityClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/lib/sanity.env'

// This client is for PUBLIC, read-only access.
// It uses the CDN and no token to ensure aggressive caching and static generation.
export const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true, // Enable CDN caching (Vital for speed)
    // token: undefined, // Explicitly NO token for public fetch
    perspective: 'published',
});