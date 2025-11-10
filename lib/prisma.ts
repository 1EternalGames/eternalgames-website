// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    // THE DEFINITIVE FIX:
    // This logic is simplified to ALWAYS use the pooled DATABASE_URL.
    // The BUILD_DATABASE_URL is prone to timeouts on Vercel builds due to
    // Neon's auto-sleep feature on the direct connection endpoint. The pooled URL is always-on.
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set in your environment variables');
    }

    // This log remains helpful for debugging which URL is being used.
    console.log("... [Prisma] Using database connection URL.");

    return new PrismaClient({
        datasources: {
            db: {
                url: databaseUrl,
            },
        },
    });
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma