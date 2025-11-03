import { createClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '@/lib/sanity.client'

// This is a server-only client for performing mutations.
// It uses a write-enabled token and should never be exposed to the client.
export const sanityWriteClient = createClient({
projectId,
dataset,
apiVersion,
useCdn: false, // Writes should always go directly to the API
token: process.env.SANITY_API_WRITE_TOKEN, // Use a dedicated write token
});






























