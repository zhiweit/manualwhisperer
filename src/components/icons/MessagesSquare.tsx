import { JSX, splitProps } from "solid-js";

export function MessagesSquare(
  props: JSX.IntrinsicElements["svg"] & { title?: string }
) {
  const [local, others] = splitProps(props, ["title"]);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...others}
    >
      <title>{local.title ?? "Messages"}</title>
      <path
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2zm4 0h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"
      />
    </svg>
  );
}
