// prisma/seed.ts
import { PrismaClient } from '../lib/generated/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ROLES_TO_CREATE = [
  'DIRECTOR',
  'ADMIN',
  'REVIEWER',
  'AUTHOR',
  'REPORTER',
  'DESIGNER',
  'USER'
];

async function main() {
  console.log('Start seeding roles...');
  for (const roleName of ROLES_TO_CREATE) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
    console.log(`Created or found role: ${role.name}`);
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });


