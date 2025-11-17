// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    // THE DEFINITIVE FIX:
    // We will now exclusively use the DATABASE_URL (the pooled connection string).
    // The pooler is always-on and manages waking up the serverless database,
    // which prevents timeout errors during Vercel's build process.
    // The distinction between build-time and run-time URLs is no longer necessary.
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set in your environment variables');
    }

    console.log("... [PRISMA] Using pooled database connection for all environments.");

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