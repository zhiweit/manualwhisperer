import { JSX, splitProps } from "solid-js";

export function ArrowBackIcon(
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
      <title>{local.title ?? "Back"}</title>
      <path
        fill="currentColor"
        d="m7.825 13l5.6 5.6L12 20l-8-8l8-8l1.425 1.4l-5.6 5.6H20v2z"
      />
    </svg>
  );
}
