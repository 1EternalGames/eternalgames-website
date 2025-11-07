// lib/sanity.server.ts

import { createClient } from '@sanity/client'
import { sanityConfig } from './sanity.config'

export const sanityWriteClient = createClient({
    ...sanityConfig,
    useCdn: false,
    token: process.env.SANITY_API_WRITE_TOKEN!,
});
