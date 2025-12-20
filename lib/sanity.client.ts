// lib/sanity.client.ts

import { createClient, type SanityClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/lib/sanity.env'

// FIX: Removed 'token'.
// Even with useCdn: true, providing a token forces the client to skip the CDN.
// We remove it to allow public, anonymous, cached access (Instant Speed).
export const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true, 
    perspective: 'published',
})


