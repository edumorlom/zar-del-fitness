import type { SVGProps } from "react";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const paths = {
  arrow: <path d="M4 12h15M13 5l7 7-7 7" {...stroke} />,
  "arrow-ur": <path d="M7 17 17 7M8 7h9v9" {...stroke} />,
  play: <path d="M8 5.5v13l11-6.5z" fill="currentColor" />,
  check: <path d="M20 6 9 17l-5-5" {...stroke} strokeWidth={2.4} />,
  plus: <path d="M12 5v14M5 12h14" {...stroke} />,
  close: <path d="M6 6l12 12M18 6 6 18" {...stroke} />,
  "chev-l": <path d="M15 5l-7 7 7 7" {...stroke} />,
  "chev-r": <path d="M9 5l7 7-7 7" {...stroke} />,
  spark: <path d="M12 0c.6 7 5 11.4 12 12-7 .6-11.4 5-12 12-.6-7-5-11.4-12-12C7 11.4 11.4 7 12 0z" fill="currentColor" />,
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" {...stroke} strokeWidth={1.8} />
      <circle cx="12" cy="9.5" r="2.6" {...stroke} strokeWidth={1.8} />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" {...stroke} strokeWidth={1.8} />
      <path d="M12 7v5l3.5 2" {...stroke} strokeWidth={1.8} />
    </>
  ),
  wa: (
    <path
      fill="currentColor"
      d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.830 9.830 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.820 11.820 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.880 11.880 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.820 11.820 0 0 0-3.48-8.41z"
    />
  ),
  ig: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" {...stroke} strokeWidth={1.9} />
      <circle cx="12" cy="12" r="4.1" {...stroke} strokeWidth={1.9} />
      <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" />
    </>
  ),
  fb: <path fill="currentColor" d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8z" />,
  yt: <path fill="currentColor" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.75 15.02V8.98L15.5 12z" />,
  tt: <path fill="currentColor" d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />,
  x: <path fill="currentColor" d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z" />,
};

export type IconName = keyof typeof paths;

export function Icon({ name, className = "icon", ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" {...rest}>
      {paths[name]}
    </svg>
  );
}
