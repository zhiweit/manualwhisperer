import {
  OpenAI,
  Settings,
  OpenAIEmbedding,
  CohereRerank,
  PostgresDocumentStore,
  PGVectorStore,
  PostgresIndexStore,
  VectorStoreIndex,
  VectorIndexRetriever,
} from "llamaindex";
import { removeFileExtension } from "./index/utils";
import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";

dotenv.config();
const envVars = [
  "COHERE_API_KEY",
  "PGHOST",
  "PGUSER",
  "PGPASSWORD",
  "PGDATABASE",
  "PGPORT",
];
for (const envVar of envVars) {
  if (!process.env[envVar]) {
    console.error(`${envVar} is not set`);
    process.exit(1);
  }
}

export const PG_CONNECTION_STRING = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

export const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
});

Settings.embedModel = new OpenAIEmbedding({
  model: "text-embedding-3-small",
});

Settings.llm = new OpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

export const settings = Settings;

export const reranker = new CohereRerank({
  apiKey: process.env.COHERE_API_KEY!,
  topN: 10,
});

export const docStore = new PostgresDocumentStore({
  clientConfig: {
    connectionString: PG_CONNECTION_STRING,
  },
});

export const indexStore = new PostgresIndexStore({
  clientConfig: {
    connectionString: PG_CONNECTION_STRING,
  },
});

export const vectorStore = new PGVectorStore({
  clientConfig: {
    connectionString: PG_CONNECTION_STRING,
  },
});

const MODEL_TO_MANUALS_MAP: Record<string, string[]> = {
  "Model A": [
    "63942EN.pdf",
    "63944ENV1.pdf",
    "63944ENV2.pdf",
    "64044EN.pdf",
    "64164EN.pdf",
    "B-63943EN-03-110525.pdf",
    "B-63945EN_02_V2004-07-26.pdf",
    "B-63950EN_02.pdf",
    // "FANUC31i-ProgManual.pdf",
  ],
  "Model B": ["FANUC31iB5-B64484EN203OperManual.pdf", "B-64483EN-2_01.pdf"],
} as const;

export const MODEL_RETRIEVERS_CACHE: Record<string, VectorIndexRetriever[]> =
  {};

async function populateModelRetrieversCache() {
  for (const model in MODEL_TO_MANUALS_MAP) {
    const manuals = MODEL_TO_MANUALS_MAP[model];
    const retrievers: VectorIndexRetriever[] = await Promise.all(
      manuals.map(async (manual) => {
        const vectorStore = new PGVectorStore({
          clientConfig: {
            connectionString: PG_CONNECTION_STRING,
          },
        });
        const collectionName = removeFileExtension(manual);

        vectorStore.setCollection(collectionName);

        const index = await VectorStoreIndex.fromVectorStore(vectorStore);
        const retriever = index.asRetriever({ similarityTopK: 10 });
        // console.log(`Retriever for ${manual} set up.`);
        return retriever;
      })
    );

    MODEL_RETRIEVERS_CACHE[model] = retrievers;
  }
}

// Call the function to populate the cache
populateModelRetrieversCache().catch(console.error);
