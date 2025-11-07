// lib/sanity.client.ts

import { createClient } from '@sanity/client'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION

export const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    // THE DEFINITIVE FIX: The public, client-side client should NOT use a secret token.
    // Server-side fetching will use the authenticated `sanityWriteClient`.
    // token: process.env.SANITY_API_READ_TOKEN, // <-- THIS LINE IS REMOVED
})