import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { load as loadVecExt } from "sqlite-vec";

export const sqlite = new Database("./data/sqlite.db");
loadVecExt(sqlite);

export const db = drizzle(sqlite);

sqlite.backup("./data/sqlite.db.bak");
