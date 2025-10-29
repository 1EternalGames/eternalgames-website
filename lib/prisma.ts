// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {

    let databaseUrl = process.env.DATABASE_URL;

    if (process.env.NODE_ENV === 'development') {

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