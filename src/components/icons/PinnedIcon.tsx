import { JSX } from "solid-js";

export function PinnedIcon(props: JSX.IntrinsicElements["svg"]) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      {...props}
    >
      <path
        fill="currentColor"
        d="M4 2h7v.278q0 .609-.258 1.117q-.259.508-.742.875v2.86q.46.218.828.546t.633.735t.398.882q.133.477.141.985v.5H8V14l-.5 1l-.5-1v-3.222H3v-.5q0-.508.14-.977t.4-.883A3.4 3.4 0 0 1 5 7.13V4.27a2.6 2.6 0 0 1-.734-.875A2.5 2.5 0 0 1 4 2.278zm1.086.778q.063.188.156.32a1.5 1.5 0 0 0 .461.43L6 3.715v4.102l-.336.117q-.617.219-1.047.711C4.331 8.973 4.09 9.573 4 10h7c-.088-.427-.33-1.027-.617-1.355a2.46 2.46 0 0 0-1.047-.71L9 7.816V3.715l.297-.18q.14-.086.25-.195a2 2 0 0 0 .21-.242a1 1 0 0 0 .157-.32z"
      />
    </svg>
  );
}