// lib/sanity.client.ts

import { createClient, type SanityClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/lib/sanity.env'

// Helper function to determine if we are on the server
const isServer = typeof window === 'undefined';

export const client = createClient({
    projectId,
    dataset,
    apiVersion,
    // THE DEFINITIVE FIX: Use CDN only on the client-side.
    // On the server (during builds, revalidation, RSC), always fetch fresh data from the API.
    // This eliminates the race condition between Vercel's build and Sanity's CDN propagation.
    useCdn: !isServer, 
    // Perspective should be 'published' for the main client.
    // Preview client will handle 'previewDrafts'.
    perspective: 'published',
});