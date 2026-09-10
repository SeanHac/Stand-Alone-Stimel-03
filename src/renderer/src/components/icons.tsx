/**
 * Small inline icons, so the application does not take on an icon library
 * dependency for a handful of glyphs. Stroke-based, currentColor.
 */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
}

export const UserPlusIcon = (): React.JSX.Element => (
  <svg {...base} width={24} height={24} aria-hidden="true">
    <path d="M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </svg>
)

export const CloudUploadIcon = (): React.JSX.Element => (
  <svg {...base} width={24} height={24} aria-hidden="true">
    <path d="M12 17V9m0 0-3 3m3-3 3 3" />
    <path d="M20 17.5A4.5 4.5 0 0 0 17.5 9h-1.2A7 7 0 1 0 5 16" />
  </svg>
)

export const SignInIcon = (): React.JSX.Element => (
  <svg {...base} width={24} height={24} aria-hidden="true">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17l5-5-5-5M15 12H3" />
  </svg>
)

export const KeyIcon = (): React.JSX.Element => (
  <svg {...base} width={24} height={24} aria-hidden="true">
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="M10.7 12.3 21 2m-4 4 2.5 2.5M14 9l2.5 2.5" />
  </svg>
)

export const UserIcon = (): React.JSX.Element => (
  <svg {...base} width={18} height={18} aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

export const LockIcon = (): React.JSX.Element => (
  <svg {...base} width={18} height={18} aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export const ChevronRightIcon = (): React.JSX.Element => (
  <svg {...base} width={20} height={20} aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export const InfoIcon = (): React.JSX.Element => (
  <svg {...base} width={15} height={15} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
)

export const AlertIcon = (): React.JSX.Element => (
  <svg {...base} width={16} height={16} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
)
