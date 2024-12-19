import { SolidQueryOptions } from "@tanstack/solid-query";
import {
  getLatestMachineAlarm,
  getMachine,
  getMachineAlarms,
  getMachineList,
} from "./rpc";

export const machineQueryOpts = (props: { id?: string }) =>
  ({
    queryKey: ["machine", props.id],
    queryFn: () => getMachine(props.id!),
    enabled: Boolean(props.id),
  }) satisfies SolidQueryOptions;

export const machineListQueryOpts = (props: {
  search?: string;
  filterType?: string;
}) =>
  ({
    queryKey: ["machine", "list", props],
    queryFn: () => getMachineList(props),
  }) satisfies SolidQueryOptions;

export const machineAlarmsQueryOpts = (props: { id?: string }) =>
  ({
    queryKey: ["machine", "alarm", "list", props.id],
    queryFn: () => getMachineAlarms(props.id!),
    enabled: Boolean(props.id),
  }) satisfies SolidQueryOptions;

export const machineLatestAlarmQueryOpts = (props: { id?: string }) =>
  ({
    queryKey: ["machine", "alarm", "latest", props.id],
    queryFn: () => getLatestMachineAlarm(props.id!),
    enabled: Boolean(props.id),
  }) satisfies SolidQueryOptions;
