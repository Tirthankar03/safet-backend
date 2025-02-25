import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/db/migrations',
  schema: [
    './src/db/schemas/users.ts',
    './src/db/schemas/reports.ts',
    './src/db/schemas/reportImages.ts',
  ],
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
