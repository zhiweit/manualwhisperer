import { SolidQueryOptions } from "@tanstack/solid-query";
import { getAlarmList, getAlarm } from "./rpc";

export const alarmQueryOpts = (props: { id?: number }) =>
  ({
    queryKey: ["alarm", props.id],
    queryFn: () => getAlarm(props.id!),
    enabled: Boolean(props.id),
  }) satisfies SolidQueryOptions;

export const alarmListQueryOpts = (props: {
  search?: string;
  filterType?: string;
}) =>
  ({
    queryKey: ["alarm", "list", props],
    queryFn: () => getAlarmList(props),
  }) satisfies SolidQueryOptions;
