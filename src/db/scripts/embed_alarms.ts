import fs from "fs";
import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config();

// read json file
const json = fs.readFileSync("./data/alarm_list_cnc.json", "utf8");

const alarms: { alarm_no: string; alarm_msg: string; alarm_desc: string }[] =
  JSON.parse(json);

const toEmbed = alarms
  // .slice(0, 1) // for testing
  .map((alarm) => `${alarm.alarm_no} ${alarm.alarm_msg} ${alarm.alarm_desc}`);

const embeddingModel = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
  dimensions: 384,
});

const vectors = await embeddingModel.embedDocuments(toEmbed);

const outputFile = "./data/alarm_embeddings.json";
fs.writeFileSync(outputFile, JSON.stringify(vectors));
console.log(
  `✔️ ${vectors.length} embeddings of dimensions ${vectors[0].length} saved to ${outputFile}`
);
