"use server";

import { and, eq, like, desc } from "drizzle-orm";
import { db } from "~/db/drizzle";
import { alarmTable, machineAlarmTable, machineTable } from "~/db/schema";

export async function getMachineList(params: {
  search?: string;
  filterType?: string;
}) {
  if (params.search || params.filterType) {
    const sql = db
      .select()
      .from(machineTable)
      .where(
        and(
          params.search ? like(machineTable.name, params.search) : undefined,
          params.filterType
            ? eq(machineTable.machineType, params.filterType)
            : undefined
        )
      )
      .getSQL();

    console.log(sql);
    return db
      .select()
      .from(machineTable)
      .where(
        and(
          params.search ? like(machineTable.name, params.search) : undefined,
          params.filterType
            ? eq(machineTable.machineType, params.filterType)
            : undefined
        )
      )
      .all();
  }
  return db.select().from(machineTable).all();
}

export async function getMachine(id: string) {
  const [row] = await db
    .select()
    .from(machineTable)
    .where(eq(machineTable.id, id));
  if (row === undefined) {
    return undefined;
  }
  return row;
}

export async function getMachineAlarms(id: string) {
  const [row] = await db
    .select()
    .from(machineAlarmTable)
    .where(eq(machineAlarmTable.machineId, id))
    .innerJoin(alarmTable, eq(machineAlarmTable.alarmId, alarmTable.id));
  if (row === undefined) {
    return undefined;
  }
  return row;
}

export async function getLatestMachineAlarm(id: string) {
  // TODO: We need to filter for unresolved? endTime

  const rows = await db
    .select()
    .from(machineAlarmTable)
    .where(eq(machineAlarmTable.machineId, id))
    .innerJoin(alarmTable, eq(machineAlarmTable.alarmId, alarmTable.id))
    .orderBy(desc(machineAlarmTable.startTime));
  return rows;
}
