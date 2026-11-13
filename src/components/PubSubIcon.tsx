export function PubSubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Hexagon background */}
      <path
        d="M40 4 L73 22.5 L73 57.5 L40 76 L7 57.5 L7 22.5 Z"
        fill="#5B7FE3"
      />
      {/* Long shadow overlay */}
      <path
        d="M40 40 L73 57.5 L40 76 L7 57.5 Z"
        fill="rgba(0,0,0,0.18)"
      />
      {/* Center circle (large) */}
      <circle cx="40" cy="40" r="9.5" fill="white" />
      {/* Top */}
      <circle cx="40" cy="19" r="5" fill="white" />
      {/* Top-right */}
      <circle cx="58" cy="29" r="5.5" fill="white" />
      {/* Bottom-right */}
      <circle cx="58" cy="51" r="6.5" fill="white" />
      {/* Bottom */}
      <circle cx="40" cy="61" r="5" fill="white" />
      {/* Bottom-left */}
      <circle cx="22" cy="51" r="7" fill="white" />
      {/* Top-left */}
      <circle cx="22" cy="29" r="5" fill="white" />
    </svg>
  )
}
