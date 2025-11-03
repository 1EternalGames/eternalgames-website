// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    let databaseUrl: string | undefined;

    // 1. Prioritize BUILD_DATABASE_URL if the IS_BUILDING flag is set.
    if (process.env.IS_BUILDING === 'true') {
        databaseUrl = process.env.BUILD_DATABASE_URL;
        console.log("... [BUILD] Using direct database connection.");
    } 
    // 2. For development, also use the direct connection URL (BUILD_DATABASE_URL).
    else if (process.env.NODE_ENV === 'development') {
        databaseUrl = process.env.BUILD_DATABASE_URL;
        console.log("... [DEV] Using direct database connection for development.");
    } 
    // 3. Fallback to the default pooled URL for production runtime.
    else {
        databaseUrl = process.env.DATABASE_URL;
        console.log("... [PROD RUNTIME] Using pooled database connection.");
    }

    if (!databaseUrl) {
        throw new Error('DATABASE_URL and/or BUILD_DATABASE_URL are not set correctly in your environment variables');
    }

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


