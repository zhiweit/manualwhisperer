import { MessageContent } from "@langchain/core/messages";
import { Metadata, NodeWithScore } from "llamaindex";

export const MachineType = {
  modelA: "Model A",
  modelB: "Model B",
} as const;
export type MachineType = (typeof MachineType)[keyof typeof MachineType];

export const MachineTypeName: Record<
  MachineType | ({} & string),
  string | undefined
> = {
  [MachineType.modelA]: "Model A",
  [MachineType.modelB]: "Model B",
};
export const MachineTypes = Object.values(MachineType) as MachineType[];

export const MessageType = {
  HumanMessage: "HumanMessage",
  AIMessageChunk: "AIMessageChunk",
  AIMessage: "AIMessage",
  ToolMessage: "ToolMessage",
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export type Message = {
  id: string;
  type: MessageType;
  content: MessageContent;
  // toolCalls?: ToolCall[];
};

export type CompletionEventData = {
  threadId: string;
  messageId: string;
  message: string;
};

export type ParsedJson = {
  page: number;
  text: string;
  md: string;
  images: {
    name: string;
    height: number;
    width: number;
    x: number;
    y: number;
    type: string;
  }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: Record<string, any>[];
};

export const MediaType = {
  text: "text",
  markdown: "markdown",
  table: "table",
  image: "image",
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export type CustomMetadata = {
  mediaType: MediaType;
  fileName: string;
} & Metadata;

export type RetrievedResult = {
  base64?: string;
} & NodeWithScore;
