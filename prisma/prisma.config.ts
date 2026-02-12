import { defineConfig } from '@prisma/client';

export default defineConfig({
  adapter: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL!,
  },
});