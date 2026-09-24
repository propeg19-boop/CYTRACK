// Minimal stroke icons for bottom nav. currentColor so they inherit text color;
// `filled` toggles a subtle fill for the active state instead of a second icon set.
type IconProps = { className?: string; filled?: boolean; 'aria-hidden'?: boolean }

export function HomeIcon({ className, filled, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      <path
        d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill={filled ? 'currentColor' : 'none'}
        fillOpacity={filled ? 0.12 : 0}
      />
    </svg>
  )
}

export function CalendarIcon({ className, filled, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      <rect
        x={4} y={5} width={16} height={15} rx={2}
        stroke="currentColor" strokeWidth={1.8}
        fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.12 : 0}
      />
      <path d="M4 9.5h16M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  )
}

export function PlusIcon({ className, filled, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      <circle
        cx={12} cy={12} r={8.2}
        stroke="currentColor" strokeWidth={1.8}
        fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.12 : 0}
      />
      <path d="M12 8.3v7.4M8.3 12h7.4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  )
}

export function ChartIcon({ className, filled, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      <path
        d="M5 19V10M12 19V5M19 19v-6"
        stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"
        opacity={filled ? 1 : 0.85}
      />
      <path d="M4 20h16" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  )
}

export function GearIcon({ className, filled, ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} {...rest}>
      <circle
        cx={12} cy={12} r={3.2}
        stroke="currentColor" strokeWidth={1.8}
        fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.12 : 0}
      />
      <path
        d="M12 4.2v2M12 17.8v2M19.8 12h-2M6.2 12h-2M17.4 6.6l-1.4 1.4M8 16l-1.4 1.4M17.4 17.4 16 16M8 8 6.6 6.6"
        stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"
      />
    </svg>
  )
}
