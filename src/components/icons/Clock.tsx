import { JSX } from "solid-js";

export function Clock(props: JSX.IntrinsicElements["svg"]) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 14 14"
      {...props} // Spread props here to apply them to the <svg> element
    >
      <g
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="7" cy="7" r="6.5" />
        <path d="M7 4.5V7l2.54 2.96" />
      </g>
    </svg>
  );
}
