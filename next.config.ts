// next.config.ts
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'cdn.sanity.io' },
            { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
        ],
    },

    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },

    // REQUIRED for @xenova/transformers to work in the browser
    webpack: (config: any) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            "sharp$": false,
            "onnxruntime-node$": false,
        }
        return config;
    },
};

export default nextConfig;