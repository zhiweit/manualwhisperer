import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";

export const sqlite = new Database("./data/sqlite.db");
export const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "./src/db/migrations" });
await sqlite.backup("./data/sqlite.db.bak");
sqlite.close();
