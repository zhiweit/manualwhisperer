import { JSX } from "solid-js";

export function EllipsisIcon(props: JSX.IntrinsicElements["svg"]) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24" // Adjust to a standard size
      height="24" // Adjust to a standard size
      viewBox="0 0 128 512"
      {...props}
    >
      <path
        fill="currentColor"
        d="M64 360a56 56 0 1 0 0 112a56 56 0 1 0 0-112m0-160a56 56 0 1 0 0 112a56 56 0 1 0 0-112m56-104A56 56 0 1 0 8 96a56 56 0 1 0 112 0"
      />
    </svg>
  );
}
