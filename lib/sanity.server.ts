import { createClient } from '@sanity/client'

const projectId = '0zany1dm'
const dataset = 'production'
const apiVersion = '2025-09-30'

export const sanityWriteClient = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_WRITE_TOKEN,
});