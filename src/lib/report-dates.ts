export interface DateRange {
  from: string;
  to: string;
  preset: string;
}

export const DATE_PRESETS: Array<{ value: string; label: string }> = [
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "mtd", label: "Month to date" },
  { value: "ytd", label: "Year to date" },
  { value: "all", label: "All time" },
];

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function resolveRange(preset: string | undefined): DateRange {
  const now = new Date();
  const today = toIso(now);
  const selected = preset ?? "30d";

  switch (selected) {
    case "90d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 90);
      return { from: toIso(from), to: today, preset: "90d" };
    }
    case "mtd": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toIso(from), to: today, preset: "mtd" };
    }
    case "ytd": {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from: toIso(from), to: today, preset: "ytd" };
    }
    case "all":
      return { from: "1970-01-01", to: today, preset: "all" };
    case "30d":
    default: {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { from: toIso(from), to: today, preset: "30d" };
    }
  }
}

export function formatRangeLabel(range: DateRange): string {
  if (range.preset === "all") return "All time";
  const preset = DATE_PRESETS.find((p) => p.value === range.preset);
  return preset?.label ?? `${range.from} → ${range.to}`;
}
