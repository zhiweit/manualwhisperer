import {
  A,
  useIsRouting,
  useNavigate,
  useParams,
  useSearchParams,
} from "@solidjs/router";
import { createQuery, useQueryClient } from "@tanstack/solid-query";
import {
  createEffect,
  createMemo,
  createSelector,
  createSignal,
  For,
  Show,
  Suspense,
} from "solid-js";
import { createStore } from "solid-js/store";
import { toast } from "solid-sonner";
import { alarmListQueryOpts, alarmQueryOpts } from "~/api/knowledge/query";
import { createAlarm, deleteAlarm, updateAlarm } from "~/api/knowledge/rpc";
import { MachineType, MachineTypeName, MachineTypes } from "~/api/types";
import { CloseIcon } from "~/components/icons/CloseIcon";
import { EllipsisIcon } from "~/components/icons/EllipsisIcon";
import { TrashIcon } from "~/components/icons/TrashIcon";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Toaster } from "~/components/ui/sonner";
import { Alarm, InsertAlarm } from "~/db/schema";
import { cn } from "~/lib/utils";
import { AlarmForm } from "~/routes/dashboard/knowledge/components/AlarmForm";
import { AlarmFormSkeleton } from "~/routes/dashboard/knowledge/components/AlarmFormSkeleton";
import { AlarmListItem } from "~/routes/dashboard/knowledge/components/AlarmListItem";
import { ConfirmDialog } from "~/routes/dashboard/knowledge/components/ConfirmDialog";
import { SearchBar } from "~/routes/dashboard/knowledge/components/SearchBar";

type PageSearchParams = {
  type?: string;
  q?: string;
};

// TODO:
// Implement the following functions
// - tanstack virtual (?)
// - fix some state render issues when refreshing the page

// Helper function to check if the error is an object with a message
// function isErrorWithMessage(error: unknown): error is { message: string } {
//   return typeof error === "object" && error !== null && "message" in error;
// }

// Improved deep equality check function
function deepEqual<T>(obj1: T, obj2: T): boolean {
  if (obj1 === obj2) return true;
  if (
    typeof obj1 !== "object" ||
    typeof obj2 !== "object" ||
    obj1 == null ||
    obj2 == null
  )
    return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (key === "time" && typeof obj1 === "object" && "blocks" in obj1) {
      // Skip comparison for 'time' field in EditorJS data
      continue;
    }

    const val1 = (obj1 as Record<string, unknown>)[key];
    const val2 = (obj2 as Record<string, unknown>)[key];

    if (val1 instanceof Date && val2 instanceof Date) {
      if (val1.getTime() !== val2.getTime()) return false;
    } else if (typeof val1 === "object" && typeof val2 === "object") {
      if (!deepEqual(val1, val2)) return false;
    } else if (val1 !== val2) {
      return false;
    }
  }

  return true;
}

export default function KnowledgeBasePage() {
  const isRouting = useIsRouting();
  const params = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const documentId = createMemo(() => {
    const id = params.documentId.split("/")[0];
    if (id === "") {
      return;
    }
    if (id === "new") {
      return "new";
    }
    return Number(id);
  });
  const isNewDocument = createMemo(() => documentId() === "new");
  const isActiveDoc = createSelector(documentId);
  const [pendingAlarmId, setPendingAlarmId] = createSignal<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams<PageSearchParams>();
  const search = createMemo(() => searchParams.q);
  const filterType = createMemo(() => searchParams.type);
  const [initialFormData, setInitialFormData] = createSignal<Partial<Alarm>>(
    {}
  );
  const [currentFormData, setCurrentFormData] = createSignal<Partial<Alarm>>(
    {}
  );

  const [selectedAlarm, setSelectedAlarm] = createStore<{
    id: number | null;
    data: Alarm | null;
    isLoading: boolean;
  }>({
    id: null,
    data: null,
    isLoading: false,
  });

  const [isDetailViewOpen, setIsDetailViewOpen] = createSignal(false);
  const [isDeleted, setIsDeleted] = createSignal(false);
  const [showMobileList, setShowMobileList] = createSignal(true);

  // Modify the document query to use a more specific key
  const document = createQuery(() => {
    const id = documentId();
    return {
      ...alarmQueryOpts({ id: id === "new" ? undefined : id }),
      enabled: id !== undefined && id !== "new",
    };
  });

  // Query for the alarm list
  const documents = createQuery(() => ({
    ...alarmListQueryOpts({
      search: search(),
      filterType: filterType(),
    }),
  }));

  const handleUpdate = async (form: Alarm) => {
    form.updatedAt = new Date();
    toast.promise(updateAlarm(form.id, form), {
      loading: "Updating alarm...",
      success: () => {
        queryClient.invalidateQueries({ queryKey: ["alarm", "list"] });
        queryClient.invalidateQueries({ queryKey: ["alarm", form.id] });
        setSelectedAlarm((prev) => ({ ...prev, data: form }));
        setInitialFormData(form);
        setCurrentFormData(form);
        return `Alarm ${form.code} updated successfully`;
      },
      error: (err) => `Error updating alarm: ${err.message}`,
    });
  };

  const handleDelete = async (id: number) => {
    const alarmToDelete = document.data;
    toast.promise(Promise.resolve(deleteAlarm(id)), {
      loading: "Deleting alarm...",
      success: () => {
        queryClient.invalidateQueries({ queryKey: ["alarm", "list"] });
        queryClient.invalidateQueries({ queryKey: ["alarm", id] });
        setSelectedAlarm({ id: null, data: null, isLoading: false });
        setIsDetailViewOpen(false);
        setSearchParams({ q: undefined, type: undefined }, { replace: true });
        navigate("/dashboard/knowledge", { replace: true });
        setIsDeleted(true);
        return `Alarm ${alarmToDelete?.code} deleted successfully`;
      },
      error: (err) => `Error deleting alarm: ${err.message}`,
    });
  };

  const handleCreate = async (form: InsertAlarm) => {
    toast.promise(createAlarm(form), {
      loading: "Creating alarm...",
      success: (newAlarm) => {
        queryClient.invalidateQueries({ queryKey: ["alarm", "list"] });
        setSelectedAlarm({
          id: newAlarm[0].id,
          data: newAlarm[0],
          isLoading: false,
        });
        setInitialFormData(newAlarm[0]);
        setCurrentFormData(newAlarm[0]);
        setIsDetailViewOpen(true);
        navigate(`/dashboard/knowledge/${newAlarm[0].id}`, { replace: true });
        return "Alarm created successfully";
      },
      error: (err) => `Error creating alarm: ${err.message}`,
    });
  };

  const closeDetailView = () => {
    if (hasUnsavedChanges()) {
      console.log("Unsaved changes detected. Opening confirm dialog.");
      unsavedChangesDialog.open();
    } else {
      setIsDetailViewOpen(false);
      setSelectedAlarm({ id: null, data: null, isLoading: false });
      navigate("/dashboard/knowledge", { replace: true });
      setShowMobileList(true); // Show the list view on mobile
    }
  };

  const hasUnsavedChanges = createMemo(() => {
    const initial = initialFormData();
    const current = currentFormData();

    const allKeys = new Set([...Object.keys(initial), ...Object.keys(current)]);

    for (const key of allKeys) {
      if (key === "solution") {
        // For the solution field (EditorJS data), parse and compare
        const initialSolution = JSON.parse(initial[key] || "{}");
        const currentSolution = JSON.parse(current[key] || "{}");

        // Remove the 'time' field before comparison
        delete initialSolution.time;
        delete currentSolution.time;

        if (!deepEqual(initialSolution, currentSolution)) {
          console.log(`Unsaved change detected in EditorJS content`);
          return true;
        }
      } else if (
        !deepEqual(initial[key as keyof Alarm], current[key as keyof Alarm])
      ) {
        console.log(`Unsaved change detected in field: ${key}`);
        console.log("Initial:", initial[key as keyof Alarm]);
        console.log("Current:", current[key as keyof Alarm]);
        return true;
      }
    }

    return false;
  });

  const handleAlarmSelect = async (alarmId: number) => {
    if (hasUnsavedChanges()) {
      setPendingAlarmId(alarmId);
      unsavedChangesDialog.open();
      return;
    }

    setIsDetailViewOpen(true);
    setIsDeleted(false);
    navigate(`/dashboard/knowledge/${alarmId}`, { replace: true });
    setShowMobileList(false); // Hide the list view on mobile when an alarm is selected

    const cachedData = queryClient.getQueryData(
      alarmQueryOpts({ id: alarmId }).queryKey
    );
    if (cachedData) {
      const alarmData = cachedData as Alarm;
      setSelectedAlarm({ id: alarmId, data: alarmData, isLoading: false });
      setInitialFormData(alarmData);
      setCurrentFormData(alarmData);
    } else {
      setSelectedAlarm({ id: alarmId, data: null, isLoading: true });
      try {
        const data = await queryClient.fetchQuery(
          alarmQueryOpts({ id: alarmId })
        );
        setSelectedAlarm({ id: alarmId, data, isLoading: false });
        if (data) {
          setInitialFormData(data);
          setCurrentFormData(data);
        }
      } catch (error) {
        console.error("Error fetching alarm:", error);
        setSelectedAlarm({ id: null, data: null, isLoading: false });
        toast("Error loading alarm details", {
          description: "Failed to load alarm details. Please try again.",
        });
      }
    }
  };

  const unsavedChangesDialog = ConfirmDialog({
    title: "Unsaved Changes",
    description: "You have unsaved changes. Do you want to save them?",
    confirmText: "Save Changes",
    onConfirm: async () => {
      const currentAlarm = document.data;
      const formData = currentFormData();
      if (currentAlarm && formData) {
        try {
          await handleUpdate({
            ...currentAlarm,
            ...formData,
          });
          setInitialFormData(formData); // Update initial form data after saving
          const newAlarmId = pendingAlarmId();
          if (newAlarmId !== null) {
            navigate(`/dashboard/knowledge/${newAlarmId}`);
          }
        } catch (error) {
          console.error("Error saving changes:", error);
          toast("Error saving changes", {
            description:
              "An error occurred while saving changes. Please try again.",
          });
        }
      }
    },
  });

  const deleteDialog = ConfirmDialog({
    title: "Confirm Deletion",
    description:
      "Are you sure you want to delete this alarm from the Knowledge Base?",
    confirmText: "Confirm Delete",
    onConfirm: () => {
      const id = documentId();
      if (id !== undefined && id !== "new") {
        handleDelete(id);
      }
    },
    confirmButtonClass: "bg-red-600 hover:bg-red-700",
    warningMessage: "This action cannot be undone.",
  });

  // Effect to update form data when selected alarm changes
  createEffect(() => {
    if (selectedAlarm.data) {
      setInitialFormData(selectedAlarm.data);
      setCurrentFormData(selectedAlarm.data);
    } else if (isNewDocument()) {
      const emptyFormData: Partial<Alarm> = {
        code: "",
        message: "",
        desc: "",
        machineType: "",
        solution: "",
      };
      setInitialFormData(emptyFormData);
      setCurrentFormData(emptyFormData);
    }
  });

  // Effect to handle initial alarm selection
  createEffect(() => {
    const id = documentId();
    if (id && id !== "new" && !isDetailViewOpen()) {
      handleAlarmSelect(Number(id));
    }
  });

  return (
    <div class="bg-zinc-50 min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Title Headers */}
      <div class="container flex items-center justify-between my-2">
        <div class="flex flex-col">
          <h1 class="text-xl font-semibold flex flex-row mt-2">
            Manage Knowledge Base
          </h1>
          <p class="text-sm text-gray-500 mt-1 mb-4">
            View and manage your knowledge base here
          </p>
        </div>

        {/* Remove the toggle button */}
      </div>

      {/* Search bar, Filter, Create btn */}
      <div class="container flex max-sm:flex-col-reverse gap-2 mb-4">
        <div class="sm:mr-auto flex gap-2">
          <SearchBar
            value={search() ?? ""}
            onInput={(value) => setSearchParams({ q: value })}
            onClear={() => setSearchParams({ q: undefined })}
          />

          <Select<MachineType | "all">
            value={
              filterType() === undefined
                ? "all"
                : (filterType() as MachineType | "all")
            }
            onChange={(value) =>
              setSearchParams(
                { type: value === "all" ? undefined : value },
                { replace: true }
              )
            }
            options={["all", ...MachineTypes]}
            placeholder="Select Machine Type"
            itemComponent={(props) => (
              <SelectItem
                item={props.item}
                class="focus:outline-none hover:bg-gray-100"
              >
                {props.item.rawValue === "all"
                  ? "All"
                  : (MachineTypeName[props.item.rawValue] ??
                    props.item.rawValue)}
              </SelectItem>
            )}
          >
            <SelectTrigger
              aria-label="Machine"
              class="w-full min-w-[180px] bg-white border border-gray-300 focus:outline-none"
            >
              <SelectValue<MachineType | "all">>
                {(state) =>
                  state.selectedOption() === undefined ||
                  state.selectedOption() === "all"
                    ? "All"
                    : (MachineTypeName[state.selectedOption() as MachineType] ??
                      state.selectedOption())
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent class="focus:outline-none" />
          </Select>

          <Button
            class="min-w-[180px] text-white rounded-sm"
            as={A}
            href={`/dashboard/knowledge/new`}
            disabled={isRouting()}
          >
            Create
          </Button>
        </div>
      </div>

      {/* Alarm List & Alarm Details view */}
      <div class="flex gap-2 items-start container flex-grow overflow-hidden">
        {/* Alarm Codes List */}
        <div
          class={cn(
            "rounded-lg border bg-white shadow-sm w-full md:max-w-[300px] flex flex-col h-[calc(100vh-4rem-200px)]",
            {
              "max-sm:hidden": !showMobileList(),
            }
          )}
        >
          <div class="px-3 py-2 border-b">
            <h2 class="font-medium">Alarm Codes</h2>
          </div>

          <div class="overflow-y-auto flex-grow">
            <Suspense fallback={<div>Loading...</div>}>
              <Show
                when={(documents.data?.length ?? 0) > 0 && documents.data}
                fallback={
                  <div class="pt-4 text-center text-gray-500">
                    No alarms found
                  </div>
                }
              >
                {(data) => (
                  <For each={data().slice(0, 50)}>
                    {(alarm) => (
                      <AlarmListItem
                        alarm={alarm}
                        isActive={isActiveDoc(alarm.id)}
                        onClick={handleAlarmSelect}
                      />
                    )}
                  </For>
                )}
              </Show>
            </Suspense>
          </div>
        </div>

        {/* Alarm Details */}
        <div
          class={cn(
            "rounded-lg border bg-white shadow-sm w-full flex flex-col h-[calc(100vh-4rem-200px)]",
            {
              "max-md:hidden": !isDetailViewOpen() || showMobileList(),
              "max-md:fixed max-md:inset-0 max-md:h-screen max-md:z-50":
                isDetailViewOpen() && !showMobileList(),
            }
          )}
        >
          <div class="px-3 py-2 flex items-center justify-between border-b">
            <Button variant="ghost" onClick={closeDetailView} class="md:hidden">
              <CloseIcon class="h-6 w-6 cursor-pointer" />
            </Button>

            <h2 class="font-medium">Alarm Details</h2>

            <div class="min-w-[56px] flex justify-end">
              <div
                class={cn({
                  hidden: isNewDocument(),
                })}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" as="div">
                      <EllipsisIcon class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      class="text-red-600"
                      onClick={(e) => {
                        e.preventDefault();
                        deleteDialog.open();
                      }}
                      disabled={
                        documentId() === undefined || documentId() === "new"
                      }
                    >
                      <TrashIcon class="pr-2 h-6 w-6" />
                      <div>Delete</div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div class="flex-grow overflow-y-auto">
            <div class="px-3 pb-32 md:pb-3 relative">
              <Show when={!isNewDocument()}>
                <Show
                  when={isDetailViewOpen()}
                  fallback={
                    <div class="text-center text-gray-500 mt-4">
                      Select an alarm from the list to view details
                    </div>
                  }
                >
                  <Show
                    when={!selectedAlarm.isLoading}
                    fallback={<AlarmFormSkeleton />}
                  >
                    <Show
                      when={selectedAlarm.data && !isDeleted()}
                      fallback={
                        <div class="text-center text-gray-500 mt-4">
                          {isDeleted()
                            ? "Alarm has been deleted"
                            : "Select an alarm to view details"}
                        </div>
                      }
                    >
                      <AlarmForm
                        alarm={selectedAlarm.data ?? undefined}
                        onSubmit={(form) => {
                          if (isNewDocument()) {
                            handleCreate(form as InsertAlarm);
                          } else {
                            handleUpdate({
                              ...selectedAlarm.data!,
                              ...form,
                            });
                          }
                        }}
                        onFormChange={(formData) => {
                          setCurrentFormData(formData);
                        }}
                      />
                    </Show>
                  </Show>
                </Show>
              </Show>

              <Show when={isNewDocument()}>
                <AlarmForm
                  onSubmit={(form) => {
                    handleCreate(form as InsertAlarm);
                  }}
                  onFormChange={(formData) => {
                    setCurrentFormData(formData);
                  }}
                />
              </Show>
            </div>
          </div>
        </div>
      </div>

      {deleteDialog.dialog}
      {unsavedChangesDialog.dialog}

      <Toaster />
    </div>
  );
}
