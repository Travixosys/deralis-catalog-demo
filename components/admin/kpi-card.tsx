export function KpiCard({
  icon,
  label,
  value,
  hint,
  clickable,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  clickable?: boolean;
}) {
  return (
    <div
      className={`h-full rounded-lg border border-border border-t-[3px] border-t-[#92400e] bg-white p-4 ${
        clickable
          ? "cursor-pointer transition-shadow hover:shadow-md"
          : ""
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
