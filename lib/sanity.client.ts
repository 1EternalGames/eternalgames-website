// lib/sanity.client.ts

import { createClient } from '@sanity/client'
import { sanityConfig } from './sanity.config'

export const client = createClient({
    ...sanityConfig,
    useCdn: false,
});
