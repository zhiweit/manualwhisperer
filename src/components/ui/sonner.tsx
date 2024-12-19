import type { Component, ComponentProps } from "solid-js";

import { Toaster as Sonner } from "solid-sonner";

type ToasterProps = ComponentProps<typeof Sonner>;

const Toaster: Component<ToasterProps> = (props) => {
  return (
    <Sonner
      class="toaster group"
      toastOptions={{
        classes: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:hover:bg-background group-[.toaster]:hover:text-foreground",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "border-red-500 bg-red-100",
          success: "border-green-500 bg-green-100",
          warning: "border-yellow-500 bg-yellow-100",
          info: "border-blue-500 bg-blue-100",
        },
      }}
      expand={true}
      {...props}
    />
  );
};

export { Toaster };
