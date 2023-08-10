import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
 
const connection = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});
 
export const db = drizzle(connection);