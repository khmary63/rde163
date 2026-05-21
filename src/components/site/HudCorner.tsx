type CornerProps = {
  className?: string;
  pos: "tl" | "tr" | "bl" | "br";
  color?: "brand" | "orange";
};

export function HudCorner({ className = "", pos, color = "brand" }: CornerProps) {
  const map: Record<CornerProps["pos"], string> = {
    tl: "border-l border-t",
    tr: "border-r border-t",
    bl: "border-l border-b",
    br: "border-r border-b",
  };
  const colorClass = color === "orange" ? "border-accent-orange" : "border-brand";
  return (
    <div className={`pointer-events-none absolute z-10 h-6 w-6 ${colorClass} ${map[pos]} ${className}`} />
  );
}
