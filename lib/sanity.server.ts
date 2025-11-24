// lib/sanity.server.ts

import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/lib/sanity.env'

// This client is for server-side write operations and draft previews.
// It requires a token and bypasses the CDN.
export const sanityWriteClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_WRITE_TOKEN!,
})