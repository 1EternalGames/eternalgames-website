import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // @ts-expect-error - This property exists in Prisma 7 but types might lag
  db: {
    url: process.env.DATABASE_URL,
  },
});
