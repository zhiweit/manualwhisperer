import { sql } from "drizzle-orm";
import { sqlite, db } from "~/db/drizzle";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const main = async () => {
  console.log("Setup starting...");

  // Get SQLite and vec versions
  const { sqlite_version, vec_version } = db.get<{
    sqlite_version: string;
    vec_version: string;
  }>(
    sql`SELECT sqlite_version() as sqlite_version, vec_version() as vec_version`
  );

  console.log(`sqlite_version=${sqlite_version}, vec_version=${vec_version}`);

  // Create virtual tables
  console.log("Creating vec tables...");
  db.run(
    sql`
    CREATE VIRTUAL TABLE IF NOT EXISTS vec_alarm USING vec0(
      embedding FLOAT[384]
    )
  `
  );

  // db.run(
  //   sql`
  //   CREATE VIRTUAL TABLE IF NOT EXISTS vec_manual USING vec0(
  //     embedding FLOAT[384]
  //   )
  // `
  // );

  console.log("✔️ Created vec tables");

  console.log("Creating alarm FTS table...");
  db.run(
    sql`
    CREATE VIRTUAL TABLE IF NOT EXISTS alarm_fts USING fts5(
      code,
      message,
      desc,
      solution UNINDEXED,
      machine_type UNINDEXED,
      updated_at UNINDEXED,
      content='alarm', -- to get data from alarm table
      content_rowid='id', -- require type to be integer
      tokenize='trigram' -- to support sub string search (requires at least 3 characters)
    )
  `
  );
  console.log("✔️ Created alarm FTS table");

  // Create triggers
  console.log("Creating triggers...");
  db.run(
    sql`
    CREATE TRIGGER IF NOT EXISTS alarm_ai AFTER INSERT ON alarm
    BEGIN
        INSERT INTO alarm_fts (rowid, code, message, desc, solution, updated_at, machine_type)
        VALUES (new.id, new.code, new.message, new.desc, new.solution, new.updated_at, new.machine_type);
    END;
  `
  );
  console.log(
    "✔️ Alarm insert trigger created to insert data into alarm FTS table"
  );

  db.run(
    sql`
    CREATE TRIGGER IF NOT EXISTS alarm_ad AFTER DELETE ON alarm
    BEGIN
        INSERT INTO alarm_fts (alarm_fts, rowid, code, message, desc, solution, updated_at, machine_type)
        VALUES ('delete', old.id, old.code, old.message, old.desc, old.solution, old.updated_at, old.machine_type);
    END;
  `
  );
  console.log(
    "✔️ Alarm delete trigger created to delete data from alarm FTS table"
  );

  db.run(
    sql`
    CREATE TRIGGER IF NOT EXISTS alarm_au AFTER UPDATE ON alarm
    BEGIN
        INSERT INTO alarm_fts (alarm_fts, rowid, code, message, desc, solution, updated_at, machine_type)
        VALUES ('delete', old.id, old.code, old.message, old.desc, old.solution, old.updated_at, old.machine_type);
        INSERT INTO alarm_fts (rowid, code, message, desc, solution, updated_at, machine_type)
        VALUES (new.id, new.code, new.message, new.desc, new.solution, new.updated_at, new.machine_type);
    END;
  `
  );
  console.log(
    "✔️ Alarm update trigger created to update data in alarm FTS table"
  );

  db.run(
    sql`
    CREATE TRIGGER IF NOT EXISTS vec_alarm_bd
    BEFORE DELETE ON alarm
    BEGIN
    DELETE FROM vec_alarm WHERE rowid = OLD.id;
    END;
    `
  );
  console.log(
    "✔️ Alarm delete trigger created to delete data from vec_alarm table before deleting from alarm table"
  );

  // db.run(
  //   sql`
  //   CREATE TRIGGER IF NOT EXISTS fk_vec_manual_docs_delete
  //   BEFORE DELETE ON manual_doc
  //   BEGIN
  //   DELETE FROM vec_manual_docs WHERE doc_id = OLD.id;
  //   END;
  //   `
  // );
  console.log("✔️ Triggers created");

  console.log("Backing up database...");
  await sqlite.backup("./data/sqlite.db.bak");
  console.log("✔️ Database backed up");

  sqlite.close();
  console.log("✔️ Setup done");
};

rl.question(
  "This script will create the triggers and virtual tables (FTS and vector) which rely on existing tables. Proceed (y) if the tables have been created.",
  async (answer) => {
    if (answer.toLowerCase() === "y") {
      await main();
    } else {
      console.log("Setup aborted.");
    }
    rl.close();
  }
);
