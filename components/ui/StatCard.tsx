import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  value,
  label,
  sub,
  color = "var(--accent)",
}: {
  icon: LucideIcon;
  value: string | number;
  label: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="stat-card">
      <Icon size={22} color={color} strokeWidth={1.8} className="mb-2.5" />
      <div className="text-[24px] font-bold tracking-tight" style={{ color, fontFamily: "var(--font-mono)" }}>
        {value}
      </div>
      <div className="text-[12px] mt-1" style={{ color: "var(--ink-muted)" }}>
        {label}
      </div>
      {sub && (
        <div className="text-[11px] mt-0.5" style={{ color: "var(--ink-muted)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
