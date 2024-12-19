"use server";

import { eq, inArray } from "drizzle-orm";
import { db, sqlite } from "~/db/drizzle";
import { Alarm, alarmTable, InsertAlarm, machineAlarmTable } from "~/db/schema";
import { embedQuery } from "~/rag/index/embed";
import { keyValueTable } from "~/db/schema";

const PINNED_ALARMS_KEY = "pinnedAlarms";

export async function getAlarmList(
  params: {
    search?: string;
    filterType?: string;
  },
  limit: number = -1
) {
  const query = `
    SELECT
      rowid as id,
      code,
      message,
      desc,
      solution,
      updated_at as updatedAt,
      machine_type as machineType
    FROM alarm_fts
    WHERE ${params.search ? `alarm_fts MATCH @query` : `1`}
      ${params.filterType ? "AND machine_type = @filterType" : ""}
    ORDER BY ${params.search ? "rank" : "rowid"}
    LIMIT @limit
  `;

  const res = sqlite
    .prepare<
      { query: string; filterType: string | undefined; limit: number },
      Alarm
    >(query)
    .all({
      query: params.search ? `"${params.search.trim()}"` : "",
      filterType: params.filterType,
      limit: limit,
    });

  return res;
}

export async function getAlarm(id: number) {
  const [row] = await db.select().from(alarmTable).where(eq(alarmTable.id, id));
  if (row === undefined) {
    return undefined;
  }
  return row;
}

export async function createAlarmEmbedding(alarmId: number, toEmbed: string) {
  const insertAlarmVecStmt = sqlite.prepare(
    "INSERT INTO vec_alarm(rowid, embedding) VALUES (?, ?)"
  );
  const vector = await embedQuery(toEmbed);

  insertAlarmVecStmt.run(BigInt(alarmId), new Float32Array(vector));
}

export async function updateAlarmEmbedding(alarmId: number, toEmbed: string) {
  const updateAlarmVecStmt = sqlite.prepare<{
    alarm_id: bigint;
    vector: Float32Array;
  }>("UPDATE vec_alarm SET embedding = @vector WHERE rowid = @alarm_id");

  const vector = await embedQuery(toEmbed);
  updateAlarmVecStmt.run({
    alarm_id: BigInt(alarmId),
    vector: new Float32Array(vector),
  });
}

export async function createAlarm(alarm: InsertAlarm) {
  const res = await db.insert(alarmTable).values(alarm).returning();

  // create embedding
  for (const alarm of res) {
    createAlarmEmbedding(
      alarm.id,
      `${alarm.code} ${alarm.message} ${alarm.desc}`
    );
  }

  return res;
}

export async function updateAlarm(id: number, fieldsToUpdate: InsertAlarm) {
  const res = await db
    .update(alarmTable)
    .set(fieldsToUpdate)
    .where(eq(alarmTable.id, id))
    .returning();

  await updateAlarmEmbedding(
    id,
    `${fieldsToUpdate.code} ${fieldsToUpdate.message} ${fieldsToUpdate.desc}`
  );
  return res;
}

export function deleteAlarm(id: number) {
  const res = db.transaction((tx) => {
    // async transaction does not rollback for sqlite https://github.com/drizzle-team/drizzle-orm/issues/1472
    try {
      // delete from machine alarm logs to avoid foreign key constraint error
      tx.delete(machineAlarmTable)
        .where(eq(machineAlarmTable.alarmId, id))
        .run();

      const deletedMachineAlarmIds = tx
        .delete(alarmTable)
        .where(eq(alarmTable.id, id))
        .run();

      // db trigger deletes embedding from alarm_vec table when alarm is deleted

      return deletedMachineAlarmIds;
    } catch (e) {
      console.error(`Error deleting alarm id ${id}:`, e);
      tx.rollback();
    }

    return { changedRows: 0, changes: 0, lastInsertRowid: 0 };
  });

  return res;
}

export async function searchAlarmVec(query: string, limit: number = 10) {
  const vector = await embedQuery(query);
  const rows = sqlite
    .prepare<{ vector: Float32Array; limit: number }, Alarm>(
      `
      SELECT id, code, message, desc, solution, machine_type as machineType, updated_at as updatedAt
      FROM alarm
      WHERE id IN (
        SELECT rowid
        FROM vec_alarm
        WHERE embedding MATCH @vector
        ORDER BY distance
        LIMIT @limit
      );
    `
    )
    .all({
      vector: new Float32Array(vector),
      limit: limit < 0 ? 10 : limit, // limit must be positive for the sql-vec search extension
    });
  return rows;
}

/**
 * Search for alarms using a hybrid search approach.
 * First search for alarms by `alarmCode` using the FTS index.
 * If there is an `alarmMessage`, search for alarms using the FTS index.
 * If there is an `alarmDescription`, search for alarms using the vector index.
 * Then, search for alarms using combination of `alarmCode`, `alarmMessage` and `alarmDescription`.
 * Finally, combine the results and deduplicate them, and slice the results to the limit if the limit is positive.
 * @param alarmCode Alarm code
 * @param alarmMessage Alarm message
 * @param alarmDescription Alarm description
 * @param limit Limit of the number of alarms to return
 * @returns List of alarms
 */
export async function hybridSearchAlarm(
  alarmCode: string,
  alarmMessage: string = "",
  alarmDescription: string = "",
  limit: number = -1
): Promise<Alarm[]> {
  const code = alarmCode.trim();
  const msg = alarmMessage.trim();
  const desc = alarmDescription.trim();

  // search alarm code on fts index
  const ftsRes: Alarm[] = [];
  if (code) {
    const alarmCodeFtsRes = await getAlarmList({ search: code }, 4);
    ftsRes.push(...alarmCodeFtsRes);
  }

  // search alarm message on fts index
  if (msg) {
    const alarmMessageFtsRes = await getAlarmList({ search: msg }, 8);
    ftsRes.push(...alarmMessageFtsRes);
  }
  // search alarm description on vector index
  if (desc) {
    const alarmDescriptionVectorRes = await searchAlarmVec(desc, 8);
    ftsRes.push(...alarmDescriptionVectorRes);
  }

  // get vector results
  const query = `${alarmCode} ${alarmMessage} ${alarmDescription}`.trim();
  if (!query) {
    return [];
  }
  const vectorRes = await searchAlarmVec(query, limit);

  // combine and deduplicate results
  const combinedResults = new Map<number, Alarm>();

  ftsRes.forEach((alarm) => {
    combinedResults.set(alarm.id, alarm);
  });

  vectorRes.forEach((alarm) => {
    if (!combinedResults.has(alarm.id)) {
      combinedResults.set(alarm.id, alarm);
    }
  });

  // slice results to limit if results length is greater than limit
  const res = Array.from(combinedResults.values());
  if (limit < 0) {
    return res;
  } else if (res.length > limit) {
    return res.slice(0, limit);
  }

  return res;
}

export async function togglePinnedAlarm(alarmId: number): Promise<boolean> {
  const pinnedAlarms = await getPinnedAlarms();
  const isPinned = pinnedAlarms.includes(alarmId);

  let updatedPinnedAlarms: number[];
  if (isPinned) {
    updatedPinnedAlarms = pinnedAlarms.filter((id) => id !== alarmId);
  } else {
    updatedPinnedAlarms = [...pinnedAlarms, alarmId];
  }

  const existingRow = await db
    .select()
    .from(keyValueTable)
    .where(eq(keyValueTable.key, PINNED_ALARMS_KEY))
    .get();

  if (existingRow) {
    // Update existing row
    await db
      .update(keyValueTable)
      .set({ value: JSON.stringify(updatedPinnedAlarms) })
      .where(eq(keyValueTable.key, PINNED_ALARMS_KEY));
  } else {
    // Insert new row
    await db.insert(keyValueTable).values({
      key: PINNED_ALARMS_KEY,
      value: JSON.stringify(updatedPinnedAlarms),
    });
  }

  return !isPinned;
}

export async function getPinnedAlarms(): Promise<number[]> {
  const row = await db
    .select()
    .from(keyValueTable)
    .where(eq(keyValueTable.key, PINNED_ALARMS_KEY))
    .get();

  if (row) {
    return JSON.parse(row.value);
  }
  return [];
}

export async function getPinnedAlarmDetails(): Promise<Alarm[]> {
  const pinnedAlarmIds = await getPinnedAlarms();

  if (pinnedAlarmIds.length === 0) {
    return [];
  }

  const pinnedAlarms = await db
    .select()
    .from(alarmTable)
    .where(inArray(alarmTable.id, pinnedAlarmIds));

  return pinnedAlarms;
}
