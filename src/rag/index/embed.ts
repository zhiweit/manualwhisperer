import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config();

const embeddingModel = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
  dimensions: 384,
});

export async function embedDocuments(docs: string[]) {
  const res = await embeddingModel.embedDocuments(docs);
  return res;
}

export async function embedQuery(query: string) {
  const res = await embeddingModel.embedQuery(query);
  return res;
}
