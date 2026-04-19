import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrate: {
    // Uses the direct (non-pooled) connection for migrations as required by Prisma
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
});
