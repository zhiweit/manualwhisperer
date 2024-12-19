import { redirect } from "@solidjs/router";
import { eq, sql } from "drizzle-orm";
import { db } from "~/db/drizzle";
import {
  alarmTable,
  machineAlarmTable,
  machineTable,
  threadTable,
  userTable,
} from "~/db/schema";
import { ROUTE_LOGIN } from "~/lib/route";
import { getSessionUserId } from "../user/auth";

export const getMostCommonErrors = async () => {
  "use server";
  const userId = await getSessionUserId();
  if (!userId) {
    throw redirect(ROUTE_LOGIN);
  }

  // Get top 10 most frequent alarms
  const commonErrors = await db
    .select({
      alarmId: machineAlarmTable.alarmId,
      code: alarmTable.code,
      message: alarmTable.message,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(machineAlarmTable)
    .innerJoin(alarmTable, eq(machineAlarmTable.alarmId, alarmTable.id))
    .groupBy(machineAlarmTable.alarmId)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  return commonErrors;
};

export const getMachinesWithMostErrors = async () => {
  "use server";
  const userId = await getSessionUserId();
  if (!userId) {
    throw redirect(ROUTE_LOGIN);
  }

  // Get top 10 machines with most alarms
  const machineErrors = await db
    .select({
      machineId: machineAlarmTable.machineId,
      machineName: machineTable.name,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(machineAlarmTable)
    .innerJoin(machineTable, eq(machineAlarmTable.machineId, machineTable.id))
    .groupBy(machineAlarmTable.machineId)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  return machineErrors;
};

export const getErrorCountOverTime = async (
  timeframe: "day" | "week" | "month" = "day"
) => {
  "use server";
  const userId = await getSessionUserId();
  if (!userId) {
    throw redirect(ROUTE_LOGIN);
  }

  const timeGrouping =
    timeframe === "day"
      ? sql<string>`date(datetime(start_time, 'unixepoch'))`
      : timeframe === "week"
        ? sql<string>`strftime('%Y-%W', datetime(start_time, 'unixepoch'))`
        : sql<string>`strftime('%Y-%m', datetime(start_time, 'unixepoch'))`;

  const errorTrends = await db
    .select({
      timePeriod: timeGrouping.as("time_period"),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(machineAlarmTable)
    .groupBy(timeGrouping)
    .orderBy(sql`time_period`);

  return errorTrends;
};

export const getUsersWithMostQuestions = async () => {
  "use server";
  const userId = await getSessionUserId();
  if (!userId) {
    throw redirect(ROUTE_LOGIN);
  }

  // Get top users by number of threads (questions)
  const userQuestions = await db
    .select({
      userId: threadTable.userId,
      username: userTable.username,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(threadTable)
    .innerJoin(userTable, eq(threadTable.userId, userTable.id))
    .groupBy(threadTable.userId)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  return userQuestions;
};

export const getMostCommonQuestions = async () => {
  "use server";
  const userId = await getSessionUserId();
  if (!userId) {
    throw redirect(ROUTE_LOGIN);
  }

  // Get most common thread names (questions)
  const commonQuestions = await db
    .select({
      name: threadTable.name,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(threadTable)
    .groupBy(threadTable.name)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  return commonQuestions;
};

export const getAverageResolutionTime = async () => {
  "use server";
  const userId = await getSessionUserId();
  if (!userId) {
    throw redirect(ROUTE_LOGIN);
  }

  const resolutionTimes = await db
    .select({
      resolutionTime:
        sql<number>`CAST((end_time - start_time) / (1000.0 * 60.0) AS INTEGER)`.as(
          "resolution_time"
        ),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(machineAlarmTable)
    .where(sql`end_time IS NOT NULL`)
    .groupBy(sql`resolution_time`)
    .orderBy(sql`resolution_time`);

  return resolutionTimes;
};
