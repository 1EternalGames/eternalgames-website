// lib/prisma.ts
import { PrismaClient } from './generated/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
        throw new Error('DATABASE_URL is not set in your environment variables')
    }

    // Configure the connection pool
    const pool = new Pool({ connectionString })
    // Create the adapter
    const adapter = new PrismaPg(pool)
    
    // Pass the adapter to the client
    return new PrismaClient({ adapter })
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma


