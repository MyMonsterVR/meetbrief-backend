import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema/schema.ts",
  out: "./drizzle",
  driver: "mysql2",
  dbCredentials: {
    host: "sql7.freemysqlhosting.net",
    user: "sql7638577",
    database: "sql7638577",
    password: "SFFt5IyF8E",
    port: 3306,
  },
} satisfies Config;
