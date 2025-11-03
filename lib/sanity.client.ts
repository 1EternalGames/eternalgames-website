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
    token: process.env.SANITY_API_READ_TOKEN,
})

export const clientAssetUploader = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    // THE FIX: Use the NEXT_PUBLIC_ prefixed variable
    token: process.env.NEXT_PUBLIC_SANITY_API_WRITE_TOKEN,
})





