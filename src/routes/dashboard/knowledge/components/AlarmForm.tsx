import { createEffect, createSignal, onMount, onCleanup } from "solid-js";
import { MachineType, MachineTypeName, MachineTypes } from "~/api/types";
import { Alarm, InsertAlarm } from "~/db/schema";
import {
  TextField,
  TextFieldInput,
  TextFieldTextArea,
} from "~/components/ui/text-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { ConfirmDialog } from "~/routes/dashboard/knowledge/components/ConfirmDialog";
import { showToast } from "~/components/ui/toast";
import { getAlarmList } from "~/api/knowledge/rpc";
import type { default as EditorJS } from "@editorjs/editorjs";

type AlarmFormProps = {
  alarm?: Alarm;
  onSubmit: (formData: InsertAlarm) => void;
  onFormChange: (formData: Partial<Alarm>) => void;
};

export function AlarmForm(props: AlarmFormProps) {
  const defaultAlarm = {
    code: "",
    message: "",
    desc: "",
    machineType: "",
    solution: "",
  };

  const [formData, setFormData] = createSignal<Partial<Alarm>>(
    props.alarm || defaultAlarm
  );
  const [duplicates, setDuplicates] = createSignal(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [initialFormData, setInitialFormData] = createSignal<Partial<Alarm>>(
    props.alarm || defaultAlarm
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = createSignal(false);
  const [editor, setEditor] = createSignal<EditorJS | null>(null);

  createEffect(() => {
    if (props.alarm) {
      setFormData(props.alarm);
      setInitialFormData(props.alarm);
      setIsLoading(false);
      initializeEditor();
    }
  });

  const checkDuplicates = async (code: string) => {
    if (!code) return;
    const alarms = await getAlarmList({ search: code });
    setDuplicates(
      alarms.filter((a) => a.code === code && a.id !== props.alarm?.id).length
    );
  };

  createEffect(() => {
    const code = formData().code;
    if (code) {
      checkDuplicates(code);
    }
  });

  const initializeEditor = async () => {
    if (typeof window === "undefined") return;

    const EditorJS = (await import("@editorjs/editorjs")).default;
    const Header = (await import("@editorjs/header")).default;
    const ImageTool = (await import("@editorjs/image")).default;
    const AttachesTool = (await import("@editorjs/attaches")).default;

    if (editor()) {
      editor()!.destroy();
    }

    const editorInstance = new EditorJS({
      holder: "editorjs",
      tools: {
        header: Header,
        image: {
          class: ImageTool,
          config: {
            uploader: {
              uploadByFile: async (file: File) => {
                const result = await createUploader("image")(file);
                editorInstance.blocks.insert(
                  "paragraph",
                  {},
                  {},
                  undefined,
                  true
                );
                return result;
              },
            },
          },
        },
        attaches: {
          class: AttachesTool,
          config: {
            uploader: {
              uploadByFile: async (file: File) => {
                const result = await createUploader("file")(file);
                editorInstance.blocks.insert(
                  "paragraph",
                  {},
                  {},
                  undefined,
                  true
                );
                return result;
              },
            },
          },
        },
      },
      data: JSON.parse(formData().solution || "{}"),
      placeholder: "Type text, add images/videos or attach files",
      onChange: async () => {
        const content = await editorInstance.save();
        const updatedFormData = {
          ...formData(),
          solution: JSON.stringify(content),
        };
        setFormData(updatedFormData);
        props.onFormChange(updatedFormData);
      },
    });

    setEditor(editorInstance);

    // Set up MutationObserver to watch for changes in the editor
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          removeCaptionInputs();
        }
      });
    });

    const editorElement = document.getElementById("editorjs");
    if (editorElement) {
      observer.observe(editorElement, { childList: true, subtree: true });
    }

    // Clean up the observer when the component unmounts
    onCleanup(() => {
      observer.disconnect();
      editor()?.destroy();
    });
  };

  onMount(() => {
    initializeEditor();
  });

  const saveDialog = ConfirmDialog({
    title: "Confirm Changes",
    description:
      "Are you sure you want to save the changes to the Knowledge Base?",
    confirmText: "Confirm Save",
    onConfirm: () => props.onSubmit(formData() as InsertAlarm),
  });

  // this is a custom uploader for the editorjs attaches tool
  // it creates a formdata object and appends the file to it
  // it then fetches the /api/upload endpoint with the formdata object
  const createUploader = (fieldName: string) => {
    return (file: File) => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append(fieldName, file);

        fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((result) => {
            if (result.success) {
              const commonData = {
                success: 1,
                file: {
                  fileId: result.fileId,
                  url: `/api/file/${result.fileId}`, // This URL will be handled by the server
                },
              };

              if (fieldName === "file") {
                resolve({
                  ...commonData,
                  file: {
                    ...commonData.file,
                    size: result.size,
                    name: result.name,
                    extension: result.extension,
                    title: result.name,
                  },
                });
              } else {
                // for images
                resolve(commonData);
              }
            } else {
              reject(result.error || "Upload failed");
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    };
  };

  // remove caption inputs from image tool
  // cant do it in app.css as display:none because it will break the block
  const removeCaptionInputs = () => {
    const captionInputs = document.querySelectorAll(
      ".cdx-input.image-tool__caption"
    );
    captionInputs.forEach((input) => input.remove());
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    try {
      if (editor()) {
        const content = await editor()!.save();
        const updatedFormData = {
          ...formData(),
          solution: JSON.stringify(content),
        };
        setFormData(updatedFormData);
      }
      if (validateForm(formData())) {
        await props.onSubmit(formData() as InsertAlarm);
        setInitialFormData(formData()); // Update initialFormData after successful submission
      }
    } catch (error) {
      if (error instanceof Error) {
        showToast({
          title: "Validation Error",
          description: error.message,
          variant: "error",
        });
      }
    }
  };

  const handleInputChange = (e: Event) => {
    const { name, value } = e.currentTarget as HTMLInputElement;
    const updatedFormData = { ...formData(), [name]: value };
    setFormData(updatedFormData);
    props.onFormChange(updatedFormData);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div class="flex flex-col gap-4 mt-4">
          {/* Alarm Code */}
          <div class="mb-2 w-full">
            <TextField>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Alarm Code
              </label>
              <TextFieldInput
                type="text"
                placeholder="Alarm Code"
                name="code"
                value={formData().code}
                onInput={(e) => {
                  handleInputChange(e);
                  checkDuplicates(e.currentTarget.value);
                }}
              />
            </TextField>
            {duplicates() > 0 && (
              <span class="absolute right-0 top-0 bg-yellow-100 text-yellow-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded">
                {duplicates()} duplicate{duplicates() > 1 ? "s" : ""} found
              </span>
            )}
          </div>

          {/* Alarm Message */}
          <div class="mb-2 w-full">
            <TextField>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Alarm Message
              </label>
              <TextFieldInput
                type="text"
                placeholder="Alarm Message"
                name="message"
                value={formData().message}
                onInput={handleInputChange}
              />
            </TextField>
          </div>

          {/* Machine Type */}
          <div class="mb-2 w-full">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Machine Type
            </label>
            <Select<MachineType>
              value={formData().machineType as MachineType}
              onChange={(value) => {
                const updatedFormData = { ...formData(), machineType: value };
                setFormData(updatedFormData as Partial<Alarm>);
                props.onFormChange(updatedFormData as Partial<Alarm>);
              }}
              options={MachineTypes}
              placeholder="Select Machine Type"
              itemComponent={(props) => (
                <SelectItem item={props.item}>
                  {MachineTypeName[props.item.rawValue] ?? props.item.rawValue}
                </SelectItem>
              )}
            >
              <SelectTrigger
                aria-label="Machine Type"
                class="w-full bg-white border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500"
              >
                <SelectValue<MachineType>>
                  {(state) =>
                    state.selectedOption() === undefined
                      ? "Select Machine Type"
                      : (MachineTypeName[
                          state.selectedOption() as MachineType
                        ] ?? state.selectedOption())
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>

          {/* Alarm Description */}
          <div class="mb-4 w-full">
            <TextField>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Alarm Description
              </label>
              <TextFieldTextArea
                name="desc"
                placeholder="Alarm description"
                value={formData().desc}
                onInput={handleInputChange}
              />
            </TextField>
          </div>

          <hr class="" />
          <div class="mb-6 w-full">
            <TextField>
              <label class="block text-sm font-medium text-gray-700 mb-2 mt-6">
                Solution
              </label>
            </TextField>
            <div
              id="editorjs"
              class="border border-gray-50 rounded-md p-4 min-h-[200px] bg-gray-50 w-full"
            />
          </div>

          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <div class="text-sm text-gray-500 font-medium order-2 sm:order-1">
              Last Updated:{" "}
              {props.alarm?.updatedAt
                ? new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "full",
                    timeStyle: "long",
                  }).format(new Date(props.alarm.updatedAt))
                : "N/A"}
            </div>
            <Button type="submit" class="w-full sm:w-auto order-2 sm:order-1">
              {props.alarm ? "Save Changes" : "Create Document"}
            </Button>
          </div>
        </div>
      </form>

      {saveDialog.dialog}
    </>
  );
}

function validateForm(formData: Partial<InsertAlarm>): formData is InsertAlarm {
  if (!formData.code) {
    throw new Error("Alarm code is required");
  }
  if (!formData.message) {
    throw new Error("Alarm message is required");
  }
  if (!formData.desc) {
    throw new Error("Alarm description is required");
  }
  if (!formData.machineType) {
    throw new Error("Machine type is required");
  }

  return true;
}
