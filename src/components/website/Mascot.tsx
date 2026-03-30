"use client";

interface MascotProps {
  type: "cairo" | "luna";
  size?: "sm" | "md" | "lg" | "xl";
  animate?: "float" | "bounce" | "wiggle" | "wave" | "none";
  className?: string;
}

const sizeMap = {
  sm: "text-5xl",
  md: "text-7xl",
  lg: "text-8xl",
  xl: "text-[120px]",
};

const animateMap = {
  float: "animate-float",
  bounce: "animate-bounce",
  wiggle: "animate-wiggle",
  wave: "animate-wave-hand",
  none: "",
};

export function Mascot({ type, size = "md", animate = "float", className = "" }: MascotProps) {
  const emoji = type === "cairo" ? "🐶" : "🐱";
  const name = type === "cairo" ? "Cairo" : "Luna";

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${animateMap[animate]} ${className}`}
      role="img"
      aria-label={`${name} the ${type === "cairo" ? "dog" : "cat"} mascot`}
    >
      <span className={sizeMap[size]}>{emoji}</span>
    </div>
  );
}

export function MascotPair({
  size = "lg",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  return (
    <div className={`flex items-end gap-4 ${className}`}>
      <Mascot type="cairo" size={size} animate="float" />
      <Mascot type="luna" size={size} animate="float" className="animate-float-delay" />
    </div>
  );
}
