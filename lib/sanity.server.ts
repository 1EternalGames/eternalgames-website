// lib/sanity.server.ts

import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'

export const sanityWriteClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_WRITE_TOKEN!,
});