// scripts/fix-db.ts
import { PrismaClient } from '../lib/generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Starting Manual Database Patch...');

  try {
    // 1. Add Ban System columns to User table (Idempotent)
    console.log('--- Patching User Table (Ban System) ---');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN NOT NULL DEFAULT false;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "banReason" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannedAt" TIMESTAMP(3);
    `);

    // 2. Create NotificationType Enum safely
    console.log('--- Creating Enums ---');
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "NotificationType" AS ENUM ('REPLY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 3. Create Notification Table
    console.log('--- Creating Notification Table ---');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL,
        "senderId" TEXT NOT NULL,
        "type" "NotificationType" NOT NULL,
        "resourceId" TEXT NOT NULL,
        "resourceSlug" TEXT NOT NULL,
        "link" TEXT NOT NULL,
        "read" BOOLEAN NOT NULL DEFAULT false,

        CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
      );
    `);

    // 4. Add Indexes and Foreign Keys
    console.log('--- Linking Relations ---');
    
    // Index
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
    `);

    // Foreign Key: User (Receiver)
    // We check if constraint exists first to avoid errors
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Foreign Key: Sender
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✅ Database successfully patched without data loss.');

  } catch (error) {
    console.error('❌ Error during patching:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();