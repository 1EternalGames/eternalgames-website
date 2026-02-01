// lib/sanity.server.ts

import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/lib/sanity.env'

// This client is for server-side write operations and draft previews.
// It requires a token and bypasses the CDN.
export const sanityWriteClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false, // Ensure CDN is off
    // FIX: Correctly check both token names to support local vs prod envs
    token: process.env.SANITY_STUDIO_API_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN,
    // FIX: Explicitly disable stega to prevent encoding issues during writes
    stega: {
        enabled: false,
        studioUrl: '/studio',
    },
    // CRITICAL FIX: Ensure we can see drafts. 
    // Without this, the API defaults to 'published' and hides 'drafts.*' documents even with a token.
    perspective: 'previewDrafts', 
    ignoreBrowserTokenWarning: true
})