import { createSignal, JSX } from "solid-js";
import { AlertTriangle } from "~/components/icons/AlertTriangle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmText: string;
  onConfirm: () => void;
  confirmButtonClass?: string;
  warningMessage?: string;
};

export function ConfirmDialog(props: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = createSignal(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const dialog: JSX.Element = (
    <Dialog open={isOpen()} onOpenChange={setIsOpen}>
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader class="text-left">
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        {props.warningMessage && (
          <div class="flex items-center space-x-2 text-yellow-500">
            <AlertTriangle class="h-5 w-5" />
            <p class="text-sm">{props.warningMessage}</p>
          </div>
        )}
        <DialogFooter class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={close} class="mt-3 sm:mt-0">
            Cancel
          </Button>
          <Button
            onClick={() => {
              props.onConfirm();
              close();
            }}
            class={props.confirmButtonClass}
          >
            {props.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { open, close, dialog };
}
