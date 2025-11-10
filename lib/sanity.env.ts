// lib/sanity.env.ts

function assertValue<T>(v: T | undefined, errorMessage: string): T {
    if (v === undefined) {
        throw new Error(errorMessage)
    }
    return v
}

export const apiVersion = process.env.SANITY_API_VERSION || '2025-09-28'

// MODIFIED: Prioritize the NEXT_PUBLIC_ variable, falling back to the server-only one.
// This makes the file safe for both client and server environments.
export const dataset = assertValue(
    process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET,
    'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET or SANITY_DATASET'
)

// MODIFIED: Prioritize the NEXT_PUBLIC_ variable for the project ID as well.
export const projectId = assertValue(
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID,
    'Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_PROJECT_ID'
)