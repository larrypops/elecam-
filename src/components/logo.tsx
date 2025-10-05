import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 600"
      {...props}
    >
      <rect width="300" height="600" fill="#007a5e" />
      <rect x="300" width="300" height="600" fill="#ce1126" />
      <rect x="600" width="300" height="600" fill="#fcd116" />
      <polygon
        points="450,225 479,315 571,315 496,369 525,459 450,405 375,459 404,369 329,315 421,315"
        fill="#fcd116"
      />
    </svg>
  );
}
