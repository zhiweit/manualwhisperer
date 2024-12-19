import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { MODEL_RETRIEVERS_CACHE, reranker } from "~/rag/base";
import { MetadataMode } from "llamaindex";
import { model } from "../base";

// tool to get info from manuals
const findInfoFromManualSchema = z.object({
  question: z
    .string()
    .describe("User's question to be searched for answers in the manual."),
});

/**
 * Retrieve information from manuals for a specific machine model.
 * @param machineModel - Machine model (to search from the relevant manuals for the machine model)
 * @param question - The question to be answered.
 */
export async function retrieveInfoFromManuals(
  machineModel: string,
  question: string
) {
  const retrievers = MODEL_RETRIEVERS_CACHE[machineModel];
  const retrievedNodes = (
    await Promise.all(
      retrievers.map((retriever) => retriever.retrieve(question))
    )
  ).flat(1);

  const rerankedNodes = await reranker.postprocessNodes(
    retrievedNodes,
    question
  );

  // Get the context from the text fields of the retrieved nodes
  const context = rerankedNodes
    .map((node) => node.node.getContent(MetadataMode.NONE))
    .join("\n\n");

  // const retrievedImages: Set<string> = new Set();
  const imageUrls: string[] = [];

  // for (const node of rerankedNodes) {
  //   if (
  //     ["mediaType", "page", "fileName"].every(
  //       (key) => key in node.node.metadata
  //     )
  //   ) {
  //     const metadata = node.node.metadata as CustomMetadata;
  //     // get the base64 images from the retrieved nodes (if there are images or tables retrieved in the retrieved nodes)
  //     if (
  //       metadata.mediaType === MediaType.image ||
  //       metadata.mediaType === MediaType.table
  //     ) {
  //       const page = metadata.page;
  //       let fileName = metadata.fileName.replace(".json", "");
  //       // if no file extension, use .pdf
  //       if (!fileName.endsWith(".pdf")) {
  //         fileName = `${fileName}.pdf`;
  //       }
  //       const base64 = await pdfToBase64(`${manualPath}/${fileName}`, [page]);
  //       const resizedBase64 = await resizeImageToOpenAiRequirements(base64[0]);
  //       const isImageAlreadyRetrieved = retrievedImages.has(
  //         `${fileName}-${page}`
  //       );
  //       if (!isImageAlreadyRetrieved) {
  //         retrievedImages.add(`${fileName}-${page}`);
  //         imageUrls.push(resizedBase64);
  //       }
  //     }
  //   }
  // }
  return { context, imageUrls };
}

export const findInfoFromManual = tool(
  async (
    input,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: { configurable?: Record<string, any> } = {}
  ): Promise<[string]> => {
    const { context, imageUrls } = await retrieveInfoFromManuals(
      config.configurable?.model || "Model A",
      input.question
    );

    const prompt = new HumanMessage({
      content: [
        {
          type: "text",
          text: `You are a helpful assistant that can answer questions from the manuals. Answer the question based on the context and images provided (if any). If there are no images, just answer the question based on the context. If you are unable to answer the question based on the context, say so. 
          \n\n
          Here is the question: \n
          \`\`\`
          ${input.question}
          \`\`\`
          \n\n
          Here is the context: \n
          \`\`\`
          ${context}
          \`\`\`
          `,
        },
        // if there is an image/table, send the question with the page image to vision language model to generate answer
        ...imageUrls.map((imageUrl) => ({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageUrl}`,
          },
        })),
      ],
    });

    const answer = await model.invoke([prompt]);
    return [answer.content as string]; // first item (content string) is passed to the LLM to answer the question, second item is not passed to the LLM and can be usedfor internal downstream tasks
  },
  {
    name: "find_info_from_manual",
    description: "Call to get information from the manual.",
    schema: findInfoFromManualSchema,
    responseFormat: "content",
  }
);
