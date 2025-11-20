import json
import os

# 1. Update package.json to ensure pg dependencies are present
package_json_path = "package.json"
try:
    with open(package_json_path, "r", encoding="utf-8") as f:
        pkg = json.load(f)
    
    # Add required dependencies for Prisma 7 Adapters
    dependencies = pkg.get("dependencies", {})
    dependencies["pg"] = "^8.11.3"
    dependencies["@prisma/adapter-pg"] = "latest" # Ensure latest version compatible with Prisma 7
    pkg["dependencies"] = dependencies

    devDependencies = pkg.get("devDependencies", {})
    devDependencies["@types/pg"] = "^8.10.9"
    pkg["devDependencies"] = devDependencies
    
    with open(package_json_path, "w", encoding="utf-8") as f:
        json.dump(pkg, f, indent=2)
    print(f"Updated {package_json_path} with PostgreSQL dependencies.")
except Exception as e:
    print(f"Error updating package.json: {e}")

# 2. Fix lib/prisma.ts
# Ensure correct imports and adapter usage
prisma_lib_path = "lib/prisma.ts"
prisma_lib_content = """// lib/prisma.ts
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
"""
with open(prisma_lib_path, "w", encoding="utf-8") as f:
    f.write(prisma_lib_content)
print(f"Updated {prisma_lib_path}")

# 3. Fix prisma/seed.ts
# Ensure relative imports for standalone execution and correct adapter usage
seed_path = "prisma/seed.ts"
seed_content = """// prisma/seed.ts
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
"""
with open(seed_path, "w", encoding="utf-8") as f:
    f.write(seed_content)
print(f"Updated {seed_path}")