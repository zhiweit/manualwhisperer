import { JSX, splitProps } from "solid-js";

export function AvatarIcon(
  props: JSX.IntrinsicElements["svg"] & { title?: string }
) {
  const [local, others] = splitProps(props, ["title"]);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 32 32"
      {...others}
    >
      <title>{local.title ?? "Avatar"}</title>
      <path
        fill="currentColor"
        d="M16 8a5 5 0 1 0 5 5a5 5 0 0 0-5-5m0 8a3 3 0 1 1 3-3a3.003 3.003 0 0 1-3 3"
      />
      <path
        fill="currentColor"
        d="M16 2a14 14 0 1 0 14 14A14.016 14.016 0 0 0 16 2m-6 24.377V25a3.003 3.003 0 0 1 3-3h6a3.003 3.003 0 0 1 3 3v1.377a11.9 11.9 0 0 1-12 0m13.993-1.451A5 5 0 0 0 19 20h-6a5 5 0 0 0-4.992 4.926a12 12 0 1 1 15.985 0"
      />
    </svg>
  );
}