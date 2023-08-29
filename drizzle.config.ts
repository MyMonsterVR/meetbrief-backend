import type { Config } from "drizzle-kit";
import { cwd } from 'node:process';
import { loadEnvConfig } from '@next/env'

loadEnvConfig(cwd());

export default {
  schema: "./src/schema/schema.ts",
  out: "./drizzle",
  driver: "mysql2",
  dbCredentials: {
    host: process.env.DATABASE_HOST || "",
    user: process.env.DATABASE_USERNAME || "",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "",
    port: 3306,
  },
} satisfies Config;
