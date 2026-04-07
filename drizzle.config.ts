import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: ['./src/schema/production-batch.ts', './src/schema/supply-movement.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  verbose: true,
  strict: true,
});
