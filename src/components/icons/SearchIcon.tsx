import { JSX, splitProps } from "solid-js";

export function SearchIcon(
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
      <title>{local.title ?? "Search"}</title>
      <path
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="m21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607"
      />
    </svg>
  );
}
