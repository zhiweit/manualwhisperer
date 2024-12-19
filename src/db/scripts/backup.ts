import { sqlite } from "~/db/drizzle";

console.log("Backing up database...");
const filepath = "./data/sqlite.db.bak";
sqlite.backup(filepath);
console.log(`✔️ Database backed up to ${filepath}`);
