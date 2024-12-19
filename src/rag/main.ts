import {
  Annotation,
  END,
  messagesStateReducer,
  START,
  StateGraph,
} from "@langchain/langgraph";
import dotenv from "dotenv";
import { BaseMessage, ToolMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { findSolutionForMachineAlarm } from "./tools/alarm";
import { findInfoFromManual } from "./tools/manual";
import { model } from "./base";

dotenv.config();
// define state
const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  // question: Annotation<string>({
  //   reducer: (x, y) => y ?? x ?? "",
  //   default: () => "",
  // }),
  // documents: Annotation<DocumentInterface[]>({
  //   reducer: (x, y) => y ?? x ?? [],
  //   default: () => [],
  // }),
  // generatedAnswer: Annotation<string>({
  //   reducer: (x, y) => y ?? x ?? "",
  //   default: () => "",
  // }),
});

const tools = [findSolutionForMachineAlarm, findInfoFromManual];
const toolNode = new ToolNode(tools);
const modelWithTools = model.bindTools(tools);

const shouldInvokeTools = (state: typeof GraphState.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];

  // if the last message contains tool call (model thinks it needs to invoke tool to answer the question) e.g. to find alarm info from db => call the tool with the generated arguments
  if (
    "tool_calls" in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls?.length
  ) {
    return "tools";
  }
  return END;
};

const callModel = async (
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> => {
  const { messages } = state;
  const response = await modelWithTools.invoke(messages);
  return { messages: [response] };
};

/**
 * Call tools node. Expects the last message in the state to be `AIMessage` with tool calls.
 * @param state State of the graph
 * @returns State of the graph with messages including the tool message after the tool call(s)
 */
const callTools = async (
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> => {
  const { messages } = state;
  const toolMessages: ToolMessage[] = await toolNode.invoke(messages); // returns ToolMessage[] with the result of the tool call(s)

  return { messages: toolMessages };
};

const checkpointer = SqliteSaver.fromConnString("./data/sqlite.db");

const workflow = new StateGraph(GraphState)
  .addNode("agent", callModel)
  .addNode("tools", callTools)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldInvokeTools, {
    tools: "tools",
    __end__: END,
  })
  .addEdge("tools", "agent");

export const app = workflow.compile({ checkpointer: checkpointer });
