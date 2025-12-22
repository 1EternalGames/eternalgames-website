// lib/prisma.ts
import { PrismaClient } from './generated/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
    // Determine if we are using the pooled connection string
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        throw new Error('DATABASE_URL is not set in your environment variables')
    }

    const pool = new Pool({ 
        connectionString,
        max: 5, // REDUCE max connections to prevent exhaustion during dev
        idleTimeoutMillis: 10000, // Close idle clients faster
        connectionTimeoutMillis: 10000, // Fail fast if DB is sleeping
    })
    
    const adapter = new PrismaPg(pool)
    
    return new PrismaClient({ adapter })
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma