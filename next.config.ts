// next.config.ts

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Inject public Sanity environment variables here since .env.local is consolidated.
    env: {
        NEXT_PUBLIC_SANITY_PROJECT_ID: '0zany1dm',
        NEXT_PUBLIC_SANITY_DATASET: 'production',
        NEXT_PUBLIC_SANITY_API_VERSION: '2025-09-30',
    },
    images: {
        // --- THE DEFINITIVE FIX IS HERE ---
        // Replace the unreliable wildcard with an explicit list of all trusted image sources.
        remotePatterns: [
            // Sanity CMS
            {
                protocol: 'https',
                hostname: 'cdn.sanity.io',
            },
            // Vercel Blob Storage (for user avatars)
            {
                protocol: 'https',
                hostname: '*.public.blob.vercel-storage.com',
            },
            // Google OAuth Avatars
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            // GitHub OAuth Avatars
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    // --- ADDED FOR UNIFIED CONTENT ROUTE ---
    async redirects() {
        return [
          {
            source: '/reviews/:slug',
            destination: '/content/reviews/:slug',
            permanent: true,
          },
          {
            source: '/articles/:slug',
            destination: '/content/articles/:slug',
            permanent: true,
          },
          {
            source: '/news/:slug',
            destination: '/content/news/:slug',
            permanent: true,
          },
        ]
    },
};

export default nextConfig;