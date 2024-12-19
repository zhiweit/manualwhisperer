import { A } from "@solidjs/router";
import { Alarm } from "~/db/schema";
import { MachineTypeName } from "~/api/types";

import { cn } from "~/lib/utils";

type AlarmListItemProps = {
  alarm: Alarm;
  isActive: boolean;
  onClick: (id: number) => void;
};

export function AlarmListItem(props: AlarmListItemProps) {
  return (
    <A
      href={`/dashboard/knowledge/${props.alarm.id}`}
      onClick={(e) => {
        e.preventDefault();
        props.onClick(props.alarm.id);
      }}
      class={cn(
        "flex group px-3 py-2 text-sm border-b border-gray-200 flex-col",
        {
          "hover:bg-gray-50": !props.isActive,
          "bg-blue-100": props.isActive,
        }
      )}
    >
      <div class="flex justify-between items-center">
        <div class="font-bold text-gray-600">{props.alarm.code}</div>
        <div
          class={cn(
            "text-[10px] text-gray-500 truncate rounded bg-gray-50 px-1",
            {
              "bg-blue-50": props.isActive,
            }
          )}
        >
          {MachineTypeName[props.alarm.machineType] || props.alarm.machineType}
        </div>
      </div>
      <div class="text-xs text-gray-500 font-medium line-clamp-2 truncate">
        {props.alarm.message}
      </div>
    </A>
  );
}
