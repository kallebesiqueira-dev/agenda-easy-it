/**
 * Set di icone unico dell'app (tratto 1.75, angoli arrotondati, griglia 24).
 * Solo SVG inline: nessuna dipendenza, ereditano `currentColor`.
 */

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconCalendar = (p: IconProps) => (
  <Base {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /><path d="M8 14h2M14 14h2M8 17h2" /></Base>
);
export const IconScissors = (p: IconProps) => (
  <Base {...p}><circle cx="6" cy="7" r="2.75" /><circle cx="6" cy="17" r="2.75" /><path d="M8.3 8.6 20 18M8.3 15.4 20 6" /></Base>
);
export const IconBag = (p: IconProps) => (
  <Base {...p}><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8Z" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></Base>
);
export const IconTicket = (p: IconProps) => (
  <Base {...p}><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4Z" /><path d="M14 5v14" strokeDasharray="2 2.5" /></Base>
);
export const IconUsers = (p: IconProps) => (
  <Base {...p}><circle cx="9" cy="8.5" r="3.25" /><path d="M3.5 19.5c.6-3 2.9-5 5.5-5s4.9 2 5.5 5" /><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.8c1.5.7 2.6 2.4 3 4.7" /></Base>
);
export const IconClock = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Base>
);
export const IconChart = (p: IconProps) => (
  <Base {...p}><path d="M4 20h16" /><rect x="5.5" y="11" width="3" height="6" rx="1" /><rect x="10.5" y="6" width="3" height="11" rx="1" /><rect x="15.5" y="13" width="3" height="4" rx="1" /></Base>
);
export const IconSettings = (p: IconProps) => (
  <Base {...p}><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></Base>
);
export const IconChevronLeft = (p: IconProps) => (<Base {...p}><path d="m14.5 6-6 6 6 6" /></Base>);
export const IconChevronRight = (p: IconProps) => (<Base {...p}><path d="m9.5 6 6 6-6 6" /></Base>);
export const IconChevronDown = (p: IconProps) => (<Base {...p}><path d="m6 9.5 6 6 6-6" /></Base>);
export const IconCheck = (p: IconProps) => (<Base {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Base>);
export const IconCheckCircle = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="m8 12.3 2.8 2.8L16.2 9.5" /></Base>
);
export const IconX = (p: IconProps) => (<Base {...p}><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></Base>);
export const IconPencil = (p: IconProps) => (
  <Base {...p}><path d="M4.5 19.5 5.3 15.6 15.6 5.3a2 2 0 0 1 2.9 0l.2.2a2 2 0 0 1 0 2.9L8.4 18.7Z" /><path d="m13.5 7.5 3 3" /></Base>
);
export const IconEye = (p: IconProps) => (
  <Base {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.75" /></Base>
);
export const IconEyeOff = (p: IconProps) => (
  <Base {...p}><path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a17 17 0 0 1-2.7 3.5M6.4 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.4-1.1" /><path d="M9.9 10a2.75 2.75 0 0 0 4 3.9M3.5 3.5l17 17" /></Base>
);
export const IconLock = (p: IconProps) => (
  <Base {...p}><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></Base>
);
export const IconSparkle = (p: IconProps) => (
  <Base {...p}><path d="M12 3.5c.6 4.3 2.2 5.9 6.5 6.5-4.3.6-5.9 2.2-6.5 6.5-.6-4.3-2.2-5.9-6.5-6.5 4.3-.6 5.9-2.2 6.5-6.5Z" /><path d="M18.5 16.5c.2 1.4.8 2 2 2.2-1.2.2-1.8.8-2 2.2-.2-1.4-.8-2-2-2.2 1.2-.2 1.8-.8 2-2.2Z" /></Base>
);
export const IconAlert = (p: IconProps) => (
  <Base {...p}><path d="M10.3 4.3 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" /><path d="M12 9.5v4M12 16.8v.2" /></Base>
);
export const IconSend = (p: IconProps) => (
  <Base {...p}><path d="M4.5 12 3.5 4.5 20.5 12 3.5 19.5Z" /><path d="M4.5 12h7" /></Base>
);
export const IconLogout = (p: IconProps) => (
  <Base {...p}><path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14" /><path d="M10 8.5 6.5 12l3.5 3.5M6.5 12H15" /></Base>
);
export const IconExternal = (p: IconProps) => (
  <Base {...p}><path d="M13.5 4.5h6v6M19.5 4.5 11 13" /><path d="M17 14v3.5a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2H10" /></Base>
);
export const IconCalendarEmpty = (p: IconProps) => (
  <Base {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /><path d="M9.5 14.5h5" /></Base>
);

export function IconMail(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </Base>
  );
}
