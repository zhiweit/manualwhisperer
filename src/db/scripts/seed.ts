import { sqlite, db } from "../drizzle";
import {
  alarmTable,
  InsertAlarm,
  InsertMachine,
  InsertMachineAlarm,
  InsertUser,
  machineAlarmTable,
  machineTable,
  userTable,
} from "../schema";
import fs from "fs";

const main = async () => {
  console.log("Seed start");

  console.log("Inserting machines...");
  const machines: InsertMachine[] = [
    {
      machineType: "Model A",
      name: "FANUC Series 300s A",
    },
    {
      machineType: "Model A5",
      name: "FANUC Series 310s A5",
    },
    {
      machineType: "Model A",
      name: "FANUC Series 310s A",
    },
    {
      machineType: "Model A",
      name: "FANUC Series 320*s A",
    },
    {
      machineType: "Model A",
      name: "FANUC Series 301s A",
    },
    {
      machineType: "Model A5",
      name: "FANUC Series 311s A5",
    },
    {
      machineType: "Model A",
      name: "FANUC Series 310s A",
    },
    {
      machineType: "Model A",
      name: "FANUC Series 320s A",
    },
    {
      machineType: "Model A",
      name: "FANUC Series 302s A",
    },
    {
      machineType: "Model B",
      name: "FANUC Series 310 B",
    },
  ];

  await db.insert(machineTable).values(machines);
  console.log(`✔️ ${machines.length} machines inserted`);

  // create alarms
  const alarms = JSON.parse(
    fs.readFileSync("./data/alarm_list_cnc.json", "utf8")
  ) as { alarm_no: string; alarm_msg: string; alarm_desc: string }[];

  const toInsert: InsertAlarm[] = alarms.map((alarm) => ({
    code: alarm.alarm_no,
    message: alarm.alarm_msg,
    desc: alarm.alarm_desc,
    solution: null,
    machineType: "Model A",
  }));

  console.log("Inserting alarms...");
  const insertedAlarmsId = await db
    .insert(alarmTable)
    .values(toInsert)
    .returning({ id: alarmTable.id });
  console.log(`✔️ ${insertedAlarmsId.length} alarms inserted`);

  // store embeddings into db
  console.log("Storing embeddings into db...");
  const vectors = JSON.parse(
    fs.readFileSync("./data/alarm_embeddings.json", "utf8")
  ) as number[][];
  const insertAlarmVecStmt = sqlite.prepare(
    "INSERT INTO vec_alarm(rowid, embedding) VALUES (?, ?)"
  );

  if (vectors.length !== insertedAlarmsId.length) {
    throw new Error(
      "No. of alarm vector embeddings and no. of alarms inserted mismatch"
    );
  }

  const insertVec = sqlite.transaction(
    async (insertedAlarmsId: { id: number }[], vectors: number[][]) => {
      for (let i = 0; i < insertedAlarmsId.length; i++) {
        insertAlarmVecStmt.run(
          BigInt(insertedAlarmsId[i].id),
          new Float32Array(vectors[i])
        );
        if (i % 100 === 0) {
          console.log(`Inserted ${i} alarms`);
        }
      }
    }
  );
  insertVec(insertedAlarmsId, vectors);
  console.log(`✔️ ${insertedAlarmsId.length} alarm vector embeddings stored`);

  // Create machine-alarm logs
  // read json

  const logsDataFile = fs.readFileSync("./data/alarm_logs_data.json", "utf8");
  const logs = JSON.parse(logsDataFile) as {
    machine_id: number;
    alarm_id: number;
    start_time: string;
    end_time: string;
    axis: number;
  }[];

  const machineAlarmsToInsert: InsertMachineAlarm[] = [];
  for (const log of logs) {
    machineAlarmsToInsert.push({
      machineId: log.machine_id,
      alarmId: log.alarm_id,
      startTime: new Date(log.start_time),
      endTime: log.end_time ? new Date(log.end_time) : null,
      axis: log.axis,
    });
  }

  const machineAlarmsInserted = await db
    .insert(machineAlarmTable)
    .values(machineAlarmsToInsert)
    .returning();
  console.log(
    `✔️ ${machineAlarmsInserted.length} machine alarms logs inserted`
  );

  // create some dummy users
  const users: InsertUser[] = [
    {
      id: "999",
      username: "admin",
      password: "admin",
      role: "admin",
    },
    {
      id: "123",
      username: "user",
      password: "user",
      role: "user",
    },
  ];

  const insertedUsers = await db
    .insert(userTable)
    .values(users)
    .returning({ id: userTable.id });
  console.log(
    `✔️ ${insertedUsers.length} users inserted. IDs: ${insertedUsers.map(
      (user) => user.id
    )}`
  );

  console.log("✔️ Seed done");
};

main();
