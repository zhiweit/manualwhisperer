import { OutputData } from "@editorjs/editorjs";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { hybridSearchAlarm } from "~/api/knowledge/rpc";
import { Alarm } from "~/db/schema";
import { retrieveInfoFromManuals } from "./manual";
import { HumanMessage } from "@langchain/core/messages";
import { model } from "../base";

// tool to get info from knowledge base
const findSolutionForMachineAlarmSchema = z.object({
  alarmCode: z
    .string()
    .describe(
      "Alarm code. Format is <2 characters alarm type which may or may not be present><4 digit alarm number string>. Example: `SW0100`, `0002` are valid alarm codes."
    ),
  alarmMessage: z
    .string()
    .optional()
    .describe(
      "Alarm message. Example: `PARAMETER ENABLE SWITCH ON`, `ILLEGAL USE OF G41.2/G42.2/G41.5/G42.5`."
    ),
  alarmDescription: z
    .string()
    .optional()
    .describe(
      "Alarm description describing the alarm and a hint to resolve the alarm. Example: `The parameter setting is enabled (PWE, one bit of parameter No. 8000 is set to 1). To set the parameter, turn this parameter ON. Otherwise, set to OFF.`"
    ),
});

function extractTextFromEditorjsBlocks(solution: string): string {
  const solutionObj: OutputData = JSON.parse(solution);
  const textBlocks = solutionObj.blocks.filter(
    (block) => block.type === "paragraph"
  );
  return textBlocks.map((block) => block.data.text).join("\n\n");
}

/**
 * Tool to find solution for machine alarm.
 * (1) Retrieve alarms from the knowledge base.
 * (2) Retrieve alarm info from the manuals.
 * (3) Pass the retrieved alarms from knowledge base and alarm info from manuals to LLM as context to answer the question.
 * (4) Return the response from LLM to the agent.
 */
export const findSolutionForMachineAlarm = tool(
  async (
    input,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: { configurable?: Record<string, any> } = {}
  ): Promise<[string, Alarm[]]> => {
    // (1) Find alarm info from the knowledge base
    const alarms = await hybridSearchAlarm(
      input.alarmCode,
      input.alarmMessage,
      input.alarmDescription,
      10
    );
    const alarmInfoFromDb = alarms
      .map((alarm) => {
        if (alarm.solution !== null) {
          return `Alarm Code: ${alarm.code}\nAlarm Message: ${alarm.message}\nAlarm Description: ${alarm.desc}\nSolution: ${extractTextFromEditorjsBlocks(alarm.solution)}\n`;
        } else {
          return `Alarm Code: ${alarm.code}\nAlarm Message: ${alarm.message}\nAlarm Description: ${alarm.desc}\n`;
        }
      })
      .join("\n\n");

    // (2) Find alarm info from the manuals
    const { context: alarmInfoFromManuals, imageUrls } =
      await retrieveInfoFromManuals(
        config.configurable?.model || "Model A",
        `${input.alarmCode} ${input.alarmMessage} ${input.alarmDescription}`
      );

    // (3) Pass the retrieved alarms from knowledge base and alarm info from manuals to LLM as context to answer the question
    const question = `What is the solution for ${input.alarmCode} ${input.alarmMessage} ${input.alarmDescription}?`;
    const prompt = new HumanMessage({
      content: [
        {
          type: "text",
          text: `You are a helpful assistant that can answer questions from the manuals. You are given a context from an internal knoweldge base and a context from manuals. Answer the question referring to the context and images provided (if any).
          If the answer is found in the context, include the source where you got the information from (either from the internal knowledge base or from the manuals).
          Else if you are unable to answer the question based on the context, say so.
          \n\n
          Here is the question: \n
          \`\`\`
          ${question}
          \`\`\`
          \n\n
          Here is the context from internal knowledge base: \n
          \`\`\`
          ${alarmInfoFromDb}
          \`\`\`
          \n\n
          Here is the context from manuals: \n
          \`\`\`
          ${alarmInfoFromManuals}
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

    return [answer.content as string, alarms]; // first item (content string) is passed to the LLM to answer the question, second item (Alarm[]) is returned for internal downstream tasks
  },
  {
    name: "find_solution_for_machine_alarm",
    description:
      "Call to get solution for machine alarm codes from the internal knowledge base and manuals.",
    schema: findSolutionForMachineAlarmSchema,
    responseFormat: "content_and_artifact",
  }
);
