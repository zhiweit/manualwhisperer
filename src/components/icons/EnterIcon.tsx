import { JSX } from "solid-js";

export function EnterIcon(props: JSX.IntrinsicElements["svg"]) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 14 14"
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M7 10V4M5.5 5.5L7 4l1.5 1.5" />
        <circle cx="7" cy="7" r="6.5" />
      </g>
    </svg>
  );
}
