import { Settings, VectorStoreIndex } from "llamaindex";
import dotenv from "dotenv";
import readline from "readline";
import { vectorStore, settings } from "~/rag/base";

dotenv.config();
Settings.embedModel = settings.embedModel;
Settings.llm = settings.llm;

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Optional - set your collection name, empty string "" is no filter on this field.
    const collectionName = "11.2"; // "B-63945EN_02_V2004-07-26";
    vectorStore.setCollection(collectionName); // query this collection

    const index = await VectorStoreIndex.fromVectorStore(vectorStore);
    // Query the index
    const retriever = index.asRetriever({ similarityTopK: 5 });

    let question = "";
    while (!isQuit(question)) {
      question = await getUserInput(rl);

      if (isQuit(question)) {
        rl.close();
        process.exit(0);
      }

      try {
        // test out the retrieved results
        const results = await retriever.retrieve(question);
        console.log("Retrieved results:");
        console.log(results);

        // testing out the query engine
        const queryEngine = index.asQueryEngine();
        const answer = await queryEngine.query({ query: question });
        console.log(answer.message);
      } catch (error) {
        console.error("Error:", error);
      }
    }
  } catch (err) {
    console.error(err);
    console.log(
      "If your PGVectorStore init failed, make sure to set env vars for PGUSER or USER, PGHOST, PGPORT and PGPASSWORD as needed."
    );
    process.exit(1);
  }
}

function isQuit(question: string) {
  return ["q", "quit", "exit"].includes(question.trim().toLowerCase());
}

// Function to get user input as a promise
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUserInput(rl: any): Promise<string> {
  return new Promise((resolve) => {
    rl.question("What would you like to know?\n>", (userInput: string) => {
      resolve(userInput);
    });
  });
}

main()
  .catch(console.error)
  .finally(() => {
    process.exit(1);
  });
