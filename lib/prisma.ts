// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
    // --- THE FIX ---
    // Modify the DATABASE_URL in development to be more resilient.
    let databaseUrl = process.env.DATABASE_URL;

    if (process.env.NODE_ENV === 'development') {
        // 1. Remove the pgbouncer parameter to connect directly. This helps avoid
        //    connection pooler instability during hot-reloading.
        // 2. Add a longer connection timeout. Serverless databases (like Neon's free tier)
        //    "sleep" after inactivity and can take a few seconds to wake up. This
        //    prevents Prisma from timing out before the database is ready.
        databaseUrl = process.env.DATABASE_URL?.replace('&pgbouncer=true', '') + '&connect_timeout=30';
    }

    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set in your environment variables');
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


