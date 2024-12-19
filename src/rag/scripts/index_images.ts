import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import fs from "fs";
import { CustomMetadata, MediaType } from "~/api/types";
import { imageToBase64, resizeImageToOpenAiRequirements } from "../index/utils";
import { Document, VectorStoreIndex } from "llamaindex";
import dotenv from "dotenv";
import { storageContext } from "../base";

dotenv.config();

const vlm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0,
});

const summariseImageMessage = ChatPromptTemplate.fromMessages([
  {
    role: "human",
    content: [
      {
        type: "text",
        text: "Generate a summary of the image as alt text. Extract keywords from the image if there are keywords. The keywords should be from the image, not from the summary generated. Keep the summary concise. Return the answer in plain text. Do not return markdown.",
      },
      {
        type: "image_url",
        image_url: { url: "data:image/jpeg;base64,{base64}" },
      },
    ],
  },
]);

const chain = summariseImageMessage.pipe(vlm).pipe(new StringOutputParser());

async function getImageSummaries(base64Images: string[]) {
  const summaries = await chain.batch(
    base64Images.map((base64) => ({ base64: base64 }))
  );
  return summaries;
}

async function getImageTextDocs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  imageDicts: Record<string, any>[],
  fileName: string
): Promise<Document[]> {
  const imageDocs = [];
  const imageSummaries = [];
  const resizedBase64: string[] = [];
  for (const imageDict of imageDicts) {
    try {
      const base64 = await imageToBase64(imageDict.path);
      const resized = await resizeImageToOpenAiRequirements(base64);
      resizedBase64.push(resized);
    } catch (error) {
      console.warn(`Error processing image ${imageDict.path}: ${error}`);
      continue;
    }
  }

  const batchSize = 5;
  for (let i = 0; i < resizedBase64.length; i += batchSize) {
    console.log(
      `batch ${i / batchSize + 1} of ${Math.ceil(
        resizedBase64.length / batchSize
      )}`
    );
    const batch = resizedBase64.slice(i, i + batchSize);
    const summaries = await getImageSummaries(batch);
    imageSummaries.push(...summaries);
  }

  for (let i = 0; i < imageSummaries.length; i++) {
    const doc = new Document<CustomMetadata>({
      text: imageSummaries[i],
      metadata: {
        path: imageDicts[i].path,
        mediaType: MediaType.image,
        fileName,
      },
    });
    imageDocs.push(doc);
  }

  return imageDocs;
}

async function main() {
  // change this accordingly to the file name to parse
  const fileName = "63944ENV2-images";

  const inputPath = `./data/parsed`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imageDicts: Record<string, any>[] = JSON.parse(
    fs.readFileSync(`${inputPath}/${fileName}.json`, "utf8")
  );
  const filteredImageDicts = imageDicts.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (imageDict: Record<string, any>) => !imageDict.deleted
  );

  const imageTextDocs = await getImageTextDocs(filteredImageDicts, fileName);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const vectorIndex = await VectorStoreIndex.fromDocuments(imageTextDocs, {
    storageContext,
  });

  console.log(`Done indexing images for ${fileName}!`);
}

main().catch(console.error);
