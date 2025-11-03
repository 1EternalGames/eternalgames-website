// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  });


















