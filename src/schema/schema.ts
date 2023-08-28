import { mysqlTable, mysqlSchema, AnyMySqlColumn, unique, int, varchar, timestamp } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"


export const users = mysqlTable("users", {
	id: int("id").autoincrement().primaryKey(),
	username: varchar("username", { length: 255 }),
	email: varchar("email", { length: 255 }),
	password: varchar("password", { length: 255 }),
	salt: varchar("salt", { length: 255 }),
	createdDate: timestamp("created_date", { mode: 'string' }).defaultNow().notNull(),
	updatedDate: timestamp("updated_date", { mode: 'string' }).default('0000-00-00 00:00:00').notNull(),
},
(table) => {
	return {
		usersUsernameUnique: unique("users_username_unique").on(table.username),
		usersEmailUnique: unique("users_email_unique").on(table.email),
	}
});

export const trancripts = mysqlTable("trancripts", {
	id: int("id").autoincrement().primaryKey(),
	name: varchar("name", { length: 255 }),
	content: varchar("content", { length: 255 }),
	createdDate: timestamp("created_date", { mode: 'string' }).defaultNow().notNull(),
	updatedDate: timestamp("updated_date", { mode: 'string' }).default('0000-00-00 00:00:00').notNull(),
});