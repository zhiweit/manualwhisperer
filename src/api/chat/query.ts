import { SolidQueryOptions } from "@tanstack/solid-query";
import { getThreadMessages, getUserThreads } from "./rpc";

export const userThreadsQueryOpts = () =>
  ({
    queryKey: ["thread", "list"],
    queryFn: () => {
      console.log("fetching threads");
      return getUserThreads();
    },
  }) satisfies SolidQueryOptions;

export const threadMessagesQueryOpts = (props: { id?: string }) =>
  ({
    queryKey: ["thread", "messages", props.id],
    queryFn: () => getThreadMessages(props.id!),
    enabled: Boolean(props.id),
  }) satisfies SolidQueryOptions;
