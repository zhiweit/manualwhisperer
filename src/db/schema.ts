import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createThreadId, createUserId } from "./utils";

export const machineTable = sqliteTable("machine", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  machineType: text("machine_type").notNull(),
  name: text("name").notNull(),
});
export type Machine = typeof machineTable.$inferSelect;
export type InsertMachine = typeof machineTable.$inferInsert;

export const alarmTable = sqliteTable("alarm", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  message: text("message").notNull(),
  desc: text("desc").notNull(),
  solution: text("solution"),
  machineType: text("machine_type").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
export type Alarm = typeof alarmTable.$inferSelect;
export type InsertAlarm = typeof alarmTable.$inferInsert;

export const machineAlarmTable = sqliteTable("machine_alarm", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  machineId: integer("machine_id").references(() => machineTable.id),
  alarmId: integer("alarm_id").references(() => alarmTable.id),
  axis: integer("axis"),
  startTime: integer("start_time", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  endTime: integer("end_time", { mode: "timestamp" }),
});
export type MachineAlarm = typeof machineAlarmTable.$inferSelect;
export type InsertMachineAlarm = typeof machineAlarmTable.$inferInsert;

export const userTable = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createUserId()),
  username: text("username").notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["user", "admin"] })
    .notNull()
    .default("user"),
});
export type User = typeof userTable.$inferSelect;
export type InsertUser = typeof userTable.$inferInsert;

export const threadTable = sqliteTable("thread", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createThreadId()),
  userId: text("user_id").references(() => userTable.id),
  name: text("name").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});
export type Thread = typeof threadTable.$inferSelect;
export type InsertThread = typeof threadTable.$inferInsert;

export const keyValueTable = sqliteTable("key_value", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  key: text("key").notNull(),
  value: text("value").notNull(),
});
export type KeyValue = typeof keyValueTable.$inferSelect;
export type InsertKeyValue = typeof keyValueTable.$inferInsert;
