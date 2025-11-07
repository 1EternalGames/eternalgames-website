// next.config.ts

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    images: {
        remotePatterns: [
            // Sanity CMS
            {
                protocol: 'https',
                hostname: 'cdn.sanity.io',
            },
            // Vercel Blob Storage (for user avatars) - WILDCARD ADDED
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
};

export default nextConfig;


