interface PawLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

function PawIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Main pad */}
      <ellipse cx="50" cy="68" rx="28" ry="24" />
      {/* Top-left toe */}
      <ellipse cx="24" cy="34" rx="10" ry="12" />
      {/* Top-center toe */}
      <ellipse cx="46" cy="22" rx="9" ry="11" />
      {/* Top-right toe */}
      <ellipse cx="68" cy="28" rx="10" ry="12" />
      {/* Right toe */}
      <ellipse cx="82" cy="50" rx="8" ry="10" />
    </svg>
  );
}

export function PawLogo({ size = "md", showText = true }: PawLogoProps) {
  const iconSize = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }[size];

  const textSize = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
  }[size];

  return (
    <span className="inline-flex items-center gap-2">
      <span className={`text-paws-orange ${iconSize}`}>
        <PawIcon className="w-full h-full" />
      </span>
      {showText && (
        <span className={`font-extrabold tracking-tight ${textSize}`}>
          <span className="text-paws-orange">PAWS</span>
          <span className="text-neutral-500 font-bold ms-1">Egypt</span>
        </span>
      )}
    </span>
  );
}
