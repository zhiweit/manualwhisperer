import {
  VectorStoreIndex,
  Settings,
  MarkdownNodeParser,
  storageContextFromDefaults,
  TextNode,
} from "llamaindex";
import { ParsedJson, CustomMetadata, MediaType } from "~/api/types";
import fs from "fs";
import { removeFileExtension } from "~/rag/index/utils";
import dotenv from "dotenv";
import { settings, docStore, indexStore, vectorStore } from "~/rag/base";
dotenv.config();

Settings.embedModel = settings.embedModel;
Settings.llm = settings.llm;

const markdownParser = new MarkdownNodeParser();

// Extract and assign text and page number from jsonList, return an array of Document objects
function getTextDocs(jsonList: ParsedJson[], fileName: string): TextNode[] {
  const docs: TextNode[] = [];

  for (const obj of jsonList) {
    // console.log(`Getting nodes for ${fileName} page ${obj.page}...`);
    // text field
    const text = obj.text.replace(/\s{2,}/g, " "); // replace extra spaces with a single space
    docs.push(
      new TextNode<CustomMetadata>({
        text: text,
        metadata: { page: obj.page, mediaType: MediaType.text, fileName },
      })
    );

    // markdown field
    const doc = new TextNode<CustomMetadata>({
      text: obj.md,
      metadata: { page: obj.page, mediaType: MediaType.markdown, fileName },
    });
    const markdownNodes = markdownParser.getNodesFromDocuments([doc]);
    docs.push(...markdownNodes);

    // table field: embed each row as a text node
    const items = obj.items;
    for (const item of items) {
      if ("type" in item && item.type == "table" && "rows" in item) {
        const rows = item.rows;
        for (const row of rows) {
          const text = row.join(" ");
          docs.push(
            new TextNode<CustomMetadata>({
              text,
              metadata: {
                page: obj.page,
                mediaType: MediaType.table,
                fileName,
              },
            })
          );
        }
      }
    }
  }
  return docs;
}

async function main() {
  // change this accordingly to the file name to parse
  const fileName = "63944ENV1.json";
  const manualName = removeFileExtension(fileName);

  try {
    vectorStore.setCollection(manualName);
    await vectorStore.clearCollection(); // clear existing collection that was set

    const ctx = await storageContextFromDefaults({
      docStore,
      indexStore,
      vectorStore,
    });

    const inputPath = `./data/parsed`;

    console.log(`Indexing ${fileName}...`);
    const jsonList = JSON.parse(
      fs.readFileSync(
        `${inputPath}/${removeFileExtension(fileName)}.json`,
        "utf8"
      )
    )[0]["pages"] as ParsedJson[];

    const textDocs = getTextDocs(jsonList, `${manualName}.pdf`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const vectorIndex = await VectorStoreIndex.fromDocuments(textDocs, {
      storageContext: ctx,
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(`Done indexing text for ${fileName}!`);
  process.exit(0);
}

void main().catch(console.error);
